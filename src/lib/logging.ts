export interface LogContext {
  route?: string;
  userId?: string;
  requestId?: string;
  duration?: number;
  error?: Error;
  [key: string]: any;
}

export class Logger {
  private static instance: Logger;
  private logLevel: string;

  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  error(message: string, context?: LogContext): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, context));
    }
  }

  // Convenience methods for common logging patterns
  logRequest(method: string, route: string, duration: number, statusCode: number): void {
    this.info(`${method} ${route}`, {
      route,
      duration,
      statusCode,
    });
  }

  logError(error: Error, context?: LogContext): void {
    this.error(error.message, {
      ...context,
      error,
      stack: error.stack,
    });
  }

  logSearch(query: string, resultCount: number, duration: number): void {
    this.info('Search completed', {
      query,
      resultCount,
      duration,
    });
  }

  logIngestion(source: string, documentsProcessed: number, duration: number): void {
    this.info('Ingestion completed', {
      source,
      documentsProcessed,
      duration,
    });
  }
}

export const logger = Logger.getInstance();
