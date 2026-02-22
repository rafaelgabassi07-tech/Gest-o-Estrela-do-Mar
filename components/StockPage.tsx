
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '../types';
import { formatCurrency } from '../utils';
import BarcodeScanner from './BarcodeScanner';

interface StockPageProps {
  products: Product[];
  onUpdateStock: (productId: string, newQuantity: number) => void;
  onOpenSettings: () => void;
  onShowToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'name' | 'stock_asc' | 'stock_desc' | 'price_desc';

const StockPage: React.FC<StockPageProps> = ({ products, onUpdateStock, onOpenSettings, onShowToast }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'low'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('stock_asc'); // Default: show low stock first
  const [showScanner, setShowScanner] = useState(false);
  
  // Estado para edição direta
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
    }
  }, [editingId]);

  // Filtragem
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const isLowStock = (product.stock || 0) <= (product.minStock || 5);
    
    if (filterMode === 'low') return matchesSearch && isLowStock;
    return matchesSearch;
  });

  // Ordenação
  filteredProducts.sort((a, b) => {
    const stockA = a.stock || 0;
    const stockB = b.stock || 0;

    switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'stock_asc': return stockA - stockB;
        case 'stock_desc': return stockB - stockA;
        case 'price_desc': return b.price - a.price;
        default: return 0;
    }
  });

  // Stats
  const totalItems = products.length;
  const lowStockCount = products.filter(p => (p.stock || 0) <= (p.minStock || 5)).length;
  const totalStockValue = products.reduce((acc, p) => acc + (p.price * (p.stock || 0)), 0);

  const handleStockChange = (id: string, current: number, delta: number) => {
    const newValue = Math.max(0, current + delta);
    onUpdateStock(id, newValue);
    if(navigator.vibrate) navigator.vibrate(5);
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
          setSearchTerm(found.name);
          startEditing(found);
          onShowToast?.('success', 'Produto encontrado!');
      } else {
          onShowToast?.('error', `Produto com código ${code} não encontrado.`);
          setShowScanner(false);
      }
  };

  const getStockStatusColor = (stock: number, min: number) => {
      if (stock === 0) return 'text-red-500 bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800';
      if (stock <= min) return 'text-orange-500 bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800';
      return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800';
  };

  const getStockLabel = (stock: number, min: number) => {
      if (stock === 0) return 'Esgotado';
      if (stock <= min) return 'Baixo';
      return 'Normal';
  };

  return (
    <div className="space-y-6 animate-fade-in pb-32 md:pb-0">
      {showScanner && <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}
      
      {/* Dashboard Stats */}
      <div className="grid grid-cols-3 gap-3 md:gap-6">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center">
             <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wide">Itens</span>
             <span className="text-xl md:text-3xl font-black text-gray-900 dark:text-white mt-1">{totalItems}</span>
          </div>
          <div className={`p-4 rounded-2xl border shadow-sm flex flex-col items-center justify-center text-center ${lowStockCount > 0 ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700'}`}>
             <span className={`text-[10px] md:text-xs font-bold uppercase tracking-wide ${lowStockCount > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'}`}>Repor</span>
             <span className={`text-xl md:text-3xl font-black mt-1 ${lowStockCount > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'}`}>{lowStockCount}</span>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center">
             <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wide">Valor Total</span>
             <span className="text-sm md:text-xl font-black text-teal-600 dark:text-teal-400 mt-1">{formatCurrency(totalStockValue)}</span>
          </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col xl:flex-row gap-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-4 rounded-3xl border border-gray-200 dark:border-slate-700 shadow-soft sticky top-20 z-30">
        
        {/* Search & Scan */}
        <div className="flex gap-2 w-full xl:w-auto flex-1">
            <button onClick={() => setShowScanner(true)} className="bg-gray-800 dark:bg-white hover:bg-black dark:hover:bg-gray-200 p-3 rounded-xl text-white dark:text-gray-900 transition-colors shadow-lg shadow-gray-400/20 dark:shadow-none" title="Escanear">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75zM16.5 19.5h.75v.75h-.75v-.75z" /></svg>
            </button>
            <div className="relative flex-1">
                <input 
                    type="text" 
                    placeholder="Buscar produto..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-rose-500 outline-none shadow-sm transition-all"
                />
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 absolute left-3 top-3.5 text-gray-400"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" /></svg>
            </div>
        </div>

        {/* Filters & Actions */}
        <div className="flex gap-2 overflow-x-auto pb-1 xl:pb-0 scrollbar-hide">
            {/* Sort Dropdown */}
            <div className="relative">
                <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="appearance-none bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-white text-xs font-bold rounded-xl px-4 py-3 pr-8 cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500 min-w-[140px]"
                >
                    <option value="stock_asc">Menor Estoque</option>
                    <option value="stock_desc">Maior Estoque</option>
                    <option value="name">Nome (A-Z)</option>
                    <option value="price_desc">Maior Preço</option>
                </select>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 absolute right-2.5 top-3 text-gray-500 pointer-events-none"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
            </div>

            {/* View Toggle */}
            <div className="bg-gray-200 dark:bg-slate-900 p-1 rounded-xl flex shrink-0">
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-rose-500 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
                </button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-rose-500 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>
                </button>
            </div>

            {/* Quick Filter */}
            <button 
                onClick={() => setFilterMode(filterMode === 'all' ? 'low' : 'all')} 
                className={`px-4 py-3 rounded-xl text-xs font-bold uppercase whitespace-nowrap transition-colors border ${filterMode === 'low' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 border-orange-200' : 'bg-white dark:bg-slate-700 text-gray-500 border-gray-200 dark:border-slate-600'}`}
            >
                ⚠️ Baixo Estoque
            </button>

             {/* Add Button */}
             <button onClick={onOpenSettings} className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-3 rounded-xl text-xs font-bold uppercase shadow-lg shadow-rose-500/20 flex items-center gap-2 transition-colors whitespace-nowrap">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
               <span className="hidden sm:inline">Cadastrar</span>
            </button>
        </div>
      </div>

      {/* Content Area */}
      {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
            {filteredProducts.map(product => {
                const stock = product.stock || 0;
                const min = product.minStock || 5;
                const statusColor = getStockStatusColor(stock, min);
                const statusLabel = getStockLabel(stock, min);
                const fillPercent = Math.min((stock / (min * 2)) * 100, 100);

                return (
                    <motion.div 
                        layout
                        key={product.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 relative overflow-hidden group hover:shadow-md transition-shadow"
                    >
                        {/* Status Line Top */}
                        <div className={`absolute top-0 left-0 w-full h-1.5 ${stock === 0 ? 'bg-red-500' : stock <= min ? 'bg-orange-500' : 'bg-emerald-500'}`}></div>

                        <div className="flex justify-between items-start mb-4 mt-2">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl bg-gray-50 dark:bg-slate-700 border border-gray-100 dark:border-slate-600">
                                    {product.category === 'drink' ? '🍺' : product.category === 'food' ? '🍔' : '📦'}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight line-clamp-1" title={product.name}>{product.name}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">{formatCurrency(product.price)}</p>
                                </div>
                            </div>
                            <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${statusColor}`}>
                                {statusLabel}
                            </div>
                        </div>

                        {/* Interactive Stock Control */}
                        <div className="bg-gray-50 dark:bg-slate-900/50 rounded-2xl p-4 flex items-center justify-between border border-gray-100 dark:border-slate-700/50 relative z-10">
                            <motion.button 
                                whileTap={{ scale: 0.9 }} 
                                onClick={() => handleStockChange(product.id, stock, -1)} 
                                className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 flex items-center justify-center text-gray-400 hover:text-rose-500 hover:border-rose-200 transition-colors font-bold shadow-sm"
                                disabled={stock === 0}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" /></svg>
                            </motion.button>
                            
                            <div className="flex flex-col items-center cursor-pointer" onClick={() => startEditing(product)}>
                                {editingId === product.id ? (
                                    <input 
                                        ref={inputRef}
                                        type="number"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onBlur={() => saveEditing(product.id)}
                                        onKeyDown={(e) => handleKeyDown(e, product.id)}
                                        className="w-16 text-center text-2xl font-black bg-transparent border-b-2 border-rose-500 outline-none p-0 text-gray-900 dark:text-white appearance-none"
                                    />
                                ) : (
                                    <>
                                        <span className={`text-3xl font-black leading-none ${stock === 0 ? 'text-red-500' : stock <= min ? 'text-orange-500' : 'text-gray-900 dark:text-white'}`}>
                                            {stock}
                                        </span>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase mt-1">Min: {min}</span>
                                    </>
                                )}
                            </div>

                            <motion.button 
                                whileTap={{ scale: 0.9 }} 
                                onClick={() => handleStockChange(product.id, stock, 1)} 
                                className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 flex items-center justify-center text-gray-400 hover:text-teal-500 hover:border-teal-200 transition-colors font-bold shadow-sm"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                            </motion.button>
                        </div>
                        
                        {/* Visual Progress Bar */}
                        <div className="mt-3 h-1.5 w-full bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                             <div className={`h-full rounded-full transition-all duration-500 ${stock === 0 ? 'bg-red-500' : stock <= min ? 'bg-orange-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, Math.max(5, fillPercent))}%` }}></div>
                        </div>
                    </motion.div>
                )
            })}
            </AnimatePresence>
          </div>
      ) : (
          /* LIST VIEW (TABLE) */
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
                            <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase">Produto</th>
                            <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase text-center">Status</th>
                            <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase text-center">Mínimo</th>
                            <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase text-center w-48">Estoque Atual</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                        {filteredProducts.map(product => {
                             const stock = product.stock || 0;
                             const min = product.minStock || 5;
                             const statusColor = getStockStatusColor(stock, min);
                             const statusLabel = getStockLabel(stock, min);

                             return (
                                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors group">
                                    <td className="py-3 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-lg">{product.category === 'drink' ? '🍺' : product.category === 'food' ? '🍔' : '📦'}</div>
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white text-sm">{product.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{formatCurrency(product.price)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-6 text-center">
                                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg border inline-block ${statusColor}`}>{statusLabel}</span>
                                    </td>
                                    <td className="py-3 px-6 text-center">
                                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{min}</span>
                                    </td>
                                    <td className="py-3 px-6">
                                        <div className="flex items-center justify-center gap-3">
                                            <button 
                                                onClick={() => handleStockChange(product.id, stock, -1)} 
                                                disabled={stock === 0}
                                                className="w-8 h-8 rounded-lg border border-gray-200 dark:border-slate-600 flex items-center justify-center hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-500 text-gray-400 transition-colors disabled:opacity-30"
                                            >
                                                -
                                            </button>
                                            <div onClick={() => startEditing(product)} className="w-12 text-center cursor-pointer">
                                                {editingId === product.id ? (
                                                    <input 
                                                        ref={inputRef}
                                                        type="number"
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        onBlur={() => saveEditing(product.id)}
                                                        onKeyDown={(e) => handleKeyDown(e, product.id)}
                                                        className="w-full text-center font-bold bg-transparent border-b border-rose-500 outline-none text-gray-900 dark:text-white"
                                                    />
                                                ) : (
                                                    <span className={`text-lg font-black ${stock === 0 ? 'text-red-500' : stock <= min ? 'text-orange-500' : 'text-gray-900 dark:text-white'}`}>{stock}</span>
                                                )}
                                            </div>
                                            <button 
                                                onClick={() => handleStockChange(product.id, stock, 1)} 
                                                className="w-8 h-8 rounded-lg border border-gray-200 dark:border-slate-600 flex items-center justify-center hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-500 text-gray-400 transition-colors"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                             )
                        })}
                    </tbody>
                </table>
              </div>
          </div>
      )}

      {filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white/50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-gray-200 dark:border-slate-700">
              <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
              </div>
              <p className="font-bold text-sm">Nenhum produto encontrado</p>
              <button onClick={onOpenSettings} className="mt-4 text-rose-500 font-bold text-sm hover:underline">Cadastrar no cardápio</button>
          </div>
      )}
    </div>
  );
};

export default StockPage;
