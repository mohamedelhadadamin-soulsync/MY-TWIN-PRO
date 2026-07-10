import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { usePresence } from '../hooks/usePresence';
import { useBreathAnimation } from '../hooks/useBreathAnimation';
import { useEmotionalState } from '../hooks/useEmotionalState';
import { useBondLevel } from '../hooks/useBondLevel';
import { useTwinBrain } from '../hooks/useTwinBrain';
import { awakeningController, AwakeningState } from '../controllers/AwakeningController';
import { signatureMomentsController } from '../controllers/SignatureMomentsController';
import { storeSyncBridge } from '../core/StoreSyncBridge';
import { EventBus } from '../core/EventBus';
import { getGreeting } from '../utils/languageDetector';
import { useRTL } from '../utils/useRTL';
import { capabilityOrchestrator } from '../coordinators/CapabilityOrchestrator';
import BirthSequence from '../renderers/zones/BirthSequence';
import GreetingWord from '../renderers/zones/GreetingWord';
import ThinkingIndicator from '../renderers/zones/ThinkingIndicator';
import SignatureMomentOverlay from '../renderers/zones/SignatureMomentOverlay';
import SilencePresence from '../renderers/zones/SilencePresence';
import MemoryRibbon from '../renderers/zones/MemoryRibbon';
import ConnectionField from '../renderers/zones/ConnectionField';
import AmbientField from './AmbientField';
import TwinPresenceZone from './TwinPresenceZone';
import ContextOverlay from './ContextOverlay';
import WorkspacePortal from './WorkspacePortal';
import SoulPulseRing from './SoulPulseRing';
import SoulObservatory from './SoulObservatory/SoulObservatory';
import WorldTransition from './WorldTransition';
import StudyCapability from './StudyCapability';
import DeveloperLabCapability from './DeveloperLabCapability';
import BusinessCapability from './BusinessCapability';
import ContentCreatorCapability from './ContentCreatorCapability';
import DreamCapability from './DreamCapability';
import LifeCoachCapability from './LifeCoachCapability';
import TaskManagerCapability from './TaskManagerCapability';
import AIImageCapability from './AIImageCapability';
import SmartHomeCapability from './SmartHomeCapability';
import QuickActions from './QuickActions';
import DailyTimeline from './DailyTimeline';
import SessionSurface from './SessionSurface';
import LivingTimeline from './LivingTimeline';
import MemoryForest from './MemoryForest';
import SoulPulse from '../renderers/zones/SoulPulse';
import SoulObservatory from './SoulObservatory/SoulObservatory';
import { SPACE, RADIUS } from '../../src/design/tokens/spacing';

interface LivingWorldProps { userId: string; }

