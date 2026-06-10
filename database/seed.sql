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
('MEX', 'México', 'A', 'https://flagcdn.com/w80/mx.png'),
('RSA', 'Sudáfrica', 'A', 'https://flagcdn.com/w80/za.png'),
('KOR', 'Corea del Sur', 'A', 'https://flagcdn.com/w80/kr.png'),
('CZE', 'Chequia', 'A', 'https://flagcdn.com/w80/cz.png'),
('CAN', 'Canadá', 'B', 'https://flagcdn.com/w80/ca.png'),
('SUI', 'Suiza', 'B', 'https://flagcdn.com/w80/ch.png'),
('QAT', 'Catar', 'B', 'https://flagcdn.com/w80/qa.png'),
('BIH', 'Bosnia y Herzegovina', 'B', 'https://flagcdn.com/w80/ba.png'),
('BRA', 'Brasil', 'C', 'https://flagcdn.com/w80/br.png'),
('MAR', 'Marruecos', 'C', 'https://flagcdn.com/w80/ma.png'),
('SCO', 'Escocia', 'C', 'https://flagcdn.com/w80/gb-sct.png'),
('HAI', 'Haití', 'C', 'https://flagcdn.com/w80/ht.png'),
('USA', 'Estados Unidos', 'D', 'https://flagcdn.com/w80/us.png'),
('PAR', 'Paraguay', 'D', 'https://flagcdn.com/w80/py.png'),
('AUS', 'Australia', 'D', 'https://flagcdn.com/w80/au.png'),
('TUR', 'Turquía', 'D', 'https://flagcdn.com/w80/tr.png'),
('CUW', 'Curazao', 'E', 'https://flagcdn.com/w80/cw.png'),
('ECU', 'Ecuador', 'E', 'https://flagcdn.com/w80/ec.png'),
('GER', 'Alemania', 'E', 'https://flagcdn.com/w80/de.png'),
('CIV', 'Costa de Marfil', 'E', 'https://flagcdn.com/w80/ci.png'),
('NED', 'Países Bajos', 'F', 'https://flagcdn.com/w80/nl.png'),
('JPN', 'Japón', 'F', 'https://flagcdn.com/w80/jp.png'),
('SWE', 'Suecia', 'F', 'https://flagcdn.com/w80/se.png'),
('TUN', 'Túnez', 'F', 'https://flagcdn.com/w80/tn.png'),
('BEL', 'Bélgica', 'G', 'https://flagcdn.com/w80/be.png'),
('EGY', 'Egipto', 'G', 'https://flagcdn.com/w80/eg.png'),
('IRN', 'Irán', 'G', 'https://flagcdn.com/w80/ir.png'),
('NZL', 'Nueva Zelanda', 'G', 'https://flagcdn.com/w80/nz.png'),
('ESP', 'España', 'H', 'https://flagcdn.com/w80/es.png'),
('CPV', 'Cabo Verde', 'H', 'https://flagcdn.com/w80/cv.png'),
('KSA', 'Arabia Saudita', 'H', 'https://flagcdn.com/w80/sa.png'),
('URU', 'Uruguay', 'H', 'https://flagcdn.com/w80/uy.png'),
('FRA', 'Francia', 'I', 'https://flagcdn.com/w80/fr.png'),
('SEN', 'Senegal', 'I', 'https://flagcdn.com/w80/sn.png'),
('IRQ', 'Irak', 'I', 'https://flagcdn.com/w80/iq.png'),
('NOR', 'Noruega', 'I', 'https://flagcdn.com/w80/no.png'),
('ARG', 'Argentina', 'J', 'https://flagcdn.com/w80/ar.png'),
('DZA', 'Argelia', 'J', 'https://flagcdn.com/w80/dz.png'),
('AUT', 'Austria', 'J', 'https://flagcdn.com/w80/at.png'),
('JOR', 'Jordania', 'J', 'https://flagcdn.com/w80/jo.png'),
('POR', 'Portugal', 'K', 'https://flagcdn.com/w80/pt.png'),
('COD', 'RD Congo', 'K', 'https://flagcdn.com/w80/cd.png'),
('UZB', 'Uzbekistán', 'K', 'https://flagcdn.com/w80/uz.png'),
('COL', 'Colombia', 'K', 'https://flagcdn.com/w80/co.png'),
('ENG', 'Inglaterra', 'L', 'https://flagcdn.com/w80/gb-eng.png'),
('CRO', 'Croacia', 'L', 'https://flagcdn.com/w80/hr.png'),
('GHA', 'Ghana', 'L', 'https://flagcdn.com/w80/gh.png'),
('PAN', 'Panamá', 'L', 'https://flagcdn.com/w80/pa.png');



