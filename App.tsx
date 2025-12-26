
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Menu, 
  X, 
  TrendingUp, 
  UserPlus, 
  Users,
  Car as CarIcon,
  Droplets,
  Clock,
  Sparkles,
  Bike,
  Zap,
  ShieldCheck,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Database,
  Wallet,
  ClipboardList,
  Settings as SettingsIcon,
  RefreshCw,
  CheckCircle,
  Download,
  Upload,
  FileJson,
  DollarSign,
  Edit2,
  FileText,
  Settings2,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Calendar
} from 'lucide-react';
import { 
  Client, 
  Vehicle, 
  WashService, 
  VehicleType, 
  ServiceStatus,
  CashFlowEntry,
  CashFlowType
} from './types';
import { NAV_ITEMS, INITIAL_SERVICE_CATEGORIES, BR_VEHICLE_DATA } from './constants';
import { getBusinessInsights } from './services/gemini';
import { DatabaseService } from './services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from 'recharts';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<WashService[]>([]);
  const [cashFlow, setCashFlow] = useState<CashFlowEntry[]>([]);
  const [serviceCategories, setServiceCategories] = useState(INITIAL_SERVICE_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Modais
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isCashFlowModalOpen, setIsCashFlowModalOpen] = useState(false);
  
  // Selections
  const [selectedClientForVehicle, setSelectedClientForVehicle] = useState<Client | null>(null);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [categoryToEdit, setCategoryToEdit] = useState<any | null>(null);
  
  // Forms
  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '' });
  const [editClientData, setEditClientData] = useState({ name: '', phone: '', email: '' });
  const [newVehicle, setNewVehicle] = useState({ brand: '', model: '', plate: '', type: VehicleType.CAR });
  const [newCashEntry, setNewCashEntry] = useState({ description: '', amount: 0, type: CashFlowType.EXPENSE, category: 'Geral' });
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedServiceType, setSelectedServiceType] = useState('');
  const [categoryForm, setCategoryForm] = useState({ name: '', priceCar: 0, priceMoto: 0, duration: 30, description: '' });

  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [insights, setInsights] = useState<string | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [c, s, cf] = await Promise.all([
          DatabaseService.getClients(),
          DatabaseService.getServices(),
          DatabaseService.getCashFlow()
        ]);
        setClients(c || []);
        setServices((s || []).map(srv => ({
          ...srv, 
          createdAt: new Date(srv.createdAt),
          isPaid: srv.isPaid ?? (srv.status === ServiceStatus.DELIVERED)
        })));
        setCashFlow((cf || []).map(item => ({...item, date: new Date(item.date)})));
        
        const savedCategories = localStorage.getItem('serviceCategories');
        if (savedCategories) {
          setServiceCategories(JSON.parse(savedCategories));
        }
      } catch (err) {
        showNotification("Erro ao carregar dados locais", "error");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // --- HANDLERS FINANCEIRO ---
  const handleAddCashEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: CashFlowEntry = {
      id: `cf-${Date.now()}`,
      ...newCashEntry,
      date: new Date()
    };
    const updated = [entry, ...cashFlow];
    setCashFlow(updated);
    localStorage.setItem('cashFlow', JSON.stringify(updated));
    setIsCashFlowModalOpen(false);
    setNewCashEntry({ description: '', amount: 0, type: CashFlowType.EXPENSE, category: 'Geral' });
    showNotification("Lançamento financeiro registrado!");
  };

  // --- HANDLERS CATEGORIAS ---
  const handleOpenCategoryModal = (cat?: any) => {
    if (cat) {
      setCategoryToEdit(cat);
      setCategoryForm({ ...cat });
    } else {
      setCategoryToEdit(null);
      setCategoryForm({ name: '', priceCar: 0, priceMoto: 0, duration: 30, description: '' });
    }
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    let updated;
    if (categoryToEdit) {
      updated = serviceCategories.map(c => c.id === categoryToEdit.id ? { ...categoryForm, id: c.id } : c);
    } else {
      updated = [...serviceCategories, { ...categoryForm, id: `cat-${Date.now()}` }];
    }
    setServiceCategories(updated);
    localStorage.setItem('serviceCategories', JSON.stringify(updated));
    setIsCategoryModalOpen(false);
    showNotification("Tabela de preços atualizada!");
  };

  const handleDeleteCategory = (id: string) => {
    if (!window.confirm("Remover este serviço definitivamente?")) return;
    const updated = serviceCategories.filter(c => c.id !== id);
    setServiceCategories(updated);
    localStorage.setItem('serviceCategories', JSON.stringify(updated));
    showNotification("Serviço removido.");
  };

  // --- HANDLERS CLIENTES ---
  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    const clientId = `c-${Date.now()}`;
    const vehicleId = `v-${Date.now()}`;
    const client: Client = {
      id: clientId,
      ...newClient,
      vehicles: [{ ...newVehicle, id: vehicleId }]
    };
    const updated = [...clients, client];
    setClients(updated);
    localStorage.setItem('clients', JSON.stringify(updated));
    setIsClientModalOpen(false);
    setNewClient({ name: '', phone: '', email: '' });
    setNewVehicle({ brand: '', model: '', plate: '', type: VehicleType.CAR });
    showNotification("Cliente cadastrado com sucesso!");
  };

  const handleUpdateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientToEdit) return;
    const updated = clients.map(c => c.id === clientToEdit.id ? { ...c, ...editClientData } : c);
    setClients(updated);
    localStorage.setItem('clients', JSON.stringify(updated));
    setIsEditClientModalOpen(false);
    showNotification("Dados do cliente atualizados!");
  };

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientForVehicle) return;
    const vehicleId = `v-${Date.now()}`;
    const vehicle = { ...newVehicle, id: vehicleId };
    const updated = clients.map(c => 
      c.id === selectedClientForVehicle.id ? { ...c, vehicles: [...c.vehicles, vehicle] } : c
    );
    setClients(updated);
    localStorage.setItem('clients', JSON.stringify(updated));
    setIsAddVehicleModalOpen(false);
    showNotification("Veículo vinculado ao cliente!");
  };

  const handleRemoveClient = (id: string) => {
    if (!window.confirm("Remover cliente e todos os veículos associados?")) return;
    const updated = clients.filter(c => c.id !== id);
    setClients(updated);
    localStorage.setItem('clients', JSON.stringify(updated));
    showNotification("Cliente removido.");
  };

  // --- HANDLERS BACKUP ---
  const handleExportBackup = () => {
    const data = { clients, services, cashFlow, serviceCategories, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `lava_jato_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showNotification("Backup exportado com sucesso!");
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        localStorage.setItem('clients', JSON.stringify(data.clients || []));
        localStorage.setItem('services', JSON.stringify(data.services || []));
        localStorage.setItem('cashFlow', JSON.stringify(data.cashFlow || []));
        localStorage.setItem('serviceCategories', JSON.stringify(data.serviceCategories || []));
        showNotification("Restauração concluída! Recarregando...");
        setTimeout(() => window.location.reload(), 1500);
      } catch {
        showNotification("Erro ao importar backup.", "error");
      }
    };
    reader.readAsText(file);
  };

  // --- HANDLERS O.S. ---
  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    const cat = serviceCategories.find(c => c.id === selectedServiceType);
    const client = clients.find(c => c.id === selectedClientId);
    const vehicle = client?.vehicles.find(v => v.id === selectedVehicleId);
    if (!client || !vehicle || !cat) return showNotification("Dados insuficientes", "error");

    const newService: WashService = {
      id: `os-${Date.now()}`,
      clientId: selectedClientId,
      vehicleId: selectedVehicleId,
      type: cat.name,
      price: vehicle.type === VehicleType.CAR ? cat.priceCar : cat.priceMoto,
      status: ServiceStatus.PENDING,
      isPaid: false,
      createdAt: new Date()
    };
    const updated = [newService, ...services];
    setServices(updated);
    localStorage.setItem('services', JSON.stringify(updated));
    setIsServiceModalOpen(false);
    setActiveTab('services');
    showNotification("Ordem de Serviço aberta!");
  };

  const financialSummary = useMemo(() => {
    const revenueFromServices = services.filter(s => s.isPaid).reduce((acc, s) => acc + s.price, 0);
    const otherIncome = cashFlow.filter(c => c.type === CashFlowType.INCOME).reduce((acc, c) => acc + c.amount, 0);
    const expenses = cashFlow.filter(c => c.type === CashFlowType.EXPENSE).reduce((acc, c) => acc + c.amount, 0);
    return { income: revenueFromServices + otherIncome, expense: expenses, balance: (revenueFromServices + otherIncome) - expenses };
  }, [services, cashFlow]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r transition-all duration-300 flex flex-col z-40 shadow-sm`}>
        <div className="p-6 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg"><Droplets className="w-6 h-6" /></div>
          {sidebarOpen && <span className="font-black text-xl text-blue-900 tracking-tight uppercase">AcquaPro</span>}
        </div>
        <nav className="flex-1 px-4 py-8 space-y-2">
          {NAV_ITEMS.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all ${activeTab === item.id ? 'bg-blue-600 text-white font-bold shadow-xl' : 'text-slate-500 hover:bg-slate-50'}`}>
              {item.icon} {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-6 text-slate-400 hover:text-blue-600 border-t flex justify-center">
          {sidebarOpen ? <X /> : <Menu />}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10 relative">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900">{NAV_ITEMS.find(i => i.id === activeTab)?.label}</h1>
            <p className="text-slate-400 font-medium italic">Gestão Inteligente v2.5</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setIsClientModalOpen(true)} className="bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl hover:bg-slate-50 flex items-center gap-2 font-bold shadow-sm">
              <UserPlus className="w-5 h-5" /> Novo Cliente
            </button>
            <button onClick={() => setIsServiceModalOpen(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 flex items-center gap-2 font-bold shadow-lg">
              <Plus className="w-5 h-5" /> Iniciar O.S.
            </button>
          </div>
        </header>

        {notification && (
          <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-4 border ${notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            <CheckCircle2 className="w-5 h-5" /> <span className="font-bold">{notification.message}</span>
          </div>
        )}

        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-10 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Saldo Caixa', val: `R$ ${financialSummary.balance.toFixed(2)}`, icon: <Wallet className="text-blue-600" />, bg: 'bg-blue-50' },
                { label: 'O.S. Pendentes', val: services.filter(s => s.status !== ServiceStatus.DELIVERED).length, icon: <ClipboardList className="text-indigo-600" />, bg: 'bg-indigo-50' },
                { label: 'Faturamento', val: `R$ ${financialSummary.income.toFixed(2)}`, icon: <TrendingUp className="text-emerald-600" />, bg: 'bg-emerald-50' },
                { label: 'Clientes', val: clients.length, icon: <Users className="text-orange-600" />, bg: 'bg-orange-50' },
              ].map((s, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
                  <div className={`p-4 rounded-2xl ${s.bg}`}>{s.icon}</div>
                  <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p><p className="text-2xl font-black">{s.val}</p></div>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 h-[400px]">
                <h3 className="text-xl font-black uppercase mb-8">Fluxo de Lavagens</h3>
                <ResponsiveContainer width="100%" height="80%">
                  <BarChart data={serviceCategories.map(c => ({ name: c.name, val: services.filter(s => s.type === c.name).length }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 600}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} />
                    <Bar dataKey="val" fill="#3b82f6" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-slate-900 text-white p-8 rounded-[40px] shadow-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <Zap className="text-blue-400 w-6 h-6" />
                    <h3 className="text-lg font-black uppercase">Insights da IA</h3>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6 italic">{insights || "Analise seus dados para receber dicas de marketing."}</p>
                </div>
                <button disabled={loadingInsights} onClick={async () => { setLoadingInsights(true); const res = await getBusinessInsights(services); setInsights(res); setLoadingInsights(false); }} className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all">
                  {loadingInsights ? "Processando..." : "Gerar Análise"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Agendamentos */}
        {activeTab === 'schedulings' && (
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 min-h-[400px] flex flex-col items-center justify-center text-center">
             <Calendar className="w-16 h-16 text-slate-200 mb-4" />
             <h2 className="text-xl font-black uppercase">Módulo de Agendamentos</h2>
             <p className="text-slate-400 max-w-xs mt-2">Esta funcionalidade está sendo sincronizada com o calendário do Google para os próximos dias.</p>
          </div>
        )}

        {/* Clientes */}
        {activeTab === 'clients' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
              <Search className="text-slate-400" />
              <input type="text" placeholder="Filtrar por nome ou placa..." className="flex-1 outline-none font-bold" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 gap-4">
              {clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.vehicles.some(v => v.plate.includes(searchTerm.toUpperCase()))).map(client => (
                <div key={client.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 group hover:shadow-lg transition-all">
                  <div className="flex items-center gap-6">
                    <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 font-black text-2xl w-14 h-14 flex items-center justify-center">{client.name.charAt(0)}</div>
                    <div>
                      <h4 className="font-black text-xl">{client.name}</h4>
                      <p className="text-sm font-bold text-slate-400">{client.phone}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {client.vehicles.map(v => (
                      <span key={v.id} className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-2xl text-[10px] font-black flex items-center gap-2 uppercase">
                        {v.type === VehicleType.CAR ? <CarIcon className="w-4 h-4 text-blue-500" /> : <Bike className="w-4 h-4 text-orange-500" />}
                        {v.plate} - {v.brand} {v.model}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setSelectedClientForVehicle(client); setIsAddVehicleModalOpen(true); }} className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all shadow-sm" title="Novo Veículo"><CarIcon className="w-5 h-5" /></button>
                    <button onClick={() => { setClientToEdit(client); setEditClientData({ name: client.name, phone: client.phone, email: client.email }); setIsEditClientModalOpen(true); }} className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all shadow-sm"><Edit2 className="w-5 h-5" /></button>
                    <button onClick={() => handleRemoveClient(client.id)} className="p-3 bg-slate-50 text-slate-400 hover:text-red-600 rounded-xl transition-all shadow-sm"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Serviços (O.S.) */}
        {activeTab === 'services' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
            {services.map(s => (
              <div key={s.id} className={`bg-white p-8 rounded-[40px] shadow-sm border relative overflow-hidden transition-all hover:shadow-xl ${s.isPaid ? 'border-emerald-100 bg-emerald-50/10' : 'border-slate-100'}`}>
                {s.isPaid && <div className="absolute top-0 right-0 bg-emerald-500 text-white px-6 py-2 rounded-bl-[24px] text-[10px] font-black uppercase">PAGO ✅</div>}
                <div className="flex justify-between items-start mb-6">
                  <span className="text-[10px] font-black px-4 py-1.5 rounded-full bg-slate-100 text-slate-500 uppercase">{s.status}</span>
                  <p className="font-black text-2xl text-blue-600">R$ {s.price.toFixed(2)}</p>
                </div>
                <div className="mb-6">
                  <h4 className="text-xl font-black">{clients.find(c => c.id === s.clientId)?.name}</h4>
                  <p className="text-xs font-black text-blue-500 uppercase">{s.type}</p>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl text-sm font-black text-slate-700 border border-slate-100 mb-6 uppercase tracking-widest">
                  <CarIcon className="w-5 h-5 text-slate-400" /> {clients.find(c => c.id === s.clientId)?.vehicles.find(v => v.id === s.vehicleId)?.plate}
                </div>
                <button onClick={() => {
                  const updated = services.map(srv => srv.id === s.id ? { ...srv, isPaid: !srv.isPaid } : srv);
                  setServices(updated);
                  localStorage.setItem('services', JSON.stringify(updated));
                  showNotification("Status alterado!");
                }} className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${s.isPaid ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white'}`}>
                  {s.isPaid ? 'Estornar Pagamento' : 'Receber Pagamento'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Financeiro */}
        {activeTab === 'finance' && (
          <div className="space-y-8 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-emerald-500 text-white p-8 rounded-[40px] shadow-lg">
                  <ArrowUpRight className="mb-4" />
                  <p className="text-[10px] font-black uppercase opacity-60">Total Entradas</p>
                  <p className="text-3xl font-black">R$ {financialSummary.income.toFixed(2)}</p>
               </div>
               <div className="bg-red-500 text-white p-8 rounded-[40px] shadow-lg">
                  <ArrowDownRight className="mb-4" />
                  <p className="text-[10px] font-black uppercase opacity-60">Total Saídas</p>
                  <p className="text-3xl font-black">R$ {financialSummary.expense.toFixed(2)}</p>
               </div>
               <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                  <DollarSign className="mb-4 text-blue-600" />
                  <p className="text-[10px] font-black uppercase text-slate-400">Saldo Disponível</p>
                  <p className="text-3xl font-black text-slate-900">R$ {financialSummary.balance.toFixed(2)}</p>
               </div>
            </div>

            <div className="bg-white rounded-[48px] shadow-sm border border-slate-100 overflow-hidden">
               <div className="p-8 border-b flex justify-between items-center">
                  <h3 className="text-xl font-black uppercase">Fluxo de Caixa</h3>
                  <button onClick={() => setIsCashFlowModalOpen(true)} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold text-xs uppercase">Registrar Despesa</button>
               </div>
               <div className="divide-y divide-slate-50">
                  {cashFlow.map(item => (
                    <div key={item.id} className="p-6 flex justify-between items-center hover:bg-slate-50 transition-colors">
                       <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${item.type === CashFlowType.INCOME ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                             {item.type === CashFlowType.INCOME ? <ArrowUpRight /> : <ArrowDownRight />}
                          </div>
                          <div>
                             <p className="font-bold text-slate-900">{item.description}</p>
                             <p className="text-[10px] font-black text-slate-400 uppercase">{new Date(item.date).toLocaleDateString()} | {item.category}</p>
                          </div>
                       </div>
                       <p className={`font-black text-lg ${item.type === CashFlowType.INCOME ? 'text-emerald-600' : 'text-red-600'}`}>
                          {item.type === CashFlowType.INCOME ? '+' : '-'} R$ {item.amount.toFixed(2)}
                       </p>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}

        {/* Ajustes */}
        {activeTab === 'settings' && (
          <div className="max-w-4xl space-y-12 animate-in slide-in-from-bottom-6">
            <div className="bg-white p-12 rounded-[48px] shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-12">
                <h2 className="text-2xl font-black uppercase tracking-tighter">Tabela de Serviços</h2>
                <button onClick={() => handleOpenCategoryModal()} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-blue-700 transition-all">
                  <Plus className="w-5 h-5" /> Adicionar Categoria
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {serviceCategories.map(cat => (
                  <div key={cat.id} className="p-8 bg-slate-50 rounded-[40px] border border-slate-100 space-y-6 hover:bg-white hover:shadow-md transition-all">
                    <div className="flex justify-between items-center">
                      <div className="bg-white p-4 rounded-2xl text-blue-600 shadow-sm"><Settings2 className="w-6 h-6" /></div>
                      <div className="flex gap-2">
                        <button onClick={() => handleOpenCategoryModal(cat)} className="p-2 text-slate-400 hover:text-blue-600 transition-all"><Edit2 className="w-5 h-5" /></button>
                        <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 text-slate-400 hover:text-red-600 transition-all"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-black text-xl uppercase tracking-tight">{cat.name}</h4>
                      <div className="flex gap-4 mt-3">
                        <div className="text-xs font-bold text-slate-500 flex items-center gap-2"><CarIcon className="w-4 h-4 text-blue-500"/> R$ {cat.priceCar}</div>
                        <div className="text-xs font-bold text-slate-500 flex items-center gap-2"><Bike className="w-4 h-4 text-orange-500"/> R$ {cat.priceMoto}</div>
                        <div className="text-xs font-bold text-slate-500 flex items-center gap-2"><Clock className="w-4 h-4 text-indigo-500"/> {cat.duration} min</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Backup Section */}
            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-6">
                <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600"><Database className="w-8 h-8" /></div>
                <div>
                  <h3 className="font-black text-xl uppercase">Backup e Restauração</h3>
                  <p className="text-slate-400 text-sm font-bold">Importe ou exporte seus dados JSON</p>
                </div>
              </div>
              <div className="flex gap-4">
                <input type="file" accept=".json" ref={fileInputRef} className="hidden" onChange={handleImportBackup} />
                <button onClick={() => fileInputRef.current?.click()} className="bg-white border-2 border-blue-500 text-blue-600 px-6 py-4 rounded-2xl font-black text-xs uppercase hover:bg-blue-50 transition-all flex items-center gap-2">
                  <Upload className="w-5 h-5" /> Restaurar
                </button>
                <button onClick={handleExportBackup} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-lg hover:bg-emerald-700 transition-all flex items-center gap-2">
                  <Download className="w-5 h-5" /> Exportar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL EDITAR CLIENTE */}
      {isEditClientModalOpen && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[48px] w-full max-w-lg shadow-2xl animate-in zoom-in duration-300">
             <div className="p-10 border-b flex justify-between items-center bg-slate-50/50">
               <h2 className="text-2xl font-black uppercase tracking-tighter">Editar Perfil</h2>
               <button onClick={() => setIsEditClientModalOpen(false)} className="p-3 hover:bg-slate-100 rounded-2xl transition-all"><X /></button>
             </div>
             <form onSubmit={handleUpdateClient} className="p-10 space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Nome Completo</label>
                   <input required className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none" value={editClientData.name} onChange={e => setEditClientData({...editClientData, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-2">WhatsApp</label>
                   <input required className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none" value={editClientData.phone} onChange={e => setEditClientData({...editClientData, phone: e.target.value})} />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white font-black py-6 rounded-3xl shadow-xl uppercase text-xs tracking-widest">Atualizar Cadastro</button>
             </form>
          </div>
        </div>
      )}

      {/* MODAL CATEGORIA (CADASTRO/EDIÇÃO) */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[48px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-10 border-b flex justify-between items-center bg-slate-50/50">
              <h2 className="text-2xl font-black uppercase text-slate-900 tracking-tighter">{categoryToEdit ? 'Editar Serviço' : 'Novo Serviço'}</h2>
              <button onClick={() => setIsCategoryModalOpen(false)} className="p-3 hover:bg-slate-100 rounded-2xl transition-all shadow-sm"><X /></button>
            </div>
            <form onSubmit={handleSaveCategory} className="p-10 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Nome do Serviço</label>
                <input required className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none" placeholder="Ex: Higienização de Couro" value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Carro R$</label>
                  <input required type="number" className="w-full p-4 bg-slate-50 rounded-2xl font-black" value={categoryForm.priceCar} onChange={e => setCategoryForm({...categoryForm, priceCar: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Moto R$</label>
                  <input required type="number" className="w-full p-4 bg-slate-50 rounded-2xl font-black" value={categoryForm.priceMoto} onChange={e => setCategoryForm({...categoryForm, priceMoto: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Duração</label>
                  <input required type="number" className="w-full p-4 bg-slate-50 rounded-2xl font-black" value={categoryForm.duration} onChange={e => setCategoryForm({...categoryForm, duration: parseInt(e.target.value) || 0})} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">O que será feito?</label>
                <textarea className="w-full p-5 bg-slate-50 rounded-2xl font-medium text-sm min-h-[120px] outline-none" placeholder="Descreva os itens inclusos neste serviço..." value={categoryForm.description} onChange={e => setCategoryForm({...categoryForm, description: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white font-black py-6 rounded-2xl shadow-xl hover:bg-blue-700 transition-all uppercase text-xs">Salvar Alterações</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NOVO CLIENTE */}
      {isClientModalOpen && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[48px] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-10 border-b bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Cadastro de Cliente</h2>
              <button onClick={() => setIsClientModalOpen(false)} className="p-3 hover:bg-slate-100 rounded-2xl transition-all shadow-sm"><X /></button>
            </div>
            <form onSubmit={handleAddClient} className="p-10 space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <input required className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none" placeholder="Nome do Cliente" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} />
                <input required className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none" placeholder="WhatsApp" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} />
              </div>

              <div className="p-8 bg-blue-50 rounded-[40px] border border-blue-100 space-y-6">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Veículo de Entrada</p>
                  <div className="flex gap-2 p-1 bg-white rounded-xl shadow-sm border border-slate-100">
                    <button type="button" onClick={() => setNewVehicle({...newVehicle, type: VehicleType.CAR, brand: '', model: ''})} className={`px-5 py-2.5 rounded-lg text-[10px] font-black transition-all ${newVehicle.type === VehicleType.CAR ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}><CarIcon className="w-4 h-4"/> CARRO</button>
                    <button type="button" onClick={() => setNewVehicle({...newVehicle, type: VehicleType.MOTORCYCLE, brand: '', model: ''})} className={`px-5 py-2.5 rounded-lg text-[10px] font-black transition-all ${newVehicle.type === VehicleType.MOTORCYCLE ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}><Bike className="w-4 h-4"/> MOTO</button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <select required className="w-full p-4 bg-white rounded-xl font-bold outline-none shadow-sm" value={newVehicle.brand} onChange={e => setNewVehicle({...newVehicle, brand: e.target.value, model: ''})}>
                      <option value="">Marca...</option>
                      {Object.keys(BR_VEHICLE_DATA[newVehicle.type as keyof typeof BR_VEHICLE_DATA]).map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <select required disabled={!newVehicle.brand} className="w-full p-4 bg-white rounded-xl font-bold outline-none shadow-sm" value={newVehicle.model} onChange={e => setNewVehicle({...newVehicle, model: e.target.value})}>
                      <option value="">Modelo...</option>
                      {newVehicle.brand && BR_VEHICLE_DATA[newVehicle.type as keyof typeof BR_VEHICLE_DATA][newVehicle.brand as any]?.map((m: string) => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
                
                <input required className="w-full p-5 bg-white rounded-xl font-black text-center text-3xl tracking-[0.4em] uppercase shadow-sm border-2 border-transparent focus:border-blue-200 outline-none" placeholder="PLACA" value={newVehicle.plate} onChange={e => setNewVehicle({...newVehicle, plate: e.target.value.toUpperCase().slice(0, 7)})} />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white font-black py-7 rounded-[28px] shadow-2xl uppercase text-xs tracking-[0.3em] hover:bg-blue-700">Finalizar e Abrir Ficha</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ADICIONAR VEÍCULO (INDIVIDUAL) */}
      {isAddVehicleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[48px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-300 border border-white/20">
            <div className="p-10 border-b bg-slate-50/50 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black uppercase text-slate-900 tracking-tighter">Novo Veículo</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Para: {selectedClientForVehicle?.name}</p>
              </div>
              <button onClick={() => setIsAddVehicleModalOpen(false)} className="p-3 hover:bg-slate-100 rounded-2xl transition-all shadow-sm"><X /></button>
            </div>
            <form onSubmit={handleAddVehicle} className="p-10 space-y-6">
              <div className="flex gap-2 p-1.5 bg-slate-100 rounded-[24px]">
                <button type="button" onClick={() => setNewVehicle({...newVehicle, type: VehicleType.CAR, brand: '', model: ''})} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${newVehicle.type === VehicleType.CAR ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-500'}`}><CarIcon className="w-5 h-5"/> CARRO</button>
                <button type="button" onClick={() => setNewVehicle({...newVehicle, type: VehicleType.MOTORCYCLE, brand: '', model: ''})} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${newVehicle.type === VehicleType.MOTORCYCLE ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-500'}`}><Bike className="w-5 h-5"/> MOTO</button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <select required className="w-full p-4 bg-slate-50 rounded-xl font-bold shadow-inner" value={newVehicle.brand} onChange={e => setNewVehicle({...newVehicle, brand: e.target.value, model: ''})}>
                  <option value="">Marca...</option>
                  {Object.keys(BR_VEHICLE_DATA[newVehicle.type as keyof typeof BR_VEHICLE_DATA]).map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <select required disabled={!newVehicle.brand} className="w-full p-4 bg-slate-50 rounded-xl font-bold shadow-inner disabled:opacity-50" value={newVehicle.model} onChange={e => setNewVehicle({...newVehicle, model: e.target.value})}>
                  <option value="">Modelo...</option>
                  {newVehicle.brand && BR_VEHICLE_DATA[newVehicle.type as keyof typeof BR_VEHICLE_DATA][newVehicle.brand as any]?.map((m: string) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              
              <input required className="w-full p-5 bg-slate-900 text-white rounded-2xl font-black text-center text-3xl tracking-[0.5em] uppercase shadow-xl border-2 border-white/10" placeholder="ABC1234" value={newVehicle.plate} onChange={e => setNewVehicle({...newVehicle, plate: e.target.value.toUpperCase().slice(0, 7)})} />
              
              <button type="submit" className="w-full bg-indigo-600 text-white font-black py-6 rounded-2xl shadow-xl uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all">Adicionar à Ficha</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FINANCEIRO (DESPESA) */}
      {isCashFlowModalOpen && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[48px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-300">
             <div className="p-10 border-b flex justify-between items-center bg-slate-50/50">
               <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Nova Despesa</h2>
               <button onClick={() => setIsCashFlowModalOpen(false)} className="p-3 hover:bg-slate-100 rounded-2xl transition-all"><X /></button>
             </div>
             <form onSubmit={handleAddCashEntry} className="p-10 space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Descrição</label>
                   <input required className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none" placeholder="Ex: Compra de Shampoo" value={newCashEntry.description} onChange={e => setNewCashEntry({...newCashEntry, description: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Valor R$</label>
                    <input required type="number" step="0.01" className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none" value={newCashEntry.amount} onChange={e => setNewCashEntry({...newCashEntry, amount: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Categoria</label>
                    <select required className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none" value={newCashEntry.category} onChange={e => setNewCashEntry({...newCashEntry, category: e.target.value})}>
                       <option value="Geral">Geral</option>
                       <option value="Produtos">Produtos</option>
                       <option value="Aluguel/Luz">Aluguel/Luz</option>
                       <option value="Salários">Salários</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="w-full bg-red-500 text-white font-black py-6 rounded-3xl shadow-xl uppercase text-xs tracking-widest">Registrar Saída</button>
             </form>
          </div>
        </div>
      )}

      {/* MODAL O.S. */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[48px] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-10 border-b flex justify-between items-center bg-slate-50/50">
              <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Gerar Nova O.S.</h2>
              <button onClick={() => setIsServiceModalOpen(false)} className="p-3 hover:bg-slate-100 rounded-2xl transition-all shadow-sm"><X /></button>
            </div>
            <form onSubmit={handleCreateService} className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Selecione o Cliente</label>
                  <select required className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-100" value={selectedClientId} onChange={e => {
                    setSelectedClientId(e.target.value);
                    const c = clients.find(cl => cl.id === e.target.value);
                    if (c?.vehicles.length) setSelectedVehicleId(c.vehicles[0].id);
                  }}>
                    <option value="">Selecione...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Veículo Atendido</label>
                  <select required disabled={!selectedClientId} className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-100 disabled:opacity-50" value={selectedVehicleId} onChange={e => setSelectedVehicleId(e.target.value)}>
                    {clients.find(c => c.id === selectedClientId)?.vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.plate})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Nível de Lavagem</label>
                <div className="grid grid-cols-2 gap-4">
                  {serviceCategories.map(cat => (
                    <button key={cat.id} type="button" onClick={() => setSelectedServiceType(cat.id)} className={`p-6 rounded-[32px] border-2 text-left transition-all ${selectedServiceType === cat.id ? 'border-blue-600 bg-blue-50 shadow-inner' : 'border-slate-50 hover:bg-slate-50'}`}>
                      <p className="font-black text-[11px] uppercase tracking-widest text-slate-900">{cat.name}</p>
                      <div className="flex gap-3 text-[9px] font-bold text-slate-400 mt-2">
                         <span className="flex items-center gap-1"><CarIcon className="w-3 h-3"/> R$ {cat.priceCar}</span>
                         <span className="flex items-center gap-1"><Bike className="w-3 h-3"/> R$ {cat.priceMoto}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {selectedServiceType && (
                <div className="p-6 bg-slate-900 rounded-[32px] animate-in fade-in slide-in-from-bottom-4 shadow-2xl">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-2">Instruções de Execução</p>
                  <p className="text-sm font-medium text-slate-300 italic leading-relaxed">
                    {serviceCategories.find(c => c.id === selectedServiceType)?.description}
                  </p>
                </div>
              )}

              <button type="submit" className="w-full bg-blue-600 text-white font-black py-7 rounded-[28px] shadow-2xl uppercase text-xs tracking-[0.3em] hover:bg-blue-700 transition-all">Lançar Ordem de Serviço</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
