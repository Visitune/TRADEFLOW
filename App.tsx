import React, { useState, useEffect, useRef } from 'react';
import { Sidebar, Header, KPI, StatusBadge } from './components/Common';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer 
} from 'recharts';
import { 
  DollarSign, Container, AlertTriangle, Scale, Plus, Search, 
  ArrowRight, Truck, FileText, CheckCircle,
  Box, Ship, Package, TrendingUp, Tag, Globe, Layers, Download, Camera, ScanLine, X,
  BookOpen, ChevronDown, ChevronUp, Edit2, Save, Trash2, Settings, Upload, Filter,
  ShoppingCart, ArrowDownToLine, User, Mail, MapPin, Building, Info, HelpCircle
} from 'lucide-react';
import { read, utils } from 'xlsx';
import { dataService } from './services/dataService';
import { downloadCSV } from './utils/export';
import { useTranslation, Language } from './services/translations';
import { Batch, BatchStatus, Invoice, Partner, PartnerType, POStatus, Product, PurchaseOrder, SalesOrder, SOStatus } from './types';
import { isSupabaseConfigured } from './services/supabaseClient';

// --- Shared Components ---

const FilterBar = ({ onSearch, onStatusFilter, statusOptions, t }: any) => (
  <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
    <div className="relative flex-1">
      <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
      <input 
        type="text" 
        placeholder={t('search_placeholder')} 
        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        onChange={(e) => onSearch(e.target.value)}
      />
    </div>
    {statusOptions && (
      <div className="relative w-full sm:w-48">
        <Filter className="absolute left-3 top-2.5 text-gray-400" size={18} />
        <select 
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none bg-white"
          onChange={(e) => onStatusFilter(e.target.value)}
        >
          <option value="all">{t('all_status')}</option>
          {statusOptions.map((opt: string) => (
            <option key={opt} value={opt}>{opt.replace(/_/g, ' ').toUpperCase()}</option>
          ))}
        </select>
      </div>
    )}
  </div>
);

// --- Views Components ---

