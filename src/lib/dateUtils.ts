// Format date based on calendar preference (default: Gregorian)
export const formatDate = (date: string | Date, options?: {
  includeTime?: boolean;
  dateStyle?: 'full' | 'long' | 'medium' | 'short';
  calendarType?: 'gregorian' | 'hijri';
}) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const calendarType = options?.calendarType || 'gregorian';
  
  const baseOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...(options?.includeTime && {
      hour: '2-digit',
      minute: '2-digit'
    })
  };

  // Use calendar type from options - default to Gregorian
  const locale = calendarType === 'hijri' ? 'ar-SA-u-ca-islamic' : 'ar-SA';
  
  try {
    return dateObj.toLocaleDateString(locale, baseOptions);
  } catch (error) {
    // Fallback to Gregorian if Hijri is not supported
    return dateObj.toLocaleDateString('ar-SA', baseOptions);
  }
};

// Short date format for smaller spaces
export const formatShortDate = (date: string | Date, calendarType: 'gregorian' | 'hijri' = 'gregorian') => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const locale = calendarType === 'hijri' ? 'ar-SA-u-ca-islamic' : 'ar-SA';
  
  try {
    return dateObj.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    // Fallback to Gregorian if Hijri is not supported
    return dateObj.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
};