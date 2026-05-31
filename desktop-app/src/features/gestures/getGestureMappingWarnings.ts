import type { GestureMappingRule } from './types';

export const getGestureMappingWarnings = (rules: GestureMappingRule[]): string[] => {
  const warnings: string[] = [];
  const exactCounts = new Map<string, number>();
  const actionCounts = new Map<string, number>();
  const edgeCounts = new Map<string, number>();

  rules.forEach((rule) => {
    const exactKey = `${rule.gesture}:${rule.action}:${rule.triggerMode}`;
    const actionKey = `${rule.gesture}:${rule.action}`;
    exactCounts.set(exactKey, (exactCounts.get(exactKey) ?? 0) + 1);
    actionCounts.set(actionKey, (actionCounts.get(actionKey) ?? 0) + 1);

    if (rule.triggerMode === 'edge') {
      edgeCounts.set(rule.gesture, (edgeCounts.get(rule.gesture) ?? 0) + 1);
    }
  });

  exactCounts.forEach((count, key) => {
    if (count > 1) {
      const [gesture, action, triggerMode] = key.split(':');
      warnings.push(`Duplicate mapping: ${gesture} -> ${action} (${triggerMode}) appears ${count} times.`);
    }
  });

  actionCounts.forEach((count, key) => {
    if (count > 1) {
      const [gesture, action] = key.split(':');
      warnings.push(`Repeated action: ${gesture} is configured to run ${action} ${count} times.`);
    }
  });

  edgeCounts.forEach((count, gesture) => {
    if (count > 1) {
      warnings.push(`Multiple edge-triggered actions are attached to ${gesture}; they will all fire together.`);
    }
  });

  return [...new Set(warnings)];
};
