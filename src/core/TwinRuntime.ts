/**
 * TwinRuntime — The Living Core
 * Manages the entire lifecycle of the Twin.
 * Engines register here. UI reads state from here.
 * This is the heartbeat of the application.
 */

import { StateBus, PresenceLevel, InterfaceState, BreathState, AvatarState, SpaceEnergy } from './StateBus';
import { EventBus } from './EventBus';

// ── Runtime Status ───────────────────────────────────
export type RuntimeStatus = 'initializing' | 'running' | 'paused' | 'stopped' | 'degraded';

// ── Engine Interface ─────────────────────────────────
export interface TwinEngine {
  name: string;
  initialize: (runtime: TwinRuntime) => Promise<void>;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  getStatus: () => 'idle' | 'starting' | 'running' | 'paused' | 'stopped' | 'error';
}

// ── Runtime Configuration ────────────────────────────
export interface RuntimeConfig {
  enableBreathing: boolean;
  enableMicroPresence: boolean;
  enableDebugLogging: boolean;
  breathCycleDuration: number; // base duration in ms
  autoStart: boolean;
}

const DEFAULT_CONFIG: RuntimeConfig = {
  enableBreathing: true,
  enableMicroPresence: true,
  enableDebugLogging: __DEV__,
  breathCycleDuration: 6000,
  autoStart: true,
};

// ── TwinRuntime Implementation ───────────────────────
export class TwinRuntime {
  private config: RuntimeConfig;
  private status: RuntimeStatus = 'initializing';
  private engines: Map<string, TwinEngine> = new Map();
  private breathAnimationId: number | null = null;
  private breathStartTime: number = 0;
  private uptimeStart: number = 0;
  private pauseTime: number = 0;
  private totalPausedDuration: number = 0;

  constructor(config: Partial<RuntimeConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (this.config.enableDebugLogging) {
      console.log('[TwinRuntime] Initializing...');
    }
  }

  // ── Lifecycle ────────────────────────────────────

  /**
   * Start the Twin runtime. This brings the Twin to life.
   */
  async start(): Promise<void> {
    if (this.status === 'running') return;

    this.uptimeStart = Date.now();
    // تهيئة الاشتراك للمستخدم
    subscriptionService.initialize(userId).catch(console.warn);
    this.status = 'running';

    // Transition from Dormant to Aware
    StateBus.update({
      presenceLevel: 1,
      interfaceState: 'aware',
      isOnline: true,
    });

    // Start breathing
    if (this.config.enableBreathing) {
      this.startBreathing();
    }

    // Start all registered engines
    for (const [name, engine] of this.engines) {
      try {
        engine.start();
        if (this.config.enableDebugLogging) {
          console.log(`[TwinRuntime] Engine "${name}" started.`);
        }
      } catch (error) {
        console.error(`[TwinRuntime] Failed to start engine "${name}":`, error);
      }
    }

    // Update uptime periodically
    this.startUptimeTracking();

    EventBus.emit('APP_FOREGROUND', { timestamp: Date.now() });

    if (this.config.enableDebugLogging) {
      console.log('[TwinRuntime] ✅ Runtime is alive.');
    }
  }

  /**
   * Pause the runtime (app goes to background).
   */
  pause(): void {
    if (this.status !== 'running') return;
    this.status = 'paused';
    this.pauseTime = Date.now();

    this.stopBreathing();

    for (const [, engine] of this.engines) {
      engine.pause();
    }

    StateBus.update({
      presenceLevel: 0,
      interfaceState: 'dormant',
    });

    EventBus.emit('APP_BACKGROUND', {
      timestamp: Date.now(),
      currentState: 'dormant',
    });
  }

  /**
   * Resume the runtime (app comes to foreground).
   */
  resume(): void {
    if (this.status !== 'paused') return;
    this.status = 'running';

    if (this.pauseTime > 0) {
      this.totalPausedDuration += Date.now() - this.pauseTime;
      this.pauseTime = 0;
    }

    if (this.config.enableBreathing) {
      this.startBreathing();
    }

    for (const [, engine] of this.engines) {
      engine.resume();
    }

    StateBus.update({
      presenceLevel: 1,
      interfaceState: 'aware',
    });

    EventBus.emit('APP_FOREGROUND', { timestamp: Date.now() });
  }

  /**
   * Stop the runtime completely.
   */
  stop(): void {
    this.status = 'stopped';
    this.stopBreathing();
    this.stopUptimeTracking();

    for (const [, engine] of this.engines) {
      engine.stop();
    }

    StateBus.reset();
  }

  // ── Engine Management ────────────────────────────

  /**
   * Register an engine with the runtime.
   */
  async registerEngine(engine: TwinEngine): Promise<void> {
    if (this.engines.has(engine.name)) {
      console.warn(`[TwinRuntime] Engine "${engine.name}" already registered.`);
      return;
    }

    this.engines.set(engine.name, engine);

    try {
      await engine.initialize(this);
      if (this.config.enableDebugLogging) {
        console.log(`[TwinRuntime] Engine "${engine.name}" registered & initialized.`);
      }
    } catch (error) {
      console.error(`[TwinRuntime] Failed to initialize engine "${engine.name}":`, error);
      this.engines.delete(engine.name);
    }
  }

