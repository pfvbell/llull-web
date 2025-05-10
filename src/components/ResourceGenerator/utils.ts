import { LogFunction } from './types';

// Logger function to standardize logging across components
export const createLogger = (component: string): LogFunction => {
  return (message: string, data?: any) => {
    console.log(`[ResourceGenerator:${component}] ${message}`, data ? data : '');
  };
}; 