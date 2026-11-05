-- Aplica em um banco ja existente as mudancas feitas no init.sql.
-- O init.sql so roda quando o volume do MySQL e criado pela primeira vez.
-- Rode uma unica vez: o ALTER TABLE falha se a coluna ja existir.
SET NAMES utf8mb4;
USE residuos_iot_db;

-- Distancia da tampa (sensor) ate o fundo: usada para converter distancia em % de nivel.
ALTER TABLE lixeiras
    ADD COLUMN altura_cm INT NOT NULL DEFAULT 100 AFTER capacidade_litros;

-- Os usuarios de teste tinham um texto no lugar do hash e nao conseguiam entrar.
-- Senha dos dois: senha123 (apenas desenvolvimento).
UPDATE usuarios
SET senha_hash = '$2b$10$6s0zCg35HnA.AjZQNcZfRuAulIbjn8fsyjvOncxTuW.nTuMiyItEy'
WHERE senha_hash IN ('hash_senha_gestor', 'hash_senha_motorista');

-- O init.sql antigo gravou os acentos dos dados de teste corrompidos ("HistÃ³rico").
-- C383 e o sinal dessa corrupcao; o filtro evita alterar textos que ja estao corretos.
UPDATE zonas
SET nome = CONVERT(CAST(CONVERT(nome USING latin1) AS BINARY) USING utf8mb4)
WHERE id = 1 AND HEX(nome) LIKE '%C383%';

UPDATE zonas
SET descricao = CONVERT(CAST(CONVERT(descricao USING latin1) AS BINARY) USING utf8mb4)
WHERE id = 1 AND HEX(descricao) LIKE '%C383%';

UPDATE usuarios
SET nome = CONVERT(CAST(CONVERT(nome USING latin1) AS BINARY) USING utf8mb4)
WHERE email = 'joao.coleta@cidade.gov.br' AND HEX(nome) LIKE '%C383%';

-- No SRID 4326 o MySQL le latitude primeiro, entao os pontos antigos estavam invertidos.
UPDATE lixeiras
SET localizacao = ST_PointFromText(
    CONCAT('POINT(', longitude, ' ', latitude, ')'), 4326, 'axis-order=long-lat'
);
