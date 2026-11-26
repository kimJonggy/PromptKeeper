/**
 * PromptKeeper 2.0 - Bookmark Service
 * URL normalization, domain extraction, and favicon resolution for web bookmarks.
 */

/**
 * Normalizes a raw URL string by enforcing HTTP/HTTPS protocol,
 * stripping common tracking parameters (utm_*, ref, fbclid), and trimming.
 * 
 * @param {string} raw
 * @returns {string|null} Clean normalized URL or null if invalid
 */
export function normalizeBookmarkUrl(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let str = raw.trim();
  if (!str) return null;

  // Prepend https:// if protocol is omitted
  if (!/^https?:\/\//i.test(str)) {
    str = 'https://' + str;
  }

  try {
    const parsed = new URL(str);
    
    // Check valid hostname: must have at least one dot or be localhost / valid IP
    const hostname = parsed.hostname;
    if (!hostname.includes('.') && hostname !== 'localhost' && !/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
      return null;
    }

    // Strip common tracking query parameters
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'ref', 'fbclid', 'gclid', 'mc_cid', 'mc_eid'
    ];
    trackingParams.forEach(param => parsed.searchParams.delete(param));

    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Extracts a clean, human-readable domain name (stripping www.).
 * 
 * @param {string} url
 * @returns {string} Hostname or empty string
 */
export function extractDomain(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./i, '');
  } catch {
    return '';
  }
}

/**
 * Computes a high-resolution favicon URL for a given target site.
 * Uses Google Favicons API with sz=32 for sharp, lightweight rendering.
 * 
 * @param {string} target Domain or URL
 * @param {number} [size=32] Favicon resolution size in pixels
 * @returns {string} URL to favicon
 */
export function getFaviconUrl(target, size = 32) {
  const domain = extractDomain(target);
  if (!domain) return '';
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`;
}

/**
 * Infers a clean initial title from a URL path or domain.
 * 
 * @param {string} url
 * @returns {string} Inferred title suggestion
 */
export function inferTitleFromUrl(url) {
  if (!url) return 'Untitled Bookmark';
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    const domain = parsed.hostname.replace(/^www\./i, '').replace(/\.[a-z]{2,}$/i, '');
    const pathParts = parsed.pathname.split('/').filter(Boolean);

    if (pathParts.length > 0) {
      const lastPart = pathParts[pathParts.length - 1]
        .replace(/[-_]/g, ' ')
        .replace(/\.(html?|php|aspx?)$/i, '');
      if (lastPart.length > 1) {
        return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
      }
    }

    // Fallback to domain capital case
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  } catch {
    return 'Untitled Bookmark';
  }
}
