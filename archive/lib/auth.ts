import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiPost, setToken } from './httpClient';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

const TOKEN_KEY = 'mytwin-token';
const USER_KEY = 'mytwin-user';

// ✅ تخزين التوكن والمستخدم
export async function saveAuthData(token: string, userId: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
  await AsyncStorage.setItem(USER_KEY, userId);
  await setToken(token);
}

// ✅ استرجاع التوكن
export async function getToken(): Promise<string | null> {
  return await AsyncStorage.getItem(TOKEN_KEY);
}

// ✅ استرجاع معرف المستخدم
export async function getUserId(): Promise<string | null> {
  return await AsyncStorage.getItem(USER_KEY);
}

// ✅ حذف التوكن والمستخدم
export async function removeToken(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}

// ✅ تسجيل الدخول
export async function login(email: string, password: string): Promise<any> {
  const data = await apiPost('/api/auth/login', { email: email.trim(), password });
  if (data?.token && data?.user_id) {
    await saveAuthData(data.token, data.user_id);
  }
  return data;
}

// ✅ إنشاء حساب
export async function signup(email: string, password: string, twinName: string, lang: string = 'ar'): Promise<any> {
  const data = await apiPost('/api/auth/signup', {
    email: email.trim(),
    password,
    twin_name: twinName,
    lang,
  });
  if (data?.token && data?.user_id) {
    await saveAuthData(data.token, data.user_id);
  }
  return data;
}

// ✅ تسجيل الدخول عبر Google
export async function googleLogin(lang: string = 'ar'): Promise<any> {
  try {
    const redirectUri = makeRedirectUri({ scheme: 'mytwin' });
    const authUrl = `https://my-twin-pro-production-b744.up.railway.app/api/auth/google/login?lang=${lang}&redirect_uri=${encodeURIComponent(redirectUri)}`;

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

    if (result.type === 'success' && result.url) {
      const url = new URL(result.url);
      const token = url.searchParams.get('token');
      const userId = url.searchParams.get('user_id');
      const onboarded = url.searchParams.get('onboarded') === 'true';

      if (token && userId) {
        await saveAuthData(token, userId);
        return { token, user_id: userId, onboarded };
      }
    }

    throw new Error('Google authentication cancelled or failed');
  } catch (e: any) {
    console.error('[GoogleLogin] Error:', e);
    throw e;
  }
}

// ✅ تسجيل الخروج
export async function logout(): Promise<void> {
  await removeToken();
}

// ✅ التحقق من وجود جلسة صالحة
export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken();
  return !!token;
}
