// Utility function to detect if the user's system supports Hijri calendar
export const detectHijriSupport = (): boolean => {
  try {
    // Check if the system/browser supports Hijri calendar
    const testDate = new Date();
    const hijriTest = testDate.toLocaleDateString('ar-SA-u-ca-islamic');
    const gregorianTest = testDate.toLocaleDateString('ar-SA');
    
    // If they're different, it means Hijri is supported and working
    return hijriTest !== gregorianTest;
  } catch (error) {
    return false;
  }
};

// Format date based on system calendar preference
export const formatDate = (date: string | Date, options?: {
  includeTime?: boolean;
  dateStyle?: 'full' | 'long' | 'medium' | 'short';
}) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const isHijriSupported = detectHijriSupport();
  
  const baseOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...(options?.includeTime && {
      hour: '2-digit',
      minute: '2-digit'
    })
  };

  // Use Hijri calendar only if system supports it, otherwise use Gregorian
  const locale = isHijriSupported ? 'ar-SA-u-ca-islamic' : 'ar-SA';
  
  return dateObj.toLocaleDateString(locale, baseOptions);
};

// Short date format for smaller spaces
export const formatShortDate = (date: string | Date) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const isHijriSupported = detectHijriSupport();
  
  const locale = isHijriSupported ? 'ar-SA-u-ca-islamic' : 'ar-SA';
  
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};