// Format date - defaults to Gregorian unless explicitly set to Hijri
export const formatDate = (date: string | Date, options?: {
  includeTime?: boolean;
  dateStyle?: 'full' | 'long' | 'medium' | 'short';
  calendarType?: 'hijri' | 'gregorian';
}) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const baseOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...(options?.includeTime && {
      hour: '2-digit',
      minute: '2-digit'
    })
  };

  // Use Hijri calendar only if explicitly requested, otherwise use Gregorian
  const locale = options?.calendarType === 'hijri' ? 'ar-SA-u-ca-islamic' : 'ar-SA';
  
  return dateObj.toLocaleDateString(locale, baseOptions);
};

// Short date format for smaller spaces - defaults to Gregorian unless explicitly set to Hijri
export const formatShortDate = (date: string | Date, calendarType?: 'hijri' | 'gregorian') => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Use Hijri calendar only if explicitly requested, otherwise use Gregorian
  const locale = calendarType === 'hijri' ? 'ar-SA-u-ca-islamic' : 'ar-SA';
  
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};