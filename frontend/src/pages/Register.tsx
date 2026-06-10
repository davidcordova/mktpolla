// frontend/src/pages/Register.tsx

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Trophy, User as UserIcon, Mail, Lock, Briefcase, Sparkles } from 'lucide-react';

interface RegisterProps {
  onLoginClick: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onLoginClick }) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('Marketing Alterno');
  const [favoriteTeam, setFavoriteTeam] = useState('MEX');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register({
        name,
        email,
        password,
        country,
        favoriteTeam
      });
    } catch (err: any) {
      setError(err.message || 'Error al crear la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  const companies = [
    'Marketing Alterno', 'Soporte Promocional', 'TYS365'
  ];

  const teams = [
    { code: 'USA', name: 'Estados Unidos' },
    { code: 'MEX', name: 'México' },
    { code: 'CAN', name: 'Canadá' },
    { code: 'ARG', name: 'Argentina' },
    { code: 'BRA', name: 'Brasil' },
    { code: 'COL', name: 'Colombia' },
    { code: 'ESP', name: 'España' },
    { code: 'FRA', name: 'Francia' },
    { code: 'GER', name: 'Alemania' },
    { code: 'ITA', name: 'Italia' },
    { code: 'POR', name: 'Portugal' },
    { code: 'URU', name: 'Uruguay' },
  ];

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'radial-gradient(circle at top left, hsla(150, 80%, 15%, 0.15), transparent 60%), radial-gradient(circle at bottom right, hsla(45, 100%, 15%, 0.1), transparent 60%)',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '500px',
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {/* Title */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{
            background: 'rgba(34, 153, 84, 0.2)',
            border: '1px solid var(--color-emerald)',
            borderRadius: '50%',
            padding: '16px',
            display: 'inline-flex',
            boxShadow: '0 0 20px rgba(34, 153, 84, 0.2)'
          }}>
            <Trophy style={{ color: 'var(--color-emerald)', width: '36px', height: '36px' }} />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800' }} className="gradient-text-emerald">Únete a la Competencia</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Crea tu cuenta gratis en menos de un minuto</p>
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="register-name">Nombre Completo</label>
            <div style={{ position: 'relative' }}>
              <UserIcon style={{ position: 'absolute', left: '14px', top: '15px', width: '18px', height: '18px', color: 'var(--text-muted)' }} />
              <input
                id="register-name"
                type="text"
                className="form-input"
                style={{ paddingLeft: '44px', width: '100%' }}
                placeholder="Juan Pérez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-email">Correo Electrónico</label>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: '14px', top: '15px', width: '18px', height: '18px', color: 'var(--text-muted)' }} />
              <input
                id="register-email"
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

          <div className="form-group">
            <label className="form-label" htmlFor="register-password">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: '14px', top: '15px', width: '18px', height: '18px', color: 'var(--text-muted)' }} />
              <input
                id="register-password"
                type="password"
                className="form-input"
                style={{ paddingLeft: '44px', width: '100%' }}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="register-country">Empresa</label>
              <div style={{ position: 'relative' }}>
                <Briefcase style={{ position: 'absolute', left: '14px', top: '15px', width: '18px', height: '18px', color: 'var(--text-muted)' }} />
                <select
                  id="register-country"
                  className="form-input"
                  style={{ paddingLeft: '44px', width: '100%', appearance: 'none' }}
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                >
                  {companies.map((c) => (
                    <option key={c} value={c} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="register-team">Equipo Favorito</label>
              <div style={{ position: 'relative' }}>
                <Sparkles style={{ position: 'absolute', left: '14px', top: '15px', width: '18px', height: '18px', color: 'var(--text-muted)' }} />
                <select
                  id="register-team"
                  className="form-input"
                  style={{ paddingLeft: '44px', width: '100%', appearance: 'none' }}
                  value={favoriteTeam}
                  onChange={(e) => setFavoriteTeam(e.target.value)}
                >
                  <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Ninguno</option>
                  {teams.map((t) => (
                    <option key={t.code} value={t.code} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button
            id="btn-register-submit"
            type="submit"
            className="btn-accent"
            style={{ justifyContent: 'center', width: '100%', padding: '14px', marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? 'Creando cuenta...' : 'Crear Cuenta y Entrar'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>¿Ya tienes una cuenta? </span>
          <button
            id="btn-go-to-login"
            onClick={onLoginClick}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-emerald)',
              fontWeight: '700',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Inicia sesión aquí
          </button>
        </div>
      </div>
    </div>
  );
};