  /**
   * Get a registered engine by name.
   */
  getEngine<T extends TwinEngine>(name: string): T | undefined {
    return this.engines.get(name) as T | undefined;
  }

  // ── Presence Management ──────────────────────────

  /**
   * Transition the Twin to a new presence level.
   */
  setPresence(level: PresenceLevel, trigger: string = 'manual'): void {
    const currentLevel = StateBus.select(s => s.presenceLevel);
    if (currentLevel === level) return;

    const interfaceState = this.mapPresenceToState(level);

    StateBus.batch(() => {
      StateBus.update({
        presenceLevel: level,
        interfaceState,
      });
    });

    EventBus.emit('PRESENCE_CHANGED', {
      from: currentLevel,
      to: level,
      trigger,
    });
  }

  /**
   * Get current uptime in milliseconds.
   */
  getUptime(): number {
    if (this.status === 'running') {
      return Date.now() - this.uptimeStart - this.totalPausedDuration;
    }
    return 0;
  }

  /**
   * Get runtime status.
   */
  getStatus(): RuntimeStatus {
    return this.status;
  }

  /**
   * Get runtime configuration.
   */
  getConfig(): Readonly<RuntimeConfig> {
    return this.config;
  }

  /**
   * Check if runtime is running.
   */
  isRunning(): boolean {
    return this.status === 'running';
  }

  // ── Private Methods ──────────────────────────────

  private startBreathing(): void {
    if (this.breathAnimationId !== null) return;
    this.breathStartTime = Date.now();

    const tick = () => {
      if (this.status !== 'running') {
        this.breathAnimationId = null;
        return;
      }

      const elapsed = Date.now() - this.breathStartTime;
      const duration = this.getCurrentBreathDuration();
      const rawPhase = (elapsed % duration) / duration;

      // Sine wave: 0 → 1 → 0
      const phase = Math.sin(rawPhase * Math.PI * 2) * 0.5 + 0.5;
      const isHolding = phase > 0.95 || phase < 0.05;

      StateBus.update({
        breath: {
          phase,
          duration,
          intensity: this.getCurrentBreathIntensity(),
          isHolding,
        },
        uptime: this.getUptime(),
      });

      this.breathAnimationId = requestAnimationFrame(tick);
    };

    this.breathAnimationId = requestAnimationFrame(tick);
  }

  private stopBreathing(): void {
    if (this.breathAnimationId !== null) {
      cancelAnimationFrame(this.breathAnimationId);
      this.breathAnimationId = null;
    }
  }

  private getCurrentBreathDuration(): number {
    const presenceLevel = StateBus.select(s => s.presenceLevel);
    const baseDuration = this.config.breathCycleDuration;

    // Map presence level to breath duration
    // Higher presence = faster breath (more engaged)
    const durationMap: Record<number, number> = {
      0: baseDuration * 1.6,  // 9600ms — very slow
      1: baseDuration * 1.4,  // 8400ms
      2: baseDuration * 1.2,  // 7200ms
      3: baseDuration * 0.9,  // 5400ms
      4: baseDuration * 0.8,  // 4800ms
      5: baseDuration * 0.85, // 5100ms
      6: baseDuration * 1.1,  // 6600ms
      7: baseDuration * 1.0,  // 6000ms
      8: baseDuration * 0.8,  // 4800ms
      9: baseDuration * 0.7,  // 4200ms
    };

    return durationMap[presenceLevel] ?? baseDuration;
  }

  private getCurrentBreathIntensity(): number {
    const presenceLevel = StateBus.select(s => s.presenceLevel);
    const intensityMap: Record<number, number> = {
      0: 0.15, 1: 0.25, 2: 0.40, 3: 0.50, 4: 0.60,
      5: 0.70, 6: 0.45, 7: 0.40, 8: 0.55, 9: 0.85,
    };
    return intensityMap[presenceLevel] ?? 0.25;
  }

  private mapPresenceToState(level: PresenceLevel): InterfaceState {
    const map: Record<number, InterfaceState> = {
      0: 'dormant',
      1: 'aware',
      2: 'attentive',
      3: 'thinking',
      4: 'speaking',
      5: 'remembering',
      6: 'reflecting',
      7: 'proactive',
      8: 'proactive',
      9: 'twin',
    };
    return map[level] ?? 'aware';
  }

  private uptimeIntervalId: ReturnType<typeof setInterval> | null = null;

  private startUptimeTracking(): void {
    if (this.uptimeIntervalId !== null) return;
    this.uptimeIntervalId = setInterval(() => {
      if (this.status === 'running') {
        StateBus.update({ uptime: this.getUptime() });
      }
    }, 1000);
  }

  private stopUptimeTracking(): void {
    if (this.uptimeIntervalId !== null) {
      clearInterval(this.uptimeIntervalId);
      this.uptimeIntervalId = null;
    }
  }
}

// ── Singleton Export ─────────────────────────────────
export const runtime = new TwinRuntime();
