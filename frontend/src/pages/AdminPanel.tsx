// frontend/src/pages/AdminPanel.tsx

import React, { useState, useEffect } from 'react';
import { api, getFlagUrl } from '../services/api';
import { Sparkles, RefreshCw, Save, CheckCircle2 } from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const [stage, setStage] = useState('GROUPS');
  const [matches, setMatches] = useState<any[]>([]);
  const [scores, setScores] = useState<{ [matchId: number]: { team_a_score: number | '', team_b_score: number | '', winner_code: string, finished: boolean } }>({});
  
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState('');
  
  const stages = [
    { code: 'GROUPS', name: 'Fase de Grupos' },
    { code: 'ROUND_OF_32', name: 'Dieciseisavos' },
    { code: 'ROUND_OF_16', name: 'Octavos' },
    { code: 'QUARTERS', name: 'Cuartos' },
    { code: 'SEMIS', name: 'Semifinales' },
    { code: 'FINAL', name: 'Final' }
  ];

  useEffect(() => {
    fetchMatches();
  }, [stage]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const res = await api.getMatches(stage);
      if (res.status === 'success') {
        setMatches(res.matches);
        
        // Build scores state
        const initialScores: typeof scores = {};
        res.matches.forEach((m: any) => {
          initialScores[m.id] = {
            team_a_score: m.team_a_score !== null ? m.team_a_score : '',
            team_b_score: m.team_b_score !== null ? m.team_b_score : '',
            winner_code: m.winner_code || '',
            finished: m.finished === 1
          };
        });
        setScores(initialScores);
      }
    } catch (err) {
      console.error('Error fetching matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (matchId: number, team: 'a' | 'b', val: string) => {
    const num = val === '' ? '' : parseInt(val);
    setScores(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [team === 'a' ? 'team_a_score' : 'team_b_score']: num
      }
    }));
  };

  const handleWinnerChange = (matchId: number, code: string) => {
    setScores(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        winner_code: code
      }
    }));
  };

  const handleFinishedChange = (matchId: number, isFinished: boolean) => {
    setScores(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        finished: isFinished
      }
    }));
  };

  const handleUpdateMatch = async (matchId: number) => {
    const s = scores[matchId];
    if (s.team_a_score === '' || s.team_b_score === '') {
      alert('Por favor, ingresa los marcadores del partido.');
      return;
    }

    setSavingId(matchId);
    setMsg('');
    try {
      const payload = {
        id: matchId,
        team_a_score: s.team_a_score,
        team_b_score: s.team_b_score,
        winner_code: s.winner_code || null,
        finished: s.finished
      };
      
      const res = await api.updateMatch(payload);
      if (res.status === 'success') {
        setMsg('¡Partido guardado y puntajes actualizados con éxito!');
        fetchMatches(); // refresh
        setTimeout(() => setMsg(''), 4000);
      }
    } catch (err: any) {
      alert(err.message || 'Error al guardar partido.');
    } finally {
      setSavingId(null);
    }
  };

  const handleSimulateStage = async (targetStage: string) => {
    setSimulating(true);
    setMsg('');
    try {
      const res = await api.simulateStage(targetStage);
      if (res.status === 'success') {
        setMsg(`¡Simulación de la etapa "${targetStage}" realizada con éxito!`);
        fetchMatches();
        setTimeout(() => setMsg(''), 4000);
      }
    } catch (err: any) {
      alert(err.message || 'Error al simular etapa.');
    } finally {
      setSimulating(false);
    }
  };

  const handleReset = async () => {
    const confirmInput = window.prompt('ATENCIÓN: Esta acción es totalmente irreversible. Borrará todas las predicciones de los usuarios, resultados oficiales, llaves del bracket y reiniciará el torneo a la fase de grupos. Para continuar, escribe "REINICIAR TORNEO" en mayúsculas:');
    
    if (confirmInput !== 'REINICIAR TORNEO') {
      alert('Confirmación incorrecta. No se ha realizado ningún cambio.');
      return;
    }
    
    setSimulating(true);
    try {
      const res = await api.resetTournament();
      if (res.status === 'success') {
        setMsg('¡El torneo ha sido reiniciado exitosamente! La fase de grupos se cargó de nuevo.');
        fetchMatches();
        setTimeout(() => setMsg(''), 4000);
      }
    } catch (err: any) {
      alert(err.message || 'Error al reiniciar torneo.');
    } finally {
      setSimulating(false);
    }
  };

  const handleSyncResults = async () => {
    setSyncing(true);
    setMsg('');
    try {
      const res = await api.syncResults();
      if (res.status === 'success') {
        setMsg(`¡Sincronización completada! Se actualizaron ${res.synced_count} partidos.`);
        fetchMatches();
      }
    } catch (err: any) {
      alert(err.message || 'Error al sincronizar resultados.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-gold)', fontWeight: '800', letterSpacing: '0.15em' }}>ADMINISTRACIÓN</span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800' }}>Panel del Administrador</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Ingresa resultados oficiales, simula fases de juego y administra la base de datos.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            id="btn-sync-results"
            onClick={handleSyncResults} 
            className="btn-accent"
            disabled={syncing || simulating}
          >
            {syncing ? 'Sincronizando...' : 'Sincronizar con API'}
          </button>
          
          <button 
            id="btn-reset-tournament"
            onClick={handleReset} 
            className="btn-secondary"
            style={{ color: 'hsl(0, 80%, 65%)', borderColor: 'rgba(231, 76, 60, 0.3)' }}
            disabled={simulating || syncing}
          >
            Reiniciar Torneo Completo
          </button>
        </div>
      </div>

      {msg && (
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
          <CheckCircle2 style={{ width: '18px', height: '18px' }} />
          {msg}
        </div>
      )}

      {/* Simulator Quick panel */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '1.25rem', color: 'var(--color-gold)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles style={{ width: '20px', height: '20px' }} />
          Simuladores de Avance de Etapa (Acceso Rápido)
        </h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          Simula de forma aleatoria los resultados de una fase entera. Al simular la fase de grupos, el sistema calculará las posiciones de forma real y creará las llaves oficiales del Round of 32. Al simular fases eliminatorias, creará automáticamente las llaves del siguiente nivel.
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
          <button id="btn-sim-groups" className="btn-accent" onClick={() => handleSimulateStage('GROUPS')} disabled={simulating}>
            Simular Grupos (72 part.)
          </button>
          <button id="btn-sim-r32" className="btn-secondary" onClick={() => handleSimulateStage('ROUND_OF_32')} disabled={simulating}>
            Simular Dieciseisavos (16 part.)
          </button>
          <button id="btn-sim-r16" className="btn-secondary" onClick={() => handleSimulateStage('ROUND_OF_16')} disabled={simulating}>
            Simular Octavos (8 part.)
          </button>
          <button id="btn-sim-q" className="btn-secondary" onClick={() => handleSimulateStage('QUARTERS')} disabled={simulating}>
            Simular Cuartos (4 part.)
          </button>
          <button id="btn-sim-s" className="btn-secondary" onClick={() => handleSimulateStage('SEMIS')} disabled={simulating}>
            Simular Semis (2 part.)
          </button>
          <button id="btn-sim-f" className="btn-secondary" onClick={() => handleSimulateStage('FINAL')} disabled={simulating}>
            Simular Final (1 part.)
          </button>
        </div>
      </div>

      {/* Match Selector Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        overflowX: 'auto', 
        paddingBottom: '8px',
        borderBottom: '1px solid var(--border-light)' 
      }}>
        {stages.map(st => (
          <button
            key={st.code}
            id={`admin-stage-tab-${st.code}`}
            onClick={() => setStage(st.code)}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: stage === st.code ? 'var(--color-gold)' : 'var(--bg-btn-secondary)',
              color: stage === st.code ? 'var(--btn-primary-text)' : 'var(--text-secondary)',
              borderRadius: 'var(--border-radius-sm)',
              fontWeight: '700',
              fontFamily: 'var(--font-display)',
              cursor: 'pointer',
              transition: 'var(--transition-smooth)'
            }}
          >
            {st.name}
          </button>
        ))}
      </div>

      {/* Matches editor list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Cargando partidos...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {matches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No hay partidos generados para esta etapa en la base de datos. Completa las simulaciones anteriores.
            </div>
          ) : (
            matches.map(m => {
              const score = scores[m.id] || { team_a_score: '', team_b_score: '', winner_code: '', finished: false };
              const isKo = stage !== 'GROUPS';
              
              return (
                <div 
                  key={m.id} 
                  className="glass-panel admin-match-card" 
                >
                  {/* Team A Input */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'flex-end' }}>
                    <span style={{ fontWeight: '700', fontSize: '1rem' }}>{m.team_a_name}</span>
                    <img src={getFlagUrl(m.team_a_code)} alt="" className="flag-img" />
                    <input
                      id={`input-score-${m.id}-a`}
                      type="number"
                      min="0"
                      className="form-input"
                      style={{ width: '60px', padding: '8px', textAlign: 'center' }}
                      value={score.team_a_score}
                      onChange={(e) => handleScoreChange(m.id, 'a', e.target.value)}
                    />
                  </div>

                  {/* VS and Draw/Winner select */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '800' }}>VS</span>
                    
                    {isKo && (
                      <select
                        id={`select-winner-${m.id}`}
                        className="form-input"
                        style={{ padding: '4px 8px', fontSize: '0.78rem', width: '120px' }}
                        value={score.winner_code}
                        onChange={(e) => handleWinnerChange(m.id, e.target.value)}
                      >
                        <option value="">Ganador...</option>
                        <option value={m.team_a_code}>{m.team_a_code}</option>
                        <option value={m.team_b_code}>{m.team_b_code}</option>
                      </select>
                    )}
                  </div>

                  {/* Team B Input */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'flex-start' }}>
                    <input
                      id={`input-score-${m.id}-b`}
                      type="number"
                      min="0"
                      className="form-input"
                      style={{ width: '60px', padding: '8px', textAlign: 'center' }}
                      value={score.team_b_score}
                      onChange={(e) => handleScoreChange(m.id, 'b', e.target.value)}
                    />
                    <img src={getFlagUrl(m.team_b_code)} alt="" className="flag-img" />
                    <span style={{ fontWeight: '700', fontSize: '1rem' }}>{m.team_b_name}</span>
                  </div>

                  {/* Save row controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input
                        id={`checkbox-finished-${m.id}`}
                        type="checkbox"
                        checked={score.finished}
                        onChange={(e) => handleFinishedChange(m.id, e.target.checked)}
                      />
                      Finalizado
                    </label>
                    
                    <button
                      id={`btn-save-match-${m.id}`}
                      className="btn-primary"
                      style={{ padding: '8px 12px' }}
                      onClick={() => handleUpdateMatch(m.id)}
                      disabled={savingId === m.id}
                    >
                      {savingId === m.id ? (
                        <RefreshCw className="animate-spin" style={{ width: '14px', height: '14px' }} />
                      ) : (
                        <Save style={{ width: '14px', height: '14px' }} />
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
