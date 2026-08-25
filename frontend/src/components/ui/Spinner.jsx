/**
 * @file Spinner.jsx
 * Loading spinner components.
 */

/** Full-page centered spinner for loading states */
export const PageSpinner = () => (
  <div className="flex justify-center items-center h-screen dark:bg-dark-bg">
    <div className="spinner"></div>
  </div>
);

/**
 * Inline spinner for buttons or small blocks.
 * @param {Object} props
 * @param {number} [props.size=4] - Size of the spinner in rem/em (adjusts w/ h-4 w-4 tailwind classes)
 */
export const InlineSpinner = ({ size = 4 }) => (
  <div className={`animate-spin h-${size} w-${size} border-2 border-white border-t-transparent rounded-full`}></div>
);
