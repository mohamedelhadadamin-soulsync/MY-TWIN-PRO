import { httpClient } from '../../lib/httpClient'; // المسار من src/services/ إلى lib/

export interface ChatResponse {
  reply: string;
  provider: string;
  use_voice?: boolean;
  twin_emotional_state?: {
    current_emotion: string;
    real_emotion?: string;
    confidence?: number;
    intensity?: number;
    recommendation?: string;
    cultural_analysis?: string;
    is_culturally_disguised?: boolean;
  };
  relationship_update?: {
    bond_level: number;
    stage: string;
    trust: number;
    trend: 'improving' | 'declining' | 'stable';
  };
}

export interface TwinStateResponse {
  mood: string;
  energy_level: number;
  presence_level: number;
}

export async function sendMessage(
  message: string,
  history: Array<{ role: string; content: string }>,
  lang: string,
  userId?: string
): Promise<ChatResponse> {
  const response = await httpClient.post('/api/chat', {
    message,
    history,
    lang,
    user_id: userId,
  });
  return response.data as ChatResponse;
}

export async function getTwinState(userId: string, lang: string): Promise<TwinStateResponse> {
  const response = await httpClient.get(`/api/twin/state?user_id=${userId}&lang=${lang}`);
  return response.data as TwinStateResponse;
}

export async function getRecentMemories(userId: string, limit: number = 5): Promise<any> {
  const response = await httpClient.get(`/api/memories?user_id=${userId}&limit=${limit}`);
  return response.data;
}

export async function storeMemory(userId: string, content: string, type: string, importance: number): Promise<any> {
  const response = await httpClient.post('/api/memories', {
    user_id: userId,
    content,
    type,
    importance,
  });
  return response.data;
}

export async function getRelationshipHealth(userId: string): Promise<any> {
  const response = await httpClient.get(`/api/relationship?user_id=${userId}`);
  return response.data;
}

export async function getRelationshipInsights(userId: string): Promise<any> {
  const response = await httpClient.get(`/api/relationship/insights?user_id=${userId}`);
  return response.data;
}
