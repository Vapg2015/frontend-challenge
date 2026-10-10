/**
 * Formatting Utilities
 * ETH formatting, currency, dates, and other display utilities
 */

/**
 * Format ETH amount with proper precision
 * ETH values are stored as decimal strings (e.g., "1.5", "0.001234567890123456")
 */
export const formatETH = (
  value: string | number,
  options: {
    decimals?: number;
    maxDecimals?: number;
    showSymbol?: boolean;
    compact?: boolean;
  } = {}
): string => {
  const {
    decimals = 4,
    maxDecimals = 6,
    showSymbol = true,
    compact = false,
  } = options;

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) return showSymbol ? '0 ETH' : '0';

  // Handle very small numbers
  if (num === 0) return showSymbol ? '0 ETH' : '0';

  if (compact && num >= 1000) {
    if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(2)}M${showSymbol ? ' ETH' : ''}`;
    }
    if (num >= 1_000) {
      return `${(num / 1_000).toFixed(2)}K${showSymbol ? ' ETH' : ''}`;
    }
  }

  // For very small amounts, show more decimals
  const displayDecimals = num < 0.001 ? maxDecimals : decimals;

  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: displayDecimals,
  });

  return showSymbol ? `${formatted} ETH` : formatted;
};

/**
 * Format USD value
 */
export const formatUSD = (
  value: number | string,
  options: {
    decimals?: number;
    compact?: boolean;
    showSymbol?: boolean;
  } = {}
): string => {
  const { decimals = 2, compact = false, showSymbol = true } = options;
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) return showSymbol ? '$0.00' : '0.00';

  if (compact && num >= 1000) {
    if (num >= 1_000_000) {
      return `${showSymbol ? '$' : ''}${(num / 1_000_000).toFixed(1)}M`;
    }
    if (num >= 1_000) {
      return `${showSymbol ? '$' : ''}${(num / 1_000).toFixed(1)}K`;
    }
  }

  return num.toLocaleString('en-US', {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Format large numbers with K/M/B suffixes
 */
export const formatCompactNumber = (value: number): string => {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toString();
};

/**
 * Format date for display
 */
export const formatDate = (
  dateString: string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-US', options);
  } catch {
    return 'Invalid date';
  }
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
  } catch {
    return 'Unknown';
  }
};

/**
 * Format address for display (0x1234...5678)
 */
export const formatAddress = (address: string, chars = 4): string => {
  if (!address || address.length < chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Calculate percentage change
 */
export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

/**
 * Parse ETH string to number safely
 */
export const parseETH = (value: string): number => {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};

/**
 * Add two ETH strings with precision
 */
export const addETH = (a: string, b: string): string => {
  const numA = parseETH(a);
  const numB = parseETH(b);
  // Use high precision for ETH calculations (18 decimals)
  return (numA + numB).toFixed(18).replace(/\.?0+$/, '');
};

/**
 * Subtract two ETH strings with precision
 */
export const subtractETH = (a: string, b: string): string => {
  const numA = parseETH(a);
  const numB = parseETH(b);
  return Math.max(0, numA - numB).toFixed(18).replace(/\.?0+$/, '');
};

/**
 * Multiply ETH string by quantity
 */
export const multiplyETH = (value: string, quantity: number): string => {
  const num = parseETH(value);
  return (num * quantity).toFixed(18).replace(/\.?0+$/, '');
};

/**
 * Calculate discount amount
 */
export const calculateDiscount = (
  subtotal: string,
  discountType: 'percentage' | 'fixed',
  discountValue: string
): string => {
  const sub = parseETH(subtotal);
  const val = parseETH(discountValue);

  if (discountType === 'percentage') {
    return (sub * (val / 100)).toFixed(18).replace(/\.?0+$/, '');
  }

  return Math.min(val, sub).toFixed(18).replace(/\.?0+$/, '');
};

/**
 * Truncate text with ellipsis
 */
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
};

/**
 * Generate slug from string
 */
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Capitalize first letter
 */
export const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Format file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};