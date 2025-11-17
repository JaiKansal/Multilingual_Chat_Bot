import React from 'react';

export const HomePage: React.FC = () => {
  return (
    <div className="homepage">
      <h2>🌍 Cross-Lingual AI Assistant</h2>
      <p>Experience seamless multilingual conversations with our intelligent chatbots</p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.1)', 
          padding: '1.5rem', 
          borderRadius: '16px', 
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          minWidth: '200px'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>🛠️ Support Bot</h3>
          <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>Get technical help and support in any language</p>
        </div>
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.1)', 
          padding: '1.5rem', 
          borderRadius: '16px', 
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          minWidth: '200px'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>💼 Sales Bot</h3>
          <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>Explore our products and get personalized demos</p>
        </div>
      </div>
    </div>
  );
};