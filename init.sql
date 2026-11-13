SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS residuos_iot_db;
USE residuos_iot_db;

-- 1. Zonas
CREATE TABLE IF NOT EXISTS zonas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Lixeiras (Com suporte espacial POINT)
CREATE TABLE IF NOT EXISTS lixeiras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_identificador VARCHAR(50) UNIQUE NOT NULL,
    epc VARCHAR(64) NULL UNIQUE, -- código da tag UHF RFID
    endereco VARCHAR(150) NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    localizacao POINT SRID 4326 NOT NULL,
    capacidade_litros INT DEFAULT 240,
    altura_cm INT NOT NULL DEFAULT 100, -- distância da tampa (sensor) até o fundo
    nivel_preenchimento_pct INT DEFAULT 0,
    nivel_bateria_pct INT DEFAULT 100,
    status ENUM('OPERACIONAL', 'MANUTENCAO', 'DESATIVADO') DEFAULT 'OPERACIONAL',
    zona_id INT,
    ultima_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ultimo_esvaziamento DATETIME NULL,
    FOREIGN KEY (zona_id) REFERENCES zonas(id) ON DELETE SET NULL,
    SPATIAL INDEX(localizacao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Histórico de Telemetria (IoT)
CREATE TABLE IF NOT EXISTS historico_telemetria (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    lixeira_id INT NOT NULL,
    nivel_preenchimento_pct INT NOT NULL,
    nivel_bateria_pct INT NOT NULL,
    distancia_cm INT,
    data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lixeira_id) REFERENCES lixeiras(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    tipo ENUM('GESTOR', 'MOTORISTA') NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Rotas
CREATE TABLE IF NOT EXISTS rotas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    motorista_id INT,
    data_rota DATE NOT NULL,
    status ENUM('PLANEJADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA') DEFAULT 'PLANEJADA',
    distancia_total_km DECIMAL(6,2),
    tempo_estimado_min INT,
    iniciada_em DATETIME NULL,
    concluida_em DATETIME NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (motorista_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Paradas da Rota
CREATE TABLE IF NOT EXISTS rota_paradas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rota_id INT NOT NULL,
    lixeira_id INT NOT NULL,
    ordem_visita INT NOT NULL,
    coletado BOOLEAN DEFAULT FALSE,
    data_hora_coleta DATETIME,
    confirmacao ENUM('RFID', 'SENSOR', 'MANUAL') NULL,
    epc_lido VARCHAR(64) NULL,
    nivel_na_coleta INT NULL,
    esvaziada_em DATETIME NULL,
    UNIQUE INDEX rota_lixeira_unica (rota_id, lixeira_id),
    FOREIGN KEY (rota_id) REFERENCES rotas(id) ON DELETE CASCADE,
    FOREIGN KEY (lixeira_id) REFERENCES lixeiras(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- DADOS MOCK PARA TESTE (senha dos dois usuários: senha123 - apenas desenvolvimento)
INSERT INTO zonas (nome, descricao) VALUES 
('Centro Histórico', 'Região central comercial'),
('Zona Sul', 'Bairro residencial');

INSERT INTO usuarios (nome, email, senha_hash, tipo) VALUES
('Carlos Gestor', 'gestor@cidade.gov.br', '$2b$10$6s0zCg35HnA.AjZQNcZfRuAulIbjn8fsyjvOncxTuW.nTuMiyItEy', 'GESTOR'),
('João Motorista', 'joao.coleta@cidade.gov.br', '$2b$10$6s0zCg35HnA.AjZQNcZfRuAulIbjn8fsyjvOncxTuW.nTuMiyItEy', 'MOTORISTA');

INSERT INTO lixeiras (codigo_identificador, latitude, longitude, localizacao, capacidade_litros, nivel_preenchimento_pct, nivel_bateria_pct, zona_id) VALUES
('LIX-001', -23.550520, -46.633308, ST_PointFromText('POINT(-46.633308 -23.550520)', 4326, 'axis-order=long-lat'), 240, 85, 92, 1),
('LIX-002', -23.551200, -46.634100, ST_PointFromText('POINT(-46.634100 -23.551200)', 4326, 'axis-order=long-lat'), 240, 90, 88, 1),
('LIX-003', -23.552500, -46.632000, ST_PointFromText('POINT(-46.632000 -23.552500)', 4326, 'axis-order=long-lat'), 200, 40, 95, 1);