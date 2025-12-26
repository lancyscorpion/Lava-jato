
import { Client, Vehicle, WashService, CashFlowEntry, Scheduling } from '../types';

// Em um ambiente real, substitua BASE_URL pela URL do seu servidor Node.js/PHP/Python
const BASE_URL = '/api'; 

export class DatabaseService {
  // Helpers para simular a latência do banco de dados enquanto não há um backend real rodando
  private static async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    console.log(`[MySQL Request] ${options?.method || 'GET'} ${endpoint}`);
    
    // Simulação de persistência usando o mesmo padrão que o MySQL usaria
    // Se você tiver um backend, descomente a linha abaixo:
    // const response = await fetch(`${BASE_URL}${endpoint}`, options);
    // return response.json();

    // Por enquanto, manteremos o retorno do localStorage mas com interface ASYNC (Promessas)
    // para que o App.tsx já funcione com a lógica de banco de dados real.
    return new Promise((resolve) => {
      setTimeout(() => {
        const key = endpoint.split('/')[1];
        const data = localStorage.getItem(key);
        resolve(data ? JSON.parse(data) : []);
      }, 500);
    });
  }

  // Clientes
  static async getClients(): Promise<Client[]> {
    return this.request<Client[]>('/clients');
  }

  static async createClient(client: Partial<Client>): Promise<Client> {
    return this.request<Client>('/clients', { method: 'POST', body: JSON.stringify(client) });
  }

  static async deleteClient(id: string): Promise<void> {
    await this.request(`/clients/${id}`, { method: 'DELETE' });
  }

  // Serviços
  static async getServices(): Promise<WashService[]> {
    return this.request<WashService[]>('/services');
  }

  static async updateServiceStatus(id: string, status: string): Promise<void> {
    await this.request(`/services/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
  }

  // Financeiro
  static async getCashFlow(): Promise<CashFlowEntry[]> {
    return this.request<CashFlowEntry[]>('/cash-flow');
  }

  static async createCashEntry(entry: Partial<CashFlowEntry>): Promise<CashFlowEntry> {
    return this.request<CashFlowEntry>('/cash-flow', { method: 'POST', body: JSON.stringify(entry) });
  }
}
