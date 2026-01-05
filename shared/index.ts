/**
 * Shared Module Index
 * Export all shared code for use in web and mobile
 */

export * from './types';
export * from './firebaseConfig';
export * from './wordPrioritization';
export * from './utils';

// Re-export commonly used items for convenience
export { firebaseConfig } from './firebaseConfig';
export {
  getPrioritizedWords,
  shuffleArray,
} from './wordPrioritization';
export {
  calculateAnalytics,
  fetchDefinition,
  generateSessionId,
  formatTime,
  getAccuracy,
} from './utils';
