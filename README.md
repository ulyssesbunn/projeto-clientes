# 🏠 Projeto Clientes - Sistema Homelab

Sistema completo de cadastro de clientes com Python, React, PostgreSQL, Docker e CI/CD.

---

## 📋 Stack Tecnológica

- **Backend:** Python + FastAPI
- **Frontend:** React
- **Banco de Dados:** PostgreSQL 15
- **Containerização:** Docker + Docker Compose
- **CI/CD:** GitLab CE
- **Versionamento:** Git

---

## 🚀 Como Rodar o Projeto

### Pré-requisitos
- WSL2 (Ubuntu)
- Docker Desktop
- Git

### Passo a Passo

1. **Clonar o repositório:**
```bash
git clone <url-do-repositorio>
cd projeto-clientes
```

2. **Subir o banco de dados:**
```bash
docker-compose up -d
```

3. **Verificar se está rodando:**
```bash
docker-compose ps
```

4. **Ver logs:**
```bash
docker-compose logs -f postgres
```

5. **Parar containers:**
```bash
docker-compose down
```

---

## 📁 Estrutura do Projeto

```
projeto-clientes/
├── backend/              # API Python FastAPI
│   ├── app/
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── database.py
│   │   └── routers/
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/             # Interface React
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   ├── Dockerfile
│   └── package.json
│
├── database/             # Scripts SQL
│   └── init.sql
│
├── docker-compose.yml    # Orquestração de containers
├── .gitlab-ci.yml       # Pipeline CI/CD
├── .gitignore
└── README.md
```

---

## 🗄️ Banco de Dados

### Credenciais (desenvolvimento)
- **Host:** localhost
- **Port:** 5432
- **Database:** clientes_db
- **User:** admin
- **Password:** admin123

### Schema da Tabela `clientes`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | SERIAL | ID único (auto-incremento) |
| nome | VARCHAR(255) | Nome completo |
| email | VARCHAR(255) | Email (único) |
| telefone | VARCHAR(20) | Telefone |
| criado_em | TIMESTAMP | Data de criação |
| atualizado_em | TIMESTAMP | Última atualização |

---

## 🧪 Comandos Úteis

### Docker
```bash
# Subir todos os containers
docker-compose up -d

# Ver status
docker-compose ps

# Ver logs
docker-compose logs -f

# Parar tudo
docker-compose down

# Rebuild containers
docker-compose up --build

# Remover volumes (CUIDADO: apaga dados!)
docker-compose down -v
```

### Acessar PostgreSQL diretamente
```bash
docker exec -it projeto-clientes-db psql -U admin -d clientes_db
```

Dentro do psql:
```sql
-- Ver tabelas
\dt

-- Ver dados dos clientes
SELECT * FROM clientes;

-- Sair
\q
```

---

## 📝 Próximos Passos

- [ ] Desenvolver API Backend (FastAPI)
- [ ] Criar Frontend (React)
- [ ] Configurar GitLab
- [ ] Criar pipeline CI/CD
- [ ] Adicionar testes automatizados

---

## 👤 Autor

Desenvolvido como projeto de aprendizado em DevOps e desenvolvimento Full Stack.

---

## 📄 Licença

Projeto de uso pessoal e educacional.

## 🚀 Projeto Completo com CI/CD
