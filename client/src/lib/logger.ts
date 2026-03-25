/**
 * Centralized logging utility
 * Replaces console.log/error/warn with proper logging
 * Can be easily extended to send logs to external services (Sentry, LogRocket, etc.)
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private enabledLevels: Set<LogLevel>;

  constructor() {
    // In production, only log errors and warnings
    this.enabledLevels = this.isDevelopment
      ? new Set<LogLevel>(['info', 'warn', 'error', 'debug'])
      : new Set<LogLevel>(['error', 'warn']);
  }

  /**
   * Log informational messages (development only)
   */
  info(message: string, context?: LogContext) {
    if (!this.enabledLevels.has('info')) return;

    console.log(`[INFO] ${message}`, context || '');
  }

  /**
   * Log warnings (always logged)
   */
  warn(message: string, context?: LogContext) {
    if (!this.enabledLevels.has('warn')) return;

    console.warn(`[WARN] ${message}`, context || '');

    // External logging service integration placeholder
    // Enable Sentry integration in sentry.ts if needed
  }

  /**
   * Log errors (always logged)
   */
  error(message: string, error?: Error | unknown, context?: LogContext) {
    if (!this.enabledLevels.has('error')) return;

    console.error(`[ERROR] ${message}`, error || '', context || '');

    // External logging service integration placeholder
    // Enable Sentry integration in sentry.ts if needed
  }

  /**
   * Debug logging (development only)
   */
  debug(message: string, context?: LogContext) {
    if (!this.enabledLevels.has('debug')) return;

    console.log(`[DEBUG] ${message}`, context || '');
  }

  /**
   * Track upload progress
   */
  uploadProgress(fileName: string, percentLoaded: number, loaded: number, total: number) {
    if (!this.isDevelopment) return;

    const loadedMB = (loaded / 1024 / 1024).toFixed(1);
    const totalMB = (total / 1024 / 1024).toFixed(1);

    console.log(`[UPLOAD] ${fileName}: ${percentLoaded}% (${loadedMB}MB / ${totalMB}MB)`);
  }

  /**
   * Track API errors
   */
  apiError(endpoint: string, error: unknown) {
    console.error(`[API Error] ${endpoint}`, error);

    // External logging service integration placeholder
    // Enable Sentry integration in sentry.ts if needed
  }

  /**
   * Send logs to external service (placeholder)
   * Sentry integration is already available in sentry.ts
   * Enable it by setting VITE_SENTRY_DSN in .env
   */
  private sendToSentry(level: 'error' | 'warning', message: string, context?: any) {
    // Sentry is already configured in sentry.ts
    // Use captureException() or captureMessage() directly when needed
  }
}

// Export singleton instance
export const logger = new Logger();

// Convenience exports
export const logInfo = logger.info.bind(logger);
export const logWarn = logger.warn.bind(logger);
export const logError = logger.error.bind(logger);
export const logDebug = logger.debug.bind(logger);
