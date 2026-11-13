-- Dados de demonstração para o painel (opcional, apenas desenvolvimento).
-- Rode depois das migrações 001 e 002. Senha dos motoristas: senha123.
SET NAMES utf8mb4;
USE residuos_iot_db;

INSERT IGNORE INTO zonas (id, nome, descricao) VALUES
(3, 'Zona Leste', 'Bairros residenciais e escolas'),
(4, 'Zona Norte', 'Região industrial e terminal');

INSERT IGNORE INTO usuarios (nome, email, senha_hash, tipo) VALUES
('Maria Oliveira', 'maria.coleta@cidade.gov.br', '$2b$10$6s0zCg35HnA.AjZQNcZfRuAulIbjn8fsyjvOncxTuW.nTuMiyItEy', 'MOTORISTA'),
('Pedro Santos', 'pedro.coleta@cidade.gov.br', '$2b$10$6s0zCg35HnA.AjZQNcZfRuAulIbjn8fsyjvOncxTuW.nTuMiyItEy', 'MOTORISTA');

UPDATE lixeiras SET endereco = 'Praça Central, Rua Principal 120' WHERE codigo_identificador = 'LIX-001' AND endereco IS NULL;
UPDATE lixeiras SET endereco = 'Av. Getúlio Vargas, 340' WHERE codigo_identificador = 'LIX-002' AND endereco IS NULL;
UPDATE lixeiras SET endereco = 'Terminal Rodoviário, Praça da Liberdade 01' WHERE codigo_identificador = 'LIX-003' AND endereco IS NULL;

INSERT IGNORE INTO lixeiras (codigo_identificador, endereco, latitude, longitude, localizacao, capacidade_litros, altura_cm, nivel_preenchimento_pct, nivel_bateria_pct, status, zona_id) VALUES
('LIX-004', 'Parque Municipal, portão 2', -23.554000, -46.629000, ST_PointFromText('POINT(-46.629000 -23.554000)', 4326, 'axis-order=long-lat'), 240, 100, 67, 55, 'OPERACIONAL', 2),
('LIX-005', 'Escola Estadual, Rua das Flores 88', -23.556200, -46.632700, ST_PointFromText('POINT(-46.632700 -23.556200)', 4326, 'axis-order=long-lat'), 240, 100, 41, 97, 'OPERACIONAL', 2),
('LIX-006', 'Mercado Municipal, Rua da Cantareira 306', -23.548900, -46.636800, ST_PointFromText('POINT(-46.636800 -23.548900)', 4326, 'axis-order=long-lat'), 360, 120, 83, 18, 'OPERACIONAL', 1),
('LIX-007', 'Hospital Regional, Av. Brasil 1500', -23.553000, -46.637800, ST_PointFromText('POINT(-46.637800 -23.553000)', 4326, 'axis-order=long-lat'), 240, 100, 12, 76, 'OPERACIONAL', 2),
('LIX-008', 'Rua Augusta, 900', -23.547000, -46.627500, ST_PointFromText('POINT(-46.627500 -23.547000)', 4326, 'axis-order=long-lat'), 240, 100, 94, 64, 'OPERACIONAL', 3),
('LIX-009', 'Praça da Sé, lado norte', -23.550300, -46.627900, ST_PointFromText('POINT(-46.627900 -23.550300)', 4326, 'axis-order=long-lat'), 240, 100, 58, 33, 'OPERACIONAL', 3),
('LIX-010', 'Estação Norte, saída B', -23.545200, -46.633900, ST_PointFromText('POINT(-46.633900 -23.545200)', 4326, 'axis-order=long-lat'), 360, 120, 76, 88, 'MANUTENCAO', 4),
('LIX-011', 'Galpão industrial, Rua 7', -23.544100, -46.638600, ST_PointFromText('POINT(-46.638600 -23.544100)', 4326, 'axis-order=long-lat'), 1000, 150, 22, 12, 'OPERACIONAL', 4);
