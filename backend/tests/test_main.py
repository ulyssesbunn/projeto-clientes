"""
Testes automatizados — API Cadastro de Clientes
"""
import os
# DEVE ser a primeira linha antes de qualquer import do projeto
os.environ["DATABASE_URL"] = "postgresql://admin:admin123@localhost:5432/clientes_db"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Recriar engine apontando para localhost
import app.database as db_module
from sqlalchemy import create_engine
engine_test = create_engine("postgresql://admin:admin123@localhost:5432/clientes_db")
db_module.engine = engine_test
db_module.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)

from app.main import app
from app.database import get_db

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(autouse=True)
def limpar_clientes_de_teste():
    yield
    db = TestingSessionLocal()
    try:
        from app.models import Cliente
        db.query(Cliente).filter(Cliente.email.like("%@teste.com")).delete()
        db.commit()
    finally:
        db.close()

def test_health_check_retorna_200():
    response = client.get("/health")
    assert response.status_code == 200

def test_health_check_retorna_status_healthy():
    response = client.get("/health")
    assert response.json() == {"status": "healthy"}

def test_banco_aceita_criar_cliente():
    payload = {"nome": "João Silva", "email": "joao@teste.com", "telefone": "11999999999"}
    response = client.post("/clientes", json=payload)
    assert response.status_code == 201

def test_banco_retorna_cliente_criado():
    payload = {"nome": "Maria Souza", "email": "maria@teste.com", "telefone": "11988888888"}
    response = client.post("/clientes", json=payload)
    data = response.json()
    assert data["nome"] == "Maria Souza"
    assert data["email"] == "maria@teste.com"
    assert "id" in data

def test_banco_impede_email_duplicado():
    payload = {"nome": "Pedro Costa", "email": "pedro@teste.com", "telefone": "11977777777"}
    client.post("/clientes", json=payload)
    response = client.post("/clientes", json=payload)
    assert response.status_code == 400

def test_banco_lista_clientes():
    client.post("/clientes", json={"nome": "Ana", "email": "ana@teste.com", "telefone": "11966666666"})
    client.post("/clientes", json={"nome": "Bruno", "email": "bruno@teste.com", "telefone": "11955555555"})
    response = client.get("/clientes")
    assert response.status_code == 200
    emails = [c["email"] for c in response.json()]
    assert "ana@teste.com" in emails
    assert "bruno@teste.com" in emails

def test_banco_retorna_404_cliente_inexistente():
    response = client.get("/clientes/999999")
    assert response.status_code == 404
