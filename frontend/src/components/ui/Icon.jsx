/**
 * @file Icon.jsx
 * Reusable Icon component rendering SVGs.
 */

/**
 * Renders an SVG icon.
 * Usage: <Icon name="search" size={16} className="text-gray-400" />
 * 
 * @param {Object} props
 * @param {string} props.name - Name of the icon
 * @param {number} [props.size=16] - Size in pixels
 * @param {string} [props.className=''] - Additional CSS classes
 */
export const Icon = ({ name, size = 16, className = '' }) => {
  // Common SVG attributes
  const attrs = {
    width: size,
    height: size,
    className,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '2',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    xmlns: 'http://www.w3.org/2000/svg'
  };

  /* === ICONS === */
  switch (name) {
    case 'search':
      return (
        <svg {...attrs} viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      );
    case 'sun':
      return (
        <svg {...attrs} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      );
    case 'moon':
      return (
        <svg {...attrs} viewBox="0 0 24 24">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      );
    case 'menu':
      return (
        <svg {...attrs} viewBox="0 0 24 24">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      );
    case 'close':
    case 'x':
      return (
        <svg {...attrs} viewBox="0 0 24 24">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      );
    case 'arrow-up-right':
    case 'link-external':
      return (
        <svg {...attrs} viewBox="0 0 24 24">
          <line x1="7" y1="17" x2="17" y2="7"></line>
          <polyline points="7 7 17 7 17 17"></polyline>
        </svg>
      );
    case 'star':
      return (
        <svg {...attrs} viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      );
    case 'check':
      return (
        <svg {...attrs} viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      );
    case 'spinner':
      return (
        <svg {...attrs} viewBox="0 0 24 24" stroke="currentColor">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
        </svg>
      );
    default:
      return null;
  }
};
