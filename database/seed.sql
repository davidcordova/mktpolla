-- Limpiar datos existentes de equipos y partidos
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM ranking_history;
DELETE FROM league_members;
DELETE FROM leagues;
DELETE FROM bracket_predictions;
DELETE FROM group_predictions;
DELETE FROM matches;
DELETE FROM teams;
DELETE FROM users;

ALTER TABLE ranking_history AUTO_INCREMENT = 1;
ALTER TABLE leagues AUTO_INCREMENT = 1;
ALTER TABLE bracket_predictions AUTO_INCREMENT = 1;
ALTER TABLE group_predictions AUTO_INCREMENT = 1;
ALTER TABLE matches AUTO_INCREMENT = 1;
ALTER TABLE users AUTO_INCREMENT = 1;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Insertar Administrador por Defecto
INSERT INTO users (id, name, email, password_hash, is_admin, avatar_url, country, favorite_team) VALUES
(1, 'Administrador', 'admin@polla.com', '$2y$10$kHiI.jU03joxYXYVOV8yT.6hUJPN.lpmh0Gfovd9VEXPlcrk9Lq.C', TRUE, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80', 'Canadá', 'CAN');

-- 2. Insertar Equipos (48 Países - 12 Grupos de 4)
INSERT INTO teams (code, name, group_name, logo_url) VALUES
('USA', 'Estados Unidos', 'A', 'https://flagcdn.com/w80/us.png'),
('PAN', 'Panamá', 'A', 'https://flagcdn.com/w80/pa.png'),
('JAM', 'Jamaica', 'A', 'https://flagcdn.com/w80/jm.png'),
('CIV', 'Costa de Marfil', 'A', 'https://flagcdn.com/w80/ci.png'),
('MEX', 'México', 'B', 'https://flagcdn.com/w80/mx.png'),
('ECU', 'Ecuador', 'B', 'https://flagcdn.com/w80/ec.png'),
('AUS', 'Australia', 'B', 'https://flagcdn.com/w80/au.png'),
('NGA', 'Nigeria', 'B', 'https://flagcdn.com/w80/ng.png'),
('CAN', 'Canadá', 'C', 'https://flagcdn.com/w80/ca.png'),
('PER', 'Perú', 'C', 'https://flagcdn.com/w80/pe.png'),
('MAR', 'Marruecos', 'C', 'https://flagcdn.com/w80/ma.png'),
('JPN', 'Japón', 'C', 'https://flagcdn.com/w80/jp.png'),
('ARG', 'Argentina', 'D', 'https://flagcdn.com/w80/ar.png'),
('ENG', 'Inglaterra', 'D', 'https://flagcdn.com/w80/gb-eng.png'),
('SEN', 'Senegal', 'D', 'https://flagcdn.com/w80/sn.png'),
('KOR', 'Corea del Sur', 'D', 'https://flagcdn.com/w80/kr.png'),
('BRA', 'Brasil', 'E', 'https://flagcdn.com/w80/br.png'),
('GER', 'Alemania', 'E', 'https://flagcdn.com/w80/de.png'),
('GHA', 'Ghana', 'E', 'https://flagcdn.com/w80/gh.png'),
('IRN', 'Irán', 'E', 'https://flagcdn.com/w80/ir.png'),
('FRA', 'Francia', 'F', 'https://flagcdn.com/w80/fr.png'),
('COL', 'Colombia', 'F', 'https://flagcdn.com/w80/co.png'),
('EGY', 'Egipto', 'F', 'https://flagcdn.com/w80/eg.png'),
('KSA', 'Arabia Saudita', 'F', 'https://flagcdn.com/w80/sa.png'),
('ESP', 'España', 'G', 'https://flagcdn.com/w80/es.png'),
('URU', 'Uruguay', 'G', 'https://flagcdn.com/w80/uy.png'),
('DZA', 'Argelia', 'G', 'https://flagcdn.com/w80/dz.png'),
('IRQ', 'Irak', 'G', 'https://flagcdn.com/w80/iq.png'),
('ITA', 'Italia', 'H', 'https://flagcdn.com/w80/it.png'),
('CHI', 'Chile', 'H', 'https://flagcdn.com/w80/cl.png'),
('CMR', 'Camerún', 'H', 'https://flagcdn.com/w80/cm.png'),
('QAT', 'Catar', 'H', 'https://flagcdn.com/w80/qa.png'),
('POR', 'Portugal', 'I', 'https://flagcdn.com/w80/pt.png'),
('NED', 'Países Bajos', 'I', 'https://flagcdn.com/w80/ne.png'),
('CRC', 'Costa Rica', 'I', 'https://flagcdn.com/w80/cr.png'),
('RSA', 'Sudáfrica', 'I', 'https://flagcdn.com/w80/za.png'),
('BEL', 'Bélgica', 'J', 'https://flagcdn.com/w80/be.png'),
('CRO', 'Croacia', 'J', 'https://flagcdn.com/w80/hr.png'),
('PAR', 'Paraguay', 'J', 'https://flagcdn.com/w80/py.png'),
('TUN', 'Túnez', 'J', 'https://flagcdn.com/w80/tn.png'),
('UKR', 'Ucrania', 'K', 'https://flagcdn.com/w80/ua.png'),
('SUI', 'Suiza', 'K', 'https://flagcdn.com/w80/ch.png'),
('VEN', 'Venezuela', 'K', 'https://flagcdn.com/w80/ve.png'),
('MLI', 'Malí', 'K', 'https://flagcdn.com/w80/ml.png'),
('DEN', 'Dinamarca', 'L', 'https://flagcdn.com/w80/dk.png'),
('SWE', 'Suecia', 'L', 'https://flagcdn.com/w80/se.png'),
('BOL', 'Bolivia', 'L', 'https://flagcdn.com/w80/bo.png'),
('NZL', 'Nueva Zelanda', 'L', 'https://flagcdn.com/w80/nz.png');



-- 3. Insertar Partidos de la Fase de Grupos (72 Partidos, 6 por Grupo)
INSERT INTO matches (stage, group_name, team_a_code, team_b_code, match_date) VALUES
('GROUPS', 'A', 'USA', 'PAN', '2026-06-11 15:00:00'),
('GROUPS', 'A', 'JAM', 'CIV', '2026-06-11 19:00:00'),
('GROUPS', 'A', 'USA', 'JAM', '2026-06-11 23:00:00'),
('GROUPS', 'A', 'PAN', 'CIV', '2026-06-12 03:00:00'),
('GROUPS', 'A', 'USA', 'CIV', '2026-06-12 07:00:00'),
('GROUPS', 'A', 'PAN', 'JAM', '2026-06-12 11:00:00'),
('GROUPS', 'B', 'MEX', 'ECU', '2026-06-12 15:00:00'),
('GROUPS', 'B', 'AUS', 'NGA', '2026-06-12 19:00:00'),
('GROUPS', 'B', 'MEX', 'AUS', '2026-06-12 23:00:00'),
('GROUPS', 'B', 'ECU', 'NGA', '2026-06-13 03:00:00'),
('GROUPS', 'B', 'MEX', 'NGA', '2026-06-13 07:00:00'),
('GROUPS', 'B', 'ECU', 'AUS', '2026-06-13 11:00:00'),
('GROUPS', 'C', 'CAN', 'PER', '2026-06-13 15:00:00'),
('GROUPS', 'C', 'MAR', 'JPN', '2026-06-13 19:00:00'),
('GROUPS', 'C', 'CAN', 'MAR', '2026-06-13 23:00:00'),
('GROUPS', 'C', 'PER', 'JPN', '2026-06-14 03:00:00'),
('GROUPS', 'C', 'CAN', 'JPN', '2026-06-14 07:00:00'),
('GROUPS', 'C', 'PER', 'MAR', '2026-06-14 11:00:00'),
('GROUPS', 'D', 'ARG', 'ENG', '2026-06-14 15:00:00'),
('GROUPS', 'D', 'SEN', 'KOR', '2026-06-14 19:00:00'),
('GROUPS', 'D', 'ARG', 'SEN', '2026-06-14 23:00:00'),
('GROUPS', 'D', 'ENG', 'KOR', '2026-06-15 03:00:00'),
('GROUPS', 'D', 'ARG', 'KOR', '2026-06-15 07:00:00'),
('GROUPS', 'D', 'ENG', 'SEN', '2026-06-15 11:00:00'),
('GROUPS', 'E', 'BRA', 'GER', '2026-06-15 15:00:00'),
('GROUPS', 'E', 'GHA', 'IRN', '2026-06-15 19:00:00'),
('GROUPS', 'E', 'BRA', 'GHA', '2026-06-15 23:00:00'),
('GROUPS', 'E', 'GER', 'IRN', '2026-06-16 03:00:00'),
('GROUPS', 'E', 'BRA', 'IRN', '2026-06-16 07:00:00'),
('GROUPS', 'E', 'GER', 'GHA', '2026-06-16 11:00:00'),
('GROUPS', 'F', 'FRA', 'COL', '2026-06-16 15:00:00'),
('GROUPS', 'F', 'EGY', 'KSA', '2026-06-16 19:00:00'),
('GROUPS', 'F', 'FRA', 'EGY', '2026-06-16 23:00:00'),
('GROUPS', 'F', 'COL', 'KSA', '2026-06-17 03:00:00'),
('GROUPS', 'F', 'FRA', 'KSA', '2026-06-17 07:00:00'),
('GROUPS', 'F', 'COL', 'EGY', '2026-06-17 11:00:00'),
('GROUPS', 'G', 'ESP', 'URU', '2026-06-17 15:00:00'),
('GROUPS', 'G', 'DZA', 'IRQ', '2026-06-17 19:00:00'),
('GROUPS', 'G', 'ESP', 'DZA', '2026-06-17 23:00:00'),
('GROUPS', 'G', 'URU', 'IRQ', '2026-06-18 03:00:00'),
('GROUPS', 'G', 'ESP', 'IRQ', '2026-06-18 07:00:00'),
('GROUPS', 'G', 'URU', 'DZA', '2026-06-18 11:00:00'),
('GROUPS', 'H', 'ITA', 'CHI', '2026-06-18 15:00:00'),
('GROUPS', 'H', 'CMR', 'QAT', '2026-06-18 19:00:00'),
('GROUPS', 'H', 'ITA', 'CMR', '2026-06-18 23:00:00'),
('GROUPS', 'H', 'CHI', 'QAT', '2026-06-19 03:00:00'),
('GROUPS', 'H', 'ITA', 'QAT', '2026-06-19 07:00:00'),
('GROUPS', 'H', 'CHI', 'CMR', '2026-06-19 11:00:00'),
('GROUPS', 'I', 'POR', 'NED', '2026-06-19 15:00:00'),
('GROUPS', 'I', 'CRC', 'RSA', '2026-06-19 19:00:00'),
('GROUPS', 'I', 'POR', 'CRC', '2026-06-19 23:00:00'),
('GROUPS', 'I', 'NED', 'RSA', '2026-06-20 03:00:00'),
('GROUPS', 'I', 'POR', 'RSA', '2026-06-20 07:00:00'),
('GROUPS', 'I', 'NED', 'CRC', '2026-06-20 11:00:00'),
('GROUPS', 'J', 'BEL', 'CRO', '2026-06-20 15:00:00'),
('GROUPS', 'J', 'PAR', 'TUN', '2026-06-20 19:00:00'),
('GROUPS', 'J', 'BEL', 'PAR', '2026-06-20 23:00:00'),
('GROUPS', 'J', 'CRO', 'TUN', '2026-06-21 03:00:00'),
('GROUPS', 'J', 'BEL', 'TUN', '2026-06-21 07:00:00'),
('GROUPS', 'J', 'CRO', 'PAR', '2026-06-21 11:00:00'),
('GROUPS', 'K', 'UKR', 'SUI', '2026-06-21 15:00:00'),
('GROUPS', 'K', 'VEN', 'MLI', '2026-06-21 19:00:00'),
('GROUPS', 'K', 'UKR', 'VEN', '2026-06-21 23:00:00'),
('GROUPS', 'K', 'SUI', 'MLI', '2026-06-22 03:00:00'),
('GROUPS', 'K', 'UKR', 'MLI', '2026-06-22 07:00:00'),
('GROUPS', 'K', 'SUI', 'VEN', '2026-06-22 11:00:00'),
('GROUPS', 'L', 'DEN', 'SWE', '2026-06-22 15:00:00'),
('GROUPS', 'L', 'BOL', 'NZL', '2026-06-22 19:00:00'),
('GROUPS', 'L', 'DEN', 'BOL', '2026-06-22 23:00:00'),
('GROUPS', 'L', 'SWE', 'NZL', '2026-06-23 03:00:00'),
('GROUPS', 'L', 'DEN', 'NZL', '2026-06-23 07:00:00'),
('GROUPS', 'L', 'SWE', 'BOL', '2026-06-23 11:00:00');


