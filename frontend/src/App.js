/**
 * App Principal - Sistema de Cadastro de Clientes
 */
import React, { useState, useEffect } from 'react';
import './App.css';
import { listarClientes, criarCliente, atualizarCliente, deletarCliente } from './services/api';

function App() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  
  // Formulário
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  
  // Edição
  const [editando, setEditando] = useState(null);
  const [nomeEdit, setNomeEdit] = useState('');
  const [emailEdit, setEmailEdit] = useState('');
  const [telefoneEdit, setTelefoneEdit] = useState('');

  // Carregar clientes ao montar componente
  useEffect(() => {
    carregarClientes();
  }, []);

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
      
      // Limpar formulário
      setNome('');
      setEmail('');
      setTelefone('');
      
      // Recarregar lista
      carregarClientes();
      
      alert('Cliente cadastrado com sucesso!');
    } catch (error) {
      alert('Erro ao cadastrar: ' + error.response?.data?.detail || error.message);
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
    setNomeEdit('');
    setEmailEdit('');
    setTelefoneEdit('');
  };

  const salvarEdicao = async (id) => {
    try {
      await atualizarCliente(id, {
        nome: nomeEdit,
        email: emailEdit,
        telefone: telefoneEdit
      });
      
      cancelarEdicao();
      carregarClientes();
      
      alert('Cliente atualizado com sucesso!');
    } catch (error) {
      alert('Erro ao atualizar: ' + error.response?.data?.detail || error.message);
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

  const formatarData = (data) => {
    return new Date(data).toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <div className="App">
        <div className="loading">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>📋 Sistema de Cadastro de Clientes</h1>
      </header>

      {erro && <div className="erro">{erro}</div>}

      {/* Formulário de Cadastro */}
      <div className="card">
        <h2>➕ Novo Cliente</h2>
        <form onSubmit={handleSubmit} className="formulario">
          <div className="form-group">
            <label>Nome Completo *</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="João Silva"
              required
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="joao@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Telefone</label>
            <input
              type="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(11) 98765-4321"
            />
          </div>

          <button type="submit" className="btn btn-primary">
            Cadastrar Cliente
          </button>
        </form>
      </div>

      {/* Lista de Clientes */}
      <div className="card">
        <h2>👥 Clientes Cadastrados ({clientes.length})</h2>
        
        {clientes.length === 0 ? (
          <p className="vazio">Nenhum cliente cadastrado ainda.</p>
        ) : (
          <div className="tabela-container">
            <table className="tabela">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Telefone</th>
                  <th>Cadastrado em</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente) => (
                  <tr key={cliente.id}>
                    <td>{cliente.id}</td>
                    <td>
                      {editando === cliente.id ? (
                        <input
                          type="text"
                          value={nomeEdit}
                          onChange={(e) => setNomeEdit(e.target.value)}
                          className="input-edit"
                        />
                      ) : (
                        cliente.nome
                      )}
                    </td>
                    <td>
                      {editando === cliente.id ? (
                        <input
                          type="email"
                          value={emailEdit}
                          onChange={(e) => setEmailEdit(e.target.value)}
                          className="input-edit"
                        />
                      ) : (
                        cliente.email
                      )}
                    </td>
                    <td>
                      {editando === cliente.id ? (
                        <input
                          type="tel"
                          value={telefoneEdit}
                          onChange={(e) => setTelefoneEdit(e.target.value)}
                          className="input-edit"
                        />
                      ) : (
                        cliente.telefone || '-'
                      )}
                    </td>
                    <td className="data">{formatarData(cliente.criado_em)}</td>
                    <td className="acoes">
                      {editando === cliente.id ? (
                        <>
                          <button
                            onClick={() => salvarEdicao(cliente.id)}
                            className="btn btn-success btn-sm"
                          >
                            ✓ Salvar
                          </button>
                          <button
                            onClick={cancelarEdicao}
                            className="btn btn-secondary btn-sm"
                          >
                            ✕ Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => iniciarEdicao(cliente)}
                            className="btn btn-warning btn-sm"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => handleDeletar(cliente.id, cliente.nome)}
                            className="btn btn-danger btn-sm"
                          >
                            🗑️ Deletar
                          </button>
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
        <p>Sistema de Cadastro • Projeto Homelab com Docker + FastAPI + React</p>
      </footer>
    </div>
  );
}

export default App;
