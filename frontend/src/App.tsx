// frontend/src/App.tsx

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { GroupPredictions } from './pages/GroupPredictions';
import { BracketPredictions } from './pages/BracketPredictions';
import { Rankings } from './pages/Rankings';
import { Rules } from './pages/Rules';
import { AdminPanel } from './pages/AdminPanel';
import { Menu, Trophy, Sun, Moon } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--color-gold)',
        fontFamily: 'var(--font-display)',
        fontSize: '1.5rem',
        fontWeight: '800'
      }}>
        Cargando Polla Mundialista 2026...
      </div>
    );
  }

  // Not logged in flow
  if (!user) {
    if (isRegistering) {
      return <Register onLoginClick={() => setIsRegistering(false)} />;
    }
    return <Login onRegisterClick={() => setIsRegistering(true)} />;
  }

  // Logged in layout
  const renderActiveTab = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'groups':
        return <GroupPredictions />;
      case 'bracket':
        return <BracketPredictions />;
      case 'rankings':
        return <Rankings />;
      case 'rules':
        return <Rules />;
      case 'admin':
        return user.is_admin ? <AdminPanel /> : <Dashboard />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="dashboard-grid">
      {/* Mobile Top Header */}
      <header className="mobile-header">
        <button 
          onClick={() => setIsMobileMenuOpen(true)} 
          className="mobile-menu-btn"
          id="btn-mobile-menu-open"
        >
          <Menu style={{ width: '24px', height: '24px' }} />
        </button>
        <div className="mobile-logo">
          <Trophy style={{ color: 'var(--color-gold)', width: '24px', height: '24px' }} />
          <span style={{ fontWeight: '800', fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>POLLA 2026</span>
        </div>
        <button 
          onClick={toggleTheme} 
          className="mobile-menu-btn"
          id="btn-mobile-theme-toggle"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            borderRadius: 'var(--border-radius-sm)',
            transition: 'var(--transition-smooth)'
          }}
        >
          {theme === 'light' ? <Moon style={{ width: '20px', height: '20px' }} /> : <Sun style={{ width: '20px', height: '20px' }} />}
        </button>
      </header>

      {/* Overlay Backdrop for Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setIsMobileMenuOpen(false)}
          id="mobile-sidebar-overlay"
        />
      )}

      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          setIsMobileMenuOpen(false); // Auto close sidebar on tab change
        }} 
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />
      <main className="main-content">
        {renderActiveTab()}
      </main>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
