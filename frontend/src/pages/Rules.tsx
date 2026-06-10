// frontend/src/pages/Rules.tsx

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Award, Sparkles } from 'lucide-react';

export const Rules: React.FC = () => {
  const [rules, setRules] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRules = async () => {
      try {
        setLoading(true);
        const res = await api.getRules();
        if (res.status === 'success') {
          setRules(res.rules);
        }
      } catch (err) {
        console.error('Error fetching rules:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRules();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div className="gradient-text-gold" style={{ fontSize: '1.5rem', fontWeight: '800' }}>Cargando Reglas...</div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div>
        <span style={{ fontSize: '0.85rem', color: 'var(--color-gold)', fontWeight: '800', letterSpacing: '0.15em' }}>REGLAS</span>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800' }}>Sistema de Puntuación</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Aprende cómo sumar puntos y competir por el primer lugar de la Polla 2026.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* Match predictions points */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-gold)' }}>
            <Award style={{ width: '20px', height: '20px' }} />
            Puntos por Pronóstico de Partido
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Acumula puntos si adivinas el resultado o ganador exacto de los partidos del Mundial:</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
              <span style={{ fontWeight: '600' }}>Fase de Grupos</span>
              <span style={{ color: 'var(--color-gold)', fontWeight: '800' }}>+{rules?.group_stage?.points} Punto</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
              <span style={{ fontWeight: '600' }}>Dieciseisavos de Final</span>
              <span style={{ color: 'var(--color-gold)', fontWeight: '800' }}>+{rules?.knockout?.round_of_32?.points} Puntos</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
              <span style={{ fontWeight: '600' }}>Octavos de Final</span>
              <span style={{ color: 'var(--color-gold)', fontWeight: '800' }}>+{rules?.knockout?.round_of_16?.points} Puntos</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
              <span style={{ fontWeight: '600' }}>Cuartos de Final</span>
              <span style={{ color: 'var(--color-gold)', fontWeight: '800' }}>+{rules?.knockout?.quarters?.points} Puntos</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
              <span style={{ fontWeight: '600' }}>Semifinales</span>
              <span style={{ color: 'var(--color-gold)', fontWeight: '800' }}>+{rules?.knockout?.semis?.points} Puntos</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px' }}>
              <span style={{ fontWeight: '600' }}>Gran Final</span>
              <span style={{ color: 'var(--color-gold)', fontWeight: '800' }}>+{rules?.knockout?.final?.points} Puntos</span>
            </div>
          </div>
        </div>

        {/* Phase qualification bonuses */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-emerald)' }}>
            <Sparkles style={{ width: '20px', height: '20px' }} />
            Bonos Especiales (Clasificación)
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Gana bonos si adivinas qué equipos logran clasificar a cada etapa eliminatoria:</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '600' }}>Clasifica a Cuartos</span>
                <span style={{ color: 'var(--color-emerald)', fontWeight: '800' }}>+{rules?.bonuses?.quarters_qualified?.points} Puntos</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Por cada equipo acertado en Cuartos</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '600' }}>Clasifica a Semis</span>
                <span style={{ color: 'var(--color-emerald)', fontWeight: '800' }}>+{rules?.bonuses?.semis_qualified?.points} Puntos</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Por cada equipo acertado en Semifinales</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '600' }}>Finalista</span>
                <span style={{ color: 'var(--color-emerald)', fontWeight: '800' }}>+{rules?.bonuses?.finalists?.points} Puntos</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Por cada equipo acertado en la Final</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '8px', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '600' }}>Campeón del Mundo</span>
                <span style={{ color: 'var(--color-emerald)', fontWeight: '800' }}>+{rules?.bonuses?.champion?.points} Puntos</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Si aciertas qué equipo levantará la copa</span>
            </div>
          </div>
        </div>

      </div>

      {/* Rules disclaimer */}
      <div className="glass-panel" style={{ padding: '24px', background: 'var(--rgba-white-01)' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>Notas Importantes</h3>
        <ul style={{ paddingLeft: '20px', fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li>En la <strong>Fase de Grupos</strong>, seleccionar el resultado 1X2 (gana local, empate o gana visitante) es <strong>obligatorio</strong>. Colocar el marcador de goles exacto es <strong>opcional</strong>.</li>
          <li>Si ingresas el marcador exacto y lo aciertas, sumas <strong>+1 punto adicional</strong> en ese partido (+1 punto por resultado + 1 punto por marcador = total 2 puntos).</li>
          <li>En la <strong>Fase Eliminatoria</strong> (de 16avos de final en adelante), debes pronosticar obligatoriamente un ganador. Si hay empate en tiempo regular, los penales deciden qué equipo avanza.</li>
          <li>El ganador de la Polla será aquel jugador con el mayor acumulado de puntos al finalizar la Final del Mundial. En caso de empate, se considerará la cantidad de aciertos exactos totales.</li>
        </ul>
      </div>

    </div>
  );
};
