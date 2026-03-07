/**
 * Device and browser detection utilities
 */

export interface DeviceInfo {
  deviceType: 'mobile' | 'desktop';
  browser: string;
  os: string;
  fingerprint: string;
  userAgent: string;
}

/**
 * Detect device type from user agent
 */
export function detectDeviceType(userAgent: string): 'mobile' | 'desktop' {
  const mobilePatterns =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Windows Phone/i;
  return mobilePatterns.test(userAgent) ? 'mobile' : 'desktop';
}

/**
 * Parse browser info from user agent
 */
export function parseBrowserInfo(userAgent: string): { browser: string; os: string } {
  let browser = 'Unknown';
  let os = 'Unknown';

  // Browser detection
  if (userAgent.includes('Chrome')) {
    browser = 'Chrome';
  } else if (userAgent.includes('Safari')) {
    browser = 'Safari';
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
  } else if (userAgent.includes('Edge')) {
    browser = 'Edge';
  } else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) {
    browser = 'IE';
  }

  // OS detection
  if (userAgent.includes('Windows')) {
    os = 'Windows';
  } else if (userAgent.includes('Macintosh')) {
    os = 'macOS';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  } else if (userAgent.includes('iPhone')) {
    os = 'iOS';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
  }

  return { browser, os };
}

/**
 * Generate a device fingerprint from headers
 * This helps identify the same device even if IP changes
 */
export function generateFingerprint(
  userAgent: string,
  acceptLanguage: string = '',
  acceptEncoding: string = ''
): string {
  const data = `${userAgent}|${acceptLanguage}|${acceptEncoding}`;
  
  // Simple hash function for fingerprinting
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(16);
}

/**
 * Extract device info from request headers
 */
export function getDeviceInfo(headers: any): DeviceInfo {
  const userAgent = headers.get('user-agent') || '';
  const acceptLanguage = headers.get('accept-language') || '';
  const acceptEncoding = headers.get('accept-encoding') || '';

  const deviceType = detectDeviceType(userAgent);
  const { browser, os } = parseBrowserInfo(userAgent);
  const fingerprint = generateFingerprint(userAgent, acceptLanguage, acceptEncoding);

  return {
    deviceType,
    browser,
    os,
    fingerprint,
    userAgent,
  };
}

/**
 * Get client IP from request headers
 */
export function getClientIp(headers: any): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return (
    headers.get('x-client-ip') ||
    headers.get('cf-connecting-ip') ||
    headers.get('x-real-ip') ||
    'unknown'
  );
}
