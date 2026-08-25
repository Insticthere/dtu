/**
 * @file TabBar.jsx
 * Reusable tab navigation.
 */

/**
 * Individual Tab component.
 * @param {Object} props
 * @param {string} props.id - Tab identifier
 * @param {string} props.label - Display text
 * @param {number} [props.count] - Optional counter badge
 * @param {boolean} props.active - Whether this tab is currently selected
 * @param {Function} props.onClick - Click handler
 */
export const Tab = ({ id, label, count, active, onClick }) => {
  const activeClasses = active
    ? "border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400"
    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600";

  return (
    <button
      onClick={() => onClick(id)}
      className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeClasses}`}
    >
      {label}
      {count !== undefined && (
        <span className={`ml-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${
          active 
            ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' 
            : 'bg-gray-100 text-gray-900 dark:bg-dark-border dark:text-gray-300'
        }`}>
          {count}
        </span>
      )}
    </button>
  );
};

/**
 * TabBar container component.
 * @param {Object} props
 * @param {Array} props.tabs - Array of tab objects {id, label, count}
 * @param {string} props.activeTab - Currently active tab id
 * @param {Function} props.onChange - Tab change handler
 */
export const TabBar = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="border-b border-gray-200 dark:border-dark-border mb-6">
      <nav className="-mb-px flex space-x-8 overflow-x-auto">
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            id={tab.id}
            label={tab.label}
            count={tab.count}
            active={activeTab === tab.id}
            onClick={onChange}
          />
        ))}
      </nav>
    </div>
  );
};
