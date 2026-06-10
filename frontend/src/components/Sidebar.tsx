// frontend/src/components/Sidebar.tsx

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getFlagUrl } from '../services/api';
import { 
  Trophy, 
  LayoutDashboard, 
  TableProperties, 
  GitBranch, 
  ListOrdered, 
  HelpCircle, 
  Settings, 
  LogOut,
  Flag,
  X,
  Sun,
  Moon
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab, isMobileOpen = false, onCloseMobile }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (!user) return null;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'groups', label: 'Fase de Grupos', icon: TableProperties },
    { id: 'bracket', label: 'Fase Eliminatoria', icon: GitBranch },
    { id: 'rankings', label: 'Rankings y Ligas', icon: ListOrdered },
    { id: 'rules', label: 'Reglas del Juego', icon: HelpCircle },
  ];

  if (user.is_admin) {
    menuItems.push({ id: 'admin', label: 'Panel de Admin', icon: Settings });
  }

  return (
    <aside className={`sidebar glass-panel ${isMobileOpen ? 'open' : ''}`}>
      {/* Title logo */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Trophy style={{ color: 'var(--color-gold)', width: '32px', height: '32px' }} />
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>POLLA 2026</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-emerald)', fontWeight: '700', letterSpacing: '0.1em' }}>MUNDIAL DE FÚTBOL</span>
          </div>
        </div>
        {onCloseMobile && (
          <button 
            onClick={onCloseMobile} 
            className="mobile-close-btn"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'none',
              padding: '4px',
              borderRadius: '4px'
            }}
          >
            <X style={{ width: '24px', height: '24px' }} />
          </button>
        )}
      </div>

      <hr style={{ borderColor: 'var(--border-light)', margin: '4px 0' }} />

      {/* Profile Card */}
      <div className="glass-panel" style={{
        padding: '16px',
        background: 'var(--bg-profile-card)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '8px'
      }}>
        <img 
          src={user.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.name}`} 
          alt="Avatar" 
          style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid var(--color-gold)' }} 
        />
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>{user.name}</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
          <span style={{ fontSize: '0.75rem', background: 'var(--bg-badge)', padding: '2px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Flag style={{ width: '12px', height: '12px' }} /> {user.country || 'N/A'}
          </span>
          {user.favorite_team && (
            <span style={{ fontSize: '0.75rem', background: 'var(--bg-badge)', padding: '2px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <img src={getFlagUrl(user.favorite_team)} alt="team" style={{ width: '14px', height: '10px', objectFit: 'cover' }} /> {user.favorite_team}
            </span>
          )}
        </div>

        <div style={{ 
          display: 'flex', 
          width: '100%', 
          justifyContent: 'space-around', 
          borderTop: '1px solid var(--border-light)', 
          paddingTop: '12px',
          marginTop: '8px'
        }}>
          <div>
            <span style={{ display: 'block', fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-gold)' }}>{user.points_total}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>PUNTOS</span>
          </div>
          <div style={{ borderLeft: '1px solid var(--border-light)' }}></div>
          <div>
            <span style={{ display: 'block', fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-emerald)' }}>{user.hits_total}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>ACIERTOS</span>
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1' }}>
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-link-${item.id}`}
              onClick={() => setCurrentTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                background: isActive ? 'var(--grad-nav-active)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--color-gold)' : '3px solid transparent',
                color: isActive ? 'var(--color-gold)' : 'var(--text-secondary)',
                borderRadius: '0 var(--border-radius-sm) var(--border-radius-sm) 0',
                cursor: 'pointer',
                fontFamily: 'var(--font-display)',
                fontWeight: isActive ? '700' : '500',
                fontSize: '0.95rem',
                textAlign: 'left',
                transition: 'var(--transition-smooth)'
              }}
            >
              <IconComponent style={{ width: '18px', height: '18px' }} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Theme Toggle */}
      <button
        id="btn-desktop-theme-toggle"
        onClick={toggleTheme}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          border: '1px solid var(--border-light)',
          background: 'transparent',
          color: 'var(--text-primary)',
          borderRadius: 'var(--border-radius-sm)',
          cursor: 'pointer',
          fontFamily: 'var(--font-display)',
          fontWeight: '600',
          transition: 'var(--transition-smooth)',
          marginBottom: '8px',
          width: '100%'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        {theme === 'light' ? (
          <>
            <Moon style={{ width: '18px', height: '18px' }} />
            Modo Oscuro
          </>
        ) : (
          <>
            <Sun style={{ width: '18px', height: '18px' }} />
            Modo Claro
          </>
        )}
      </button>

      {/* Logout */}
      <button
        id="btn-logout"
        onClick={logout}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          border: '1px solid var(--border-light)',
          background: 'transparent',
          color: 'hsl(0, 80%, 65%)',
          borderRadius: 'var(--border-radius-sm)',
          cursor: 'pointer',
          fontFamily: 'var(--font-display)',
          fontWeight: '600',
          transition: 'var(--transition-smooth)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(231, 76, 60, 0.1)';
          e.currentTarget.style.borderColor = 'rgba(231, 76, 60, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.borderColor = 'var(--border-light)';
        }}
      >
        <LogOut style={{ width: '18px', height: '18px' }} />
        Cerrar Sesión
      </button>
    </aside>
  );
};
