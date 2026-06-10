// frontend/src/pages/Login.tsx

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Trophy, Mail, Lock, Play } from 'lucide-react';

interface LoginProps {
  onRegisterClick: () => void;
}

export const Login: React.FC<LoginProps> = ({ onRegisterClick }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'radial-gradient(circle at top right, hsla(150, 80%, 15%, 0.15), transparent 60%), radial-gradient(circle at bottom left, hsla(45, 100%, 15%, 0.1), transparent 60%)',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '450px',
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {/* Logo and title */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{
            background: 'var(--color-gold-glow)',
            border: '1px solid var(--color-gold)',
            borderRadius: '50%',
            padding: '16px',
            display: 'inline-flex',
            boxShadow: '0 0 20px rgba(241, 196, 15, 0.2)'
          }}>
            <Trophy style={{ color: 'var(--color-gold)', width: '36px', height: '36px' }} />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800' }} className="gradient-text-gold">Polla Mundialista 2026</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Predice el Mundial 2026 y acumula puntos. Campaña exclusiva y premiada por <strong>Marketing Alterno</strong>.</p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(231, 76, 60, 0.15)',
            border: '1px solid rgba(231, 76, 60, 0.3)',
            color: 'hsl(0, 85%, 70%)',
            padding: '12px 16px',
            borderRadius: 'var(--border-radius-sm)',
            fontSize: '0.88rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Email form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="email-input">Correo Electrónico</label>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: '14px', top: '15px', width: '18px', height: '18px', color: 'var(--text-muted)' }} />
              <input
                id="email-input"
                type="email"
                className="form-input"
                style={{ paddingLeft: '44px', width: '100%' }}
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '8px' }}>
            <label className="form-label" htmlFor="password-input">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: '14px', top: '15px', width: '18px', height: '18px', color: 'var(--text-muted)' }} />
              <input
                id="password-input"
                type="password"
                className="form-input"
                style={{ paddingLeft: '44px', width: '100%' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            id="btn-login-submit"
            type="submit"
            className="btn-primary"
            style={{ justifyContent: 'center', width: '100%', padding: '14px' }}
            disabled={loading}
          >
            {loading ? 'Cargando...' : 'Iniciar Sesión'}
            <Play style={{ width: '16px', height: '16px', fill: 'currentColor' }} />
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.9rem', marginTop: '8px' }}>
          <span style={{ color: 'var(--text-muted)' }}>¿No tienes una cuenta? </span>
          <button
            id="btn-go-to-register"
            onClick={onRegisterClick}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-gold)',
              fontWeight: '700',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Regístrate aquí
          </button>
        </div>
      </div>
    </div>
  );
};
