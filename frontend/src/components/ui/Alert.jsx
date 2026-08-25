/**
 * @file Alert.jsx
 * Alert/Banner component.
 */

/**
 * Alert — dismissible or static notification banner
 * @param {Object} props
 * @param {'success'|'error'|'info'|'warning'} props.type - Alert type
 * @param {React.ReactNode} props.children - Alert content
 */
export const Alert = ({ type, children }) => {
  // Determine styles based on type
  const baseClasses = "p-4 rounded-md mb-4 text-sm font-medium";
  let typeClasses = "";

  switch (type) {
    case 'error':
      typeClasses = "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800/30";
      break;
    case 'success':
      typeClasses = "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800/30";
      break;
    case 'warning':
      typeClasses = "bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/30";
      break;
    case 'info':
    default:
      typeClasses = "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800/30";
      break;
  }

  return (
    <div className={`${baseClasses} ${typeClasses}`}>
      {children}
    </div>
  );
};
