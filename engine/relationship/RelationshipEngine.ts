import { stateBus, STATE_EVENTS } from '../../src/core/StateBus';
import { useTwinState } from '../../src/core/TwinState';

type RelationshipPhase = 'stranger' | 'acquaintance' | 'friend' | 'close_friend' | 'soulmate';
interface BondMetrics { trust: number; intimacy: number; consistency: number; shared_experiences: number; }
interface BondSnapshot { timestamp: string; bondLevel: number; phase: string; velocity?: number; }
interface AttachmentProfile { style: 'secure' | 'anxious' | 'avoidant' | 'disorganized'; score: number; }

export class RelationshipEngine {
  private chapters: Array<{ title: string; phase: string; startedAt: string; bondAtStart: number }> = [];
  private memoryClient: any = null;
  private phase: RelationshipPhase = 'stranger';
  private metrics: BondMetrics = { trust: 0, intimacy: 0, consistency: 0, shared_experiences: 0 };
  private interactionCount: number = 0;
  private positiveInteractions: number = 0;
  private history: BondSnapshot[] = [];
  private trustBreaches: number = 0;
  private bondVelocity: number = 0;
  private greetingStyle: 'formal' | 'friendly' | 'warm' | 'intimate' | 'deep' = 'formal';
  private initiativeLevel: number = 0.2;

  setMemoryClient(client: any): void { this.memoryClient = client; this.loadFromMemory(); }

  private async loadFromMemory(): Promise<void> {
    if (this.memoryClient) { 
      try { 
        const s = await this.memoryClient.getEntity('relationship_state', 'current'); 
        if (s) { 
          this.phase = s.phase || 'stranger'; 
          this.metrics = s.metrics || this.metrics; 
          this.interactionCount = s.interactionCount || 0; 
        } 
      } catch (e) {} 
    }
  }

  async recordInteraction(quality: 'positive' | 'neutral' | 'negative', context: string = ''): Promise<void> {
    const oldPhase = this.phase;
    this.interactionCount++; 
    if (quality === 'positive') this.positiveInteractions++;
    this.metrics.consistency = Math.min(100, (this.interactionCount / 50) * 100);
    this.metrics.shared_experiences = Math.min(100, this.interactionCount * 2);
    if (quality === 'positive') { 
      this.metrics.trust = Math.min(100, this.metrics.trust + 2); 
      this.metrics.intimacy = Math.min(100, this.metrics.intimacy + 1.5); 
    } else if (quality === 'negative') { 
      this.metrics.trust = Math.max(0, this.metrics.trust - 1); 
    }
    const avg = (this.metrics.trust + this.metrics.intimacy + this.metrics.consistency + this.metrics.shared_experiences) / 4;
    this.bondVelocity = avg - this.getBondLevel();
    
    if (avg >= 85 && this.interactionCount > 100) this.phase = 'soulmate';
    else if (avg >= 70 && this.interactionCount > 50) this.phase = 'close_friend';
    else if (avg >= 50 && this.interactionCount > 20) this.phase = 'friend';
    else if (avg >= 30 && this.interactionCount > 5) this.phase = 'acquaintance';
    
    if (oldPhase !== this.phase && !this.chapters.find(c => c.phase === this.phase)) {
      this.chapters.push({
        title: this.getChapterTitle(this.phase),
        phase: this.phase,
        startedAt: new Date().toISOString(),
        bondAtStart: avg
      });
    }
    
    this.updateBehavioralStyle();
    
    useTwinState.getState().setBondLevel(Math.round(avg));
    stateBus.emit(STATE_EVENTS.BOND_CHANGED, { phase: this.phase, metrics: this.metrics, bondLevel: Math.round(avg) });
    await this.saveToMemory();
  }

  // 🆕 استقبال تحديث من الخلفية
  applyBackendUpdate(update: { bondLevel: number; phase: string; trust: number; trend: string }): void {
    const oldPhase = this.phase;
    this.metrics.trust = update.trust;
    if (update.phase && update.phase !== this.phase) {
      const validPhases: RelationshipPhase[] = ['stranger', 'acquaintance', 'friend', 'close_friend', 'soulmate'];
      if (validPhases.includes(update.phase as RelationshipPhase)) {
        this.phase = update.phase as RelationshipPhase;
        this.updateBehavioralStyle();
        if (!this.chapters.find(c => c.phase === this.phase)) {
          this.chapters.push({
            title: this.getChapterTitle(this.phase),
            phase: this.phase,
            startedAt: new Date().toISOString(),
            bondAtStart: update.bondLevel,
          });
        }
      }
    }
    const avg = (this.metrics.trust + this.metrics.intimacy + this.metrics.consistency + this.metrics.shared_experiences) / 4;
    useTwinState.getState().setBondLevel(Math.round(avg));
    stateBus.emit(STATE_EVENTS.BOND_CHANGED, { 
      phase: this.phase, 
      metrics: this.metrics, 
      bondLevel: Math.round(avg),
      backendSync: true 
    });
    this.saveToMemory();
    console.log(`[RelationshipEngine] تم تطبيق تحديث الخلفية: ثقة=${update.trust}, مرحلة=${this.phase}`);
  }

