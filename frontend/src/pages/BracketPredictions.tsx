// frontend/src/pages/BracketPredictions.tsx

import React, { useState, useEffect, useRef } from 'react';
import { api, getFlagUrl as getFlagUrlBase } from '../services/api';
import { Save, Info, RefreshCw, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

interface BracketMatch {
  teamA: string;
  teamB: string;
  winner: string;
  predicted_team_a_score: number | '';
  predicted_team_b_score: number | '';
}

interface BracketState {
  ROUND_OF_32: BracketMatch[];
  ROUND_OF_16: BracketMatch[];
  QUARTERS: BracketMatch[];
  SEMIS: BracketMatch[];
  FINAL: BracketMatch[];
}

export const BracketPredictions: React.FC = () => {
  const [bracket, setBracket] = useState<BracketState>({
    ROUND_OF_32: Array(16).fill(null).map(() => ({ teamA: '', teamB: '', winner: '', predicted_team_a_score: '', predicted_team_b_score: '' })),
    ROUND_OF_16: Array(8).fill(null).map(() => ({ teamA: '', teamB: '', winner: '', predicted_team_a_score: '', predicted_team_b_score: '' })),
    QUARTERS: Array(4).fill(null).map(() => ({ teamA: '', teamB: '', winner: '', predicted_team_a_score: '', predicted_team_b_score: '' })),
    SEMIS: Array(2).fill(null).map(() => ({ teamA: '', teamB: '', winner: '', predicted_team_a_score: '', predicted_team_b_score: '' })),
    FINAL: Array(1).fill(null).map(() => ({ teamA: '', teamB: '', winner: '', predicted_team_a_score: '', predicted_team_b_score: '' }))
  });

  const [champion, setChampion] = useState('');
  const [savedChampion, setSavedChampion] = useState('');
  const [savedBracketNodes, setSavedBracketNodes] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [isBracketLocked, setIsBracketLocked] = useState(true);

  // Drag-to-scroll, keyboard navigation, and chevron state & handlers
  const bracketRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  // Drag distance tracking to avoid clicking while dragging
  const hasDragged = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  // Floating navigation button states
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [showScrollControls, setShowScrollControls] = useState(false);

  const updateScrollButtons = () => {
    if (bracketRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = bracketRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
      setShowScrollControls(scrollWidth > clientWidth);
    }
  };

  const scrollBracket = (direction: 'left' | 'right') => {
    if (bracketRef.current) {
      const scrollAmount = 450; // Scroll by roughly two columns
      const amount = direction === 'left' ? -scrollAmount : scrollAmount;
      bracketRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!bracketRef.current) return;
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'BUTTON') return;
    
    setIsDragging(true);
    const startXVal = e.pageX - bracketRef.current.offsetLeft;
    setStartX(startXVal);
    setScrollLeftState(bracketRef.current.scrollLeft);
    
    dragStartPos.current = { x: e.pageX, y: e.pageY };
    hasDragged.current = false;
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    hasDragged.current = false;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setTimeout(() => {
      hasDragged.current = false;
    }, 50);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !bracketRef.current) return;
    
    const currentX = e.pageX;
    const currentY = e.pageY;
    const distance = Math.sqrt(
      Math.pow(currentX - dragStartPos.current.x, 2) + 
      Math.pow(currentY - dragStartPos.current.y, 2)
    );
    
    if (distance > 5) {
      hasDragged.current = true;
    }
    
    if (hasDragged.current) {
      e.preventDefault();
      const x = e.pageX - bracketRef.current.offsetLeft;
      const walk = (x - startX) * 1.5; // Drag speed multiplier
      bracketRef.current.scrollLeft = scrollLeftState - walk;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!bracketRef.current) return;
    const scrollAmount = 150; // Keyboard scroll speed
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      bracketRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      bracketRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  };

  // Keyboard scroll global listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (!bracketRef.current) return;
      
      // Ignore if focus is in an input or select
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') {
        return;
      }
      
      const scrollAmount = 250; // Keyboard scroll speed
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        bracketRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        bracketRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

  
  // To allow easy team logo rendering, we'll keep a code-to-name/logo dictionary
  const [teamsMap, setTeamsMap] = useState<{ [code: string]: { name: string, logo: string } }>({});

  const stageOrder: (keyof BracketState)[] = ['ROUND_OF_32', 'ROUND_OF_16', 'QUARTERS', 'SEMIS', 'FINAL'];

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Load matches to extract team list & metadata
        const matchesRes = await api.getMatches();
        const tMap: { [code: string]: { name: string, logo: string } } = {};
        
        if (matchesRes.status === 'success') {
          matchesRes.matches.forEach((m: any) => {
            tMap[m.team_a_code] = { name: m.team_a_name, logo: m.team_a_logo };
            tMap[m.team_b_code] = { name: m.team_b_name, logo: m.team_b_logo };
          });
          setTeamsMap(tMap);
        }
        
        // Fetch user's saved bracket predictions
        const predsRes = await api.getPredictions('ELIMINATORY');
        
        let initialBracket: BracketState = {
          ROUND_OF_32: Array(16).fill(null).map(() => ({ 
            teamA: '', 
            teamB: '', 
            winner: '',
            predicted_team_a_score: '',
            predicted_team_b_score: ''
          })),
          ROUND_OF_16: Array(8).fill(null).map(() => ({ teamA: '', teamB: '', winner: '', predicted_team_a_score: '', predicted_team_b_score: '' })),
          QUARTERS: Array(4).fill(null).map(() => ({ teamA: '', teamB: '', winner: '', predicted_team_a_score: '', predicted_team_b_score: '' })),
          SEMIS: Array(2).fill(null).map(() => ({ teamA: '', teamB: '', winner: '', predicted_team_a_score: '', predicted_team_b_score: '' })),
          FINAL: Array(1).fill(null).map(() => ({ teamA: '', teamB: '', winner: '', predicted_team_a_score: '', predicted_team_b_score: '' }))
        };

        // If knockout matches have actually been generated by admin, use them to overwrite ROUND_OF_32 teams
        const actualKoMatches = matchesRes.matches.filter((m: any) => m.stage === 'ROUND_OF_32');
        if (actualKoMatches.length === 16) {
          setIsBracketLocked(false);
          actualKoMatches.forEach((m: any, idx: number) => {
            initialBracket.ROUND_OF_32[idx].teamA = m.team_a_code;
            initialBracket.ROUND_OF_32[idx].teamB = m.team_b_code;
          });
        } else {
          setIsBracketLocked(true);
        }

        const savedNodes: typeof savedBracketNodes = {};
        if (predsRes.status === 'success' && predsRes.predictions.length > 0) {
          // Fill from saved predictions
          predsRes.predictions.forEach((p: any) => {
            const st = p.stage as keyof BracketState;
            const idx = p.match_index;
            if (initialBracket[st] && initialBracket[st][idx]) {
              initialBracket[st][idx] = {
                teamA: p.predicted_team_a_code,
                teamB: p.predicted_team_b_code,
                winner: p.winner_code,
                predicted_team_a_score: p.predicted_team_a_score !== null ? p.predicted_team_a_score : '',
                predicted_team_b_score: p.predicted_team_b_score !== null ? p.predicted_team_b_score : ''
              };
              if (p.winner_code) {
                savedNodes[`${st}-${idx}`] = true;
              }
            }
          });
        }
        
        setBracket(initialBracket);
        setSavedBracketNodes(savedNodes);

        // Fetch champion prediction
        const profileRes = await api.getProfile();
        if (profileRes.status === 'success' && profileRes.user.champion_predicted_id) {
          setChampion(profileRes.user.champion_predicted_id);
          setSavedChampion(profileRes.user.champion_predicted_id);
        }
        
      } catch (err) {
        console.error('Error loading bracket data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handleSelectWinner = (stage: keyof BracketState, matchIdx: number, winnerCode: string) => {
    if (!winnerCode) return;
    if (savedBracketNodes[`${stage}-${matchIdx}`]) return; // Block modification if already saved
    
    setBracket(prev => {
      const updated = { ...prev };
      const match = { ...updated[stage][matchIdx] };
      
      // Toggle or set winner
      match.winner = winnerCode;
      updated[stage][matchIdx] = match;
      
      // Advance winner to the next round if not the Final
      const currentStageIndex = stageOrder.indexOf(stage);
      if (currentStageIndex < stageOrder.length - 1) {
        const nextStage = stageOrder[currentStageIndex + 1];
        const nextMatchIdx = Math.floor(matchIdx / 2);
        const isTeamA = (matchIdx % 2 === 0);
        
        const nextMatch = { ...updated[nextStage][nextMatchIdx] };
        
        // If team changes, clear downstream winners to keep bracket logic integral
        const oldTeam = isTeamA ? nextMatch.teamA : nextMatch.teamB;
        if (oldTeam !== winnerCode) {
          if (isTeamA) {
            nextMatch.teamA = winnerCode;
          } else {
            nextMatch.teamB = winnerCode;
          }
          // Clear winner of this next match since the teams changed
          nextMatch.winner = '';
          updated[nextStage][nextMatchIdx] = nextMatch;
          
          // Clear downstream recursively
          clearDownstream(updated, currentStageIndex + 1, nextMatchIdx);
        }
      } else if (stage === 'FINAL') {
        // If final, winner is the world champion!
        setChampion(winnerCode);
      }
      
      return updated;
    });
  };

  // Helper to clear downstream winner nodes if the bracket path changes
  const clearDownstream = (bracketObj: BracketState, stageIndex: number, matchIdx: number) => {
    let currentIdx = matchIdx;
    for (let i = stageIndex; i < stageOrder.length - 1; i++) {
      const nextStage = stageOrder[i + 1];
      const nextMatchIdx = Math.floor(currentIdx / 2);
      const isTeamA = (currentIdx % 2 === 0);
      
      const nextMatch = { ...bracketObj[nextStage][nextMatchIdx] };
      if (isTeamA) {
        nextMatch.teamA = '';
        nextMatch.predicted_team_a_score = '';
      } else {
        nextMatch.teamB = '';
        nextMatch.predicted_team_b_score = '';
      }
      nextMatch.winner = '';
      bracketObj[nextStage][nextMatchIdx] = nextMatch;
      
      currentIdx = nextMatchIdx;
    }
    // Also clear champion if final path is disrupted
    setChampion('');
  };

  const handleBracketScoreChange = (stage: keyof BracketState, matchIdx: number, teamType: 'A' | 'B', val: string) => {
    if (savedBracketNodes[`${stage}-${matchIdx}`]) return; // Block modification if already saved
    
    const scoreVal = val === '' ? '' : parseInt(val, 10);
    if (scoreVal !== '' && (isNaN(scoreVal) || scoreVal < 0)) return;

    setBracket(prev => {
      const updated = { ...prev };
      const match = { ...updated[stage][matchIdx] };

      if (teamType === 'A') {
        match.predicted_team_a_score = scoreVal;
      } else {
        match.predicted_team_b_score = scoreVal;
      }

      updated[stage][matchIdx] = match;

      // Auto-determine and advance winner if score is unequal and both are filled
      const scoreA = match.predicted_team_a_score;
      const scoreB = match.predicted_team_b_score;

      if (scoreA !== '' && scoreB !== '') {
        let autoWinner = '';
        if (scoreA > scoreB) {
          autoWinner = match.teamA;
        } else if (scoreB > scoreA) {
          autoWinner = match.teamB;
        }

        if (autoWinner && autoWinner !== match.winner) {
          match.winner = autoWinner;
          updated[stage][matchIdx] = match;

          // Advance winner to the next round if not the Final
          const currentStageIndex = stageOrder.indexOf(stage);
          if (currentStageIndex < stageOrder.length - 1) {
            const nextStage = stageOrder[currentStageIndex + 1];
            const nextMatchIdx = Math.floor(matchIdx / 2);
            const isTeamA = (matchIdx % 2 === 0);

            const nextMatch = { ...updated[nextStage][nextMatchIdx] };
            const oldTeam = isTeamA ? nextMatch.teamA : nextMatch.teamB;

            if (oldTeam !== autoWinner) {
              if (isTeamA) {
                nextMatch.teamA = autoWinner;
              } else {
                nextMatch.teamB = autoWinner;
              }
              nextMatch.winner = '';
              updated[nextStage][nextMatchIdx] = nextMatch;

              // Clear downstream recursively
              clearDownstream(updated, currentStageIndex + 1, nextMatchIdx);
            }
          } else if (stage === 'FINAL') {
            setChampion(autoWinner);
          }
        }
      }

      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    try {
      // 1. Save bracket predictions
      const payload: any[] = [];
      stageOrder.forEach(stage => {
        bracket[stage].forEach((m, idx) => {
          // Only save nodes that have teams populated (so it is clean)
          // Also only save ones that are not already saved
          if (m.teamA && m.teamB && m.winner && !savedBracketNodes[`${stage}-${idx}`]) {
            payload.push({
              stage,
              match_index: idx,
              predicted_team_a_code: m.teamA,
              predicted_team_b_code: m.teamB,
              winner_code: m.winner,
              predicted_team_a_score: m.predicted_team_a_score === '' ? null : Number(m.predicted_team_a_score),
              predicted_team_b_score: m.predicted_team_b_score === '' ? null : Number(m.predicted_team_b_score)
            });
          }
        });
      });
      
      if (payload.length > 0) {
        await api.savePredictions('ELIMINATORY', payload);
        const newlySaved = { ...savedBracketNodes };
        payload.forEach(p => {
          newlySaved[`${p.stage}-${p.match_index}`] = true;
        });
        setSavedBracketNodes(newlySaved);
      }
      
      // 2. Save champion prediction
      if (champion && champion !== savedChampion) {
        await api.saveChampion(champion);
        setSavedChampion(champion);
      }
      
      setMsg('¡Pronósticos del bracket guardados correctamente!');
      setTimeout(() => setMsg(''), 4000);
      
    } catch (err: any) {
      alert(err.message || 'Error al guardar pronósticos.');
    } finally {
      setSaving(false);
    }
  };

  const getFlagUrl = (code: string) => {
    if (!code) return 'https://placehold.co/40x30/1e293b/a1a1aa?text=?';
    
    // Check if team details are loaded
    if (teamsMap[code] && teamsMap[code].logo && teamsMap[code].logo.startsWith('http')) {
      return teamsMap[code].logo;
    }
    
    return getFlagUrlBase(code);
  };

  const getTeamName = (code: string) => {
    if (!code) return 'Por definir';
    return teamsMap[code]?.name || code;
  };

  const renderTeamRow = (stage: keyof BracketState, matchIdx: number, teamCode: string, teamType: 'A' | 'B') => {
    const match = bracket[stage][matchIdx];
    const isWinner = match.winner === teamCode && teamCode;
    const scoreVal = teamType === 'A' ? match.predicted_team_a_score : match.predicted_team_b_score;
    const isSaved = savedBracketNodes[`${stage}-${matchIdx}`];

    return (
      <div 
        className={`bracket-team ${isWinner ? 'winner-predicted' : ''}`}
        onClick={(e) => {
          if (hasDragged.current) {
            e.stopPropagation();
            return;
          }
          handleSelectWinner(stage, matchIdx, teamCode);
        }}
        style={{ pointerEvents: (teamCode && !isSaved) ? 'auto' : 'none', opacity: teamCode ? 1 : 0.5 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          <img src={getFlagUrl(teamCode)} alt="" className="flag-img" style={{ width: '20px', height: '14px', flexShrink: 0 }} />
          <span className="team-name" style={{ 
            fontSize: stage === 'FINAL' ? '0.9rem' : '0.85rem', 
            fontWeight: stage === 'FINAL' ? '700' : 'normal',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '120px'
          }}>
            {getTeamName(teamCode)}
          </span>
        </div>
        {teamCode && (
          <input
            type="number"
            min="0"
            placeholder="-"
            value={scoreVal}
            onChange={(e) => handleBracketScoreChange(stage, matchIdx, teamType, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            disabled={isSaved}
            style={{
              width: '36px',
              height: '22px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: isWinner ? '1px solid var(--color-gold)' : '1px solid var(--border-light)',
              borderRadius: '4px',
              color: isWinner ? 'var(--color-gold)' : 'var(--text-primary)',
              textAlign: 'center',
              fontSize: '0.85rem',
              fontWeight: '700',
              padding: '0 2px',
              marginLeft: '8px',
              opacity: isSaved ? 0.75 : 1
            }}
          />
        )}
      </div>
    );
  };

  const renderBracketMatch = (stage: keyof BracketState, idx: number, key: string, customStyle = {}) => {
    const isMatchSaved = savedBracketNodes[`${stage}-${idx}`];
    return (
      <div 
        key={key} 
        className="bracket-match" 
        style={{ 
          borderColor: isMatchSaved ? 'rgba(34, 153, 84, 0.4)' : 'var(--border-light)',
          background: isMatchSaved ? 'rgba(34, 153, 84, 0.03)' : 'var(--bg-card)',
          boxShadow: isMatchSaved ? '0 0 10px rgba(34, 153, 84, 0.08)' : 'var(--box-shadow)',
          ...customStyle
        }}
      >
        {renderTeamRow(stage, idx, bracket[stage][idx].teamA, 'A')}
        {renderTeamRow(stage, idx, bracket[stage][idx].teamB, 'B')}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div className="gradient-text-gold" style={{ fontSize: '1.5rem', fontWeight: '800' }}>Cargando Bracket...</div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-gold)', fontWeight: '800', letterSpacing: '0.15em' }}>SIMULADOR</span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800' }}>Bracket Eliminatorio</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Haz clic en un equipo para avanzar al ganador de la llave o ingresa goles para definir el resultado.</p>
        </div>
        
        <button 
          id="btn-save-bracket"
          onClick={handleSave} 
          className="btn-primary"
          disabled={saving || isBracketLocked}
        >
          {saving ? (
            <RefreshCw className="animate-spin" style={{ width: '16px', height: '16px' }} />
          ) : (
            <Save style={{ width: '16px', height: '16px' }} />
          )}
          Guardar Llaves
        </button>
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

      {/* Bracket instructions */}
      <div style={{ display: 'flex', gap: '12px', background: 'rgba(52, 152, 219, 0.08)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(52, 152, 219, 0.15)', fontSize: '0.88rem' }}>
        <Info style={{ color: 'var(--color-neon-blue)', flexShrink: 0 }} />
        <div>
          <span style={{ fontWeight: '700', color: 'var(--color-neon-blue)' }}>¿Cómo jugar? </span>
          <span>Ingresa el marcador pronosticado para cada llave. El ganador avanzará automáticamente. Si hay empate, haz clic en el equipo que consideras que clasificará. Al llegar a la Final, al definir un ganador también se guardará como tu Campeón del Mundo.</span>
        </div>
      </div>

      {isBracketLocked && (
        <div style={{
          display: 'flex',
          gap: '12px',
          background: 'rgba(230, 126, 34, 0.08)',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid rgba(230, 126, 34, 0.25)',
          color: '#f39c12',
          fontSize: '0.9rem',
          fontWeight: '600',
          alignItems: 'center'
        }}>
          <Info style={{ color: '#f39c12', flexShrink: 0 }} />
          <div>
            La fase de grupos aún no ha concluido y las llaves de octavos/dieciseisavos no han sido definidas oficialmente. Podrás ingresar tus pronósticos una vez el administrador finalice la fase de grupos.
          </div>
        </div>
      )}

      {/* Champion display */}
      {champion && (
        <div className="glass-panel glass-panel-glow-gold animate-fade-in" style={{
          padding: '20px',
          background: 'radial-gradient(ellipse at center, hsla(45, 100%, 50%, 0.06), transparent)',
          alignSelf: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          minWidth: '280px',
          borderColor: savedChampion ? 'rgba(34, 153, 84, 0.4)' : 'var(--border-glow)'
        }}>
          <span style={{ fontSize: '0.78rem', color: savedChampion ? 'var(--color-emerald)' : 'var(--color-gold)', fontWeight: '800', letterSpacing: '0.2em' }}>
            {savedChampion ? 'CAMPEÓN PRONOSTICADO (REGISTRADO)' : 'CAMPEÓN PRONOSTICADO'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={getFlagUrl(champion)} alt="champion flag" className="flag-img" style={{ width: '48px', height: '32px', borderRadius: '4px' }} />
            <span style={{ fontSize: '1.6rem', fontWeight: '800' }}>{getTeamName(champion)}</span>
          </div>
        </div>
      )}

      {/* Bracket visualizer wrapper */}
      <div style={{ position: 'relative', width: '100%' }}>
        {showScrollControls && (
          <>
            <button
              onClick={() => scrollBracket('left')}
              className={`bracket-scroll-btn scroll-left ${canScrollLeft ? 'visible' : ''}`}
              aria-label="Desplazar a la izquierda"
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'var(--bg-secondary)',
                backdropFilter: 'var(--glass-backdrop)',
                border: '1px solid var(--border-glow)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                opacity: canScrollLeft ? 0.95 : 0,
                pointerEvents: canScrollLeft ? 'auto' : 'none',
                transition: 'var(--transition-smooth)',
                boxShadow: 'var(--box-shadow)'
              }}
            >
              <ChevronLeft style={{ width: '24px', height: '24px' }} />
            </button>
            
            <button
              onClick={() => scrollBracket('right')}
              className={`bracket-scroll-btn scroll-right ${canScrollRight ? 'visible' : ''}`}
              aria-label="Desplazar a la derecha"
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'var(--bg-secondary)',
                backdropFilter: 'var(--glass-backdrop)',
                border: '1px solid var(--border-glow)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                opacity: canScrollRight ? 0.95 : 0,
                pointerEvents: canScrollRight ? 'auto' : 'none',
                transition: 'var(--transition-smooth)',
                boxShadow: 'var(--box-shadow)'
              }}
            >
              <ChevronRight style={{ width: '24px', height: '24px' }} />
            </button>
          </>
        )}

        <div 
          ref={bracketRef}
          className="bracket-container" 
          tabIndex={0}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onKeyDown={handleKeyDown}
          onScroll={updateScrollButtons}
          style={{ 
            paddingBottom: '40px',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: isDragging ? 'none' : 'auto',
            outline: 'none'
          }}
        >
          
          {/* LEFT ROUND OF 32 */}
          <div className="bracket-round">
            <h4 style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '16px' }}>16avos</h4>
            <div className="bracket-matches-col">
              {bracket.ROUND_OF_32.slice(0, 8).map((_, idx) => renderBracketMatch('ROUND_OF_32', idx, `r32-l-${idx}`))}
            </div>
          </div>

          {/* LEFT ROUND OF 16 */}
          <div className="bracket-round">
            <h4 style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '16px' }}>8avos</h4>
            <div className="bracket-matches-col">
              {bracket.ROUND_OF_16.slice(0, 4).map((_, idx) => renderBracketMatch('ROUND_OF_16', idx, `r16-l-${idx}`))}
            </div>
          </div>

          {/* LEFT QUARTERS */}
          <div className="bracket-round">
            <h4 style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '16px' }}>4tos</h4>
            <div className="bracket-matches-col">
              {bracket.QUARTERS.slice(0, 2).map((_, idx) => renderBracketMatch('QUARTERS', idx, `q-l-${idx}`))}
            </div>
          </div>

          {/* LEFT SEMIS */}
          <div className="bracket-round">
            <h4 style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '16px' }}>Semis</h4>
            <div className="bracket-matches-col">
              {bracket.SEMIS.slice(0, 1).map((_, idx) => renderBracketMatch('SEMIS', idx, `s-l-${idx}`))}
            </div>
          </div>

          {/* CENTER FINAL */}
          <div className="bracket-round">
            <h4 style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '16px' }}>FINAL</h4>
            <div className="bracket-matches-col">
              {bracket.FINAL.map((_, idx) => renderBracketMatch('FINAL', idx, `f-${idx}`, {
                borderColor: savedBracketNodes['FINAL-0'] ? 'rgba(34, 153, 84, 0.4)' : 'var(--border-glow)',
                boxShadow: '0 0 20px rgba(241,196,15,0.1)'
              }))}
            </div>
          </div>

          {/* RIGHT SEMIS */}
          <div className="bracket-round">
            <h4 style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '16px' }}>Semis</h4>
            <div className="bracket-matches-col">
              {bracket.SEMIS.slice(1, 2).map((_, idx) => renderBracketMatch('SEMIS', idx + 1, `s-r-${idx}`))}
            </div>
          </div>

          {/* RIGHT QUARTERS */}
          <div className="bracket-round">
            <h4 style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '16px' }}>4tos</h4>
            <div className="bracket-matches-col">
              {bracket.QUARTERS.slice(2, 4).map((_, idx) => renderBracketMatch('QUARTERS', idx + 2, `q-r-${idx}`))}
            </div>
          </div>

          {/* RIGHT ROUND OF 16 */}
          <div className="bracket-round">
            <h4 style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '16px' }}>8avos</h4>
            <div className="bracket-matches-col">
              {bracket.ROUND_OF_16.slice(4, 8).map((_, idx) => renderBracketMatch('ROUND_OF_16', idx + 4, `r16-r-${idx}`))}
            </div>
          </div>

          {/* RIGHT ROUND OF 32 */}
          <div className="bracket-round">
            <h4 style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '16px' }}>16avos</h4>
            <div className="bracket-matches-col">
              {bracket.ROUND_OF_32.slice(8, 16).map((_, idx) => renderBracketMatch('ROUND_OF_32', idx + 8, `r32-r-${idx}`))}
            </div>
          </div>

        </div>
      </div>
      
    </div>
  );
};

