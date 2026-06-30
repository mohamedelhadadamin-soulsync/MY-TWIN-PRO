import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiPost, apiGet, apiDelete } from '../lib/httpClient';

export type ProjectType =
  | 'chat'
  | 'study'
  | 'code_lab'
  | 'business'
  | 'life_coach'
  | 'dream'
  | 'content'
  | 'image_lab'
  | 'smart_home'
  | 'task';

export interface ProjectItem {
  id: string;
  type: ProjectType;
  title: string;
  preview: string;
  created_at: string;
  updated_at: string;
  data: Record<string, any>;
  tags: string[];
  pinned: boolean;
}

interface ProjectStore {
  projects: ProjectItem[];
  loading: boolean;
  error: string | null;

  fetchProjects: (userId: string) => Promise<void>;
  addProject: (project: Omit<ProjectItem, 'id' | 'created_at' | 'updated_at'> & { user_id?: string }) => Promise<ProjectItem | null>;
  updateProject: (id: string, updates: Partial<ProjectItem>) => Promise<void>;
  deleteProject: (id: string, userId?: string) => Promise<boolean>;
  getProjectsByType: (type: ProjectType) => ProjectItem[];
  searchProjects: (query: string) => ProjectItem[];
  clearProjects: () => void;
}

const generateId = () => 'proj_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: [],
      loading: false,
      error: null,

      fetchProjects: async (userId: string) => {
        set({ loading: true, error: null });
        try {
          const res = await apiGet(`/api/projects?user_id=${userId}`);
          if (res?.projects) {
            set({ projects: res.projects, loading: false });
          } else {
            set({ loading: false });
          }
        } catch (e) {
          set({ error: 'Failed to fetch projects', loading: false });
        }
      },

      addProject: async (project) => {
        const id = generateId();
        const now = new Date().toISOString();
        const newProject: ProjectItem = {
          ...project,
          id,
          created_at: now,
          updated_at: now,
        };

        set((s) => ({ projects: [newProject, ...s.projects] }));

        try {
          await apiPost('/api/projects', {
            user_id: project.user_id,
            type: project.type,
            title: project.title,
            preview: project.preview,
            data: project.data,
            tags: project.tags,
            pinned: project.pinned,
          });
        } catch (e) {
          // Saved locally even if API fails
        }

        return newProject;
      },

      updateProject: async (id, updates) => {
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
          ),
        }));
      },

      deleteProject: async (id, userId) => {
        set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
        try {
          await apiDelete(`/api/projects/${id}?user_id=${userId || ''}`);
          return true;
        } catch (e) {
          return true; // Deleted locally
        }
      },

      getProjectsByType: (type) => get().projects.filter((p) => p.type === type),

      searchProjects: (query) => {
        const q = query.toLowerCase();
        return get().projects.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.preview.toLowerCase().includes(q) ||
            p.tags.some((t) => t.toLowerCase().includes(q))
        );
      },

      clearProjects: () => set({ projects: [] }),
    }),
    {
      name: 'mytwin-projects-store',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        projects: state.projects.slice(0, 100),
      }),
    }
  )
);
