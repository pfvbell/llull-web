/**
 * Shared utility functions for review queue module
 */

/**
 * Logger function for debugging
 */
export const log = (message: string, data?: unknown): void => {
  console.log(`[ReviewQueue] ${message}`, data ? data : '');
}; 