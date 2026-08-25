/**
 * @file Avatar.jsx
 * User avatar displaying initials.
 */

/**
 * Avatar — shows initials in a rounded div
 * @param {Object} props
 * @param {string} props.name - User's full name
 * @param {'sm'|'md'|'lg'} [props.size='md'] - Avatar size
 */
export const Avatar = ({ name, size = 'md' }) => {
  // Extract initials
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : '?';

  // Size mappings
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  return (
    <div className={`${sizeClasses[size]} bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 rounded-full flex items-center justify-center font-bold`}>
      {initials}
    </div>
  );
};
