import { Platform } from 'react-native';
import { RewardedAd, RewardedAdEventType, AdEventType } from 'react-native-google-mobile-ads';
import { getAdUnitId } from '../../lib/ads';

export class RewardedAdService {
  private rewarded: RewardedAd | null = null;
  private isLoaded = false;
  private isLoading = false;

  /**
   * تحميل إعلان مكافأة
   */
  async load(): Promise<void> {
    if (this.isLoading) return;

    const adUnitId = getAdUnitId('rewarded');
    this.isLoading = true;
    this.isLoaded = false;

    this.rewarded = RewardedAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    // حدث التحميل الناجح
    const loadedListener = this.rewarded.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        this.isLoaded = true;
        this.isLoading = false;
        console.log('[RewardedAd] ✅ تم التحميل');
      }
    );

    // حدث فشل التحميل
    const errorListener = this.rewarded.addAdEventListener(
      AdEventType.ERROR,
      (error) => {
        this.isLoaded = false;
        this.isLoading = false;
        console.warn('[RewardedAd] فشل التحميل:', error?.message);
      }
    );

    // بدء التحميل
    this.rewarded.load();
  }

  /**
   * عرض الإعلان — يعيد true إذا اكتملت المشاهدة
   */
  async show(): Promise<boolean> {
    if (!this.rewarded || !this.isLoaded) {
      console.warn('[RewardedAd] ⚠️ الإعلان غير جاهز');
      await this.load();
      return false;
    }

    return new Promise((resolve) => {
      // حدث المكافأة (المستخدم أكمل المشاهدة)
      const earnedListener = this.rewarded!.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        (reward) => {
          console.log('[RewardedAd] 🎁 مكافأة:', reward);
          this.isLoaded = false;
          resolve(true);
        }
      );

      // حدث الإغلاق بدون مكافأة
      const dismissedListener = this.rewarded!.addAdEventListener(
        AdEventType.CLOSED,
        () => {
          console.log('[RewardedAd] 🚪 تم الإغلاق');
          this.isLoaded = false;
          resolve(false);
        }
      );

      // عرض الإعلان
      this.rewarded!.show();
    });
  }

  /**
   * هل الإعلان جاهز للعرض؟
   */
  isReady(): boolean {
    return this.isLoaded && this.rewarded !== null;
  }
}
