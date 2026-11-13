-- Comprovação de coleta: tag UHF RFID de cada lixeira e esvaziamento detectado pelo sensor.
-- Rode uma única vez, depois da 002.
SET NAMES utf8mb4;
USE residuos_iot_db;

-- Código (EPC) da tag UHF colada na lixeira.
ALTER TABLE lixeiras
    ADD COLUMN epc VARCHAR(64) NULL UNIQUE AFTER codigo_identificador,
    ADD COLUMN ultimo_esvaziamento DATETIME NULL AFTER ultima_atualizacao;

ALTER TABLE rota_paradas
    -- Como a coleta foi marcada: leitura da tag, queda de nível no sensor ou toque no app.
    ADD COLUMN confirmacao ENUM('RFID', 'SENSOR', 'MANUAL') NULL AFTER data_hora_coleta,
    ADD COLUMN epc_lido VARCHAR(64) NULL AFTER confirmacao,
    -- Nível da lixeira no momento da coleta: abaixo do limite não se espera queda no sensor.
    ADD COLUMN nivel_na_coleta INT NULL AFTER epc_lido,
    -- Quando o sensor viu o nível despencar nessa lixeira (prova de que foi esvaziada).
    ADD COLUMN esvaziada_em DATETIME NULL AFTER nivel_na_coleta;
