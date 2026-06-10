// frontend/src/pages/Dashboard.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, getFlagUrl } from '../services/api';
import { 
  Calendar, 
  Edit3, 
  Save, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user, updateUser } = useAuth();
  
  // States
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileCountry, setProfileCountry] = useState(user?.country || '');
  const [profileTeam, setProfileTeam] = useState(user?.favorite_team || '');
  const [avatarSeed, setAvatarSeed] = useState(user?.name || '');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  
  const [teams, setTeams] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  
  const [groupPredCount, setGroupPredCount] = useState(0);
  const [bracketPredCount, setBracketPredCount] = useState(0);
  const [championTeam, setChampionTeam] = useState<any>(null);
  const [isChangingChampion, setIsChangingChampion] = useState(false);
  const [selectedTempChampion, setSelectedTempChampion] = useState('');
  
  const [loading, setLoading] = useState(true);

  // Fetch dashboard stats & upcoming matches
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Load matches
        const matchesRes = await api.getMatches();
        if (matchesRes.status === 'success') {
          // Sort upcoming matches (finished = false)
          const upcoming = matchesRes.matches.filter((m: any) => !m.finished).slice(0, 4);
          setMatches(upcoming);
          
          // Count predictions
          const groupPreds = await api.getPredictions('GROUPS');
          setGroupPredCount(groupPreds.predictions.length);
          
          const bracketPreds = await api.getPredictions('ELIMINATORY');
          setBracketPredCount(bracketPreds.predictions.length);
        }
        
        // Load teams for champion selection
        const matchesData = await api.getMatches();
        // Extract teams
        const uniqueTeams: any[] = [];
        const map = new Map();
        for (const m of matchesData.matches) {
          if (!map.has(m.team_a_code)) {
            map.set(m.team_a_code, true);
            uniqueTeams.push({ code: m.team_a_code, name: m.team_a_name, logo: m.team_a_logo });
          }
          if (!map.has(m.team_b_code)) {
            map.set(m.team_b_code, true);
            uniqueTeams.push({ code: m.team_b_code, name: m.team_b_name, logo: m.team_b_logo });
          }
        }
        setTeams(uniqueTeams.sort((a,b) => a.name.localeCompare(b.name)));
        
        // Fetch stats is removed as it is not used in view
        
        // Fetch champion predicted status
        if (user?.champion_predicted_id) {
          const predictedId = user.champion_predicted_id;
          const teamDetail = uniqueTeams.find(t => t.code === predictedId);
          if (teamDetail) {
            let isAlive = true;
            try {
              const rankingsRes = await api.getRankings();
              if (rankingsRes.status === 'success') {
                const selfRank = rankingsRes.rankings.find((r: any) => Number(r.user_id) === Number(user.id));
                if (selfRank && selfRank.champion) {
                  isAlive = selfRank.champion.active;
                }
              }
            } catch (rErr) {
              console.error('Error fetching rankings for champion status:', rErr);
            }
            
            setChampionTeam({
              code: predictedId,
              name: teamDetail.name,
              logo: teamDetail.logo,
              alive: isAlive
            });
            setSelectedTempChampion(predictedId);
          }
        } else {
          setChampionTeam(null);
          setSelectedTempChampion('');
        }
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess('');
    
    const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(avatarSeed)}`;
    
    try {
      const response = await api.updateProfile({
        name: profileName,
        country: profileCountry,
        favoriteTeam: profileTeam,
        avatarUrl: avatarUrl
      });
      
      if (response.status === 'success') {
        updateUser(response.user);
        setSaveSuccess('¡Perfil actualizado con éxito!');
        setIsEditingProfile(false);
        setTimeout(() => setSaveSuccess(''), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Error al actualizar perfil.');
    }
  };

  const handleChampionSelect = async (code: string) => {
    try {
      const res = await api.saveChampion(code);
      if (res.status === 'success') {
        // Refresh local user state
        const profileRes = await api.getProfile();
        if (profileRes.status === 'success') {
          updateUser(profileRes.user);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Error al guardar campeón.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div className="gradient-text-gold" style={{ fontSize: '1.5rem', fontWeight: '800' }}>Cargando Dashboard...</div>
      </div>
    );
  }

  const groupProgressPercent = Math.round((groupPredCount / 72) * 100);
  const bracketProgressPercent = Math.round((bracketPredCount / 31) * 100);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Welcome header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-gold)', fontWeight: '800', letterSpacing: '0.15em' }}>BIENVENIDO</span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800' }}>{user?.name}</h1>
        </div>
        <button 
          id="btn-edit-profile-toggle"
          className="btn-secondary" 
          onClick={() => setIsEditingProfile(!isEditingProfile)}
        >
          <Edit3 style={{ width: '16px', height: '16px' }} />
          {isEditingProfile ? 'Cancelar Edición' : 'Editar Perfil'}
        </button>
      </div>

      {saveSuccess && (
        <div style={{
          background: 'rgba(34, 153, 84, 0.15)',
          border: '1px solid rgba(34, 153, 84, 0.3)',
          color: 'var(--color-emerald)',
          padding: '12px 16px',
          borderRadius: 'var(--border-radius-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: '600'
        }}>
          <CheckCircle style={{ width: '18px', height: '18px' }} />
          {saveSuccess}
        </div>
      )}

      {/* Profile Editing Form Drawer */}
      {isEditingProfile && (
        <form onSubmit={handleProfileSave} className="glass-panel animate-fade-in" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--color-gold)' }}>Personalizar Perfil</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-name">Nombre</label>
              <input 
                id="edit-name"
                type="text" 
                className="form-input" 
                value={profileName} 
                onChange={(e) => setProfileName(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-country">Empresa</label>
              <select 
                id="edit-country"
                className="form-input" 
                value={profileCountry} 
                onChange={(e) => setProfileCountry(e.target.value)} 
              >
                <option value="Marketing Alterno">Marketing Alterno</option>
                <option value="Soporte Promocional">Soporte Promocional</option>
                <option value="TYS365">TYS365</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-fav-team">Seleccionar Equipo Favorito</label>
              <select 
                id="edit-fav-team"
                className="form-input" 
                value={profileTeam} 
                onChange={(e) => setProfileTeam(e.target.value)}
              >
                <option value="">Ninguno</option>
                {teams.map(t => (
                  <option key={t.code} value={t.code}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-avatar-seed">Semilla del Avatar (Generador)</label>
              <input 
                id="edit-avatar-seed"
                type="text" 
                className="form-input" 
                value={avatarSeed} 
                onChange={(e) => setAvatarSeed(e.target.value)} 
              />
            </div>
          </div>
          <button id="btn-save-profile" type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }}>
            <Save style={{ width: '16px', height: '16px' }} />
            Guardar Cambios
          </button>
        </form>
      )}

      {/* Grid of panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* Panel 1: Prediction Completion Meters */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>Progreso de Pronósticos</h3>
          
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
              <span>Fase de Grupos</span>
              <span style={{ fontWeight: '700' }}>{groupPredCount}/72 ({groupProgressPercent}%)</span>
            </div>
            <div style={{ background: 'var(--rgba-white-05)', borderRadius: '10px', height: '12px', overflow: 'hidden' }}>
              <div style={{ 
                background: 'linear-gradient(90deg, var(--color-emerald) 0%, #2ecc71 100%)', 
                width: `${groupProgressPercent}%`, 
                height: '100%',
                borderRadius: '10px',
                transition: 'width 0.5s ease-out'
              }}></div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
              <span>Fase Eliminatoria</span>
              <span style={{ fontWeight: '700' }}>{bracketPredCount}/31 ({bracketProgressPercent}%)</span>
            </div>
            <div style={{ background: 'var(--rgba-white-05)', borderRadius: '10px', height: '12px', overflow: 'hidden' }}>
              <div style={{ 
                background: 'linear-gradient(90deg, var(--color-gold) 0%, #e67e22 100%)', 
                width: `${bracketProgressPercent}%`, 
                height: '100%',
                borderRadius: '10px',
                transition: 'width 0.5s ease-out'
              }}></div>
            </div>
          </div>
          
          {(groupProgressPercent < 100 || bracketProgressPercent < 100) ? (
            <div style={{ display: 'flex', gap: '8px', color: 'var(--color-warning-text)', fontSize: '0.85rem', background: 'var(--bg-warning)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-warning)' }}>
              <AlertCircle style={{ width: '16px', height: '16px', flexShrink: '0' }} />
              <span>Asegúrate de completar todos tus pronósticos antes de que comience el torneo para maximizar tus puntos.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px', color: 'var(--color-emerald)', fontSize: '0.85rem', background: 'rgba(46,204,113,0.08)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(46,204,113,0.15)' }}>
              <CheckCircle style={{ width: '16px', height: '16px', flexShrink: '0' }} />
              <span>¡Felicidades! Has completado todos los pronósticos disponibles.</span>
            </div>
          )}
        </div>

        {/* Panel 2: Champion Prediction Status */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>Mi Campeón Predicho</h3>
          
          {championTeam && !isChangingChampion ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', flex: '1', justifyContent: 'center' }}>
              <img 
                src={getFlagUrl(championTeam.code)} 
                alt={championTeam.name} 
                className="flag-img flag-large" 
                style={{ filter: championTeam.alive ? 'none' : 'grayscale(100%)' }}
              />
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: '800', display: 'block' }}>{championTeam.name}</span>
                
                {championTeam.alive ? (
                  <div style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    marginTop: '8px',
                    background: 'rgba(46, 204, 113, 0.1)',
                    border: '1px solid rgba(46, 204, 113, 0.3)',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    color: '#2ecc71',
                  }} className="pulse-badge-emerald">
                    🟢 Sigue en Competencia
                  </div>
                ) : (
                  <div style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    marginTop: '8px',
                    background: 'rgba(231, 76, 60, 0.1)',
                    border: '1px solid rgba(231, 76, 60, 0.3)',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    color: '#e74c3c'
                  }}>
                    🔴 Eliminado del Torneo
                  </div>
                )}
              </div>
              
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setSelectedTempChampion(championTeam.code);
                  setIsChangingChampion(true);
                }}
                style={{ padding: '6px 12px', fontSize: '0.78rem', marginTop: '4px' }}
              >
                Cambiar Selección
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: '1', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                {championTeam ? 'Selecciona un nuevo campeón predicho:' : 'Aún no has elegido a tu campeón predicho. ¡Elige uno ahora!'}
              </span>
              <div className="form-group" style={{ margin: '0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <select 
                  id="select-champion-quick"
                  className="form-input" 
                  onChange={(e) => setSelectedTempChampion(e.target.value)}
                  value={selectedTempChampion}
                  style={{ width: '100%' }}
                >
                  <option value="" disabled>Selecciona tu Campeón...</option>
                  {teams.map(t => (
                    <option key={t.code} value={t.code}>{t.name}</option>
                  ))}
                </select>
                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                  <button
                    type="button"
                    className="btn-accent"
                    onClick={async () => {
                      if (selectedTempChampion) {
                        await handleChampionSelect(selectedTempChampion);
                        setIsChangingChampion(false);
                      }
                    }}
                    disabled={!selectedTempChampion}
                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
                  >
                    Guardar
                  </button>
                  {championTeam && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setIsChangingChampion(false);
                        setSelectedTempChampion(championTeam?.code || '');
                      }}
                      style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming matches */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar style={{ color: 'var(--color-gold)' }} />
          Próximos Partidos del Torneo
        </h3>
        
        {matches.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {matches.map((m: any) => (
              <div key={m.id} className="glass-panel" style={{ padding: '16px', background: 'var(--rgba-white-01)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                  <span>{m.stage === 'GROUPS' ? `Grupo ${m.group_name}` : m.stage}</span>
                  <span>{new Date(m.match_date).toLocaleDateString()}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img src={getFlagUrl(m.team_a_code)} alt="" className="flag-img" />
                    <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>{m.team_a_code}</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '800' }}>VS</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexDirection: 'row-reverse' }}>
                    <img src={getFlagUrl(m.team_b_code)} alt="" className="flag-img" />
                    <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>{m.team_b_code}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No hay partidos programados pendientes.</div>
        )}
      </div>
      
    </div>
  );
};
