
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '../types';
import { formatCurrency } from '../utils';
import BarcodeScanner from './BarcodeScanner';

interface StockPageProps {
  products: Product[];
  onUpdateStock: (productId: string, newQuantity: number) => void;
  onOpenSettings: () => void;
}

const StockPage: React.FC<StockPageProps> = ({ products, onUpdateStock, onOpenSettings }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'low'>('all');
  const [showScanner, setShowScanner] = useState(false);
  
  // Estado para edição direta
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
        inputRef.current.focus();
    }
  }, [editingId]);

  // Filtrar produtos
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const isLowStock = (product.stock || 0) <= (product.minStock || 5);
    
    if (filterMode === 'low') return matchesSearch && isLowStock;
    return matchesSearch;
  });

  // Ordenar: Baixo estoque primeiro
  filteredProducts.sort((a, b) => {
    const aLow = (a.stock || 0) <= (a.minStock || 5);
    const bLow = (b.stock || 0) <= (b.minStock || 5);
    if (aLow && !bLow) return -1;
    if (!aLow && bLow) return 1;
    return a.name.localeCompare(b.name);
  });

  // Stats
  const totalItems = products.length;
  const lowStockCount = products.filter(p => (p.stock || 0) <= (p.minStock || 5)).length;
  const totalStockValue = products.reduce((acc, p) => acc + (p.price * (p.stock || 0)), 0);

  const handleStockChange = (id: string, current: number, delta: number) => {
    const newValue = Math.max(0, current + delta);
    onUpdateStock(id, newValue);
  };

  const startEditing = (product: Product) => {
      setEditingId(product.id);
      setEditValue(String(product.stock || 0));
  };

  const saveEditing = (id: string) => {
      const newValue = parseInt(editValue, 10);
      if (!isNaN(newValue) && newValue >= 0) {
          onUpdateStock(id, newValue);
      }
      setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
      if (e.key === 'Enter') saveEditing(id);
      if (e.key === 'Escape') setEditingId(null);
  };

  const handleScan = (code: string) => {
      const found = products.find(p => p.barcode === code);
      if (found) {
          setShowScanner(false);
          setSearchTerm(found.name); // Filter by the found product name to highlight it
          // Optionally auto-start editing
          startEditing(found);
      } else {
          alert(`Produto com código ${code} não encontrado.`);
          setShowScanner(false);
      }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
      {showScanner && <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}
      
      {/* Dashboard de Estoque */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
             <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Itens Cadastrados</p>
             <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{totalItems}</p>
          </div>
          <div className={`p-5 rounded-2xl border shadow-sm ${lowStockCount > 0 ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700'}`}>
             <p className={`text-xs font-bold uppercase tracking-wide ${lowStockCount > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500'}`}>Estoque Baixo</p>
             <p className={`text-2xl font-black mt-1 ${lowStockCount > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'}`}>{lowStockCount}</p>
          </div>
          <div className="col-span-2 lg:col-span-1 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
             <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Valor em Mercadoria</p>
             <p className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-1">{formatCurrency(totalStockValue)}</p>
          </div>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-3 rounded-2xl border border-gray-100 dark:border-slate-700 sticky top-20 z-30 shadow-soft">
        <div className="flex-1 flex gap-2">
            <button onClick={() => setShowScanner(true)} className="bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 p-3 rounded-xl text-gray-700 dark:text-white transition-colors" title="Escanear">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75zM16.5 19.5h.75v.75h-.75v-.75z" /></svg>
            </button>
            <div className="relative flex-1">
            <input 
                type="text" 
                placeholder="Buscar item..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-rose-500 outline-none shadow-sm"
            />
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 absolute left-3 top-3.5 text-gray-400"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" /></svg>
            </div>
        </div>
        <div className="flex gap-2 shrink-0">
           <div className="flex gap-1 bg-gray-200 dark:bg-slate-900 p-1 rounded-xl">
             <button onClick={() => setFilterMode('all')} className={`px-3 py-2 rounded-lg text-xs font-bold uppercase transition-all ${filterMode === 'all' ? 'bg-white dark:bg-slate-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}>Todos</button>
             <button onClick={() => setFilterMode('low')} className={`px-3 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1 ${filterMode === 'low' ? 'bg-white dark:bg-slate-700 shadow-sm text-orange-500' : 'text-gray-500'}`}>
                <span className="w-2 h-2 rounded-full bg-orange-500"></span> Baixos
             </button>
           </div>
           
           <button onClick={onOpenSettings} className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase shadow-lg shadow-rose-500/20 flex items-center gap-2 transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
               <span className="hidden sm:inline">Gerenciar Produtos</span>
               <span className="sm:hidden">Novo</span>
           </button>
        </div>
      </div>

      {/* Lista de Produtos */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
           {filteredProducts.map(product => {
               const stock = product.stock || 0;
               const min = product.minStock || 5;
               const isLow = stock <= min;
               const isCritical = stock === 0;

               return (
                   <motion.div 
                     layout
                     key={product.id}
                     initial={{ opacity: 0, scale: 0.95 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.95 }}
                     className={`relative bg-white dark:bg-slate-800 rounded-2xl border p-4 shadow-sm transition-all ${isCritical ? 'border-red-300 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10' : isLow ? 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10' : 'border-gray-100 dark:border-slate-700'}`}
                   >
                       <div className="flex justify-between items-start mb-3">
                           <div className="flex items-center gap-3">
                               <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-white dark:bg-slate-700 shadow-sm border border-gray-100 dark:border-slate-600`}>
                                   {product.category === 'drink' ? '🍺' : product.category === 'food' ? '🍔' : '📦'}
                               </div>
                               <div>
                                   <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight">{product.name}</h3>
                                   <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">{formatCurrency(product.price)}</p>
                               </div>
                           </div>
                           <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${isCritical ? 'bg-red-500 text-white' : isLow ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400' : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'}`}>
                               {isCritical ? 'Esgotado' : isLow ? 'Baixo' : 'Normal'}
                           </div>
                       </div>

                       <div className="bg-gray-50 dark:bg-slate-900/50 rounded-xl p-3 flex items-center justify-between border border-gray-100 dark:border-slate-700/50">
                           <div className="text-center">
                               <p className="text-[9px] font-bold text-gray-400 uppercase">Mínimo</p>
                               <p className="text-xs font-bold text-gray-600 dark:text-gray-400">{min}</p>
                           </div>
                           
                           {/* Controles de Estoque */}
                           <div className="flex items-center gap-3">
                               <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleStockChange(product.id, stock, -1)} className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 flex items-center justify-center text-gray-600 dark:text-white hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-500 transition-colors font-bold shadow-sm">-</motion.button>
                               
                               <div className="min-w-[4rem] text-center" title="Clique para editar valor">
                                   {editingId === product.id ? (
                                       <input 
                                          ref={inputRef}
                                          type="number"
                                          value={editValue}
                                          onChange={(e) => setEditValue(e.target.value)}
                                          onBlur={() => saveEditing(product.id)}
                                          onKeyDown={(e) => handleKeyDown(e, product.id)}
                                          className="w-16 text-center text-xl font-black bg-white dark:bg-slate-600 rounded border border-blue-500 outline-none p-0 text-gray-900 dark:text-white"
                                       />
                                   ) : (
                                       <span 
                                         onClick={() => startEditing(product)}
                                         className={`text-2xl font-black cursor-pointer border-b border-dashed border-gray-300 hover:border-blue-500 hover:text-blue-500 transition-colors ${isLow ? 'text-orange-500' : 'text-gray-800 dark:text-white'}`}
                                       >
                                           {stock}
                                       </span>
                                   )}
                               </div>

                               <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleStockChange(product.id, stock, 1)} className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 flex items-center justify-center text-gray-600 dark:text-white hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:text-teal-500 transition-colors font-bold shadow-sm">+</motion.button>
                           </div>
                       </div>
                   </motion.div>
               )
           })}
        </AnimatePresence>
      </div>

      {filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
              </div>
              <p className="font-bold text-sm">Nenhum produto encontrado</p>
              <button onClick={onOpenSettings} className="mt-4 text-rose-500 font-bold text-sm hover:underline">Cadastrar novo produto</button>
          </div>
      )}
    </div>
  );
};

export default StockPage;
