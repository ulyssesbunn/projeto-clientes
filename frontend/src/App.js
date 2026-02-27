/**
 * App Principal - Sistema de Cadastro de Clientes
 */
import React, { useState, useEffect } from 'react';
import './App.css';
import { listarClientes, criarCliente, atualizarCliente, deletarCliente } from './services/api';

// ── Componentes da vitrine ────────────────────────────────────────────────────

function StatusDot({ ok }) {
  return <span className={`status-dot ${ok ? 'ok' : 'err'}`} />;
}

function InfraCard({ icon, title, sub, ok = true }) {
  return (
    <div className="infra-card">
      <div className="infra-card-top">
        <span className="infra-icon">{icon}</span>
        <StatusDot ok={ok} />
      </div>
      <div className="infra-title">{title}</div>
      <div className="infra-sub">{sub}</div>
    </div>
  );
}

function PipeStep({ num, label, done }) {
  return (
    <div className={`pipe-step ${done ? 'done' : ''}`}>
      <div className="pipe-num">{num}</div>
      <div className="pipe-label">{label}</div>
    </div>
  );
}

function TechTag({ name, color }) {
  return (
    <span className="tech-tag" style={{ '--c': color }}>
      {name}
    </span>
  );
}

// ── App principal ─────────────────────────────────────────────────────────────

