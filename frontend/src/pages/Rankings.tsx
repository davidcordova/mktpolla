// frontend/src/pages/Rankings.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, getFlagUrl } from '../services/api';
import { 
  Trophy, 
  Download, 
  Users, 
  Plus, 
  Compass, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ChevronRight,
  X,
  LineChart
} from 'lucide-react';

export const Rankings: React.FC = () => {
  const { user } = useAuth();
  
  // Rankings state
  const [globalRankings, setGlobalRankings] = useState<any[]>([]);
  const [historyData, setHistoryData] = useState<any[]>([]);
  
  // Private leagues state
  const [leagues, setLeagues] = useState<any[]>([]);
  const [activeLeague, setActiveLeague] = useState<any>(null);
  const [leagueStandings, setLeagueStandings] = useState<any[]>([]);
  
  // Actions state
  const [newLeagueName, setNewLeagueName] = useState('');
  const [joinLeagueCode, setJoinLeagueCode] = useState('');
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [loadingLeague, setLoadingLeague] = useState(false);

  useEffect(() => {
    fetchMainData();
  }, []);

  const fetchMainData = async () => {
    try {
      setLoading(true);
      // Fetch global rankings
      const rankRes = await api.getRankings();
      if (rankRes.status === 'success') {
        setGlobalRankings(rankRes.rankings);
      }
      
      // Fetch self history
      const historyRes = await api.getRankingHistory();
      if (historyRes.status === 'success') {
        setHistoryData(historyRes.history);
      }
      
      // Fetch leagues list
      const leaguesRes = await api.getLeagues();
      if (leaguesRes.status === 'success') {
        setLeagues(leaguesRes.leagues);
      }
    } catch (err) {
      console.error('Error fetching rankings data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setErrorMsg('');
    if (!newLeagueName.trim()) return;
    
    try {
      const res = await api.createLeague(newLeagueName);
      if (res.status === 'success') {
        setMsg(`¡Liga "${res.league.name}" creada! Comparte el código: ${res.league.code}`);
        setNewLeagueName('');
        // Refresh leagues list
        const listRes = await api.getLeagues();
        if (listRes.status === 'success') {
          setLeagues(listRes.leagues);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al crear la liga.');
    }
  };

  const handleJoinLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setErrorMsg('');
    if (!joinLeagueCode.trim()) return;
    
    try {
      const res = await api.joinLeague(joinLeagueCode);
      if (res.status === 'success') {
        setMsg(`¡Te has unido exitosamente a la liga "${res.league.name}"!`);
        setJoinLeagueCode('');
        // Refresh leagues list
        const listRes = await api.getLeagues();
        if (listRes.status === 'success') {
          setLeagues(listRes.leagues);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al unirse a la liga.');
    }
  };

  const handleLeagueClick = async (league: any) => {
    setActiveLeague(league);
    setLoadingLeague(true);
    try {
      const res = await api.getLeagueDetails(league.id);
      if (res.status === 'success') {
        setLeagueStandings(res.members);
      }
    } catch (err: any) {
      alert(err.message || 'Error al cargar detalles de la liga.');
      setActiveLeague(null);
    } finally {
      setLoadingLeague(false);
    }
  };

  // Render a beautiful custom SVG line chart for ranking history
  const renderTrendChart = () => {
    if (historyData.length < 2) {
      return (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Se necesitan al menos 2 días de juego para mostrar tu gráfica de tendencia.
        </div>
      );
    }
    
    // SVG Dimensions
    const width = 500;
    const height = 150;
    const padding = 25;
    
    // Find min and max points for scaling
    const points = historyData.map(h => h.points);
    const minPts = Math.min(...points);
    const maxPts = Math.max(...points);
    const rangePts = maxPts - minPts || 1;
    
    // Calculate coordinates
    const pointsCount = historyData.length;
    const stepX = (width - padding * 2) / (pointsCount - 1);
    
    const svgPoints = historyData.map((h, idx) => {
      const x = padding + idx * stepX;
      // Invert Y so higher points are at the top
      const y = height - padding - ((h.points - minPts) / rangePts) * (height - padding * 2);
      return { x, y, date: h.ranking_date, value: h.points, pos: h.position };
    });
    
    const pathD = svgPoints.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h4 style={{ fontSize: '0.9rem', color: 'var(--color-gold)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <LineChart style={{ width: '16px', height: '16px' }} />
          Mi Evolución de Puntos
        </h4>
        <div style={{ background: 'var(--rgba-white-02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
          <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
            {/* Draw grid lines */}
            <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="var(--border-light)" strokeDasharray="3" />
            <line x1={padding} y1={height/2} x2={width - padding} y2={height/2} stroke="var(--border-light)" strokeDasharray="3" />
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--border-light)" />
            
            {/* Draw path line */}
            <path d={pathD} fill="none" stroke="var(--color-gold)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            
            {/* Draw gradient fill area */}
            <path 
              d={`${pathD} L ${svgPoints[pointsCount-1].x} ${height - padding} L ${svgPoints[0].x} ${height - padding} Z`} 
              fill="url(#gold-gradient-area)" 
              opacity="0.1" 
            />
            
            <defs>
              <linearGradient id="gold-gradient-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-gold)" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>

            {/* Draw dots */}
            {svgPoints.map((p, idx) => (
              <g key={idx}>
                <circle cx={p.x} cy={p.y} r="5" fill="var(--bg-primary)" stroke="var(--color-gold)" strokeWidth="3" />
                {/* Position text (e.g. #3 or points) */}
                <text x={p.x} y={p.y - 10} textAnchor="middle" fill="var(--text-primary)" fontSize="10" fontWeight="700">
                  {p.value} pts
                </text>
                <text x={p.x} y={p.y + 18} textAnchor="middle" fill="var(--text-muted)" fontSize="9">
                  {p.date.substring(5)}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div className="gradient-text-gold" style={{ fontSize: '1.5rem', fontWeight: '800' }}>Cargando Rankings...</div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-gold)', fontWeight: '800', letterSpacing: '0.15em' }}>LEADERBOARD</span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800' }}>Tablas de Posiciones</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Compara tus puntos con la comunidad mundialista y en tus ligas privadas.</p>
        </div>
        
        <a 
          href={api.getExportUrl()} 
          className="btn-secondary" 
          download="ranking_polla_mundialista_2026.csv"
          id="btn-export-rankings"
        >
          <Download style={{ width: '16px', height: '16px' }} />
          Exportar Tabla (CSV)
        </a>
      </div>

      {(msg || errorMsg) && (
        <div style={{
          background: msg ? 'rgba(34, 153, 84, 0.15)' : 'rgba(231, 76, 60, 0.15)',
          border: msg ? '1px solid rgba(34, 153, 84, 0.3)' : '1px solid rgba(231, 76, 60, 0.3)',
          color: msg ? 'var(--color-emerald)' : 'hsl(0, 85%, 70%)',
          padding: '12px 16px',
          borderRadius: 'var(--border-radius-sm)',
          fontSize: '0.9rem',
          fontWeight: '600'
        }}>
          {msg || errorMsg}
        </div>
      )}

      {/* Grid: Rankings List vs User Stats & Private Leagues */}
      <div className="rankings-grid">
        
        {/* Left Side: General Ranking Table */}
        <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy style={{ color: 'var(--color-gold)', width: '20px', height: '20px' }} />
            Ranking General Global
          </h3>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <th style={{ padding: '12px 8px' }}>POS</th>
                <th style={{ padding: '12px 8px' }}>JUGADOR</th>
                <th style={{ padding: '12px 8px' }}>EMPRESA</th>
                <th style={{ padding: '12px 8px' }}>FAVORITO</th>
                <th style={{ padding: '12px 8px' }}>CAMPEÓN</th>
                <th style={{ padding: '12px 8px', textAlign: 'right' }}>ACIERTOS</th>
                <th style={{ padding: '12px 8px', textAlign: 'right' }}>PUNTOS</th>
              </tr>
            </thead>
            <tbody>
              {globalRankings.map((r) => {
                const isSelf = r.user_id === user?.id;
                return (
                  <tr 
                    key={r.user_id} 
                    style={{ 
                      borderBottom: '1px solid var(--rgba-white-03)', 
                      fontSize: '0.95rem',
                      background: isSelf ? 'var(--color-gold-glow)' : 'transparent',
                      fontWeight: isSelf ? '700' : 'normal'
                    }}
                  >
                    <td style={{ padding: '16px 8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ 
                        display: 'inline-flex', 
                        width: '24px', 
                        height: '24px', 
                        background: r.position === 1 ? 'var(--color-gold)' : r.position === 2 ? '#BDC3C7' : r.position === 3 ? '#D35400' : 'transparent', 
                        color: r.position <= 3 ? '#0c0f16' : 'var(--text-secondary)',
                        borderRadius: '50%',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '800',
                        fontSize: '0.8rem'
                      }}>
                        {r.position}
                      </span>
                      {r.trend === 'UP' && <TrendingUp style={{ color: 'var(--color-emerald)', width: '14px', height: '14px' }} />}
                      {r.trend === 'DOWN' && <TrendingDown style={{ color: 'hsl(0, 80%, 60%)', width: '14px', height: '14px' }} />}
                      {r.trend === 'SAME' && <Minus style={{ color: 'var(--text-muted)', width: '12px', height: '12px' }} />}
                    </td>
                    <td style={{ padding: '16px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img src={r.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${r.name}`} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                        <span>{r.name} {isSelf && <span style={{ fontSize: '0.7rem', background: 'var(--color-gold)', color: '#0c0f16', padding: '1px 4px', borderRadius: '4px', marginLeft: '4px' }}>TÚ</span>}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 8px', color: 'var(--text-secondary)' }}>{r.country || 'N/A'}</td>
                    <td style={{ padding: '16px 8px' }}>
                      {r.favorite_team ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <img src={getFlagUrl(r.favorite_team)} alt="" style={{ width: '16px', height: '11px', objectFit: 'cover' }} />
                          <span style={{ fontSize: '0.85rem' }}>{r.favorite_team}</span>
                        </div>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '16px 8px' }}>
                      {r.champion_predicted ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <img 
                            src={getFlagUrl(r.champion_predicted)} 
                            alt="" 
                            style={{ 
                              width: '16px', 
                              height: '11px', 
                              objectFit: 'cover',
                              filter: r.champion_alive ? 'none' : 'grayscale(100%)' 
                            }} 
                          />
                          <span style={{ 
                            fontSize: '0.85rem', 
                            color: r.champion_alive ? 'var(--text-primary)' : 'var(--text-muted)',
                            textDecoration: r.champion_alive ? 'none' : 'line-through'
                          }}>
                            {r.champion_predicted}
                          </span>
                        </div>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '16px 8px', textAlign: 'right', color: 'var(--text-muted)' }}>{r.hits}</td>
                    <td style={{ padding: '16px 8px', textAlign: 'right', color: 'var(--color-gold)', fontWeight: '800' }}>{r.points}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Right Side: Leagues Manager and Evolution Graph */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Trend graph panel */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            {renderTrendChart()}
          </div>

          {/* Leagues manager panel */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users style={{ color: 'var(--color-emerald)', width: '20px', height: '20px' }} />
              Mis Ligas Privadas
            </h3>

            {/* List leagues */}
            {leagues.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {leagues.map(l => (
                  <button
                    key={l.id}
                    id={`league-item-${l.id}`}
                    onClick={() => handleLeagueClick(l)}
                    className="glass-panel"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'var(--rgba-white-02)',
                      textAlign: 'left',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--border-radius-sm)'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: '700', display: 'block', fontSize: '0.95rem' }}>{l.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cód: {l.code} • {l.total_members} miembros</span>
                    </div>
                    <ChevronRight style={{ width: '16px', height: '16px', color: 'var(--text-muted)' }} />
                  </button>
                ))}
              </div>
            ) : (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>No estás en ninguna liga privada aún. ¡Crea o únete a una!</span>
            )}

            <hr style={{ borderColor: 'var(--border-light)' }} />

            {/* Create League */}
            <form onSubmit={handleCreateLeague} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Crear Nueva Liga</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  id="input-create-league-name"
                  type="text"
                  placeholder="Nombre de la liga..."
                  className="form-input"
                  style={{ flex: 1, padding: '8px 12px', fontSize: '0.9rem' }}
                  value={newLeagueName}
                  onChange={(e) => setNewLeagueName(e.target.value)}
                />
                <button id="btn-create-league" type="submit" className="btn-accent" style={{ padding: '8px 16px' }}>
                  <Plus style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
            </form>

            {/* Join League */}
            <form onSubmit={handleJoinLeague} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Unirse con Código</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  id="input-join-league-code"
                  type="text"
                  placeholder="Código de 6 letras..."
                  className="form-input"
                  style={{ flex: 1, padding: '8px 12px', fontSize: '0.9rem' }}
                  value={joinLeagueCode}
                  onChange={(e) => setJoinLeagueCode(e.target.value)}
                />
                <button id="btn-join-league" type="submit" className="btn-primary" style={{ padding: '8px 16px' }}>
                  <Compass style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
            </form>

          </div>

        </div>

      </div>

      {/* Modal: Private League Standings */}
      {activeLeague && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 100,
          padding: '20px',
          backdropFilter: 'blur(5px)'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '650px',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--border-radius-md)',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.4rem', color: 'var(--color-gold)' }}>{activeLeague.name}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Código de Invitación: <strong>{activeLeague.code}</strong></span>
              </div>
              <button 
                id="btn-close-league-modal"
                onClick={() => setActiveLeague(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X style={{ width: '24px', height: '24px' }} />
              </button>
            </div>

            {loadingLeague ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>Cargando tabla de la liga...</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      <th style={{ padding: '8px' }}>POS</th>
                      <th style={{ padding: '8px' }}>JUGADOR</th>
                      <th style={{ padding: '8px' }}>EMPRESA</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>PUNTOS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(leagueStandings || []).map((m) => {
                      const isSelf = m.user_id === user?.id;
                      return (
                        <tr 
                          key={m.user_id}
                          style={{ 
                            borderBottom: '1px solid var(--rgba-white-02)',
                            background: isSelf ? 'var(--color-gold-glow)' : 'transparent',
                            fontWeight: isSelf ? '700' : 'normal'
                          }}
                        >
                          <td style={{ padding: '12px 8px' }}>#{m.position}</td>
                          <td style={{ padding: '12px 8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <img src={m.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${m.name}`} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                              <span>{m.name}</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{m.country || 'N/A'}</td>
                          <td style={{ padding: '12px 8px', textAlign: 'right', color: 'var(--color-gold)', fontWeight: '800' }}>{m.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
