/**
 * main.jsx — React application entry point
 *
 * Mounts the App component into the #root div.
 * Imports global CSS (Tailwind) before anything else.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
