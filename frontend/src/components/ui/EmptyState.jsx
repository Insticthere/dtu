/**
 * @file EmptyState.jsx
 * Displayed when lists or data are empty.
 */

/**
 * EmptyState — centered "nothing here" message.
 * 
 * @param {Object} props
 * @param {string} props.message - Main empty state text
 * @param {string} [props.subMessage] - Secondary text
 * @param {React.ReactNode} [props.action] - Optional action button
 */
export const EmptyState = ({ message, subMessage, action }) => {
  return (
    <div className="text-center py-12 px-4 bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-border">
      <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">{message}</h3>
      {subMessage && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subMessage}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};
