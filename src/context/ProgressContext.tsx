import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { GameAttempt, GameId, GameProgress, ProgressStore } from '../types';
import { addAttempt as storeAddAttempt, loadProgress, resetProgress as storageReset } from '../utils/storage';
import { fetchCloudProgress, migrateLocalToCloud, resetCloudProgress, saveCloudAttempt } from '../utils/cloudProgress';
import { useAuth } from './AuthContext';

const EMPTY_STORE: ProgressStore = {
  attempts: [],
  gameProgress: {} as ProgressStore['gameProgress'],
  totalAttempts: 0,
  totalCompleted: 0,
};

interface ProgressContextValue {
  store: ProgressStore;
  saveAttempt: (attempt: GameAttempt) => void;
  getGameProgress: (gameId: GameId) => GameProgress | undefined;
  resetProgress: () => void;
  syncing: boolean;
  isCloudSynced: boolean;
}

const ProgressContext = createContext<ProgressContextValue>({
  store: EMPTY_STORE,
  saveAttempt: () => {},
  getGameProgress: () => undefined,
  resetProgress: () => {},
  syncing: false,
  isCloudSynced: false,
});

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user, cloudEnabled } = useAuth();
  const [store, setStore] = useState<ProgressStore>(() => loadProgress());
  const [syncing, setSyncing] = useState(false);
  const migratedForUser = useRef<string | null>(null);

  const isCloudSynced = cloudEnabled && Boolean(user);

  // When a user signs in, load (and one-time-migrate) their cloud progress.
  // When they sign out, fall back to whatever is in local storage.
  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setStore(loadProgress());
      return;
    }

    setSyncing(true);
    const localBeforeSync = loadProgress();
    const shouldMigrate = migratedForUser.current !== user.id;

    const load = shouldMigrate
      ? migrateLocalToCloud(user.id, localBeforeSync)
      : fetchCloudProgress(user.id);

    load
      .then(cloudStore => {
        if (cancelled) return;
        migratedForUser.current = user.id;
        setStore(cloudStore);
      })
      .finally(() => {
        if (!cancelled) setSyncing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const saveAttempt = useCallback(
    (attempt: GameAttempt) => {
      if (user) {
        // Optimistic local update, then persist to Supabase in the background.
        setStore(prev => {
          saveCloudAttempt(user.id, attempt, prev).then(updated => setStore(updated));
          return prev;
        });
      } else {
        const updated = storeAddAttempt(attempt);
        setStore(updated);
      }
    },
    [user]
  );

  const getGameProgress = useCallback((gameId: GameId) => store.gameProgress[gameId], [store]);

  const resetProgress = useCallback(() => {
    if (user) {
      setSyncing(true);
      resetCloudProgress(user.id).finally(() => {
        setStore(EMPTY_STORE);
        setSyncing(false);
      });
    } else {
      storageReset();
      setStore(EMPTY_STORE);
    }
  }, [user]);

  return (
    <ProgressContext.Provider
      value={{ store, saveAttempt, getGameProgress, resetProgress, syncing, isCloudSynced }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  return useContext(ProgressContext);
}
