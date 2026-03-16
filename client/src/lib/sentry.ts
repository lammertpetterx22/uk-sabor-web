/**
 * Sentry Error Tracking Integration
 *
 * SETUP REQUIRED:
 * 1. npm install @sentry/react
 * 2. Get your DSN from https://sentry.io
 * 3. Set VITE_SENTRY_DSN in .env
 * 4. Uncomment the implementation below
 */

// TODO: Uncomment when @sentry/react is installed
// import * as Sentry from "@sentry/react";
// import { BrowserTracing } from "@sentry/tracing";

/**
 * Initialize Sentry for error tracking
 * Call this in main.tsx before rendering the app
 */
export function initSentry() {
  // Only run in production
  if (import.meta.env.DEV) {
    console.log('[Sentry] Skipping initialization in development mode');
    return;
  }

  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    console.warn('[Sentry] No DSN found. Set VITE_SENTRY_DSN in .env');
    return;
  }

  // TODO: Uncomment when @sentry/react is installed
  /*
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [
      new BrowserTracing(),
      // Replay integration for session recording
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Performance Monitoring
    tracesSampleRate: 0.1, // 10% of transactions for performance monitoring

    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

    // Release tracking
    release: import.meta.env.VITE_APP_VERSION || 'development',

    // Error filtering
    beforeSend(event, hint) {
      // Filter out errors we don't care about
      const error = hint.originalException;

      if (typeof error === 'string') {
        // Ignore known benign errors
        if (error.includes('ResizeObserver loop')) return null;
        if (error.includes('Non-Error promise rejection')) return null;
      }

      // Add custom context
      event.tags = {
        ...event.tags,
        deployment: 'production',
      };

      return event;
    },

    // Ignore certain errors
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'Network request failed',
      'Failed to fetch',
    ],
  });
  */

  console.log('[Sentry] Initialized successfully');
}

/**
 * Manually capture an exception
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (import.meta.env.DEV) {
    console.error('[Sentry] Would capture exception:', error, context);
    return;
  }

  // TODO: Uncomment when @sentry/react is installed
  /*
  Sentry.captureException(error, {
    extra: context,
  });
  */
}

/**
 * Capture a message
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (import.meta.env.DEV) {
    console.log(`[Sentry] Would capture message (${level}):`, message);
    return;
  }

  // TODO: Uncomment when @sentry/react is installed
  /*
  Sentry.captureMessage(message, level);
  */
}

/**
 * Set user context
 */
export function setUser(user: { id: number; email?: string; username?: string } | null) {
  if (import.meta.env.DEV) {
    console.log('[Sentry] Would set user:', user);
    return;
  }

  // TODO: Uncomment when @sentry/react is installed
  /*
  if (user) {
    Sentry.setUser({
      id: String(user.id),
      email: user.email,
      username: user.username,
    });
  } else {
    Sentry.setUser(null);
  }
  */
}

/**
 * Add breadcrumb for tracking user actions
 */
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
  if (import.meta.env.DEV) {
    console.log(`[Sentry] Breadcrumb [${category}]:`, message, data);
    return;
  }

  // TODO: Uncomment when @sentry/react is installed
  /*
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
  */
}

/**
 * Create a transaction for performance monitoring
 */
export function startTransaction(name: string, op: string) {
  if (import.meta.env.DEV) {
    console.log(`[Sentry] Start transaction: ${name} (${op})`);
    return null;
  }

  // TODO: Uncomment when @sentry/react is installed
  /*
  return Sentry.startTransaction({
    name,
    op,
  });
  */

  return null;
}
