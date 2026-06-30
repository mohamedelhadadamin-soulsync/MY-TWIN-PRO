import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiPost, setToken } from './httpClient';

const TOKEN_KEY = 'mytwin-token';
const USER_KEY = 'mytwin-user';

// تخزين التوكن والمستخدم
export async function saveAuthData(token: string, userId: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
  await AsyncStorage.setItem(USER_KEY, userId);
  await setToken(token);
}

// استرجاع التوكن
export async function getToken(): Promise<string | null> {
  return await AsyncStorage.getItem(TOKEN_KEY);
}

// استرجاع معرف المستخدم
export async function getUserId(): Promise<string | null> {
  return await AsyncStorage.getItem(USER_KEY);
}

// حذف التوكن والمستخدم
export async function removeToken(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}

// تسجيل الدخول
export async function login(email: string, password: string): Promise<any> {
  const data = await apiPost('/api/auth/login', { email: email.trim(), password });
  if (data?.token && data?.user_id) {
    await saveAuthData(data.token, data.user_id);
  }
  return data;
}

// إنشاء حساب
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

// تسجيل الدخول عبر Google
export async function googleLogin(accessToken: string, lang: string = 'ar'): Promise<any> {
  const data = await apiPost('/api/auth/google', {
    access_token: accessToken,
    lang,
  });
  if (data?.token && data?.user_id) {
    await saveAuthData(data.token, data.user_id);
  }
  return data;
}

// تسجيل الخروج
export async function logout(): Promise<void> {
  await removeToken();
}

// التحقق من وجود جلسة صالحة
export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken();
  return !!token;
}
