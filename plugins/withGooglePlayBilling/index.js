const { withAppBuildGradle, withAndroidManifest } = require('@expo/config-plugins');

const withGooglePlayBilling = (config) => {
  // إضافة Google Play Billing إلى Gradle
  config = withAppBuildGradle(config, (cfg) => {
    if (!cfg.modResults.contents.includes('billing')) {
      cfg.modResults.contents = cfg.modResults.contents.replace(
        /dependencies\s*\{/,
        `dependencies {
    implementation 'com.android.billingclient:billing:6.2.1'
    implementation 'com.android.billingclient:billing-ktx:6.2.1'`
      );
    }
    return cfg;
  });

  return config;
};

module.exports = withGooglePlayBilling;
