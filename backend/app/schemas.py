"""
Schemas Pydantic para validação de dados da API
"""
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional

class ClienteBase(BaseModel):
    """Schema base com campos comuns"""
    nome: str = Field(..., min_length=3, max_length=255, description="Nome completo do cliente")
    email: EmailStr = Field(..., description="Email válido do cliente")
    telefone: Optional[str] = Field(None, max_length=20, description="Telefone do cliente")

class ClienteCreate(ClienteBase):
    """Schema para criar um novo cliente"""
    pass

class ClienteUpdate(BaseModel):
    """Schema para atualizar um cliente (todos os campos opcionais)"""
    nome: Optional[str] = Field(None, min_length=3, max_length=255)
    email: Optional[EmailStr] = None
    telefone: Optional[str] = Field(None, max_length=20)

class ClienteResponse(ClienteBase):
    """Schema para retornar dados do cliente"""
    id: int
    criado_em: datetime
    atualizado_em: datetime

    class Config:
        from_attributes = True  # Permite criar a partir de objetos SQLAlchemy
