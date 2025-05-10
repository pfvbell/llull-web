/**
 * Logger utility for consistent logging throughout the application
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private context: string;
  
  constructor(context: string) {
    this.context = context;
  }

  /**
   * Format a log message with timestamp and context
   */
  private format(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] [${this.context}] ${message}`;
    
    if (data) {
      return `${formattedMessage} ${JSON.stringify(data, null, 2)}`;
    }
    
    return formattedMessage;
  }

  /**
   * Debug level logging
   */
  debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'production') return;
    console.debug(this.format('debug', message, data));
  }

  /**
   * Info level logging
   */
  info(message: string, data?: any): void {
    console.info(this.format('info', message, data));
  }

  /**
   * Warning level logging
   */
  warn(message: string, data?: any): void {
    console.warn(this.format('warn', message, data));
  }

  /**
   * Error level logging
   */
  error(message: string, error?: Error | any): void {
    if (error instanceof Error) {
      console.error(this.format('error', message, {
        name: error.name,
        message: error.message,
        stack: error.stack
      }));
    } else {
      console.error(this.format('error', message, error));
    }
  }
}

/**
 * Create a new logger with the given context
 */
export function createLogger(context: string): Logger {
  return new Logger(context);
}

/**
 * Default logger instance
 */
export const logger = createLogger('app');

export default logger; 