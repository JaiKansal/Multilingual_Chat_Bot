import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import './App.css'; 

// Import our new pages
import { HomePage } from './pages/HomePage';
import { SupportPage } from './pages/SupportPage';
import { SalesPage } from './pages/SalesPage';

function App() {
  return (
    <div className="App">
      {/* --- Navigation Bar --- */}
      <nav className="main-nav">
        <Link to="/">Home</Link>
        <Link to="/support">Support Chat</Link>
        <Link to="/sales">Sales Chat</Link>
      </nav>

      {/* --- Page Content Area --- */}
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/sales" element={<SalesPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;