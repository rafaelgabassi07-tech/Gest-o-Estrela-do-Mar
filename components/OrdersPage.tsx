
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Order, OrderStatus, PaymentMethod } from '../types';
import { formatCurrency } from '../utils';
import Modal from './Modal';
import OrderForm from './OrderForm';
import { generateId } from '../utils';

interface OrdersPageProps {
  orders: Order[];
  onAddOrder: (order: Order) => void;
  onUpdateOrder: (order: Order) => void;
  onCloseOrder: (order: Order, paymentMethod: PaymentMethod) => void;
  onDeleteOrder: (id: string) => void;
}

const OrdersPage: React.FC<OrdersPageProps> = ({ orders, onAddOrder, onUpdateOrder, onCloseOrder, onDeleteOrder }) => {
  const [activeTab, setActiveTab] = useState<OrderStatus>('open');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  
  // Timer State to force re-render every minute for duration updates
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredOrders = orders
    .filter(o => o.status === activeTab)
    .sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());

  // Helper to calculate duration
  const getDuration = (start: string) => {
    const diff = new Date().getTime() - new Date(start).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes} min`;
  };

  const isLongWait = (start: string) => {
    const diff = new Date().getTime() - new Date(start).getTime();
    return diff > 2 * 60 * 60 * 1000; // 2 hours
  };

  const handleOpenNew = (tableName?: string) => {
    setEditingOrder(tableName ? { 
        id: generateId(), 
        tableOrName: tableName, 
        items: [], 
        status: 'open', 
        openedAt: new Date().toISOString(), 
        total: 0 
    } : null);
    setIsModalOpen(true);
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setIsModalOpen(true);
  };

  const handleSaveFromForm = (order: Order) => {
    if (editingOrder && orders.find(o => o.id === editingOrder.id)) {
      onUpdateOrder(order);
    } else {
      onAddOrder(order);
    }
    setIsModalOpen(false);
  };

  const handleCloseFromForm = (order: Order, paymentMethod: PaymentMethod) => {
    // Pass the full order object up
    onCloseOrder(order, paymentMethod);
    setIsModalOpen(false);
  };

  // Generate Table Map Slots (1-20)
  const tables = Array.from({ length: 20 }, (_, i) => {
      const num = i + 1;
      const name = `Mesa ${num}`;
      // Find open order for this table (loose match for "Mesa X" or just "X")
      const order = orders.find(o => 
          o.status === 'open' && 
          (o.tableOrName.toLowerCase() === name.toLowerCase() || o.tableOrName === String(num))
      );
      return { num, name, order };
  });

  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-0 relative">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/80 dark:bg-slate-800/80 p-3 rounded-3xl border border-white/40 dark:border-slate-700 backdrop-blur-md shadow-soft sticky top-20 z-30 transition-all">
        <div className="flex gap-4 w-full md:w-auto">
            <div className="flex gap-1 bg-gray-200 dark:bg-slate-900 p-1.5 rounded-2xl flex-1 md:flex-none">
                <button onClick={() => setActiveTab('open')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'open' ? 'bg-white dark:bg-slate-700 text-rose-500 shadow-sm scale-105' : 'text-gray-500 hover:text-gray-700'}`}>Abertas</button>
                <button onClick={() => setActiveTab('closed')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'closed' ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm scale-105' : 'text-gray-500 hover:text-gray-700'}`}>Fechadas</button>
            </div>
            
            {activeTab === 'open' && (
                <div className="flex gap-1 bg-gray-200 dark:bg-slate-900 p-1.5 rounded-2xl">
                    <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-gray-800 dark:text-white shadow-sm' : 'text-gray-500'}`} title="Lista">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M2.625 6.75a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875 0A.75.75 0 018.25 6h12a.75.75 0 010 1.5h-12a.75.75 0 01-.75-.75zM2.625 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zM7.5 12a.75.75 0 01.75-.75h12a.75.75 0 010 1.5h-12A.75.75 0 017.5 12zm-4.875 5.25a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875 0a.75.75 0 01.75-.75h12a.75.75 0 010 1.5h-12a.75.75 0 01-.75-.75z" clipRule="evenodd" /></svg>
                    </button>
                    <button onClick={() => setViewMode('map')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'map' ? 'bg-white dark:bg-slate-700 text-gray-800 dark:text-white shadow-sm' : 'text-gray-500'}`} title="Mapa de Mesas">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M3 6a3 3 0 013-3h2.25a3 3 0 013 3v2.25a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm9.75 0a3 3 0 013-3H18a3 3 0 013 3v2.25a3 3 0 01-3 3h-2.25a3 3 0 01-3-3V6zM3 15.75a3 3 0 013-3h2.25a3 3 0 013 3V18a3 3 0 01-3 3H6a3 3 0 01-3-3v-2.25zm9.75 0a3 3 0 013-3H18a3 3 0 013 3V18a3 3 0 01-3 3h-2.25a3 3 0 01-3-3v-2.25z" clipRule="evenodd" /></svg>
                    </button>
                </div>
            )}
        </div>

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleOpenNew()} className="w-full md:w-auto bg-rose-500 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-glow-rose flex items-center justify-center gap-2 hover:bg-rose-600 transition-colors">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
           Nova Comanda
        </motion.button>
      </div>

      {/* Content */}
      {viewMode === 'map' && activeTab === 'open' ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 md:gap-6 p-2">
            {tables.map(table => (
                <motion.div 
                    key={table.num}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => table.order ? handleEdit(table.order) : handleOpenNew(table.name)}
                    className={`aspect-square rounded-[2rem] flex flex-col items-center justify-center cursor-pointer relative overflow-hidden transition-all duration-300 shadow-sm border-2 ${table.order ? (isLongWait(table.order.openedAt) ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700' : 'bg-rose-100 dark:bg-rose-900/40 border-rose-300 dark:border-rose-700') : 'bg-white dark:bg-slate-800/80 border-dashed border-gray-300 dark:border-slate-600 hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20'}`}
                >
                    {/* Visual "Plate" circle in background */}
                    <div className={`absolute inset-0 m-auto w-16 h-16 rounded-full opacity-20 ${table.order ? 'bg-white' : 'bg-gray-200 dark:bg-slate-600'}`}></div>

                    <span className={`text-xl font-black relative z-10 ${table.order ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>{table.num}</span>
                    
                    {table.order ? (
                        <>
                            <div className="relative z-10 flex flex-col items-center mt-1">
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-200 bg-white/60 dark:bg-black/20 px-2 py-0.5 rounded-lg backdrop-blur-sm">{formatCurrency(table.order.total)}</span>
                                <span className={`text-[9px] font-black uppercase mt-1 px-1.5 rounded ${isLongWait(table.order.openedAt) ? 'bg-amber-500 text-white' : 'text-gray-500'}`}>{getDuration(table.order.openedAt)}</span>
                            </div>
                            
                            {/* Corner Status Dot */}
                            <div className="absolute top-3 right-3 flex gap-1">
                                <span className={`w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-800 ${isLongWait(table.order.openedAt) ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`}></span>
                            </div>
                        </>
                    ) : (
                        <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-600 mt-2 relative z-10">Livre</span>
                    )}
                </motion.div>
            ))}
        </div>
      ) : (
        /* List View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
            {filteredOrders.length === 0 ? (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-full shadow-soft mb-4 border border-gray-200 dark:border-slate-700">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                </div>
                <p className="font-bold text-gray-500">Nenhuma comanda {activeTab === 'open' ? 'aberta' : 'neste histórico'}.</p>
                </div>
            ) : (
                filteredOrders.map((order) => (
                <motion.div 
                    layout
                    key={order.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => handleEdit(order)}
                    className={`group relative p-5 rounded-[2rem] border shadow-sm cursor-pointer hover:-translate-y-1 transition-all duration-300 overflow-hidden ${activeTab === 'open' ? 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-900/50 hover:shadow-md' : 'bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700'}`}
                >
                    {/* Visual Alert for Long Wait */}
                    {activeTab === 'open' && isLongWait(order.openedAt) && (
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-amber-400 to-transparent opacity-20 pointer-events-none"></div>
                    )}
                    
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-xl shadow-inner border border-gray-100 dark:border-slate-600">
                            {order.tableOrName.toLowerCase().includes('mesa') ? '🍽️' : '👤'}
                        </div>
                        {activeTab === 'open' ? (
                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${isLongWait(order.openedAt) ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" /></svg>
                                <span className="text-[10px] font-black uppercase tracking-wide">{getDuration(order.openedAt)}</span>
                            </div>
                        ) : (
                            <span className="text-[10px] font-bold bg-gray-200 dark:bg-slate-700 px-2 py-1 rounded-lg text-gray-600 dark:text-gray-400 uppercase">{order.paymentMethod}</span>
                        )}
                    </div>
                    
                    <h3 className="font-black text-gray-900 dark:text-white text-lg leading-tight line-clamp-1 mb-1">{order.tableOrName}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-4">{new Date(order.openedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {order.items.length} itens</p>
                    
                    <div className="space-y-1.5 mb-5 min-h-[40px]">
                        {order.items.slice(0, 2).map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs font-medium text-gray-700 dark:text-gray-400">
                            <span className={item.status === 'delivered' ? 'line-through decoration-gray-300 opacity-60' : ''}>{item.quantity}x {item.name}</span>
                        </div>
                        ))}
                        {order.items.length > 2 && <p className="text-[10px] text-gray-400 italic font-medium">+ {order.items.length - 2} itens...</p>}
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-slate-700/50 flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total</span>
                        <span className={`text-xl font-black ${activeTab === 'open' ? 'text-rose-500' : 'text-teal-600 dark:text-teal-400'}`}>
                        {formatCurrency(order.total)}
                        </span>
                    </div>

                    {/* Hover Action Overlay */}
                    <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center z-20">
                        <span className="bg-rose-500 text-white font-bold px-5 py-2.5 rounded-2xl shadow-glow-rose transform scale-90 group-hover:scale-100 transition-transform">
                        {activeTab === 'open' ? 'Gerenciar' : 'Detalhes'}
                        </span>
                    </div>
                </motion.div>
                ))
            )}
            </AnimatePresence>
        </div>
      )}

      {/* Used max-w-[95vw] to fill the screen as requested */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingOrder ? 'Editar Comanda' : 'Nova Comanda'} maxWidth="max-w-[95vw]">
        <OrderForm 
           existingOrder={editingOrder} 
           onSaveOrder={handleSaveFromForm} 
           onCloseOrder={handleCloseFromForm}
           onCancel={() => setIsModalOpen(false)} 
        />
      </Modal>
    </div>
  );
};

export default OrdersPage;
