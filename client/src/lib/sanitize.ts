/**
 * HTML Sanitization Utility
 * Prevents XSS attacks by sanitizing user-generated HTML content
 *
 * SETUP REQUIRED:
 * npm install dompurify
 * npm install --save-dev @types/dompurify
 */

// DOMPurify installed and active ✅
import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 *
 * @param dirty - Raw HTML string that may contain malicious code
 * @param options - Configuration options for sanitization
 * @returns Sanitized HTML string safe to render
 *
 * @example
 * const userHTML = '<script>alert("XSS")</script><p>Safe content</p>';
 * const clean = sanitizeHTML(userHTML);
 * // Returns: '<p>Safe content</p>'
 */
export function sanitizeHTML(
  dirty: string,
  options?: {
    allowedTags?: string[];
    allowedAttributes?: string[];
  }
): string {
  const config: DOMPurify.Config = {
    ALLOWED_TAGS: options?.allowedTags || [
      'p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'code', 'pre',
      'img', 'div', 'span',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ],
    ALLOWED_ATTR: options?.allowedAttributes || [
      'href', 'title', 'target', 'rel',
      'src', 'alt', 'width', 'height',
      'class', 'id', 'style',
    ],
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    SAFE_FOR_TEMPLATES: true,
  };

  return DOMPurify.sanitize(dirty, config);
}

/**
 * Sanitize HTML for email content
 * More permissive than general HTML sanitization
 */
export function sanitizeEmailHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'img', 'div', 'span', 'hr',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ],
    ALLOWED_ATTR: [
      'href', 'title', 'target', 'rel',
      'src', 'alt', 'width', 'height',
      'class', 'style', 'align',
      'cellpadding', 'cellspacing', 'border',
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });
}

/**
 * Strip all HTML tags, leaving only plain text
 * Useful for previews, meta descriptions, etc.
 */
export function stripHTML(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
}

/**
 * Truncate HTML while preserving tags
 * Useful for previews
 */
export function truncateHTML(html: string, maxLength: number): string {
  const text = stripHTML(html);
  if (text.length <= maxLength) return html;

  const truncated = text.substring(0, maxLength) + '...';
  return truncated;
}
