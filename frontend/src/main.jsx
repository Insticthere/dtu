import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Normalize any multiple consecutive slashes in the path (e.g. //verify/... -> /verify/...)
if (typeof window !== 'undefined' && window.location.pathname.includes('//')) {
  const cleanPath = window.location.pathname.replace(/\/+/g, '/');
  window.history.replaceState(null, '', cleanPath + window.location.search + window.location.hash);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

