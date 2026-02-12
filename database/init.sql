-- Script de inicialização do banco de dados
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_clientes_email ON clientes(email);

INSERT INTO clientes (nome, email, telefone) VALUES
    ('João Silva', 'joao.silva@email.com', '(11) 98765-4321'),
    ('Maria Santos', 'maria.santos@email.com', '(21) 99876-5432'),
    ('Pedro Oliveira', 'pedro.oliveira@email.com', '(31) 97654-3210')
ON CONFLICT (email) DO NOTHING;
