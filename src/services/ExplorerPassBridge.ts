import { economyEngine } from './EconomyEngine';
import { EventBus } from '../core/EventBus';

export class ExplorerPassBridge {
  private passActive = false;
  private passExpiry: number = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;

  async activatePass(userId: string): Promise<void> {
    this.passActive = true;
    this.passExpiry = Date.now() + 60 * 60 * 1000;

    await economyEngine.addPoints('ad', 10, 'مشاهدة إعلان');

    EventBus.emit('EXPLORER_PASS_ACTIVATED', { expiry: this.passExpiry });

    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.deactivatePass(), 60 * 60 * 1000);
  }

  deactivatePass(): void {
    this.passActive = false;
    this.passExpiry = 0;
    EventBus.emit('EXPLORER_PASS_EXPIRED', {});
  }

  isPassActive(): boolean {
    if (this.passActive && Date.now() > this.passExpiry) {
      this.deactivatePass();
      return false;
    }
    return this.passActive;
  }

  getRemainingMinutes(): number {
    if (!this.passActive) return 0;
    return Math.max(0, Math.ceil((this.passExpiry - Date.now()) / 60000));
  }
}

export const explorerPassBridge = new ExplorerPassBridge();
