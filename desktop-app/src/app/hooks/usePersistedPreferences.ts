import { useEffect, useState } from 'react';
import type { GestureMappingRule } from '../../features/gestures/types';
import type { AppSettings } from '../../features/settings/types';
import { getPersistedAppPreferences } from '../../stores/appStore';

type UsePersistedPreferencesParams = {
  settings: AppSettings;
  gestureMappings: GestureMappingRule[];
  hydratePreferences: (preferences: ReturnType<typeof getPersistedAppPreferences>) => void;
  onLoadError: (message: string) => void;
};

export const usePersistedPreferences = ({
  settings,
  gestureMappings,
  hydratePreferences,
  onLoadError
}: UsePersistedPreferencesParams): boolean => {
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadPreferences = async (): Promise<void> => {
      try {
        const preferences = await window.gestivo.loadPreferences();

        if (!cancelled && preferences) {
          hydratePreferences(preferences);
        }
      } catch {
        if (!cancelled) {
          onLoadError('Could not load saved preferences');
        }
      } finally {
        if (!cancelled) {
          setPreferencesLoaded(true);
        }
      }
    };

    void loadPreferences();

    return () => {
      cancelled = true;
    };
  }, [hydratePreferences, onLoadError]);

  useEffect(() => {
    if (!preferencesLoaded) {
      return;
    }

    const preferences = getPersistedAppPreferences({
      settings,
      gestureMappings
    });

    void window.gestivo.savePreferences(preferences);
  }, [gestureMappings, preferencesLoaded, settings]);

  return preferencesLoaded;
};