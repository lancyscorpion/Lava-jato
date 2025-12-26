
export enum VehicleType {
  CAR = 'CARRO',
  MOTORCYCLE = 'MOTO'
}

export enum ServiceStatus {
  PENDING = 'PENDENTE',
  IN_PROGRESS = 'EM_ANDAMENTO',
  FINISHED = 'FINALIZADO',
  DELIVERED = 'ENTREGUE',
  SCHEDULED = 'AGENDADO'
}

export enum CashFlowType {
  INCOME = 'RECEITA',
  EXPENSE = 'DESPESA'
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  plate: string;
  type: VehicleType;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  vehicles: Vehicle[];
}

export interface WashService {
  id: string;
  clientId: string;
  vehicleId: string;
  type: string;
  price: number;
  status: ServiceStatus;
  isPaid: boolean;
  createdAt: Date;
}

export interface CashFlowEntry {
  id: string;
  description: string;
  amount: number;
  type: CashFlowType;
  date: Date;
  category: string;
}

export interface Scheduling {
  id: string;
  clientId: string;
  vehicleId: string;
  serviceTypeId: string;
  dateTime: Date;
  notes?: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalServices: number;
  pendingServices: number;
  finishedToday: number;
}
