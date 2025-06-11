import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';
// If you have a global stylesheet, import it here e.g.
// import './index.css';

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </React.StrictMode>
  );
} else {
  console.error("Failed to find the root element. Ensure your index.html has a div with id='root'.");
}

// The backend code previously in this file has been removed
// as it's server-side code and cannot be run directly by the browser
// when index.html loads this script.
// That backend logic would need to be hosted and run separately.
// For example, the backend app definition would typically be in 
// a file like server.tsx or api.tsx, and run in a Node.js 
// or Deno environment, or a local server platform.