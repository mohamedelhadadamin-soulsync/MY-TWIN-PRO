import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Audio } from 'expo-av';
import { apiPost } from './httpClient';
import { useTwinStore } from '../store/useTwinStore';

// تشغيل نبض التوأم عند استلام إشعار
async function playPulseSound(): Promise<void> {
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/pulse.mp3'),
      { shouldPlay: true }
    );
    await sound.playAsync();
  } catch {}
}

// إعداد معالج الإشعارات
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// تسجيل الجهاز للإشعارات
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications require physical device');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission denied');
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const token = await Notifications.getExpoPushTokenAsync({ projectId });

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'MyTwin',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#7C3AED',
        sound: 'default',
      });
    }

    const userId = useTwinStore.getState().userId;
    if (userId && token.data) {
      await apiPost('/api/awareness/register-player', {
        user_id: userId,
        player_id: token.data,
        platform: Platform.OS,
      });
    }

    return token.data;
  } catch (error) {
    console.error('Failed to register for push notifications:', error);
    return null;
  }
}

// إعداد معالجات الإشعارات
export function setupNotificationHandlers(): void {
  Notifications.addNotificationReceivedListener(async (notification) => {
    console.log('Notification received:', notification);
    await playPulseSound();
  });

  Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data;
    console.log('Notification response:', data);

    if (data?.type === 'emotional_support') {
      // router.push('/chat');
    } else if (data?.type === 'memory_echo') {
      // router.push('/memories');
    }
  });
}

// إعداد قنوات Android
export function setupAndroidChannels(): void {
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('proactive', {
      name: 'Proactive Awareness',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7C3AED',
      sound: 'default',
    });

    Notifications.setNotificationChannelAsync('emotional', {
      name: 'Emotional Support',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 200, 100, 200],
      lightColor: '#EC4899',
      sound: 'default',
    });
  }
}

// إرسال إشعار محلي (فوري)
export async function sendLocalNotification(title: string, body: string, data?: Record<string, any>): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: 'default',
    },
    trigger: null,
  });
}
