-- Colunas usadas pelo painel web e pelo acompanhamento de rotas.
-- Rode uma única vez, depois da 001: o ALTER TABLE falha se a coluna já existir.
SET NAMES utf8mb4;
USE residuos_iot_db;

-- Gestor pode desativar um motorista sem apagar o histórico dele.
ALTER TABLE usuarios
    ADD COLUMN ativo BOOLEAN NOT NULL DEFAULT TRUE AFTER tipo;

-- Endereço legível do ponto de coleta (ex.: "Praça Central, Rua Principal 120").
ALTER TABLE lixeiras
    ADD COLUMN endereco VARCHAR(150) NULL AFTER codigo_identificador;

-- Quando o motorista começou e terminou a rota.
ALTER TABLE rotas
    ADD COLUMN iniciada_em DATETIME NULL AFTER tempo_estimado_min,
    ADD COLUMN concluida_em DATETIME NULL AFTER iniciada_em;

-- Uma lixeira aparece no máximo uma vez em cada rota.
ALTER TABLE rota_paradas
    ADD UNIQUE INDEX rota_lixeira_unica (rota_id, lixeira_id);
