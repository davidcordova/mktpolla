// frontend/src/pages/GroupPredictions.tsx

import React, { useState, useEffect } from 'react';
import { api, getFlagUrl } from '../services/api';
import { Sparkles, Send, CheckCircle2, RefreshCw } from 'lucide-react';

export const GroupPredictions: React.FC = () => {
  const [activeGroup, setActiveGroup] = useState('A');
  const [matches, setMatches] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<{ 
    [matchId: number]: { 
      prediction: 'A' | 'B' | 'DRAW' | '', 
      predicted_team_a_score: number | '', 
      predicted_team_b_score: number | '' 
    } 
  }>({});
  const [savedPredictionIds, setSavedPredictionIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Load group stage matches
        const matchesRes = await api.getMatches('GROUPS');
        if (matchesRes.status === 'success') {
          setMatches(matchesRes.matches);
        }
        
        // Load user predictions
        const predsRes = await api.getPredictions('GROUPS');
        if (predsRes.status === 'success') {
          const predMap: typeof predictions = {};
          const savedIds = new Set<number>();
          predsRes.predictions.forEach((p: any) => {
            predMap[p.match_id] = {
              prediction: p.prediction || '',
              predicted_team_a_score: p.predicted_team_a_score !== null ? p.predicted_team_a_score : '',
              predicted_team_b_score: p.predicted_team_b_score !== null ? p.predicted_team_b_score : ''
            };
            if (p.prediction) {
              savedIds.add(p.match_id);
            }
          });
          setPredictions(predMap);
          setSavedPredictionIds(savedIds);
        }
      } catch (err) {
        console.error('Error fetching group predictions:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleScoreChange = (matchId: number, team: 'a' | 'b', value: string) => {
    // Check if match is already finished or already saved
    const match = matches.find(m => m.id === matchId);
    if (match && (match.finished || savedPredictionIds.has(matchId))) return;

    const num = value === '' ? '' : parseInt(value, 10);
    setPredictions(prev => {
      const current = prev[matchId] || { prediction: '', predicted_team_a_score: '', predicted_team_b_score: '' };
      const nextA = team === 'a' ? num : current.predicted_team_a_score;
      const nextB = team === 'b' ? num : current.predicted_team_b_score;
      
      // Auto-set prediction if both scores are filled
      let nextPred = current.prediction;
      if (nextA !== '' && nextB !== '') {
        if (nextA > nextB) {
          nextPred = 'A';
        } else if (nextA < nextB) {
          nextPred = 'B';
        } else {
          nextPred = 'DRAW';
        }
      }
      
      return {
        ...prev,
        [matchId]: {
          prediction: nextPred,
          predicted_team_a_score: nextA,
          predicted_team_b_score: nextB
        }
      };
    });
  };

  const handleOutcomeClick = (matchId: number, outcome: 'A' | 'B' | 'DRAW') => {
    // Check if match is already finished or already saved
    const match = matches.find(m => m.id === matchId);
    if (match && (match.finished || savedPredictionIds.has(matchId))) return;

    setPredictions(prev => {
      const current = prev[matchId] || { prediction: '', predicted_team_a_score: '', predicted_team_b_score: '' };
      
      let clearGoals = false;
      const scoreA = current.predicted_team_a_score;
      const scoreB = current.predicted_team_b_score;
      if (scoreA !== '' && scoreB !== '') {
        if (outcome === 'A' && scoreA <= scoreB) clearGoals = true;
        else if (outcome === 'B' && scoreA >= scoreB) clearGoals = true;
        else if (outcome === 'DRAW' && scoreA !== scoreB) clearGoals = true;
      } else {
        // If one or both are empty, we also clear them to avoid partial inputs when switching outcome manually
        clearGoals = true;
      }

      return {
        ...prev,
        [matchId]: {
          prediction: outcome,
          predicted_team_a_score: clearGoals ? '' : scoreA,
          predicted_team_b_score: clearGoals ? '' : scoreB
        }
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    try {
      // Structure predictions payload (only include matches that are NOT already saved/finished)
      const predictionsPayload = Object.keys(predictions)
        .filter(matchId => {
          const mId = parseInt(matchId, 10);
          const p = predictions[mId];
          return p && p.prediction !== '' && !savedPredictionIds.has(mId);
        })
        .map(matchId => {
          const p = predictions[parseInt(matchId, 10)];
          return {
            match_id: parseInt(matchId, 10),
            prediction: p.prediction,
            predicted_team_a_score: p.predicted_team_a_score === '' ? null : Number(p.predicted_team_a_score),
            predicted_team_b_score: p.predicted_team_b_score === '' ? null : Number(p.predicted_team_b_score)
          };
        });
      
      if (predictionsPayload.length === 0) {
        setMsg('No hay nuevos pronósticos por enviar.');
        setTimeout(() => setMsg(''), 3000);
        return;
      }

      const res = await api.savePredictions('GROUPS', predictionsPayload);
      if (res.status === 'success') {
        setMsg('¡Tus pronósticos de grupos se enviaron con éxito! Las modificaciones para estos partidos han sido bloqueadas.');
        const newlySaved = new Set(savedPredictionIds);
        predictionsPayload.forEach(p => newlySaved.add(p.match_id));
        setSavedPredictionIds(newlySaved);
        setTimeout(() => setMsg(''), 5000);
      }
    } catch (err: any) {
      alert(err.message || 'Error al enviar pronósticos.');
    } finally {
      setSaving(false);
    }
  };

  const handleAutocomplete = () => {
    const autoPreds: typeof predictions = { ...predictions };
    let hasNew = false;
    
    // Fill all unfinished and unsaved matches with random goals between 0 and 4
    matches.forEach(m => {
      const isSaved = savedPredictionIds.has(m.id);
      if (!m.finished && !isSaved) {
        hasNew = true;
        const current = predictions[m.id];
        let scoreA = Math.floor(Math.random() * 5);
        let scoreB = Math.floor(Math.random() * 5);
        
        // If there is already a temporary prediction, force a different score combination
        if (current && current.predicted_team_a_score !== '' && current.predicted_team_b_score !== '') {
          let attempts = 0;
          while (
            scoreA === current.predicted_team_a_score && 
            scoreB === current.predicted_team_b_score && 
            attempts < 15
          ) {
            scoreA = Math.floor(Math.random() * 5);
            scoreB = Math.floor(Math.random() * 5);
            attempts++;
          }
        }
        
        autoPreds[m.id] = {
          prediction: scoreA > scoreB ? 'A' : scoreA < scoreB ? 'B' : 'DRAW',
          predicted_team_a_score: scoreA,
          predicted_team_b_score: scoreB
        };
      }
    });

    if (!hasNew) {
      setMsg('Todos los partidos pendientes ya tienen pronósticos guardados.');
      setTimeout(() => setMsg(''), 3000);
      return;
    }

    setPredictions(autoPreds);
    setMsg('Predicciones autocompletadas en pantalla. Recuerda hacer clic en "Enviar Pronósticos" para registrarlas oficialmente.');
    setTimeout(() => setMsg(''), 6000);
  };

  // Filter matches for active group
  const activeMatches = matches.filter(m => m.group_name === activeGroup);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div className="gradient-text-gold" style={{ fontSize: '1.5rem', fontWeight: '800' }}>Cargando Partidos...</div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-gold)', fontWeight: '800', letterSpacing: '0.15em' }}>PRONÓSTICOS</span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800' }}>Fase de Grupos</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Selecciona tus ganadores (obligatorio) e ingresa el marcador exacto (opcional).</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            id="btn-autocomplete-groups"
            onClick={handleAutocomplete} 
            className="btn-secondary"
            style={{ borderColor: 'var(--color-emerald)', color: '#58d68d' }}
          >
            <Sparkles style={{ width: '16px', height: '16px' }} />
            Autocompletar Todo
          </button>
          
          <button 
            id="btn-save-groups"
            onClick={handleSave} 
            className="btn-primary"
            disabled={saving}
          >
            {saving ? (
              <RefreshCw className="animate-spin" style={{ width: '16px', height: '16px' }} />
            ) : (
              <Send style={{ width: '16px', height: '16px' }} />
            )}
            Enviar Pronósticos
          </button>
        </div>
      </div>

      {msg && (
        <div style={{
          background: 'rgba(34, 153, 84, 0.15)',
          border: '1px solid rgba(34, 153, 84, 0.3)',
          color: '#58d68d',
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

      {/* Group Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        overflowX: 'auto', 
        paddingBottom: '8px',
        borderBottom: '1px solid var(--border-light)' 
      }}>
        {groups.map(g => (
          <button
            key={g}
            id={`group-tab-${g}`}
            onClick={() => setActiveGroup(g)}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: activeGroup === g ? 'var(--color-gold)' : 'var(--bg-btn-secondary)',
              color: activeGroup === g ? 'var(--btn-primary-text)' : 'var(--text-secondary)',
              borderRadius: 'var(--border-radius-sm)',
              fontWeight: '700',
              fontFamily: 'var(--font-display)',
              cursor: 'pointer',
              transition: 'var(--transition-smooth)',
              minWidth: '50px'
            }}
          >
            Grupo {g}
          </button>
        ))}
      </div>

      {/* Matches Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {activeMatches.map(m => {
          const pred = predictions[m.id] || { prediction: '', predicted_team_a_score: '', predicted_team_b_score: '' };
          const isSaved = savedPredictionIds.has(m.id);
          const isReadOnly = m.finished || isSaved;
          
          return (
            <div 
              key={m.id} 
              className={`glass-panel match-card ${m.finished ? 'finished-match' : ''}`}
              style={{
                background: 'var(--bg-card)',
                transition: 'var(--transition-smooth)',
                padding: '24px 16px',
                borderColor: isSaved ? 'rgba(34, 153, 84, 0.35)' : 'var(--border-light)',
                boxShadow: isSaved ? '0 0 15px rgba(34, 153, 84, 0.08), var(--box-shadow)' : 'var(--box-shadow)'
              }}
            >
              {/* Team A */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center', flex: 1 }}>
                <img src={getFlagUrl(m.team_a_code)} alt="" className="flag-img flag-large" />
                <span style={{ fontSize: '0.95rem', fontWeight: '800' }}>{m.team_a_name}</span>
                {m.finished && (
                  <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-gold)' }}>{m.team_a_score}</span>
                )}
              </div>

              {/* Selector de Goles y Resultado */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', flex: 1.5 }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.05em' }}>GOLES (OPCIONAL)</span>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    id={`predict-score-${m.id}-a`}
                    type="number"
                    min="0"
                    className="form-input"
                    style={{ width: '46px', height: '34px', padding: '4px', textAlign: 'center', fontSize: '1rem', fontWeight: '700' }}
                    value={pred.predicted_team_a_score}
                    onChange={(e) => handleScoreChange(m.id, 'a', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="-"
                  />
                  <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: '800' }}>-</span>
                  <input
                    id={`predict-score-${m.id}-b`}
                    type="number"
                    min="0"
                    className="form-input"
                    style={{ width: '46px', height: '34px', padding: '4px', textAlign: 'center', fontSize: '1rem', fontWeight: '700' }}
                    value={pred.predicted_team_b_score}
                    onChange={(e) => handleScoreChange(m.id, 'b', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="-"
                  />
                </div>

                {/* Outcome selector buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', width: '100%' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700' }}>RESULTADO (OBLIGATORIO)</span>
                  <div className="predict-button-group" style={{ display: 'flex', gap: '4px', width: '100%' }}>
                    <button
                      onClick={() => handleOutcomeClick(m.id, 'A')}
                      disabled={isReadOnly}
                      className={`predict-btn ${pred.prediction === 'A' ? 'active' : ''}`}
                      style={{ flex: 1, padding: '6px 2px', fontSize: '0.72rem', minWidth: 'auto', whiteSpace: 'nowrap' }}
                    >
                      Gana {m.team_a_code}
                    </button>
                    <button
                      onClick={() => handleOutcomeClick(m.id, 'DRAW')}
                      disabled={isReadOnly}
                      className={`predict-btn ${pred.prediction === 'DRAW' ? 'active-draw' : ''}`}
                      style={{ flex: 1, padding: '6px 2px', fontSize: '0.72rem', minWidth: 'auto', whiteSpace: 'nowrap' }}
                    >
                      Empate
                    </button>
                    <button
                      onClick={() => handleOutcomeClick(m.id, 'B')}
                      disabled={isReadOnly}
                      className={`predict-btn ${pred.prediction === 'B' ? 'active' : ''}`}
                      style={{ flex: 1, padding: '6px 2px', fontSize: '0.72rem', minWidth: 'auto', whiteSpace: 'nowrap' }}
                    >
                      Gana {m.team_b_code}
                    </button>
                  </div>
                </div>

                {isSaved && (
                  <span style={{ 
                    fontSize: '0.7rem', 
                    color: 'var(--color-emerald)', 
                    fontWeight: '800', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px', 
                    marginTop: '-2px' 
                  }}>
                    <CheckCircle2 style={{ width: '12px', height: '12px' }} /> Pronóstico Registrado
                  </span>
                )}

                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  {new Date(m.match_date).toLocaleDateString()} {new Date(m.match_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>

              {/* Team B */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center', flex: 1 }}>
                <img src={getFlagUrl(m.team_b_code)} alt="" className="flag-img flag-large" />
                <span style={{ fontSize: '0.95rem', fontWeight: '800' }}>{m.team_b_name}</span>
                {m.finished && (
                  <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-gold)' }}>{m.team_b_score}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
    </div>
  );
};
