/**
 * Serviço de API - Comunicação com o Backend
 */
import axios from 'axios';

// URL base da API (usa proxy configurado no package.json)
const API_URL = '/clientes';

/**
 * Listar todos os clientes
 */
export const listarClientes = async () => {
  const response = await axios.get(API_URL);
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
