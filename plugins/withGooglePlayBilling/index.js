/**
 * withGooglePlayBilling – Config Plugin
 * يضيف Google Play Billing v7 + BillingModule + BillingPackage
 * ويسجلهم في MainApplication.kt تلقائياً أثناء EAS Build
 */
const {
  withAppBuildGradle,
  withAndroidManifest,
  withDangerousMod,
} = require('@expo/config-plugins');
const fs   = require('fs');
const path = require('path');

// ── 1. إضافة billing-ktx في build.gradle ─────────────────────
const withBillingGradle = (config) => {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.contents.includes('billing-ktx')) return cfg;
    cfg.modResults.contents = cfg.modResults.contents.replace(
      /dependencies\s*\{/,
      `dependencies {\n    implementation 'com.android.billingclient:billing-ktx:7.1.1'`
    );
    return cfg;
  });
};

// ── 2. التأكد من إذن BILLING ──────────────────────────────────
const withBillingPermission = (config) => {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    const perms    = manifest['uses-permission'] || [];
    const has      = perms.some(
      p => p.$?.['android:name'] === 'com.android.vending.BILLING'
    );
    if (!has) {
      perms.push({ $: { 'android:name': 'com.android.vending.BILLING' } });
      manifest['uses-permission'] = perms;
    }
    return cfg;
  });
};