-- 3. Insertar Partidos de la Fase de Grupos (72 Partidos, 6 por Grupo)
INSERT INTO matches (stage, group_name, team_a_code, team_b_code, match_date) VALUES
('GROUPS', 'A', 'MEX', 'RSA', '2026-06-11 15:00:00'),
('GROUPS', 'A', 'KOR', 'CZE', '2026-06-11 19:00:00'),
('GROUPS', 'A', 'MEX', 'KOR', '2026-06-11 23:00:00'),
('GROUPS', 'A', 'RSA', 'CZE', '2026-06-12 03:00:00'),
('GROUPS', 'A', 'MEX', 'CZE', '2026-06-12 07:00:00'),
('GROUPS', 'A', 'RSA', 'KOR', '2026-06-12 11:00:00'),
('GROUPS', 'B', 'CAN', 'SUI', '2026-06-12 15:00:00'),
('GROUPS', 'B', 'QAT', 'BIH', '2026-06-12 19:00:00'),
('GROUPS', 'B', 'CAN', 'QAT', '2026-06-12 23:00:00'),
('GROUPS', 'B', 'SUI', 'BIH', '2026-06-13 03:00:00'),
('GROUPS', 'B', 'CAN', 'BIH', '2026-06-13 07:00:00'),
('GROUPS', 'B', 'SUI', 'QAT', '2026-06-13 11:00:00'),
('GROUPS', 'C', 'BRA', 'MAR', '2026-06-13 15:00:00'),
('GROUPS', 'C', 'SCO', 'HAI', '2026-06-13 19:00:00'),
('GROUPS', 'C', 'BRA', 'SCO', '2026-06-13 23:00:00'),
('GROUPS', 'C', 'MAR', 'HAI', '2026-06-14 03:00:00'),
('GROUPS', 'C', 'BRA', 'HAI', '2026-06-14 07:00:00'),
('GROUPS', 'C', 'MAR', 'SCO', '2026-06-14 11:00:00'),
('GROUPS', 'D', 'USA', 'PAR', '2026-06-14 15:00:00'),
('GROUPS', 'D', 'AUS', 'TUR', '2026-06-14 19:00:00'),
('GROUPS', 'D', 'USA', 'AUS', '2026-06-14 23:00:00'),
('GROUPS', 'D', 'PAR', 'TUR', '2026-06-15 03:00:00'),
('GROUPS', 'D', 'USA', 'TUR', '2026-06-15 07:00:00'),
('GROUPS', 'D', 'PAR', 'AUS', '2026-06-15 11:00:00'),
('GROUPS', 'E', 'CUW', 'ECU', '2026-06-15 15:00:00'),
('GROUPS', 'E', 'GER', 'CIV', '2026-06-15 19:00:00'),
('GROUPS', 'E', 'CUW', 'GER', '2026-06-15 23:00:00'),
('GROUPS', 'E', 'ECU', 'CIV', '2026-06-16 03:00:00'),
('GROUPS', 'E', 'CUW', 'CIV', '2026-06-16 07:00:00'),
('GROUPS', 'E', 'ECU', 'GER', '2026-06-16 11:00:00'),
('GROUPS', 'F', 'NED', 'JPN', '2026-06-16 15:00:00'),
('GROUPS', 'F', 'SWE', 'TUN', '2026-06-16 19:00:00'),
('GROUPS', 'F', 'NED', 'SWE', '2026-06-16 23:00:00'),
('GROUPS', 'F', 'JPN', 'TUN', '2026-06-17 03:00:00'),
('GROUPS', 'F', 'NED', 'TUN', '2026-06-17 07:00:00'),
('GROUPS', 'F', 'JPN', 'SWE', '2026-06-17 11:00:00'),
('GROUPS', 'G', 'BEL', 'EGY', '2026-06-17 15:00:00'),
('GROUPS', 'G', 'IRN', 'NZL', '2026-06-17 19:00:00'),
('GROUPS', 'G', 'BEL', 'IRN', '2026-06-17 23:00:00'),
('GROUPS', 'G', 'EGY', 'NZL', '2026-06-18 03:00:00'),
('GROUPS', 'G', 'BEL', 'NZL', '2026-06-18 07:00:00'),
('GROUPS', 'G', 'EGY', 'IRN', '2026-06-18 11:00:00'),
('GROUPS', 'H', 'ESP', 'CPV', '2026-06-18 15:00:00'),
('GROUPS', 'H', 'KSA', 'URU', '2026-06-18 19:00:00'),
('GROUPS', 'H', 'ESP', 'KSA', '2026-06-18 23:00:00'),
('GROUPS', 'H', 'CPV', 'URU', '2026-06-19 03:00:00'),
('GROUPS', 'H', 'ESP', 'URU', '2026-06-19 07:00:00'),
('GROUPS', 'H', 'CPV', 'KSA', '2026-06-19 11:00:00'),
('GROUPS', 'I', 'FRA', 'SEN', '2026-06-19 15:00:00'),
('GROUPS', 'I', 'IRQ', 'NOR', '2026-06-19 19:00:00'),
('GROUPS', 'I', 'FRA', 'IRQ', '2026-06-19 23:00:00'),
('GROUPS', 'I', 'SEN', 'NOR', '2026-06-20 03:00:00'),
('GROUPS', 'I', 'FRA', 'NOR', '2026-06-20 07:00:00'),
('GROUPS', 'I', 'SEN', 'IRQ', '2026-06-20 11:00:00'),
('GROUPS', 'J', 'ARG', 'DZA', '2026-06-20 15:00:00'),
('GROUPS', 'J', 'AUT', 'JOR', '2026-06-20 19:00:00'),
('GROUPS', 'J', 'ARG', 'AUT', '2026-06-20 23:00:00'),
('GROUPS', 'J', 'DZA', 'JOR', '2026-06-21 03:00:00'),
('GROUPS', 'J', 'ARG', 'JOR', '2026-06-21 07:00:00'),
('GROUPS', 'J', 'DZA', 'AUT', '2026-06-21 11:00:00'),
('GROUPS', 'K', 'POR', 'COD', '2026-06-21 15:00:00'),
('GROUPS', 'K', 'UZB', 'COL', '2026-06-21 19:00:00'),
('GROUPS', 'K', 'POR', 'UZB', '2026-06-21 23:00:00'),
('GROUPS', 'K', 'COD', 'COL', '2026-06-22 03:00:00'),
('GROUPS', 'K', 'POR', 'COL', '2026-06-22 07:00:00'),
('GROUPS', 'K', 'COD', 'UZB', '2026-06-22 11:00:00'),
('GROUPS', 'L', 'ENG', 'CRO', '2026-06-22 15:00:00'),
('GROUPS', 'L', 'GHA', 'PAN', '2026-06-22 19:00:00'),
('GROUPS', 'L', 'ENG', 'GHA', '2026-06-22 23:00:00'),
('GROUPS', 'L', 'CRO', 'PAN', '2026-06-23 03:00:00'),
('GROUPS', 'L', 'ENG', 'PAN', '2026-06-23 07:00:00'),
('GROUPS', 'L', 'CRO', 'GHA', '2026-06-23 11:00:00');