  private updateBehavioralStyle(): void {
    const phaseStyles: Record<RelationshipPhase, { greeting: typeof this.greetingStyle; initiative: number }> = {
      stranger:     { greeting: 'formal',   initiative: 0.15 },
      acquaintance: { greeting: 'formal',   initiative: 0.25 },
      friend:       { greeting: 'friendly', initiative: 0.40 },
      close_friend: { greeting: 'warm',     initiative: 0.60 },
      soulmate:     { greeting: 'intimate', initiative: 0.80 },
    };
    const style = phaseStyles[this.phase] || phaseStyles.stranger;
    this.greetingStyle = style.greeting;
    this.initiativeLevel = style.initiative;
  }

  private async saveToMemory(): Promise<void> { 
    if (this.memoryClient) { 
      try { 
        await this.memoryClient.storeEntity('relationship_state', 'current', { 
          phase: this.phase, metrics: this.metrics, interactionCount: this.interactionCount 
        }); 
      } catch (e) {} 
    } 
  }

  getResponseTone(): string { 
    const t: Record<RelationshipPhase, string> = { 
      stranger: 'رسمي', acquaintance: 'ودود', friend: 'دافئ', close_friend: 'حميم', soulmate: 'عميق' 
    }; 
    return t[this.phase]; 
  }
  
  getBondLevel(): number { 
    return Math.round((this.metrics.trust + this.metrics.intimacy + this.metrics.consistency + this.metrics.shared_experiences) / 4); 
  }
  
  getPhase(): RelationshipPhase { return this.phase; }
  getMetrics(): BondMetrics { return { ...this.metrics }; }

  getGreetingStyle(): string { return this.greetingStyle; }
  getInitiativeLevel(): number { return this.initiativeLevel; }
  
  getPersonalizedGreeting(): string {
    const greetings: Record<string, string> = {
      formal: 'مرحباً، كيف يمكنني مساعدتك؟',
      friendly: 'أهلاً! سعيد برؤيتك.',
      warm: 'عدت! اشتقت للحديث معك.',
      intimate: 'كنت أنتظرك. كيف حالك اليوم؟',
      deep: 'أخيراً عدت. كنت أفكر فيك.',
    };
    return greetings[this.greetingStyle] || greetings.formal;
  }

  snapshot(): void {
    this.history.push({ timestamp: new Date().toISOString(), bondLevel: this.getBondLevel(), phase: this.phase });
    if (this.history.length > 50) this.history = this.history.slice(-50);
  }
  
  analyzeTrend(): 'growing' | 'stable' | 'declining' {
    if (this.history.length < 3) return 'stable';
    const recent = this.history.slice(-5);
    const diff = recent[recent.length - 1].bondLevel - recent[0].bondLevel;
    if (diff > 5) return 'growing'; 
    if (diff < -5) return 'declining'; 
    return 'stable';
  }
  
  suggestAction(): string {
    const trend = this.analyzeTrend();
    if (trend === 'declining') return 'حاول قضاء وقت أطول في المحادثة.';
    if (this.metrics.intimacy < 40) return 'شاركني شيئاً شخصياً عنك.';
    return 'الرابطة بيننا قوية.';
  }
  
  getHistory(): BondSnapshot[] { return [...this.history]; }

  getAttachmentModel(): AttachmentProfile {
    const ratio = this.interactionCount > 0 ? this.positiveInteractions / this.interactionCount : 0.5;
    let style: AttachmentProfile['style'] = 'secure';
    if (ratio > 0.8 && this.metrics.trust > 70) style = 'secure';
    else if (ratio < 0.4 || this.trustBreaches > 2) style = 'avoidant';
    else if (this.metrics.intimacy > 70 && this.metrics.trust < 50) style = 'anxious';
    else if (ratio < 0.6 && this.trustBreaches > 0) style = 'disorganized';
    return { style, score: this.metrics.trust };
  }

  recoverTrust(amount: number): number {
    this.trustBreaches = Math.max(0, this.trustBreaches - 1);
    this.metrics.trust = Math.min(100, this.metrics.trust + amount);
    stateBus.emit(STATE_EVENTS.BOND_CHANGED, { phase: this.phase, metrics: this.metrics, bondLevel: this.getBondLevel(), recovered: true });
    return this.metrics.trust;
  }

  getBondEvolution(): BondSnapshot[] {
    if (this.history.length < 2) this.snapshot();
    return this.history.map((s, i) => ({
      ...s,
      velocity: i > 0 ? s.bondLevel - this.history[i - 1].bondLevel : 0,
    }));
  }

  registerTrustBreach(): void {
    this.trustBreaches++;
    this.metrics.trust = Math.max(0, this.metrics.trust - 5);
  }

  private getChapterTitle(phase: RelationshipPhase): string {
    const titles: Record<RelationshipPhase, string> = {
      stranger: 'Chapter 1: First Meeting',
      acquaintance: 'Chapter 2: Getting to Know You',
      friend: 'Chapter 3: Friendship',
      close_friend: 'Chapter 4: Close Bond',
      soulmate: 'Chapter 5: Soul Connection'
    };
    return titles[phase] || 'Chapter: Unknown';
  }
  
  getChapters() { return [...this.chapters]; }
}

export const relationshipEngine = new RelationshipEngine();
