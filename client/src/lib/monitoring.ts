/**
 * Client-side Performance Monitoring and Analytics
 * Tracks Core Web Vitals and custom metrics
 */

import { logger } from './logger';
import { onCLS, onLCP, onFCP, onTTFB, onINP } from 'web-vitals';
import type { Metric } from 'web-vitals';

/**
 * Core Web Vitals Metrics
 */
export interface WebVitals {
  /** Largest Contentful Paint */
  LCP?: number;
  /** First Input Delay */
  FID?: number;
  /** Cumulative Layout Shift */
  CLS?: number;
  /** First Contentful Paint */
  FCP?: number;
  /** Time to First Byte */
  TTFB?: number;
  /** Interaction to Next Paint */
  INP?: number;
}

/**
 * Custom Performance Metrics
 */
export interface CustomMetrics {
  /** Page load time */
  pageLoadTime?: number;
  /** API response time */
  apiResponseTime?: number;
  /** React hydration time */
  hydrationTime?: number;
  /** Bundle size */
  bundleSize?: number;
}

/**
 * Initialize Web Vitals tracking
 * Requires web-vitals library: npm install web-vitals
 */
export function initWebVitals() {
  if (typeof window === 'undefined') return;

  onCLS((metric) => {
    logger.info('Web Vital: CLS', { value: metric.value, rating: metric.rating });
    sendToAnalytics('CLS', metric.value);
  });

  onLCP((metric) => {
    logger.info('Web Vital: LCP', { value: metric.value, rating: metric.rating });
    sendToAnalytics('LCP', metric.value);
  });

  onFCP((metric) => {
    logger.info('Web Vital: FCP', { value: metric.value, rating: metric.rating });
    sendToAnalytics('FCP', metric.value);
  });

  onTTFB((metric) => {
    logger.info('Web Vital: TTFB', { value: metric.value, rating: metric.rating });
    sendToAnalytics('TTFB', metric.value);
  });

  onINP((metric) => {
    logger.info('Web Vital: INP', { value: metric.value, rating: metric.rating });
    sendToAnalytics('INP', metric.value);
  });

  // Additional manual tracking
  trackPageLoad();
  trackNavigationTiming();
}

/**
 * Track page load time
 */
function trackPageLoad() {
  if (typeof window === 'undefined') return;

  window.addEventListener('load', () => {
    const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    if (navigationTiming) {
      const pageLoadTime = navigationTiming.loadEventEnd - navigationTiming.fetchStart;

      logger.info('Page Load Time', {
        time: Math.round(pageLoadTime),
        domContentLoaded: Math.round(navigationTiming.domContentLoadedEventEnd - navigationTiming.fetchStart),
        domInteractive: Math.round(navigationTiming.domInteractive - navigationTiming.fetchStart),
      });

      sendToAnalytics('page_load_time', pageLoadTime);
    }
  });
}

/**
 * Track Navigation Timing API metrics
 */
function trackNavigationTiming() {
  if (typeof window === 'undefined' || !window.performance) return;

  setTimeout(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    if (nav) {
      const metrics = {
        dns: nav.domainLookupEnd - nav.domainLookupStart,
        tcp: nav.connectEnd - nav.connectStart,
        request: nav.responseStart - nav.requestStart,
        response: nav.responseEnd - nav.responseStart,
        dom: nav.domComplete - nav.domInteractive,
      };

      logger.debug('Navigation Timing', metrics);
    }
  }, 0);
}

/**
 * Track API call performance
 */
export function trackApiCall(endpoint: string, duration: number, success: boolean) {
  logger.debug('API Call', { endpoint, duration, success });

  sendToAnalytics('api_call', duration, {
    endpoint,
    success,
  });
}

/**
 * Track custom event
 */
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  logger.info('Event', { name: eventName, ...properties });

  sendToAnalytics(eventName, undefined, properties);
}

/**
 * Track page view
 */
export function trackPageView(path: string) {
  logger.info('Page View', { path });

  sendToAnalytics('page_view', undefined, { path });
}

/**
 * Track user action
 */
export function trackUserAction(action: string, category: string, label?: string) {
  logger.info('User Action', { action, category, label });

  sendToAnalytics('user_action', undefined, {
    action,
    category,
    label,
  });
}

/**
 * Track error
 */
export function trackError(error: Error, context?: Record<string, any>) {
  logger.error('Client Error', error, context);

  sendToAnalytics('error', undefined, {
    message: error.message,
    stack: error.stack,
    ...context,
  });
}

/**
 * Send metrics to analytics service
 */
function sendToAnalytics(
  eventName: string,
  value?: number,
  properties?: Record<string, any>
) {
  if (import.meta.env.DEV) {
    // console.log('[Analytics]', eventName, value, properties);
    return;
  }

  // TODO: Integrate with your analytics service
  // Examples:

  // Google Analytics 4
  /*
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, {
      value,
      ...properties,
    });
  }
  */

  // PostHog
  /*
  if (typeof window !== 'undefined' && (window as any).posthog) {
    (window as any).posthog.capture(eventName, {
      value,
      ...properties,
    });
  }
  */

  // Mixpanel
  /*
  if (typeof window !== 'undefined' && (window as any).mixpanel) {
    (window as any).mixpanel.track(eventName, {
      value,
      ...properties,
    });
  }
  */
}

/**
 * Performance Observer for monitoring long tasks
 */
export function observeLongTasks() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          logger.warn('Long Task Detected', {
            duration: entry.duration,
            startTime: entry.startTime,
          });
        }
      }
    });

    observer.observe({ entryTypes: ['longtask'] });
  } catch (e) {
    // PerformanceObserver not supported
  }
}

/**
 * Memory usage monitoring
 */
export function getMemoryUsage() {
  if (typeof window === 'undefined') return null;

  const memory = (performance as any).memory;

  if (!memory) return null;

  return {
    usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1048576), // MB
    totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1048576), // MB
    jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
  };
}

/**
 * Initialize all monitoring
 */
export function initMonitoring() {
  initWebVitals();
  observeLongTasks();

  // Log memory usage every 30 seconds in development
  if (import.meta.env.DEV) {
    setInterval(() => {
      const memory = getMemoryUsage();
      if (memory) {
        logger.debug('Memory Usage', memory);
      }
    }, 30000);
  }

  logger.info('Monitoring initialized');
}