export default function LivingWorld({ userId }: LivingWorldProps) {
  const presence = usePresence();
  const breath = useBreathAnimation();
  const emotion = useEmotionalState();
  const bond = useBondLevel();
  const { isThinking, thinkingPhase, streamedText, streamMessage, setUserId } = useTwinBrain();
  const rtl = useRTL();

  useEffect(() => { if (userId) setUserId(userId); }, [userId, setUserId]);

  const [birthComplete, setBirthComplete] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [greetingDone, setGreetingDone] = useState(false);
  const [awakening, setAwakening] = useState<AwakeningState>({
    phase: 'presence', isComplete: false, firstWord: '',
    showInput: false, breathVisible: false, avatarVisible: false, eyesOpen: false,
  });
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Array<{ id: string; sender: 'user' | 'twin'; text: string }>>([]);
  const [showInput, setShowInput] = useState(false);
  const [memoryEchoVisible, setMemoryEchoVisible] = useState(false);
  const [echoColor, setEchoColor] = useState('#A855F7');
  const greeting = getGreeting();

  useEffect(() => {
    storeSyncBridge.activate();
    storeSyncBridge.syncNow();
    signatureMomentsController.start();
    return () => { storeSyncBridge.deactivate(); signatureMomentsController.stop(); };
  }, []);

  useEffect(() => {
    const unsub = EventBus.on('MEMORY_SURFACED', (payload: any) => {
      setEchoColor(payload?.color || '#A855F7');
      setMemoryEchoVisible(true);
      setTimeout(() => setMemoryEchoVisible(false), 1200);
    });
    return unsub;
  }, []);

  const handleBirthComplete = useCallback(() => { setBirthComplete(true); awakeningController.start(setAwakening); }, []);
  useEffect(() => { return () => awakeningController.stop(); }, []);
  useEffect(() => { if (awakening.isComplete) setShowGreeting(true); }, [awakening.isComplete]);
  const handleGreetingComplete = useCallback(() => setGreetingDone(true), []);
  const handleFirstInteraction = useCallback(() => { if (!greetingDone) return; setShowInput(true); }, [greetingDone]);

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || isThinking) return;
    const text = inputText.trim();
    try {
      const orchestration = await capabilityOrchestrator.orchestrate(text, userId);
      if (orchestration.primaryCapability !== 'general' && orchestration.primaryCapability !== null) {
        capabilityOrchestrator.activateChain([orchestration.primaryCapability, ...orchestration.secondaryCapabilities]);
      }
    } catch (e) {}

    }

    setInputText('');
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user' as const, text }]);
    EventBus.emit('USER_SEND_MESSAGE', { message: text, timestamp: Date.now() });
    const twinMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: twinMsgId, sender: 'twin', text: '' }]);
    await streamMessage(text);
  }, [inputText, isThinking, streamMessage]);

  useEffect(() => {
    if (streamedText && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender === 'twin') {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...updated[updated.length - 1], text: streamedText };
          return updated;
        });
      }
    }
  }, [streamedText]);

  if (!birthComplete) return <BirthSequence onComplete={handleBirthComplete} />;

  return (
    <WorldTransition>
      <TouchableWithoutFeedback onPress={handleFirstInteraction}>
        <View style={styles.container}>
          <AmbientField />
          <SoulPulseRing />
          <SoulPulse />
          <SoulObservatory />
          <ConnectionField visible={bond.bondLevel >= 2} />

          {awakening.breathVisible && (
            <TwinPresenceZone
            onLongPress={() => EventBus.emit('OPEN_SOUL_OBSERVATORY')}
              memoryEchoVisible={memoryEchoVisible}
              echoColor={echoColor}
              awakeningEyesOpen={awakening.eyesOpen}
            />
          )}

          <ContextOverlay />
          <SessionSurface />

          <View style={styles.capabilityContainer}>
            <StudyCapability />
            <DeveloperLabCapability />
            <BusinessCapability />
            <ContentCreatorCapability />
            <DreamCapability />
          <LifeCoachCapability />
          <TaskManagerCapability />
          <AIImageCapability />
          <SmartHomeCapability />
          </View>

          <View style={styles.conversationContainer}>
            {showGreeting && !greetingDone && (
              <GreetingWord
                word={greeting.word} colors={greeting.colors}
                transitionSpeed={greeting.transitionSpeed}
                fontSize={greeting.fontSize} fontWeight={greeting.fontWeight}
                onComplete={handleGreetingComplete}
              />
            )}
            {messages.map(msg => (
              <Text key={msg.id} style={[
                msg.sender === 'user' ? styles.userMessage : styles.twinMessage,
                { textAlign: msg.sender === 'user' ? rtl.textAlign : (rtl.isRTL ? 'left' : 'right') }
              ]}>
                {msg.text}
              </Text>
            ))}
            {isThinking && thinkingPhase && <ThinkingIndicator phase={thinkingPhase} />}
            <SilencePresence />
          </View>

          <View style={styles.portalContainer}>
            <WorkspacePortal />
          </View>

          <View style={styles.memoryContainer}>
            <MemoryRibbon userId={userId} maxCards={2} />
          </View>

          <QuickActions />
          <DailyTimeline />
          <LivingTimeline />
          <MemoryForest />

          {showInput && (
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { textAlign: rtl.textAlign }]}
                value={inputText} onChangeText={setInputText}
                onSubmitEditing={handleSend} editable={!isThinking}
                placeholder={rtl.isRTL ? 'اكتب رسالتك الأولى...' : 'Write your first message...'}
                placeholderTextColor="#6B5B8A"
              />
            </View>
          )}

          <SignatureMomentOverlay />
        </View>
      </TouchableWithoutFeedback>
    </WorldTransition>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050510' },
  capabilityContainer: {
    position: 'absolute', top: 100, left: 0, right: 0, zIndex: 15,
  },
  conversationContainer: {
    position: 'absolute', bottom: 280, left: SPACE.lg, right: SPACE.lg,
    alignItems: 'center', zIndex: 15,
  },
  portalContainer: {
    position: 'absolute', bottom: 180, left: 0, right: 0, zIndex: 12,
  },
  memoryContainer: {
    position: 'absolute', bottom: 100, left: 0, right: 0, zIndex: 11,
  },
  userMessage: { color: '#B8B0C8', fontSize: 18, alignSelf: 'flex-end', marginVertical: SPACE.xs },
  twinMessage: { color: '#E8E0F0', fontSize: 20, alignSelf: 'flex-start', marginVertical: SPACE.xs },
  inputContainer: {
    position: 'absolute', bottom: 30, left: SPACE.lg, right: SPACE.lg,
    padding: SPACE.md, backgroundColor: 'rgba(30,20,50,0.9)',
    borderRadius: RADIUS.input, zIndex: 20,
  },
  input: { color: '#E8E0F0', fontSize: 18 },
});