// 1. DASHBOARD VIEW
const DashboardView = ({ stockValue, pendingPO, arAging, t }: any) => {
  const chartData = [
    { name: 'Jan', stock: 4000, sales: 2400 },
    { name: 'Feb', stock: 3000, sales: 1398 },
    { name: 'Mar', stock: 2000, sales: 9800 },
    { name: 'Apr', stock: 2780, sales: 3908 },
    { name: 'May', stock: 1890, sales: 4800 },
    { name: 'Jun', stock: 2390, sales: 3800 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPI 
          title={t('stock_value')} 
          value={`${(stockValue / 1000).toFixed(1)}k €`} 
          sub={t('stock_value_sub')}
          icon={DollarSign} 
          color="bg-emerald-500" 
        />
        <KPI 
          title={t('in_transit_kpi')} 
          value={pendingPO} 
          sub={t('in_transit_sub')}
          icon={Container} 
          color="bg-blue-500" 
        />
        <KPI 
          title={t('ar_aging')} 
          value={`${arAging.toLocaleString()} €`} 
          sub={t('ar_aging_sub')} 
          icon={AlertTriangle} 
          color="bg-amber-500" 
        />
        <KPI 
          title={t('margin_monthly')} 
          value="22.5%" 
          sub="Real landed cost basis" 
          icon={Scale} 
          color="bg-indigo-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-80">
          <h3 className="text-lg font-bold text-gray-800 mb-4">{t('sales')} Trend</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <ReTooltip />
              <Bar dataKey="stock" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="sales" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// 2. PURCHASING VIEW
const PurchasingView = ({ pos, products, partners, onUpdate, onCreate, t }: any) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingPO, setEditingPO] = useState<any | null>(null);

  const filtered = pos.filter((po: PurchaseOrder) => {
    const matchesSearch = po.po_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          po.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || po.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSave = () => {
    if (editingPO) {
      // Calculate Total
      const total = editingPO.items.reduce((acc: number, item: any) => acc + (item.quantity_cases * item.price_unit), 0);
      const updatedPO = { ...editingPO, total_fob: total };

      if (updatedPO.id === 'new') {
         updatedPO.id = `po-${Date.now()}`;
         if(!updatedPO.supplier && updatedPO.supplier_id) {
            updatedPO.supplier = partners.find((p:any) => p.id === updatedPO.supplier_id);
         }
         onCreate(updatedPO);
      } else {
         onUpdate(updatedPO);
      }
      setEditingPO(null);
    }
  };

  const handleNewPO = () => {
    setEditingPO({
      id: 'new',
      po_number: `PO-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
      status: POStatus.DRAFT,
      order_date: new Date().toISOString().split('T')[0],
      items: [],
      supplier_id: '',
      currency_rate: 1.0,
      total_fob: 0
    });
  };

  const addLine = () => {
    setEditingPO({
      ...editingPO,
      items: [...(editingPO.items || []), { id: `tmp-${Date.now()}`, product_id: '', quantity_cases: 1, price_unit: 0 }]
    });
  };

  const removeLine = (idx: number) => {
     const newItems = [...editingPO.items];
     newItems.splice(idx, 1);
     setEditingPO({ ...editingPO, items: newItems });
  };

  const updateLine = (idx: number, field: string, value: any) => {
     const newItems = [...editingPO.items];
     newItems[idx] = { ...newItems[idx], [field]: value };
     if (field === 'product_id') {
         const prod = products.find((p:any) => p.id === value);
         if (prod) {
             newItems[idx].product = prod; 
             newItems[idx].price_unit = prod.wholesale_price || 0;
         }
     }
     setEditingPO({ ...editingPO, items: newItems });
  };

  const suppliers = partners.filter((p:any) => p.type === PartnerType.SUPPLIER);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
           <button 
             onClick={() => downloadCSV(filtered, 'purchase_orders')}
             className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
             <Download size={16} />
             {t('export_csv')}
           </button>
        </div>
        <button onClick={handleNewPO} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={18} />
          {t('new_order')}
        </button>
      </div>

      <FilterBar 
        t={t} 
        onSearch={setSearchTerm} 
        onStatusFilter={setStatusFilter} 
        statusOptions={Object.values(POStatus)}
      />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
              <th className="p-4 font-semibold">{t('po_number')}</th>
              <th className="p-4 font-semibold">{t('supplier')}</th>
              <th className="p-4 font-semibold">{t('date')}</th>
              <th className="p-4 font-semibold">{t('total_fob')}</th>
              <th className="p-4 font-semibold">{t('status')}</th>
              <th className="p-4 font-semibold">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((po: any) => (
              <tr key={po.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 font-medium text-gray-900 flex items-center gap-2">
                  <FileText size={16} className="text-gray-400"/>
                  {po.po_number}
                </td>
                <td className="p-4 text-gray-700">
                  <span className="block font-medium">{po.supplier?.name}</span>
                </td>
                <td className="p-4 text-gray-600 font-mono text-sm">{po.order_date}</td>
                <td className="p-4 font-medium text-gray-900">${po.total_fob.toLocaleString()}</td>
                <td className="p-4"><StatusBadge status={po.status} type="PO" /></td>
                <td className="p-4">
                  <button onClick={() => setEditingPO({...po})} className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50">
                    <Edit2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit/Create Modal */}
      {editingPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h3 className="text-xl font-bold text-gray-800">
                    {editingPO.id === 'new' ? t('create_po') : `${t('edit_po')} - ${editingPO.po_number}`}
                </h3>
                <button onClick={() => setEditingPO(null)}><X size={24} className="text-gray-400 hover:text-gray-600"/></button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                {/* Header Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('po_number')}</label>
                        <input 
                            className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50"
                            value={editingPO.po_number}
                            readOnly={editingPO.id !== 'new'}
                            onChange={e => setEditingPO({...editingPO, po_number: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('supplier')}</label>
                        <select 
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            value={editingPO.supplier_id}
                            onChange={e => setEditingPO({...editingPO, supplier_id: e.target.value})}
                        >
                            <option value="">{t('select_supplier')}</option>
                            {suppliers.map((s:any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('date')}</label>
                        <input 
                            type="date"
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            value={editingPO.order_date}
                            onChange={e => setEditingPO({...editingPO, order_date: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('status')}</label>
                        <select 
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            value={editingPO.status}
                            onChange={e => setEditingPO({...editingPO, status: e.target.value})}
                        >
                            {Object.values(POStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('incoterm')}</label>
                        <input 
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            value={editingPO.incoterm || ''}
                            onChange={e => setEditingPO({...editingPO, incoterm: e.target.value})}
                            placeholder="e.g. EXW"
                        />
                    </div>
                </div>

                {/* Items Table */}
                <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-gray-800">Items</h4>
                        <button onClick={addLine} className="text-sm flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium">
                            <Plus size={16} /> {t('add_line')}
                        </button>
                    </div>
                    <table className="w-full text-left border border-gray-200 rounded-lg overflow-hidden">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                            <tr>
                                <th className="p-3">{t('product')}</th>
                                <th className="p-3 w-24">{t('quantity')}</th>
                                <th className="p-3 w-32">{t('unit_price')}</th>
                                <th className="p-3 w-32 text-right">Subtotal</th>
                                <th className="p-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {editingPO.items?.map((item: any, idx: number) => (
                                <tr key={idx}>
                                    <td className="p-2">
                                        <select 
                                            className="w-full p-1 border border-gray-300 rounded"
                                            value={item.product_id}
                                            onChange={e => updateLine(idx, 'product_id', e.target.value)}
                                        >
                                            <option value="">{t('select_product')}</option>
                                            {products.map((p:any) => <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>)}
                                        </select>
                                    </td>
                                    <td className="p-2">
                                        <input 
                                            type="number" className="w-full p-1 border border-gray-300 rounded text-right"
                                            value={item.quantity_cases}
                                            onChange={e => updateLine(idx, 'quantity_cases', parseFloat(e.target.value))}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input 
                                            type="number" className="w-full p-1 border border-gray-300 rounded text-right"
                                            value={item.price_unit}
                                            onChange={e => updateLine(idx, 'price_unit', parseFloat(e.target.value))}
                                        />
                                    </td>
                                    <td className="p-2 text-right font-medium">
                                        {(item.quantity_cases * item.price_unit).toLocaleString()}
                                    </td>
                                    <td className="p-2 text-center">
                                        <button onClick={() => removeLine(idx)} className="text-red-400 hover:text-red-600">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-50 font-bold">
                            <tr>
                                <td colSpan={3} className="p-3 text-right">Total FOB</td>
                                <td className="p-3 text-right">
                                    {editingPO.items?.reduce((acc: number, i: any) => acc + (i.quantity_cases * i.price_unit), 0).toLocaleString()}
                                </td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
                <button onClick={() => setEditingPO(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">{t('cancel')}</button>
                <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{t('save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 3. RECEIVING VIEW (Unchanged but included for completeness)
const ReceivingView = ({ pos, t }: { pos: PurchaseOrder[], t: any }) => {
    // ... same as before
    const [searchTerm, setSearchTerm] = useState('');
  const incoming = pos.filter(p => p.status === 'in_transit' || p.status === 'ordered' || p.status === 'partial');
  const [scanning, setScanning] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  const filtered = incoming.filter(po => 
    po.po_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
    po.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleScanClick = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setScanning(true);
  };

  if (scanning && selectedPO) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
           <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
             <h3 className="font-bold text-gray-800 flex items-center gap-2">
               <Camera size={20} className="text-blue-600"/>
               Scan Receiving - PO {selectedPO.po_number}
             </h3>
             <button onClick={() => setScanning(false)} className="text-gray-400 hover:text-gray-600">
               <X size={24} />
             </button>
           </div>
           
           <div className="p-8 flex flex-col items-center justify-center space-y-4">
              <div className="w-full h-48 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center relative overflow-hidden">
                 <ScanLine size={48} className="text-slate-400 animate-pulse" />
                 <p className="absolute bottom-4 text-xs text-slate-500 font-medium">Camera Active... Positioning UPC</p>
              </div>
              <p className="text-center text-sm text-gray-600">
                Point camera at product UPC or Lot label to validate reception.
              </p>
              
              <div className="w-full space-y-2 mt-4">
                 <div className="text-xs font-semibold text-gray-500 uppercase">Manual Override</div>
                 <select className="w-full p-2 border border-gray-300 rounded-lg text-sm">
                    <option>Select Item manually...</option>
                    {selectedPO.items?.map(item => (
                       <option key={item.id}>{item.product?.sku} - {item.quantity_cases} cases</option>
                    ))}
                 </select>
              </div>
           </div>

           <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-2">
             <button onClick={() => setScanning(false)} className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-800 font-medium text-sm">Cancel</button>
             <button onClick={() => { alert('Items Received!'); setScanning(false); }} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium text-sm">Confirm Receipt</button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FilterBar t={t} onSearch={setSearchTerm} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(po => (
           <div key={po.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                 <div>
                    <h3 className="font-bold text-lg text-gray-900">{po.po_number}</h3>
                    <p className="text-gray-500 text-sm">{po.supplier?.name}</p>
                 </div>
                 <StatusBadge status={po.status} type="PO" />
              </div>
              <div className="space-y-2 mb-6">
                 <p className="text-sm text-gray-600 flex justify-between">
                   <span>ETA:</span> <span className="font-medium">{po.expected_arrival || 'TBD'}</span>
                 </p>
                 <p className="text-sm text-gray-600 flex justify-between">
                   <span>Items:</span> <span className="font-medium">{po.items?.length}</span>
                 </p>
              </div>
              <div className="flex gap-2">
                 <button 
                    onClick={() => handleScanClick(po)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium">
                    <ScanLine size={16} />
                    {t('scan_upc')}
                 </button>
                 <button className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 rounded-lg text-sm font-medium">
                    {t('manual_entry')}
                 </button>
              </div>
           </div>
        ))}
      </div>
    </div>
  )
}

// 4. INVENTORY VIEW (Unchanged)
const InventoryView = ({ products, batches, pos, sales, onUpdateProduct, t }: any) => {
    // ... Same as before
     const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Logic to aggregate stock by Product
  const productsMap = new Map();

  // 0. Initialize with all products
  products.forEach((p:any) => {
    productsMap.set(p.id, {
        product: p,
        onHand: 0,
        inTransit: 0,
        committed: 0
    });
  });

  // 1. On Hand (Batches)
  batches.forEach((b:any) => {
    if (productsMap.has(b.product_id)) {
        const entry = productsMap.get(b.product_id);
        if (b.status === BatchStatus.AVAILABLE) {
            entry.onHand += b.quantity_current;
        }
    }
  });

  // 2. In Transit (POs)
  pos.forEach((po:any) => {
     if (po.status === 'in_transit' || po.status === 'ordered') {
         po.items?.forEach((item:any) => {
             if (productsMap.has(item.product_id)) {
                 const entry = productsMap.get(item.product_id);
                 entry.inTransit += (item.quantity_cases || 0);
             }
         })
     }
  });

  // 3. Committed (SOs)
  sales.forEach((so:any) => {
    if (so.status === 'booking' || so.status === 'confirmed') {
        so.items?.forEach((item:any) => {
            if (productsMap.has(item.product_id)) {
                const entry = productsMap.get(item.product_id);
                entry.committed += item.quantity;
            }
        })
    }
  });

  const stockRows = Array.from(productsMap.values());
  const filtered = stockRows.filter((row: any) => 
     row.product.sku.toLowerCase().includes(searchTerm.toLowerCase()) || 
     row.product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = () => {
    if(editingProduct) {
      onUpdateProduct(editingProduct);
      setEditingProduct(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
         <FilterBar t={t} onSearch={setSearchTerm} />
         <button 
           onClick={() => downloadCSV(stockRows.map((r: any) => ({
               sku: r.product?.sku,
               name: r.product?.name,
               onHand: r.onHand,
               inTransit: r.inTransit,
               committed: r.committed,
               available: r.onHand - r.committed
           })), 'stock_status')}
           className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 h-10 self-start">
           <Download size={16} />
           {t('export_csv')}
         </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
           <h3 className="font-semibold text-gray-700">{t('inventory')} - Consolidated View</h3>
        </div>
        <table className="w-full text-left">
          <thead className="bg-white text-gray-500 text-xs uppercase font-semibold border-b border-gray-200">
            <tr>
              <th className="p-4">{t('product')}</th>
              <th className="p-4">{t('brand')}</th>
              <th className="p-4 text-right bg-emerald-50/50">{t('on_hand')}</th>
              <th className="p-4 text-right bg-blue-50/50">{t('in_transit')}</th>
              <th className="p-4 text-right bg-amber-50/50">{t('committed')}</th>
              <th className="p-4 text-right font-bold">{t('available')}</th>
              <th className="p-4 text-right">Costing (W/R)</th>
              <th className="p-4 text-right">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((row: any, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="p-4">
                    <p className="font-medium text-gray-900">{row.product?.sku}</p>
                    <p className="text-xs text-gray-500 max-w-[200px] truncate">{row.product?.name}</p>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{row.product?.brand}</td>
                  <td className="p-4 text-right font-mono bg-emerald-50/30">{row.onHand}</td>
                  <td className="p-4 text-right font-mono text-gray-500 bg-blue-50/30">{row.inTransit}</td>
                  <td className="p-4 text-right font-mono text-gray-500 bg-amber-50/30">{row.committed}</td>
                  <td className="p-4 text-right font-bold font-mono">
                    <span className={row.onHand - row.committed < 0 ? 'text-red-600' : 'text-gray-900'}>
                        {row.onHand - row.committed}
                    </span>
                  </td>
                  <td className="p-4 text-right text-xs">
                     <div className="flex flex-col items-end">
                        <span className="text-gray-900">{row.product?.wholesale_price?.toFixed(2) || '-'} / {row.product?.suggested_retail_price?.toFixed(2) || '-'}</span>
                     </div>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => setEditingProduct(row.product)} className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50">
                        <Edit2 size={16} />
                    </button>
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>

       {/* Edit Product Modal */}
       {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">{t('edit_product')} - {editingProduct.sku}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wholesale Price</label>
                <input 
                  type="number" 
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  value={editingProduct.wholesale_price}
                  onChange={e => setEditingProduct({...editingProduct, wholesale_price: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Retail Price</label>
                <input 
                  type="number" 
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  value={editingProduct.suggested_retail_price}
                  onChange={e => setEditingProduct({...editingProduct, suggested_retail_price: parseFloat(e.target.value)})}
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => setEditingProduct(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">{t('cancel')}</button>
                <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{t('save')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 5. SALES VIEW
const SalesView = ({ sales, products, partners, onUpdate, onCreate, t }: any) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [editingSO, setEditingSO] = useState<any | null>(null);

    const filtered = sales.filter((so: SalesOrder) => {
        const matchesSearch = so.so_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              so.client?.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || so.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleSave = () => {
        if(editingSO) {
             const total = editingSO.items.reduce((acc: number, item: any) => acc + (item.quantity * item.unit_price), 0);
             const updatedSO = { ...editingSO, total_amount: total };

             if(updatedSO.id === 'new') {
                 updatedSO.id = `so-${Date.now()}`;
                 if(!updatedSO.client && updatedSO.client_id) {
                     updatedSO.client = partners.find((p:any) => p.id === updatedSO.client_id);
                 }
                 onCreate(updatedSO);
             } else {
                 onUpdate(updatedSO);
             }
             setEditingSO(null);
        }
    }

    const handleNewSO = () => {
        setEditingSO({
            id: 'new',
            so_number: `BK-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
            status: SOStatus.BOOKING,
            order_date: new Date().toISOString().split('T')[0],
            items: [],
            client_id: '',
            currency: 'EUR',
            total_amount: 0
        });
    }

    const addLine = () => {
        setEditingSO({
          ...editingSO,
          items: [...(editingSO.items || []), { id: `tmp-so-${Date.now()}`, product_id: '', quantity: 1, unit_price: 0 }]
        });
      };
    
    const removeLine = (idx: number) => {
        const newItems = [...editingSO.items];
        newItems.splice(idx, 1);
        setEditingSO({ ...editingSO, items: newItems });
    };

    const updateLine = (idx: number, field: string, value: any) => {
        const newItems = [...editingSO.items];
        newItems[idx] = { ...newItems[idx], [field]: value };
        if (field === 'product_id') {
            const prod = products.find((p:any) => p.id === value);
            if (prod) {
                newItems[idx].unit_price = prod.suggested_retail_price || 0;
            }
        }
        setEditingSO({ ...editingSO, items: newItems });
    };

    const clients = partners.filter((p:any) => p.type === PartnerType.CLIENT);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex gap-2">
                <button 
                    onClick={() => downloadCSV(filtered, 'sales_orders')}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                    <Download size={16} />
                    {t('export_csv')}
                </button>
                </div>
                <button onClick={handleNewSO} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus size={18} />
                Create Booking
                </button>
            </div>

            <FilterBar 
                t={t} 
                onSearch={setSearchTerm} 
                onStatusFilter={setStatusFilter} 
                statusOptions={Object.values(SOStatus)}
            />

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                    <th className="p-4 font-semibold">{t('so_number')}</th>
                    <th className="p-4 font-semibold">{t('client')}</th>
                    <th className="p-4 font-semibold">{t('date')}</th>
                    <th className="p-4 font-semibold">{t('amount')}</th>
                    <th className="p-4 font-semibold">{t('status')}</th>
                    <th className="p-4 font-semibold">{t('actions')}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filtered.map((so: any) => (
                    <tr key={so.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-medium text-gray-900">{so.so_number}</td>
                        <td className="p-4 text-gray-700">{so.client?.name}</td>
                        <td className="p-4 text-gray-600 text-sm">{so.order_date}</td>
                        <td className="p-4 font-medium text-gray-900">{so.total_amount?.toLocaleString()} {so.currency}</td>
                        <td className="p-4"><StatusBadge status={so.status} type="SO" /></td>
                        <td className="p-4">
                            <div className="flex items-center gap-2">
                                <button onClick={() => setEditingSO({...so})} className="text-blue-600 hover:text-blue-800 p-1">
                                    <Edit2 size={16} />
                                </button>
                                {/* Quick Actions */}
                                {so.status === 'booking' && (
                                    <button className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100 hover:bg-indigo-100">
                                        {t('create_bol')}
                                    </button>
                                )}
                            </div>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>

            {/* Edit SO Modal */}
            {editingSO && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                        <h3 className="text-xl font-bold text-gray-800">
                             {editingSO.id === 'new' ? t('create_so') : `${t('edit_so')} - ${editingSO.so_number}`}
                        </h3>
                        <button onClick={() => setEditingSO(null)}><X size={24} className="text-gray-400 hover:text-gray-600"/></button>
                    </div>

                    <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                        {/* Header Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('so_number')}</label>
                                <input 
                                    className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50"
                                    value={editingSO.so_number}
                                    readOnly={editingSO.id !== 'new'}
                                    onChange={e => setEditingSO({...editingSO, so_number: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('client')}</label>
                                <select 
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                    value={editingSO.client_id}
                                    onChange={e => setEditingSO({...editingSO, client_id: e.target.value})}
                                >
                                    <option value="">{t('select_client')}</option>
                                    {clients.map((c:any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('date')}</label>
                                <input 
                                    type="date"
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                    value={editingSO.order_date}
                                    onChange={e => setEditingSO({...editingSO, order_date: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('status')}</label>
                                <select 
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                    value={editingSO.status}
                                    onChange={e => setEditingSO({...editingSO, status: e.target.value as SOStatus})}
                                >
                                {Object.values(SOStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('currency')}</label>
                                <input 
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                    value={editingSO.currency}
                                    onChange={e => setEditingSO({...editingSO, currency: e.target.value})}
                                />
                            </div>
                        </div>

                         {/* Items Table */}
                         <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-semibold text-gray-800">Items</h4>
                                <button onClick={addLine} className="text-sm flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium">
                                    <Plus size={16} /> {t('add_line')}
                                </button>
                            </div>
                            <table className="w-full text-left border border-gray-200 rounded-lg overflow-hidden">
                                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                    <tr>
                                        <th className="p-3">{t('product')}</th>
                                        <th className="p-3 w-24">{t('quantity')}</th>
                                        <th className="p-3 w-32">{t('unit_price')}</th>
                                        <th className="p-3 w-32 text-right">Subtotal</th>
                                        <th className="p-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {editingSO.items?.map((item: any, idx: number) => (
                                        <tr key={idx}>
                                            <td className="p-2">
                                                <select 
                                                    className="w-full p-1 border border-gray-300 rounded"
                                                    value={item.product_id}
                                                    onChange={e => updateLine(idx, 'product_id', e.target.value)}
                                                >
                                                    <option value="">{t('select_product')}</option>
                                                    {products.map((p:any) => <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>)}
                                                </select>
                                            </td>
                                            <td className="p-2">
                                                <input 
                                                    type="number" className="w-full p-1 border border-gray-300 rounded text-right"
                                                    value={item.quantity}
                                                    onChange={e => updateLine(idx, 'quantity', parseFloat(e.target.value))}
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input 
                                                    type="number" className="w-full p-1 border border-gray-300 rounded text-right"
                                                    value={item.unit_price}
                                                    onChange={e => updateLine(idx, 'unit_price', parseFloat(e.target.value))}
                                                />
                                            </td>
                                            <td className="p-2 text-right font-medium">
                                                {(item.quantity * item.unit_price).toLocaleString()}
                                            </td>
                                            <td className="p-2 text-center">
                                                <button onClick={() => removeLine(idx)} className="text-red-400 hover:text-red-600">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50 font-bold">
                                    <tr>
                                        <td colSpan={3} className="p-3 text-right">Total</td>
                                        <td className="p-3 text-right">
                                            {editingSO.items?.reduce((acc: number, i: any) => acc + (i.quantity * i.unit_price), 0).toLocaleString()}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
                        <button onClick={() => setEditingSO(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">{t('cancel')}</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{t('save')}</button>
                    </div>
                </div>
                </div>
            )}
        </div>
    )
}

// 6. FINANCE VIEW (Unchanged)
const FinanceView = ({ invoices, onUpdate, t }: { invoices: Invoice[], onUpdate: (inv: Invoice) => void, t: any }) => {
    // ... Same as before
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [editingInv, setEditingInv] = useState<Invoice | null>(null);

    // Basic Aging Logic
    const getAge = (dueDate: string) => {
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = Math.abs(today.getTime() - due.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        return diffDays;
    }

    const filtered = invoices.filter(inv => {
        const matchesSearch = inv.invoice_number.includes(searchTerm) || inv.client?.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleSave = () => {
        if(editingInv) {
            onUpdate(editingInv);
            setEditingInv(null);
        }
    }

    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800">Accounts Receivable Aging</h2>
                <button 
                    onClick={() => downloadCSV(filtered, 'ar_aging')}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                    <Download size={16} />
                    {t('export_csv')}
                </button>
            </div>

            <FilterBar 
                t={t} 
                onSearch={setSearchTerm} 
                onStatusFilter={setStatusFilter} 
                statusOptions={['unpaid', 'paid', 'partial']}
            />

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                    <th className="p-4 font-semibold">{t('invoice_no')}</th>
                    <th className="p-4 font-semibold">{t('client')}</th>
                    <th className="p-4 font-semibold">{t('due_date')}</th>
                    <th className="p-4 font-semibold">{t('age_days')}</th>
                    <th className="p-4 font-semibold">{t('balance')}</th>
                    <th className="p-4 font-semibold">{t('status')}</th>
                    <th className="p-4 font-semibold">{t('actions')}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filtered.map((inv) => {
                       const age = getAge(inv.due_date);
                       let ageColor = "text-gray-600";
                       if(age > 30) ageColor = "text-orange-600 font-bold";
                       if(age > 60) ageColor = "text-red-600 font-bold";

                       return (
                        <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-4 font-medium text-gray-900">{inv.invoice_number}</td>
                            <td className="p-4 text-gray-700">{inv.client?.name}</td>
                            <td className="p-4 text-gray-600 text-sm">{inv.due_date}</td>
                            <td className={`p-4 ${ageColor}`}>{age} days</td>
                            <td className="p-4 font-medium text-gray-900">${inv.balance.toLocaleString()}</td>
                            <td className="p-4"><StatusBadge status={inv.status} type="INV" /></td>
                            <td className="p-4">
                                <button onClick={() => setEditingInv(inv)} className="text-blue-600 hover:text-blue-800 p-1">
                                    <Edit2 size={16} />
                                </button>
                            </td>
                        </tr>
                       )
                    })}
                </tbody>
                </table>
            </div>

            {/* Edit Invoice Modal */}
            {editingInv && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                    <h3 className="text-lg font-bold mb-4">{t('edit_invoice')} - {editingInv.invoice_number}</h3>
                    <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('status')}</label>
                        <select 
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            value={editingInv.status}
                            onChange={e => setEditingInv({...editingInv, status: e.target.value as any})}
                        >
                            <option value="unpaid">Unpaid</option>
                            <option value="partial">Partial</option>
                            <option value="paid">Paid</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('balance')}</label>
                        <input 
                            type="number" 
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            value={editingInv.balance}
                            onChange={e => setEditingInv({...editingInv, balance: parseFloat(e.target.value)})}
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <button onClick={() => setEditingInv(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">{t('cancel')}</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{t('save')}</button>
                    </div>
                    </div>
                </div>
                </div>
            )}
        </div>
    )
}

// 7. TRACEABILITY VIEW (Unchanged)
const TraceabilityView = ({ t }: any) => {
    // ... Same as before
    const [searchId, setSearchId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if(!searchId) return;
    setLoading(true);
    const data = await dataService.getTraceability(searchId);
    setResult(data);
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('traceability')}</h2>
        <p className="text-gray-500 mb-6">Enter Internal Batch Number to view the complete chain of custody.</p>
        
        <div className="flex max-w-md mx-auto relative">
          <input 
            type="text" 
            placeholder="e.g., INT-25-001" 
            className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchId}
            onChange={e => setSearchId(e.target.value)}
          />
          <button 
            onClick={handleSearch}
            disabled={loading}
            className="absolute right-2 top-2 bg-blue-600 text-white p-1.5 rounded-md hover:bg-blue-700"
          >
            <Search size={20} />
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-400">Try: INT-25-001</div>
      </div>

      {result && (
        <div className="relative">
           {/* Timeline Line */}
           <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 -z-10"></div>
           {/* Steps - keeping existing structure just translating headers if needed or keeping as is */}
           <div className="space-y-8 pl-0">
             <div className="flex gap-6 items-start">
               <div className="w-16 h-16 rounded-full bg-blue-100 border-4 border-white shadow-sm flex items-center justify-center shrink-0 text-blue-600 z-10">
                 <Ship size={24} />
               </div>
               <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex-1">
                 <div className="flex justify-between mb-2">
                   <h4 className="font-bold text-gray-800">Supplier & Origin</h4>
                   <span className="text-xs bg-gray-100 px-2 py-1 rounded">{result.po.order_date}</span>
                 </div>
                 <div className="text-sm text-gray-600 grid grid-cols-2 gap-4">
                   <div><span className="block text-gray-400 text-xs">Partner</span>{result.supplier.name}</div>
                   <div><span className="block text-gray-400 text-xs">Lot</span>{result.batch.supplier_batch_number}</div>
                 </div>
               </div>
             </div>
             {/* Warehouse Step */}
             <div className="flex gap-6 items-start">
               <div className="w-16 h-16 rounded-full bg-indigo-100 border-4 border-white shadow-sm flex items-center justify-center shrink-0 text-indigo-600 z-10">
                 <Package size={24} />
               </div>
               <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex-1">
                 <h4 className="font-bold text-gray-800 mb-2">Warehouse</h4>
                 <div className="text-sm text-gray-600 grid grid-cols-2 gap-4">
                    <div><span className="block text-gray-400 text-xs">Internal ID</span>{result.batch.internal_batch_number}</div>
                    <div><span className="block text-gray-400 text-xs">Zone</span>{result.batch.location_zone}</div>
                 </div>
               </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

// 8. USER GUIDE VIEW (Refactored for Details)
const UserGuideView = ({ lang, t }: { lang: Language, t: any }) => {
  const [activeSection, setActiveSection] = useState('intro');

  const content = {
      intro: {
          title: t('guide_intro'),
          icon: Info,
          body: lang === 'en' ? (
              <div className="space-y-4 text-gray-600">
                  <p>Welcome to <strong>TradeFlow ERP</strong>, your comprehensive solution for managing international trade operations. This system is designed to streamline the flow of goods, money, and information from the initial purchase order to the final sale.</p>
                  <p><strong>Key Features:</strong></p>
                  <ul className="list-disc pl-5 space-y-1">
                      <li><strong>End-to-End Traceability:</strong> Track products from supplier lot to customer invoice using internal batch numbers.</li>
                      <li><strong>Landed Cost Calculation:</strong> Automatically estimate costs including FOB price, freight, and duties.</li>
                      <li><strong>Multi-Currency:</strong> Handle suppliers in EUR/USD and local sales in CAD/USD.</li>
                  </ul>
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                      <h4 className="font-bold text-blue-900">Database Status</h4>
                      <p className="text-sm text-blue-800 mt-1">
                          The system is currently running in <strong>{isSupabaseConfigured() ? 'Live Mode (Supabase)' : 'Demo Mode (Local Mock Data)'}</strong>. 
                          In Demo mode, changes are temporary and will reset upon page reload.
                      </p>
                  </div>
              </div>
          ) : (
              <div className="space-y-4 text-gray-600">
                  <p>Bienvenue sur <strong>TradeFlow ERP</strong>, votre solution complète pour gérer les opérations de commerce international. Ce système est conçu pour fluidifier le flux de marchandises et d'informations, de la commande d'achat à la vente finale.</p>
                  <p><strong>Fonctionnalités Clés :</strong></p>
                  <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Traçabilité de bout en bout :</strong> Suivez les produits du lot fournisseur jusqu'à la facture client.</li>
                      <li><strong>Calcul du Coût de Revient :</strong> Estimez automatiquement les coûts incluant le prix FOB, le fret et les douanes.</li>
                      <li><strong>Multi-Devises :</strong> Gérez les fournisseurs en EUR/USD et les ventes locales en CAD/USD.</li>
                  </ul>
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                      <h4 className="font-bold text-blue-900">État de la Base de Données</h4>
                      <p className="text-sm text-blue-800 mt-1">
                          Le système fonctionne actuellement en <strong>{isSupabaseConfigured() ? 'Mode Live (Supabase)' : 'Mode Démo (Données Locales)'}</strong>. 
                          En mode Démo, les modifications sont temporaires et seront réinitialisées au rechargement de la page.
                      </p>
                  </div>
              </div>
          )
      },
      sourcing: {
          title: t('guide_sourcing'),
          icon: ShoppingCart,
          body: lang === 'en' ? (
              <div className="space-y-4 text-gray-600">
                  <h3 className="text-lg font-bold text-gray-800">Creating Purchase Orders (PO)</h3>
                  <p>Navigate to the <strong>Purchasing</strong> tab to manage your supply chain. This module allows you to raise new orders with international suppliers.</p>
                  <ol className="list-decimal pl-5 space-y-2">
                      <li>Click <strong>+ New Order</strong>.</li>
                      <li>Select a <strong>Supplier</strong> (e.g., Casa Folino). Ensure the supplier is created in Settings first.</li>
                      <li>Add items by selecting products. The system will auto-populate the default Wholesale Price.</li>
                      <li>Save the PO. It will start in <code>DRAFT</code> status.</li>
                  </ol>
                  <h3 className="text-lg font-bold text-gray-800 mt-6">Workflow Statuses</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="p-2 border rounded bg-gray-50"><strong>DRAFT:</strong> Initial creation, not sent to supplier.</div>
                      <div className="p-2 border rounded bg-blue-50"><strong>ORDERED:</strong> Confirmed with supplier.</div>
                      <div className="p-2 border rounded bg-indigo-50"><strong>IN_TRANSIT:</strong> Goods have left the origin port.</div>
                  </div>
              </div>
          ) : (
              <div className="space-y-4 text-gray-600">
                   <h3 className="text-lg font-bold text-gray-800">Création de Commandes d'Achat (PO)</h3>
                  <p>Naviguez vers l'onglet <strong>Achats</strong> pour gérer votre chaîne d'approvisionnement. Ce module vous permet de créer de nouvelles commandes.</p>
                  <ol className="list-decimal pl-5 space-y-2">
                      <li>Cliquez sur <strong>+ Nouvelle Commande</strong>.</li>
                      <li>Sélectionnez un <strong>Fournisseur</strong>. Assurez-vous qu'il existe dans les Paramètres.</li>
                      <li>Ajoutez des lignes produits. Le système remplira automatiquement le Prix de Gros.</li>
                      <li>Enregistrez le PO. Il débutera au statut <code>BROUILLON</code>.</li>
                  </ol>
              </div>
          )
      },
      logistics: {
          title: t('guide_logistics'),
          icon: Truck,
          body: lang === 'en' ? (
              <div className="space-y-4 text-gray-600">
                  <h3 className="text-lg font-bold text-gray-800">Receiving Goods</h3>
                  <p>Use the <strong>Receiving</strong> tab when goods arrive at the warehouse. This step is critical for inventory accuracy and traceability.</p>
                  <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Scanning:</strong> Use the "Scan UPC" feature to validate incoming items using your device's camera.</li>
                      <li><strong>Batch Creation:</strong> Upon receipt, the system converts PO lines into <strong>Batches</strong>. You will be assigned an Internal Batch Number (e.g., INT-25-001).</li>
                  </ul>
                  <h3 className="text-lg font-bold text-gray-800 mt-6">Inventory Management</h3>
                  <p>The <strong>Stock Status</strong> view shows a consolidated view of your inventory.</p>
                  <div className="p-3 bg-gray-100 rounded text-sm font-mono border border-gray-300">
                      Available = On Hand (Physical) - Committed (Sales Orders)
                  </div>
              </div>
          ) : (
              <div className="space-y-4 text-gray-600">
                  <h3 className="text-lg font-bold text-gray-800">Réception des Marchandises</h3>
                  <p>Utilisez l'onglet <strong>Réception</strong> lorsque les marchandises arrivent à l'entrepôt. Cette étape est critique pour la précision des stocks.</p>
                  <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Scannage :</strong> Utilisez la fonction "Scanner UPC" pour valider les articles entrants via la caméra.</li>
                      <li><strong>Création de Lots :</strong> À la réception, le système convertit les lignes de PO en <strong>Lots (Batches)</strong>. Un numéro de lot interne sera généré (ex: INT-25-001).</li>
                  </ul>
                  <h3 className="text-lg font-bold text-gray-800 mt-6">Gestion des Stocks</h3>
                  <p>La vue <strong>État du Stock</strong> montre une vue consolidée.</p>
                  <div className="p-3 bg-gray-100 rounded text-sm font-mono border border-gray-300">
                      Disponible = En Stock (Physique) - Réservé (Commandes Clients)
                  </div>
              </div>
          )
      },
      sales: {
          title: t('guide_sales'),
          icon: TrendingUp,
          body: lang === 'en' ? (
              <div className="space-y-4 text-gray-600">
                   <h3 className="text-lg font-bold text-gray-800">Sales Orders (Bookings)</h3>
                   <p>The sales workflow starts with a Booking.</p>
                   <ol className="list-decimal pl-5 space-y-2">
                      <li>Create a Booking for a client. Prices default to the Product's SRP (Suggested Retail Price).</li>
                      <li><strong>Status Flow:</strong> Booking -> Confirmed -> BOL Generated -> Invoiced.</li>
                   </ol>
                   <p className="mt-4"><strong>Bill of Lading (BOL):</strong> When an order is ready to ship, click "Generate BOL". This deducts inventory from "Available" to "Consumed" (conceptually) upon shipping.</p>
              </div>
          ) : (
              <div className="space-y-4 text-gray-600">
                   <h3 className="text-lg font-bold text-gray-800">Commandes de Vente</h3>
                   <p>Le flux de vente commence par une Réservation (Booking).</p>
                   <ol className="list-decimal pl-5 space-y-2">
                      <li>Créez une réservation pour un client. Les prix sont par défaut le Prix de Détail Suggéré (SRP).</li>
                      <li><strong>Flux de Statut :</strong> Booking -> Confirmé -> BOL Généré -> Facturé.</li>
                   </ol>
                   <p className="mt-4"><strong>Bill of Lading (BOL):</strong> Quand une commande est prête, cliquez sur "Générer BOL".</p>
              </div>
          )
      },
      finance: {
          title: t('guide_finance'),
          icon: FileText,
          body: lang === 'en' ? (
              <div className="space-y-4 text-gray-600">
                  <h3 className="text-lg font-bold text-gray-800">Accounts Receivable (AR)</h3>
                  <p>Track unpaid invoices in the Finance module.</p>
                  <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Aging:</strong> Invoices older than 30 days are highlighted in orange, and >60 days in red.</li>
                      <li><strong>Payments:</strong> Mark invoices as "Paid" to clear the balance.</li>
                  </ul>
              </div>
          ) : (
              <div className="space-y-4 text-gray-600">
                  <h3 className="text-lg font-bold text-gray-800">Comptes Clients (AR)</h3>
                  <p>Suivez les factures impayées dans le module Finance.</p>
                  <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Retards :</strong> Les factures de plus de 30 jours sont en orange, >60 jours en rouge.</li>
                      <li><strong>Paiements :</strong> Marquez les factures comme "Payées" pour solder la balance.</li>
                  </ul>
              </div>
          )
      }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-6">
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-64 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-shrink-0">
            <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-gray-700">
                {t('user_guide')}
            </div>
            <nav className="p-2 space-y-1">
                {Object.entries(content).map(([key, section]: any) => {
                    const Icon = section.icon;
                    return (
                        <button
                            key={key}
                            onClick={() => setActiveSection(key)}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                activeSection === key 
                                ? 'bg-blue-50 text-blue-700' 
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <Icon size={16} />
                            {section.title}
                        </button>
                    )
                })}
            </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm p-8 overflow-y-auto custom-scrollbar">
            <div className="max-w-3xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                        {React.createElement(content[activeSection as keyof typeof content].icon, { size: 24 })}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        {content[activeSection as keyof typeof content].title}
                    </h2>
                </div>
                
                <div className="prose prose-blue max-w-none">
                    {content[activeSection as keyof typeof content].body}
                </div>
            </div>
        </div>
    </div>
  );
};

// 9. SETTINGS VIEW
const SettingsView = ({ products, partners, userProfile, setUserProfile, onUpdateProduct, onUpdatePartner, onBulkImport, onCreateProduct, onCreatePartner, t }: any) => {
  const [activeTab, setActiveTab] = useState<'products' | 'suppliers' | 'clients'>('products');
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredPartners = partners.filter((p:any) => 
    activeTab === 'suppliers' ? p.type === PartnerType.SUPPLIER : p.type === PartnerType.CLIENT
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = utils.sheet_to_json(ws);
        const type = activeTab === 'products' ? 'products' : 'partners';
        onBulkImport(type, data);
      } catch (error) {
        console.error("Error reading excel", error);
        alert(t('upload_error'));
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleCreate = () => {
      if(activeTab === 'products') {
          setEditingItem({
              id: 'new',
              sku: '',
              name: '',
              brand: '',
              category: '',
              unit: 'colis',
              unit_weight_kg: 0,
              items_per_case: 1,
              origin: '',
              hs_code: '',
              conservation: 'sec',
              wholesale_price: 0,
              suggested_retail_price: 0,
              min_stock_alert: 5
          });
      } else {
          setEditingItem({
              id: 'new',
              name: '',
              type: activeTab === 'suppliers' ? PartnerType.SUPPLIER : PartnerType.CLIENT,
              country: '',
              currency: 'EUR',
              address: '',
              city: ''
          });
      }
  }

  const handleSave = () => {
      if(editingItem) {
          if (activeTab === 'products') {
              if (editingItem.id === 'new') {
                  const newItem = { ...editingItem, id: `prod-${Date.now()}` };
                  onCreateProduct(newItem);
              } else {
                  onUpdateProduct(editingItem);
              }
          } else {
               if (editingItem.id === 'new') {
                  const newItem = { ...editingItem, id: `part-${Date.now()}` };
                  onCreatePartner(newItem);
              } else {
                  onUpdatePartner(editingItem);
              }
          }
          setEditingItem(null);
      }
  }

  return (
    <div className="space-y-8">
       {/* User Profile Section */}
       <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start gap-6">
           <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
               <User size={32} />
           </div>
           <div className="flex-1">
               <h3 className="text-lg font-bold text-gray-800 mb-4">{t('settings_profile')}</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                   <div>
                       <label className="block text-sm font-medium text-gray-500 mb-1">{t('full_name')}</label>
                       <input 
                           className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                           value={userProfile.name}
                           onChange={(e) => setUserProfile({...userProfile, name: e.target.value})}
                           placeholder="Enter your name"
                       />
                   </div>
                   <div>
                       <label className="block text-sm font-medium text-gray-500 mb-1">{t('role')}</label>
                       <div className="w-full p-2 border border-gray-200 bg-gray-50 rounded-lg text-sm text-gray-600">
                           Administrator
                       </div>
                   </div>
               </div>
           </div>
       </div>

       {/* Database Management */}
       <div className="space-y-4">
           <h3 className="text-lg font-bold text-gray-800 px-1">{t('settings_db')}</h3>
           
           {/* Tabs */}
           <div className="flex space-x-4 border-b border-gray-200">
              <button 
                 className={`pb-2 px-4 font-medium text-sm transition-colors ${activeTab === 'products' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                 onClick={() => setActiveTab('products')}
              >
                 {t('product_management')}
              </button>
              <button 
                 className={`pb-2 px-4 font-medium text-sm transition-colors ${activeTab === 'suppliers' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                 onClick={() => setActiveTab('suppliers')}
              >
                 {t('supplier_management')}
              </button>
              <button 
                 className={`pb-2 px-4 font-medium text-sm transition-colors ${activeTab === 'clients' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                 onClick={() => setActiveTab('clients')}
              >
                 {t('client_management')}
              </button>
           </div>

           {/* Actions Bar */}
           <div className="flex justify-end gap-2 bg-white p-2 rounded-lg border border-gray-200">
                 <input 
                   type="file" 
                   accept=".xlsx, .xls" 
                   className="hidden" 
                   ref={fileInputRef} 
                   onChange={handleFileUpload}
                 />
                 <button 
                   onClick={() => fileInputRef.current?.click()}
                   className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                   <Upload size={16} />
                   {t('import_excel')}
                 </button>
                 <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                   <Plus size={16} />
                   {t('add_new')}
                 </button>
           </div>

           {/* Content Table */}
           <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              {activeTab === 'products' ? (
                 <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold border-b border-gray-200">
                       <tr>
                          <th className="p-4">SKU</th>
                          <th className="p-4">Name</th>
                          <th className="p-4">Brand</th>
                          <th className="p-4">Category</th>
                          <th className="p-4 text-right">Price (W)</th>
                          <th className="p-4 text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                       {products.map((p: Product) => (
                          <tr key={p.id} className="hover:bg-gray-50">
                             <td className="p-4 font-medium text-gray-900">{p.sku}</td>
                             <td className="p-4 text-gray-600 text-sm max-w-xs truncate">{p.name}</td>
                             <td className="p-4 text-gray-600">{p.brand}</td>
                             <td className="p-4 text-gray-600">
                               <span className="px-2 py-1 bg-gray-100 rounded text-xs">{p.category}</span>
                             </td>
                             <td className="p-4 text-right font-mono text-sm">{p.wholesale_price?.toFixed(2)}</td>
                             <td className="p-4 text-right">
                               <button onClick={() => setEditingItem(p)} className="text-blue-600 hover:text-blue-800 p-1"><Edit2 size={16}/></button>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              ) : (
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold border-b border-gray-200">
                       <tr>
                          <th className="p-4">Name</th>
                          <th className="p-4">Country</th>
                          <th className="p-4">Currency</th>
                          <th className="p-4 text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                       {filteredPartners.map((p: Partner) => (
                          <tr key={p.id} className="hover:bg-gray-50">
                             <td className="p-4 font-medium text-gray-900">{p.name}</td>
                             <td className="p-4 text-gray-600 flex items-center gap-2">
                               <Globe size={14} className="text-gray-400"/>
                               {p.country}
                             </td>
                             <td className="p-4 text-gray-600 font-mono text-sm">{p.currency}</td>
                             <td className="p-4 text-right">
                               <button onClick={() => setEditingItem(p)} className="text-blue-600 hover:text-blue-800 p-1"><Edit2 size={16}/></button>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              )}
           </div>
       </div>

       {/* Detailed Editing Modal (Card Style) */}
       {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
             <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                 <h3 className="text-xl font-bold text-gray-800">
                     {editingItem.id === 'new' 
                       ? t('add_new') 
                       : t('edit')} - {activeTab === 'products' ? editingItem.sku : editingItem.name}
                 </h3>
                 <button onClick={() => setEditingItem(null)}><X size={24} className="text-gray-400 hover:text-gray-600"/></button>
             </div>
             
             <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-slate-50">
                 {activeTab === 'products' ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* General Info Card */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-center gap-2 mb-4 text-blue-600">
                                <Package size={20} />
                                <h4 className="font-bold uppercase text-xs tracking-wider">{t('general_info')}</h4>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">SKU</label>
                                    <input className="w-full p-2 border border-gray-300 rounded text-sm" value={editingItem.sku} onChange={e => setEditingItem({...editingItem, sku: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('product')}</label>
                                    <input className="w-full p-2 border border-gray-300 rounded text-sm" value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('brand')}</label>
                                        <input className="w-full p-2 border border-gray-300 rounded text-sm" value={editingItem.brand} onChange={e => setEditingItem({...editingItem, brand: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('category')}</label>
                                        <input className="w-full p-2 border border-gray-300 rounded text-sm" value={editingItem.category} onChange={e => setEditingItem({...editingItem, category: e.target.value})} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Logistics Card */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                             <div className="flex items-center gap-2 mb-4 text-indigo-600">
                                <Truck size={20} />
                                <h4 className="font-bold uppercase text-xs tracking-wider">{t('logistics')}</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('unit')}</label>
                                    <select className="w-full p-2 border border-gray-300 rounded text-sm" value={editingItem.unit} onChange={e => setEditingItem({...editingItem, unit: e.target.value})}>
                                        <option value="colis">Colis</option>
                                        <option value="unite">Unit</option>
                                        <option value="palette">Palette</option>
                                        <option value="kg">Kg</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('items_per_case')}</label>
                                    <input type="number" className="w-full p-2 border border-gray-300 rounded text-sm" value={editingItem.items_per_case} onChange={e => setEditingItem({...editingItem, items_per_case: parseFloat(e.target.value)})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('weight')}</label>
                                    <input type="number" className="w-full p-2 border border-gray-300 rounded text-sm" value={editingItem.unit_weight_kg} onChange={e => setEditingItem({...editingItem, unit_weight_kg: parseFloat(e.target.value)})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('origin')}</label>
                                    <input className="w-full p-2 border border-gray-300 rounded text-sm" value={editingItem.origin} onChange={e => setEditingItem({...editingItem, origin: e.target.value})} />
                                </div>
                            </div>
                        </div>

                        {/* Pricing Card */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                             <div className="flex items-center gap-2 mb-4 text-emerald-600">
                                <DollarSign size={20} />
                                <h4 className="font-bold uppercase text-xs tracking-wider">{t('pricing')}</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Wholesale</label>
                                    <input type="number" className="w-full p-2 border border-gray-300 rounded text-sm" value={editingItem.wholesale_price} onChange={e => setEditingItem({...editingItem, wholesale_price: parseFloat(e.target.value)})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Retail (SRP)</label>
                                    <input type="number" className="w-full p-2 border border-gray-300 rounded text-sm" value={editingItem.suggested_retail_price} onChange={e => setEditingItem({...editingItem, suggested_retail_price: parseFloat(e.target.value)})} />
                                </div>
                            </div>
                        </div>

                         {/* Stock Card */}
                         <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                             <div className="flex items-center gap-2 mb-4 text-amber-600">
                                <AlertTriangle size={20} />
                                <h4 className="font-bold uppercase text-xs tracking-wider">Inventory Control</h4>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('min_stock')}</label>
                                <input type="number" className="w-full p-2 border border-gray-300 rounded text-sm" value={editingItem.min_stock_alert} onChange={e => setEditingItem({...editingItem, min_stock_alert: parseFloat(e.target.value)})} />
                            </div>
                        </div>
                     </div>
                 ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Identity Card */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-center gap-2 mb-4 text-blue-600">
                                <Building size={20} />
                                <h4 className="font-bold uppercase text-xs tracking-wider">Identity</h4>
                            </div>
                             <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
                                    <input className="w-full p-2 border border-gray-300 rounded text-sm" value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                                    <div className="w-full p-2 border border-gray-200 bg-gray-50 rounded text-sm text-gray-600">
                                        {activeTab === 'suppliers' ? 'Supplier' : 'Client'}
                                    </div>
                                </div>
                             </div>
                        </div>

                        {/* Address Card */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                             <div className="flex items-center gap-2 mb-4 text-indigo-600">
                                <MapPin size={20} />
                                <h4 className="font-bold uppercase text-xs tracking-wider">{t('address_contact')}</h4>
                            </div>
                            <div className="space-y-4">
                                 <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Address</label>
                                    <input className="w-full p-2 border border-gray-300 rounded text-sm" value={editingItem.address || ''} onChange={e => setEditingItem({...editingItem, address: e.target.value})} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">City</label>
                                        <input className="w-full p-2 border border-gray-300 rounded text-sm" value={editingItem.city || ''} onChange={e => setEditingItem({...editingItem, city: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Country</label>
                                        <input className="w-full p-2 border border-gray-300 rounded text-sm" value={editingItem.country} onChange={e => setEditingItem({...editingItem, country: e.target.value})} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Business Card */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                             <div className="flex items-center gap-2 mb-4 text-emerald-600">
                                <DollarSign size={20} />
                                <h4 className="font-bold uppercase text-xs tracking-wider">{t('business_info')}</h4>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('currency')}</label>
                                <input className="w-full p-2 border border-gray-300 rounded text-sm" value={editingItem.currency} onChange={e => setEditingItem({...editingItem, currency: e.target.value})} />
                            </div>
                        </div>
                     </div>
                 )}
             </div>

             <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
                <button onClick={() => setEditingItem(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">{t('cancel')}</button>
                <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{t('save')}</button>
            </div>
          </div>
        </div>
       )}
    </div>
  );
};

// --- Main App Shell ---

const App = () => {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [lang, setLang] = useState<Language>('en');
  const t = useTranslation(lang);
  
  // User Profile State
  const [userProfile, setUserProfile] = useState({ name: 'John Doe', role: 'admin' });

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    products: Product[];
    partners: Partner[]; 
    batches: Batch[];
    pos: PurchaseOrder[];
    sales: SalesOrder[];
    invoices: Invoice[];
  }>({ products: [], partners: [], batches: [], pos: [], sales: [], invoices: [] });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [products, partners, batches, pos, sales, invoices] = await Promise.all([
          dataService.getProducts(),
          dataService.getPartners(),
          dataService.getBatches(),
          dataService.getPurchaseOrders(),
          dataService.getSalesOrders(),
          dataService.getInvoices()
        ]);
        setData({ products, partners, batches, pos, sales, invoices });
      } catch (e) {
        console.error("Failed to load data", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Update Handlers for Data Editing
  const handleUpdateProduct = (updatedProduct: Product) => {
    setData(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === updatedProduct.id ? updatedProduct : p)
    }));
  };

  const handleCreateProduct = (newProduct: Product) => {
      setData(prev => ({
          ...prev,
          products: [...prev.products, newProduct]
      }));
  }

  const handleUpdatePartner = (updatedPartner: Partner) => {
    setData(prev => ({
      ...prev,
      partners: prev.partners.map(p => p.id === updatedPartner.id ? updatedPartner : p)
    }));
  };

  const handleCreatePartner = (newPartner: Partner) => {
      setData(prev => ({
          ...prev,
          partners: [...prev.partners, newPartner]
      }));
  }

  const handleUpdatePO = (updatedPO: PurchaseOrder) => {
    setData(prev => ({
        ...prev,
        pos: prev.pos.map(po => po.id === updatedPO.id ? updatedPO : po)
    }));
  }

  const handleCreatePO = (newPO: PurchaseOrder) => {
      setData(prev => ({
          ...prev,
          pos: [newPO, ...prev.pos]
      }));
  }

  const handleUpdateSO = (updatedSO: SalesOrder) => {
    setData(prev => ({
        ...prev,
        sales: prev.sales.map(s => s.id === updatedSO.id ? updatedSO : s)
    }));
  }

  const handleCreateSO = (newSO: SalesOrder) => {
      setData(prev => ({
          ...prev,
          sales: [newSO, ...prev.sales]
      }));
  }

  const handleUpdateInvoice = (updatedInv: Invoice) => {
    setData(prev => ({
        ...prev,
        invoices: prev.invoices.map(i => i.id === updatedInv.id ? updatedInv : i)
    }));
  }

  const handleBulkImport = (type: 'products' | 'partners', importedData: any[]) => {
    if (type === 'products') {
      const newProducts = importedData.map((row: any, idx) => ({
        id: `imported-p-${Date.now()}-${idx}`,
        sku: row.sku || row.SKU || `SKU-${idx}`,
        name: row.name || row.Name || 'Unknown Product',
        category: row.category || 'General',
        unit: 'colis',
        unit_weight_kg: row.weight || 1,
        conservation: 'sec',
        min_stock_alert: 10,
        wholesale_price: parseFloat(row.wholesale) || 0,
        suggested_retail_price: parseFloat(row.retail) || 0,
        ...row // Spread rest for flexibility
      })) as Product[];
      
      setData(prev => ({
        ...prev,
        products: [...prev.products, ...newProducts]
      }));
      alert(t('upload_success'));
    } else {
      const newPartners = importedData.map((row: any, idx) => ({
        id: `imported-partner-${Date.now()}-${idx}`,
        name: row.name || row.Name || 'Unknown Partner',
        type: row.type?.toLowerCase().includes('client') ? PartnerType.CLIENT : PartnerType.SUPPLIER,
        country: row.country || 'Unknown',
        currency: row.currency || 'USD',
        ...row
      })) as Partner[];
      
      setData(prev => ({
        ...prev,
        partners: [...prev.partners, ...newPartners]
      }));
      alert(t('upload_success'));
    }
  };

  // Derived State
  const stockValue = data.batches.reduce((acc, b) => acc + (b.quantity_current * b.landed_cost_unit), 0);
  const pendingPO = data.pos.filter(p => p.status === 'in_transit' || p.status === 'ordered' || p.status === 'partial').length;
  const arAging = data.invoices.reduce((acc, inv) => acc + inv.balance, 0);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    switch (currentTab) {
      case 'dashboard':
        return <DashboardView stockValue={stockValue} pendingPO={pendingPO} arAging={arAging} t={t} />;
      case 'sourcing':
        return (
            <PurchasingView 
                pos={data.pos} 
                products={data.products}
                partners={data.partners}
                onUpdate={handleUpdatePO} 
                onCreate={handleCreatePO}
                t={t} 
            />
        );
      case 'receiving':
        return <ReceivingView pos={data.pos} t={t} />;
      case 'inventory':
        return <InventoryView products={data.products} batches={data.batches} pos={data.pos} sales={data.sales} onUpdateProduct={handleUpdateProduct} t={t} />;
      case 'sales':
        return (
            <SalesView 
                sales={data.sales} 
                products={data.products}
                partners={data.partners}
                onUpdate={handleUpdateSO} 
                onCreate={handleCreateSO}
                t={t} 
            />
        );
      case 'finance':
        return <FinanceView invoices={data.invoices} onUpdate={handleUpdateInvoice} t={t} />;
      case 'traceability':
        return <TraceabilityView t={t} />;
      case 'user_guide':
        return <UserGuideView lang={lang} t={t} />;
      case 'settings':
        return (
          <SettingsView 
            products={data.products} 
            partners={data.partners} 
            userProfile={userProfile}
            setUserProfile={setUserProfile}
            onUpdateProduct={handleUpdateProduct} 
            onCreateProduct={handleCreateProduct}
            onUpdatePartner={handleUpdatePartner} 
            onCreatePartner={handleCreatePartner}
            onBulkImport={handleBulkImport}
            t={t} 
          />
        );
      default:
        return <div>Not found</div>;
    }
  };

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar currentTab={currentTab} onTabChange={setCurrentTab} t={t} />
      
      <main className="flex-1 ml-64">
        <Header title={t(currentTab as any)} lang={lang} setLang={setLang} />
        
        <div className="p-8 max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;