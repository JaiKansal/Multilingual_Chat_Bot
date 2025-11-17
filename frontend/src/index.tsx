import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css'; // Keep the awesome CSS
import App from './App';
import { BrowserRouter } from 'react-router-dom'; // <-- IMPORT THIS

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    {/* V-- ADD THIS WRAPPER --V */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
    {/* ^-- ADD THIS WRAPPER --^ */}
  </React.StrictMode>
);