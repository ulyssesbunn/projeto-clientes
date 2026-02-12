-- Script de inicialização do banco de dados
-- Este script roda automaticamente quando o container PostgreSQL é criado pela primeira vez

-- Criar tabela de clientes
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índice no email para buscas mais rápidas
CREATE INDEX idx_clientes_email ON clientes(email);

-- Inserir alguns dados de exemplo para testar
INSERT INTO clientes (nome, email, telefone) VALUES
    ('João Silva', 'joao.silva@email.com', '(11) 98765-4321'),
    ('Maria Santos', 'maria.santos@email.com', '(21) 99876-5432'),
    ('Pedro Oliveira', 'pedro.oliveira@email.com', '(31) 97654-3210')
ON CONFLICT (email) DO NOTHING;

-- Função para atualizar automaticamente o campo atualizado_em
CREATE OR REPLACE FUNCTION atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para executar a função antes de cada UPDATE
CREATE TRIGGER trigger_atualizar_timestamp
BEFORE UPDATE ON clientes
FOR EACH ROW
EXECUTE FUNCTION atualizar_timestamp();

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE 'Banco de dados inicializado com sucesso!';
    RAISE NOTICE 'Tabela clientes criada com 3 registros de exemplo.';
END $$;
