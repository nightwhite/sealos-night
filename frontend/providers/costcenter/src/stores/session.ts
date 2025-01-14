import type { Session } from '@/types/session';
import { sessionKey } from '@/types/session';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import * as yaml from 'js-yaml';

type SessionState = {
  session: Session;
  locale: string;
  setSession: (ss: Session) => void;
  setSessionProp: (key: keyof Session, value: any) => void;
  getSession: () => Session;
  delSession: () => void;
  isUserLogin: () => boolean;
  getKubeconfigToken: () => string;
};

const useSessionStore = create<SessionState>()(
  devtools(
    persist(
      immer((set, get) => ({
        session: {} as Session,
        locale: 'en',
        setSession: (ss: Session) => set({ session: ss }),
        setSessionProp: (key: keyof Session, value: any) => {
          set((state) => {
            state.session[key] = value;
          });
        },
        getSession: () => get().session,
        delSession: () => {
          set({ session: undefined });
        },
        isUserLogin: () => get().session?.user?.id !== undefined,
        getKubeconfigToken: () => {
          if (get().session?.kubeconfig === '') {
            return '';
          }
          const doc = yaml.load(get().session.kubeconfig);
          //@ts-ignore
          return doc?.users[0]?.user?.token;
        }
      })),
      { name: sessionKey }
    )
  )
);

export default useSessionStore;
