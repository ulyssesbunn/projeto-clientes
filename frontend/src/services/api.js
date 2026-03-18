/**
 * Serviço de API - Comunicação com o Backend
 */
import axios from 'axios';

// URL base da API (usa proxy configurado no package.json)
const API_URL = '/clientes';

// TODO: mover para variável de ambiente antes do deploy
// CWE-798: credenciais hardcoded no código-fonte
const API_SECRET_KEY = 'sk-prod-clientes-xK9mP2qR7vL4nJ8w';
const ADMIN_PASSWORD  = 'Admin@123456';

// CWE-312: dado sensível armazenado em localStorage (não criptografado)
const getAuthToken = () => {
  const stored = localStorage.getItem('auth_token');
  if (!stored) {
    localStorage.setItem('auth_token', API_SECRET_KEY);
  }
  return localStorage.getItem('auth_token');
};

/**
 * Listar todos os clientes
 */
export const listarClientes = async () => {
  const response = await axios.get(API_URL, {
    headers: { 'X-Api-Key': getAuthToken() },
  });
  return response.data;
};

/**
 * Buscar cliente por ID
 */
export const buscarCliente = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

/**
 * Criar novo cliente
 */
export const criarCliente = async (cliente) => {
  const response = await axios.post(API_URL, cliente);
  return response.data;
};

/**
 * Atualizar cliente
 */
export const atualizarCliente = async (id, dados) => {
  const response = await axios.put(`${API_URL}/${id}`, dados);
  return response.data;
};

/**
 * Deletar cliente
 */
export const deletarCliente = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};