// ── 3. حقن BillingModule.kt + BillingPackage.kt ──────────────
const withBillingKotlinFiles = (config) => {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const pkg     = 'com.soulsync.mytwin';
      const pkgPath = pkg.replace(/\./g, '/');
      const dir     = path.join(
        cfg.modRequest.projectRoot,
        'android', 'app', 'src', 'main', 'java', pkgPath
      );

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // ── BillingModule.kt ────────────────────────────────────
      const modulePath = path.join(dir, 'BillingModule.kt');
      if (!fs.existsSync(modulePath)) {
        fs.writeFileSync(modulePath, `package ${pkg}

import android.app.Activity
import com.android.billingclient.api.*
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = BillingModule.NAME)
class BillingModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), PurchasesUpdatedListener {

    companion object { const val NAME = "BillingModule" }
    override fun getName() = NAME

    private var billingClient: BillingClient? = null
    private var purchasePromise: Promise? = null

    @ReactMethod
    fun startConnection(promise: Promise) {
        billingClient = BillingClient.newBuilder(reactApplicationContext)
            .setListener(this)
            .enablePendingPurchases(
                PendingPurchasesParams.newBuilder().enableOneTimeProducts().build()
            )
            .build()
        billingClient!!.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(result: BillingResult) {
                if (result.responseCode == BillingClient.BillingResponseCode.OK)
                    promise.resolve(true)
                else
                    promise.reject("BILLING_UNAVAILABLE", result.debugMessage)
            }
            override fun onBillingServiceDisconnected() {
                billingClient?.startConnection(this)
            }
        })
    }

    @ReactMethod
    fun endConnection(promise: Promise) {
        billingClient?.endConnection()
        billingClient = null
        promise.resolve(true)
    }

    @ReactMethod
    fun queryProductDetails(skus: ReadableArray, promise: Promise) {
        val client = billingClient
        if (client == null || !client.isReady) {
            promise.reject("NOT_INITIALIZED", "BillingClient not ready"); return
        }
        val list = (0 until skus.size()).map { i ->
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId(skus.getString(i)!!)
                .setProductType(BillingClient.ProductType.SUBS)
                .build()
        }
        client.queryProductDetailsAsync(
            QueryProductDetailsParams.newBuilder().setProductList(list).build()
        ) { result, details ->
            if (result.responseCode == BillingClient.BillingResponseCode.OK) {
                val arr = Arguments.createArray()
                details.forEach { d ->
                    val offer = d.subscriptionOfferDetails?.firstOrNull()
                    val phase = offer?.pricingPhases?.pricingPhaseList?.firstOrNull()
                    arr.pushMap(Arguments.createMap().apply {
                        putString("productId",   d.productId)
                        putString("title",       d.title)
                        putString("description", d.description)
                        putString("price",       phase?.formattedPrice ?: "")
                        putString("currency",    phase?.priceCurrencyCode ?: "")
                        putString("offerToken",  offer?.offerToken ?: "")
                    })
                }
                promise.resolve(arr)
            } else {
                promise.reject("QUERY_FAILED", result.debugMessage)
            }
        }
    }

    @ReactMethod
    fun launchBillingFlow(productId: String, promise: Promise) {
        val client   = billingClient
        val activity: Activity? = currentActivity
        if (client == null || !client.isReady) {
            promise.reject("NOT_INITIALIZED", "BillingClient not ready"); return
        }
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No active Activity"); return
        }
        purchasePromise = promise
        client.queryProductDetailsAsync(
            QueryProductDetailsParams.newBuilder().setProductList(listOf(
                QueryProductDetailsParams.Product.newBuilder()
                    .setProductId(productId)
                    .setProductType(BillingClient.ProductType.SUBS)
                    .build()
            )).build()
        ) { result, details ->
            if (result.responseCode != BillingClient.BillingResponseCode.OK || details.isEmpty()) {
                purchasePromise = null
                promise.reject("PRODUCT_NOT_FOUND", "Product \$productId not found")
                return@queryProductDetailsAsync
            }
            val d          = details[0]
            val offerToken = d.subscriptionOfferDetails?.firstOrNull()?.offerToken ?: ""
            activity.runOnUiThread {
                client.launchBillingFlow(activity,
                    BillingFlowParams.newBuilder()
                        .setProductDetailsParamsList(listOf(
                            BillingFlowParams.ProductDetailsParams.newBuilder()
                                .setProductDetails(d)
                                .setOfferToken(offerToken)
                                .build()
                        )).build()
                )
            }
        }
    }

    override fun onPurchasesUpdated(result: BillingResult, purchases: List<Purchase>?) {
        val promise = purchasePromise ?: return
        purchasePromise = null
        when (result.responseCode) {
            BillingClient.BillingResponseCode.OK -> {
                val p = purchases?.firstOrNull()
                if (p != null) {
                    promise.resolve(Arguments.createMap().apply {
                        putString("purchaseToken", p.purchaseToken)
                        putString("productId",     p.products.firstOrNull() ?: "")
                        putString("orderId",       p.orderId ?: "")
                        putInt("purchaseState",    p.purchaseState)
                        putDouble("purchaseTime",  p.purchaseTime.toDouble())
                    })
                } else {
                    promise.reject("NO_PURCHASE", "No purchase returned")
                }
            }
            BillingClient.BillingResponseCode.USER_CANCELED ->
                promise.reject("USER_CANCELED", "User cancelled")
            else ->
                promise.reject("BILLING_ERROR", result.debugMessage)
        }
    }

    @ReactMethod
    fun acknowledgePurchase(purchaseToken: String, promise: Promise) {
        val client = billingClient
        if (client == null || !client.isReady) {
            promise.reject("NOT_INITIALIZED", "BillingClient not ready"); return
        }
        client.acknowledgePurchase(
            AcknowledgePurchaseParams.newBuilder()
                .setPurchaseToken(purchaseToken).build()
        ) { result ->
            if (result.responseCode == BillingClient.BillingResponseCode.OK)
                promise.resolve(true)
            else
                promise.reject("ACK_FAILED", result.debugMessage)
        }
    }

    @ReactMethod
    fun queryPurchases(promise: Promise) {
        val client = billingClient
        if (client == null || !client.isReady) {
            promise.reject("NOT_INITIALIZED", "BillingClient not ready"); return
        }
        client.queryPurchasesAsync(
            QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.SUBS).build()
        ) { result, purchases ->
            if (result.responseCode == BillingClient.BillingResponseCode.OK) {
                val arr = Arguments.createArray()
                purchases.forEach { p ->
                    arr.pushMap(Arguments.createMap().apply {
                        putString("purchaseToken",   p.purchaseToken)
                        putString("productId",       p.products.firstOrNull() ?: "")
                        putString("orderId",         p.orderId ?: "")
                        putInt("purchaseState",      p.purchaseState)
                        putBoolean("isAcknowledged", p.isAcknowledged)
                    })
                }
                promise.resolve(arr)
            } else {
                promise.reject("QUERY_FAILED", result.debugMessage)
            }
        }
    }

    @ReactMethod fun addListener(eventName: String) {}
    @ReactMethod fun removeListeners(count: Int) {}
}
`);
        console.log('[BillingPlugin] ✅ BillingModule.kt written');
      }

      // ── BillingPackage.kt ───────────────────────────────────
      const packagePath = path.join(dir, 'BillingPackage.kt');
      if (!fs.existsSync(packagePath)) {
        fs.writeFileSync(packagePath, `package ${pkg}

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class BillingPackage : ReactPackage {
    override fun createNativeModules(ctx: ReactApplicationContext): List<NativeModule> =
        listOf(BillingModule(ctx))
    override fun createViewManagers(ctx: ReactApplicationContext): List<ViewManager<*, *>> =
        emptyList()
}
`);
        console.log('[BillingPlugin] ✅ BillingPackage.kt written');
      }

      // ── تسجيل BillingPackage في MainApplication.kt ─────────
      const mainAppPath = path.join(dir, 'MainApplication.kt');
      if (fs.existsSync(mainAppPath)) {
        let mainApp = fs.readFileSync(mainAppPath, 'utf8');
        if (!mainApp.includes('BillingPackage()')) {
          mainApp = mainApp.replace(
            'PackageList(this).packages.apply {',
            'PackageList(this).packages.apply {\n              add(BillingPackage())'
          );
          fs.writeFileSync(mainAppPath, mainApp);
          console.log('[BillingPlugin] ✅ BillingPackage registered in MainApplication.kt');
        }
      } else {
        console.warn('[BillingPlugin] ⚠️ MainApplication.kt not found - will be handled by EAS');
      }

      return cfg;
    },
  ]);
};

// ── التجميع النهائي ───────────────────────────────────────────
const withGooglePlayBilling = (config) => {
  config = withBillingGradle(config);
  config = withBillingPermission(config);
  config = withBillingKotlinFiles(config);
  return config;
};

module.exports = withGooglePlayBilling;
