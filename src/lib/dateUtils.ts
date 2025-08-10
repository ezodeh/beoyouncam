// Format date - always uses Gregorian calendar
export const formatDate = (date: string | Date, options?: {
  includeTime?: boolean;
  dateStyle?: 'full' | 'long' | 'medium' | 'short';
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

  return dateObj.toLocaleDateString('ar-SA', baseOptions);
};

// Short date format for smaller spaces - always uses Gregorian calendar
export const formatShortDate = (date: string | Date) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};