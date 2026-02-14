/**
 * Trace ID Generator
 *
 * Generates unique trace IDs for distributed tracing across the Camelot platform.
 * Each trace ID follows a request from UI through API, Runtime, and all Lambda executions.
 */

/**
 * Generate a unique trace ID using the browser's native crypto API.
 *
 * Returns a RFC 4122 version 4 UUID (random UUID).
 * Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 *
 * @returns {string} UUID v4 trace ID
 *
 * @example
 * const traceId = generateTraceId();
 * // Returns: "550e8400-e29b-41d4-a716-446655440000"
 */
export function generateTraceId(): string {
  // Use native browser crypto API (supported in all modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for older browsers (should rarely be needed)
  console.warn('crypto.randomUUID() not available, using fallback UUID generator');
  return fallbackUuidV4();
}

/**
 * Fallback UUID v4 generator for browsers that don't support crypto.randomUUID()
 *
 * @returns {string} UUID v4 string
 */
function fallbackUuidV4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Validate if a string is a valid UUID v4 format
 *
 * @param {string} traceId - The trace ID to validate
 * @returns {boolean} True if valid UUID v4 format
 *
 * @example
 * isValidTraceId("550e8400-e29b-41d4-a716-446655440000") // true
 * isValidTraceId("invalid") // false
 */
export function isValidTraceId(traceId: string): boolean {
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidV4Regex.test(traceId);
}
