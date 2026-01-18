import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  TrendingUp, 
  Search, 
  Bell,
  Ship,
  FileBarChart,
  Globe,
  Languages,
  ArrowDownToLine,
  BookOpen,
  Settings
} from 'lucide-react';

// --- Badges ---

export const StatusBadge = ({ status, type }: { status: string; type: 'PO' | 'SO' | 'BATCH' | 'INV' }) => {
  const getColors = () => {
    const s = status.toLowerCase();
    
    if (type === 'PO') {
      if (s === 'draft') return 'bg-gray-100 text-gray-800';
      if (s === 'ordered') return 'bg-blue-100 text-blue-800';
      if (s === 'in_transit') return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
      if (s === 'received') return 'bg-green-100 text-green-800';
      if (s === 'partial') return 'bg-amber-100 text-amber-800 border border-amber-200';
    }
    
    if (type === 'SO') {
      if (s === 'booking') return 'bg-yellow-100 text-yellow-800';
      if (s === 'confirmed') return 'bg-blue-100 text-blue-800';
      if (s === 'bol_generated') return 'bg-purple-100 text-purple-800';
      if (s === 'invoiced') return 'bg-green-100 text-green-800';
    }

    if (type === 'BATCH') {
      if (s === 'available') return 'bg-emerald-100 text-emerald-800';
      if (s === 'quarantine') return 'bg-red-100 text-red-800 animate-pulse';
    }
    
    if (type === 'INV') {
      if (s === 'unpaid') return 'bg-red-100 text-red-800';
      if (s === 'paid') return 'bg-green-100 text-green-800';
    }

    return 'bg-gray-100 text-gray-800';
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getColors()}`}>
      {status.replace(/_/g, ' ').toUpperCase()}
    </span>
  );
};

// --- Layout Components ---

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  t: (key: any) => string;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange, t }) => {
  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'sourcing', label: t('sourcing'), icon: ShoppingCart },
    { id: 'receiving', label: t('receiving'), icon: ArrowDownToLine },
    { id: 'inventory', label: t('inventory'), icon: Package },
    { id: 'sales', label: t('sales'), icon: TrendingUp },
    { id: 'finance', label: t('finance'), icon: FileBarChart },
    { id: 'traceability', label: t('traceability'), icon: Search },
    // New Items
    { id: 'user_guide', label: t('user_guide'), icon: BookOpen },
    { id: 'settings', label: t('settings'), icon: Settings },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen flex flex-col fixed left-0 top-0 z-30 shadow-xl">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <Ship className="text-blue-400" />
          <span>TradeFlow</span>
        </div>
        <p className="text-slate-400 text-xs mt-1">Import/Export ERP</p>
      </div>
      
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                active 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">JD</div>
          <div>
            <p className="text-sm font-medium">John Doe</p>
            <p className="text-xs text-slate-500">Logistics Manager</p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface HeaderProps {
  title: string;
  lang: 'en' | 'fr';
  setLang: (l: 'en' | 'fr') => void;
}

export const Header: React.FC<HeaderProps> = ({ title, lang, setLang }) => {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-20">
      <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
      <div className="flex items-center gap-4">
        {/* Language Toggle */}
        <button 
           onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}
           className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
        >
           <Languages size={16} />
           {lang.toUpperCase()}
        </button>

        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
      </div>
    </header>
  );
};

export const KPI = ({ title, value, sub, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      {sub && <p className={`text-xs mt-2 font-medium ${sub.includes('Days') ? 'text-red-600' : 'text-slate-500'}`}>{sub}</p>}
    </div>
    <div className={`p-3 rounded-lg ${color}`}>
      <Icon size={24} className="text-white" />
    </div>
  </div>
);