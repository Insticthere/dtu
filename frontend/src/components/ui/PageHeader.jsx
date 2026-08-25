/**
 * @file PageHeader.jsx
 * Consistent page title and subtitle block.
 */

/**
 * PageHeader — title + subtitle + optional action button.
 * Used at the top of every dashboard/listing page.
 * 
 * @param {Object} props
 * @param {string} props.title - Page main title
 * @param {string} [props.subtitle] - Page secondary text
 * @param {React.ReactNode} [props.action] - Action component (e.g. Button)
 */
export const PageHeader = ({ title, subtitle, action }) => {
  return (
    <div className="sm:flex sm:items-center sm:justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-gray-700 dark:text-gray-400">{subtitle}</p>}
      </div>
      {action && (
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          {action}
        </div>
      )}
    </div>
  );
};
