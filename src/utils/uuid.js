/**
 * Generates a standard UUID v4 string.
 * Falls back to Math.random() based UUID generation if crypto.randomUUID is not available.
 * 
 * @returns {string} Standard UUIDv4 string
 */
export function generateUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Checks whether a given string is a valid RFC-4122 UUID.
 * @param {any} str
 * @returns {boolean}
 */
export function isValidUUID(str) {
  if (typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str.trim());
}

/**
 * Guarantees a valid RFC-4122 compliant UUID.
 * If the input is already a valid UUID, returns it normalized.
 * If not, deterministically generates a valid UUID from the input string.
 * 
 * @param {string|number} input
 * @returns {string}
 */
export function ensureUUID(input) {
  if (!input) return generateUUID();
  const str = String(input).trim();
  if (isValidUUID(str)) return str.toLowerCase();

  // Deterministic 32-hex generation from input string
  let h1 = 0xdeadbeef, h2 = 0x41c64e6d, h3 = 0x12345678, h4 = 0x87654321;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
    h3 = Math.imul(h3 ^ ch, 3812015801);
    h4 = Math.imul(h4 ^ ch, 2718281829);
  }
  const toHex = (n) => (n >>> 0).toString(16).padStart(8, '0');
  const fullHex = (toHex(h1) + toHex(h2) + toHex(h3) + toHex(h4)).toLowerCase();

  return `${fullHex.slice(0, 8)}-${fullHex.slice(8, 12)}-4${fullHex.slice(13, 16)}-a${fullHex.slice(17, 20)}-${fullHex.slice(20, 32)}`;
}


