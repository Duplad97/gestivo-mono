import type { GestureMappingRule } from '../features/gestures/types';
import type { AppSettings } from '../features/settings/types';

export type PersistedAppPreferences = {
  settings: AppSettings;
  gestureMappings: GestureMappingRule[];
};
