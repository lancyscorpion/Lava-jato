
import React from 'react';
import { 
  Droplets, 
  Zap, 
  ShieldCheck, 
  Sparkles, 
  LayoutDashboard, 
  Users, 
  ClipboardList,
  Settings as SettingsIcon,
  CalendarClock,
  Wallet
} from 'lucide-react';

export const INITIAL_SERVICE_CATEGORIES = [
  { 
    id: 'simple', 
    name: 'Lavagem Simples', 
    priceCar: 50, 
    priceMoto: 30, 
    duration: 45, 
    iconName: 'Droplets',
    description: 'Lavagem externa, secagem, limpeza de vidros externos e pretinho nos pneus.'
  },
  { 
    id: 'complete', 
    name: 'Lavagem Completa', 
    priceCar: 80, 
    priceMoto: 50, 
    duration: 90, 
    iconName: 'Sparkles',
    description: 'Lavagem simples + Aspiração interna completa, limpeza de painel, consoles e porta-malas.'
  },
  { 
    id: 'wax', 
    name: 'Enceramento', 
    priceCar: 120, 
    priceMoto: 70, 
    duration: 120, 
    iconName: 'Zap',
    description: 'Lavagem completa + Aplicação de cera protetora de alto brilho e revitalização de plásticos externos.'
  },
  { 
    id: 'internal', 
    name: 'Higienização Interna', 
    priceCar: 150, 
    priceMoto: 0, 
    duration: 180, 
    iconName: 'ShieldCheck',
    description: 'Limpeza profunda de estofados/couro, teto, carpetes e descontaminação do sistema de ar.'
  },
];

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Painel', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'schedulings', label: 'Agendamentos', icon: <CalendarClock className="w-5 h-5" /> },
  { id: 'clients', label: 'Clientes', icon: <Users className="w-5 h-5" /> },
  { id: 'services', label: 'Serviços', icon: <ClipboardList className="w-5 h-5" /> },
  { id: 'finance', label: 'Financeiro', icon: <Wallet className="w-5 h-5" /> },
  { id: 'settings', label: 'Ajustes', icon: <SettingsIcon className="w-5 h-5" /> },
];

export const BR_VEHICLE_DATA = {
  CARRO: {
    'Volkswagen': ['Polo', 'T-Cross', 'Nivus', 'Gol', 'Virtus', 'Saveiro', 'Amarok', 'Jetta'],
    'Fiat': ['Strada', 'Mobi', 'Argo', 'Cronos', 'Pulse', 'Fastback', 'Toro', 'Fiorino'],
    'Chevrolet': ['Onix', 'Onix Plus', 'Tracker', 'Montana', 'S10', 'Spin', 'Equinox', 'Cruze'],
    'Toyota': ['Corolla', 'Corolla Cross', 'Hilux', 'SW4', 'Yaris'],
    'Hyundai': ['HB20', 'HB20S', 'Creta', 'Tucson'],
    'Honda': ['Civic', 'HR-V', 'City', 'City Hatchback', 'CR-V'],
    'Jeep': ['Renegade', 'Compass', 'Commander'],
    'Renault': ['Kwid', 'Sandero', 'Logan', 'Duster', 'Oroch'],
    'Nissan': ['Kicks', 'Versa', 'Frontier', 'Sentra'],
    'Ford': ['Ranger', 'Territory', 'Maverick'],
    'BYD': ['Dolphin', 'Seal', 'Song Plus', 'Yuan Plus'],
    'GWM': ['Haval H6', 'Ora 03'],
    'Outros': ['Outro Modelo']
  },
  MOTO: {
    'Honda': ['CG 160 Titan', 'CG 160 Fan', 'Biz 125', 'Biz 110i', 'NXR 160 Bros', 'CB 300F Twister', 'XRE 300', 'XRE 190', 'PCX 160', 'Elite 125', 'Pop 110i'],
    'Yamaha': ['Fazer FZ25', 'Fazer FZ15', 'Lander 250', 'Factor 150', 'Factor 125', 'Crosser 150', 'MT-03', 'NMAX 160', 'Fluo 125'],
    'BMW': ['G 310 GS', 'R 1250 GS', 'F 850 GS', 'S 1000 RR'],
    'Kawasaki': ['Ninja 400', 'Z400', 'Versys 650', 'Z900'],
    'Shineray': ['XY 50', 'Phoenix', 'SHI 175'],
    'Royal Enfield': ['Hunter 350', 'Classic 350', 'Meteor 350', 'Himalayan'],
    'Suzuki': ['V-Strom 650', 'GSX-S750', 'Burgman'],
    'Outros': ['Outro Modelo']
  }
};