function App() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [backendOk, setBackendOk] = useState(null);

  // Formulário
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');

  // Edição
  const [editando, setEditando] = useState(null);
  const [nomeEdit, setNomeEdit] = useState('');
  const [emailEdit, setEmailEdit] = useState('');
  const [telefoneEdit, setTelefoneEdit] = useState('');

  useEffect(() => {
    carregarClientes();
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const res = await fetch('/health');
      setBackendOk(res.ok);
    } catch {
      setBackendOk(false);
    }
  };

  const carregarClientes = async () => {
    try {
      setLoading(true);
      const dados = await listarClientes();
      setClientes(dados);
      setErro(null);
    } catch (error) {
      setErro('Erro ao carregar clientes: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome || !email) {
      alert('Nome e email são obrigatórios!');
      return;
    }
    try {
      await criarCliente({ nome, email, telefone });
      setNome(''); setEmail(''); setTelefone('');
      carregarClientes();
      alert('Cliente cadastrado com sucesso!');
    } catch (error) {
      alert('Erro ao cadastrar: ' + (error.response?.data?.detail || error.message));
    }
  };

  const iniciarEdicao = (cliente) => {
    setEditando(cliente.id);
    setNomeEdit(cliente.nome);
    setEmailEdit(cliente.email);
    setTelefoneEdit(cliente.telefone || '');
  };

  const cancelarEdicao = () => {
    setEditando(null);
    setNomeEdit(''); setEmailEdit(''); setTelefoneEdit('');
  };

  const salvarEdicao = async (id) => {
    try {
      await atualizarCliente(id, { nome: nomeEdit, email: emailEdit, telefone: telefoneEdit });
      cancelarEdicao();
      carregarClientes();
      alert('Cliente atualizado com sucesso!');
    } catch (error) {
      alert('Erro ao atualizar: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDeletar = async (id, nome) => {
    if (window.confirm(`Deseja realmente deletar ${nome}?`)) {
      try {
        await deletarCliente(id);
        carregarClientes();
        alert('Cliente deletado com sucesso!');
      } catch (error) {
        alert('Erro ao deletar: ' + error.message);
      }
    }
  };

  const formatarData = (data) => new Date(data).toLocaleString('pt-BR');

  if (loading) {
    return (
      <div className="App">
        <div className="loading">
          <span className="loading-spinner" />
          Carregando...
        </div>
      </div>
    );
  }

  return (
    <div className="App">

      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <header className="site-header">
        <div className="header-inner">
          <div className="header-brand">
            <span className="brand-bracket">[</span>
            projeto<span className="brand-accent">-clientes</span>
            <span className="brand-bracket">]</span>
          </div>
          <div className="header-status">
            <StatusDot ok={backendOk === true} />
            <span>{backendOk === true ? 'PROD · ONLINE' : backendOk === false ? 'OFFLINE' : 'verificando...'}</span>
          </div>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-label">Full Stack · DevOps · AWS</div>
        <h1 className="hero-title">
          Sistema de Cadastro <span className="hero-accent">de Clientes</span>
        </h1>
        <p className="hero-desc">
          Aplicação containerizada rodando em produção na AWS EC2 com pipeline
          CI/CD automatizado via Jenkins, monitoramento com Prometheus + Grafana
          e rollback por BUILD_NUMBER.
        </p>
        <div className="tech-tags">
          <TechTag name="React 18"    color="#61dafb" />
          <TechTag name="FastAPI"     color="#009688" />
          <TechTag name="PostgreSQL"  color="#336791" />
          <TechTag name="Docker"      color="#2496ed" />
          <TechTag name="Jenkins"     color="#d33833" />
          <TechTag name="AWS EC2"     color="#ff9900" />
          <TechTag name="Nginx"       color="#43a047" />
          <TechTag name="Prometheus"  color="#e6522c" />
        </div>
      </section>

      {/* ── INFRA STATUS ────────────────────────────────────────────── */}
      <section className="showcase-section">
        <h2 className="section-heading"><span>//</span> infraestrutura</h2>
        <div className="infra-grid">
          <InfraCard icon="☁️"  title="AWS EC2"        sub="t3.micro · us-east-1"       ok={backendOk === true} />
          <InfraCard icon="🐳"  title="Docker"         sub="containers em produção"      ok />
          <InfraCard icon="⚡"  title="Nginx"          sub="proxy reverso interno"       ok />
          <InfraCard icon="🐍"  title="FastAPI"        sub="backend · porta 8000"        ok={backendOk === true} />
          <InfraCard icon="🐘"  title="PostgreSQL 15"  sub={`${clientes.length} clientes no banco`} ok />
          <InfraCard icon="🔁"  title="Jenkins CI/CD"  sub="build → SCP → SSH deploy"   ok />
        </div>
      </section>

      {/* ── ARQUITETURA ─────────────────────────────────────────────── */}
      <section className="showcase-section">
        <h2 className="section-heading"><span>//</span> arquitetura prod</h2>
        <div className="arch-box">
          <div className="arch-flow">
            {[
              { icon: '🌐', label: 'Internet' },
              { icon: '☁️', label: 'EC2', sub: '98.87.127.2' },
              { icon: '⚡', label: 'Nginx', sub: 'proxy' },
              { icon: '⚛️', label: 'React', sub: 'porta 80' },
              { icon: '🐍', label: 'FastAPI', sub: 'porta 8000' },
              { icon: '🐘', label: 'Postgres', sub: 'porta 5432' },
            ].map((n, i, arr) => (
              <React.Fragment key={i}>
                <div className="arch-node">
                  <div className="arch-icon">{n.icon}</div>
                  <div className="arch-label">{n.label}</div>
                  {n.sub && <div className="arch-sub">{n.sub}</div>}
                </div>
                {i < arr.length - 1 && <div className="arch-arrow">→</div>}
              </React.Fragment>
            ))}
          </div>
          <div className="arch-note">
            Notebook DEV → Jenkins → SCP + SSH → EC2 · Elastic IP fixo
          </div>
        </div>
      </section>

      {/* ── PIPELINE ────────────────────────────────────────────────── */}
      <section className="showcase-section">
        <h2 className="section-heading"><span>//</span> pipeline ci/cd</h2>
        <div className="pipeline">
          {['Checkout', 'Build Images', 'Testes', 'SCP → EC2', 'SSH Deploy', 'Tag BUILD_NUMBER'].map((label, i) => (
            <PipeStep key={i} num={String(i + 1).padStart(2, '0')} label={label} done />
          ))}
        </div>
      </section>

      {/* ── DIVISOR ─────────────────────────────────────────────────── */}
      <div className="section-divider">
        <span>banco de dados</span>
      </div>

      {/* ── CRUD ────────────────────────────────────────────────────── */}
      {erro && <div className="erro">{erro}</div>}

      <div className="card">
        <h2>➕ Novo Cliente</h2>
        <form onSubmit={handleSubmit} className="formulario">
          <div className="form-row">
            <div className="form-group">
              <label>Nome Completo *</label>
              <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="João Silva" required />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="joao@email.com" required />
            </div>
            <div className="form-group">
              <label>Telefone</label>
              <input type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 98765-4321" />
            </div>
          </div>
          <button type="submit" className="btn btn-primary">Cadastrar Cliente</button>
        </form>
      </div>

      <div className="card">
        <h2>👥 Clientes Cadastrados ({clientes.length})</h2>
        {clientes.length === 0 ? (
          <p className="vazio">Nenhum cliente cadastrado ainda.</p>
        ) : (
          <div className="tabela-container">
            <table className="tabela">
              <thead>
                <tr>
                  <th>ID</th><th>Nome</th><th>Email</th><th>Telefone</th><th>Cadastrado em</th><th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente) => (
                  <tr key={cliente.id}>
                    <td>{cliente.id}</td>
                    <td>
                      {editando === cliente.id
                        ? <input type="text" value={nomeEdit} onChange={(e) => setNomeEdit(e.target.value)} className="input-edit" />
                        : cliente.nome}
                    </td>
                    <td>
                      {editando === cliente.id
                        ? <input type="email" value={emailEdit} onChange={(e) => setEmailEdit(e.target.value)} className="input-edit" />
                        : cliente.email}
                    </td>
                    <td>
                      {editando === cliente.id
                        ? <input type="tel" value={telefoneEdit} onChange={(e) => setTelefoneEdit(e.target.value)} className="input-edit" />
                        : (cliente.telefone || '-')}
                    </td>
                    <td className="data">{formatarData(cliente.criado_em)}</td>
                    <td className="acoes">
                      {editando === cliente.id ? (
                        <>
                          <button onClick={() => salvarEdicao(cliente.id)} className="btn btn-success btn-sm">✓ Salvar</button>
                          <button onClick={cancelarEdicao} className="btn btn-secondary btn-sm">✕ Cancelar</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => iniciarEdicao(cliente)} className="btn btn-warning btn-sm">✏️ Editar</button>
                          <button onClick={() => handleDeletar(cliente.id, cliente.nome)} className="btn btn-danger btn-sm">🗑️ Deletar</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <footer className="footer">
        <p>projeto-clientes · AWS EC2 · Docker + FastAPI + React + Jenkins</p>
      </footer>

    </div>
  );
}

export default App;
