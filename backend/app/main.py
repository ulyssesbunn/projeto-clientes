"""
API FastAPI - Sistema de Cadastro de Clientes
"""
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from .database import get_db, engine
from .models import Cliente, Base
from .schemas import ClienteCreate, ClienteUpdate, ClienteResponse

# Criar tabelas no banco (caso não existam)
Base.metadata.create_all(bind=engine)

# Criar aplicação FastAPI
app = FastAPI(
    title="API Cadastro de Clientes",
    description="API REST para gerenciar cadastro de clientes",
    version="1.0.0"
)

# Configurar CORS (permitir requisições do frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especificar domínios permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== ENDPOINTS ====================

@app.get("/")
def read_root():
    """Endpoint raiz - informações da API"""
    return {
        "message": "API de Cadastro de Clientes",
        "version": "1.0.0",
        "endpoints": {
            "GET /clientes": "Listar todos os clientes",
            "GET /clientes/{id}": "Buscar cliente por ID",
            "POST /clientes": "Criar novo cliente",
            "PUT /clientes/{id}": "Atualizar cliente",
            "DELETE /clientes/{id}": "Deletar cliente"
        }
    }

@app.get("/health")
def health_check():
    """Verificar se a API está funcionando"""
    return {"status": "healthy"}

# ==================== CRUD CLIENTES ====================

@app.post("/clientes", response_model=ClienteResponse, status_code=201)
def criar_cliente(cliente: ClienteCreate, db: Session = Depends(get_db)):
    """
    Criar um novo cliente
    """
    # Verificar se email já existe
    db_cliente = db.query(Cliente).filter(Cliente.email == cliente.email).first()
    if db_cliente:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    # Criar novo cliente
    novo_cliente = Cliente(**cliente.model_dump())
    db.add(novo_cliente)
    db.commit()
    db.refresh(novo_cliente)
    
    return novo_cliente

@app.get("/clientes", response_model=List[ClienteResponse])
def listar_clientes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Listar todos os clientes (com paginação)
    """
    clientes = db.query(Cliente).offset(skip).limit(limit).all()
    return clientes

@app.get("/clientes/{cliente_id}", response_model=ClienteResponse)
def buscar_cliente(cliente_id: int, db: Session = Depends(get_db)):
    """
    Buscar cliente por ID
    """
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return cliente

@app.put("/clientes/{cliente_id}", response_model=ClienteResponse)
def atualizar_cliente(
    cliente_id: int, 
    cliente_update: ClienteUpdate, 
    db: Session = Depends(get_db)
):
    """
    Atualizar dados de um cliente
    """
    # Buscar cliente
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    # Atualizar apenas campos fornecidos
    update_data = cliente_update.model_dump(exclude_unset=True)
    
    # Verificar se email já está em uso (se fornecido)
    if "email" in update_data:
        email_existe = db.query(Cliente).filter(
            Cliente.email == update_data["email"],
            Cliente.id != cliente_id
        ).first()
        if email_existe:
            raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    # Aplicar atualizações
    for key, value in update_data.items():
        setattr(cliente, key, value)
    
    db.commit()
    db.refresh(cliente)
    
    return cliente

@app.delete("/clientes/{cliente_id}")
def deletar_cliente(cliente_id: int, db: Session = Depends(get_db)):
    """
    Deletar um cliente
    """
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    db.delete(cliente)
    db.commit()
    
    return {"message": f"Cliente {cliente_id} deletado com sucesso"}

# ==================== ENDPOINTS EXTRAS ====================

@app.get("/clientes/buscar/email/{email}", response_model=ClienteResponse)
def buscar_cliente_por_email(email: str, db: Session = Depends(get_db)):
    """
    Buscar cliente por email
    """
    cliente = db.query(Cliente).filter(Cliente.email == email).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return cliente
