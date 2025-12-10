
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppSettings, Expense, Product, Order, ExpenseCategory, PaymentMethod } from '../types';
import { generateId, formatCurrency } from '../utils';
import BarcodeScanner from './BarcodeScanner';

interface SettingsPanelProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onClearData: () => void;
  expenses: Expense[];
  onImportData: (expenses: Expense[], settings: AppSettings, orders?: Order[]) => void;
}

// Helper for haptics
const vibrate = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
};

// --- SUB COMPONENTS (Optimized for Contrast) ---

const GeneralSettings: React.FC<{ settings: AppSettings, onUpdate: (s: AppSettings) => void, onStatus: (t: 'success' | 'error', m: string) => void }> = ({ settings, onUpdate, onStatus }) => {
    const logoInputRef = useRef<HTMLInputElement>(null);

    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 300; // Tamanho ideal para ícone/logo
                    const MAX_HEIGHT = 300;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    
                    // Comprimir para JPEG com qualidade 0.7
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    resolve(dataUrl);
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        try {
            onStatus('success', 'Processando imagem...'); // Feedback imediato
            const compressedBase64 = await compressImage(file);
            onUpdate({ ...settings, logoUrl: compressedBase64 });
            onStatus('success', 'Logotipo atualizado!');
        } catch (error) {
            console.error(error);
            onStatus('error', 'Erro ao processar imagem.');
        }
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-2xl mx-auto pb-32 md:pb-0">
            <div className="bg-orange-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-orange-100 dark:border-slate-700 text-center">
                <div className="relative group inline-block">
                    <div 
                        className="w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-slate-600 shadow-lg bg-white dark:bg-slate-700 flex items-center justify-center mx-auto mb-3 relative cursor-pointer"
                        onClick={() => logoInputRef.current?.click()}
                    >
                        {settings.logoUrl ? (
                             <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                             <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-1">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                                </svg>
                                <span className="text-[9px] font-bold uppercase">Upload</span>
                             </div>
                        )}
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <span className="text-white text-xs font-bold">{settings.logoUrl ? 'Alterar' : 'Enviar'}</span>
                        </div>
                    </div>
                    {settings.logoUrl && (
                         <button onClick={() => logoInputRef.current?.click()} className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full shadow-md hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" /></svg>
                        </button>
                    )}
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">Identidade Visual</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Aparece no cabeçalho e tela de bloqueio</p>
                <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                {settings.logoUrl && <button onClick={() => { onUpdate({ ...settings, logoUrl: null }); onStatus('success', 'Logotipo removido'); }} className="text-xs text-rose-500 font-bold hover:underline">Remover Logo</button>}
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 space-y-5">
                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Nome Quiosque</label>
                    <input type="text" value={settings.kioskName} onChange={(e) => onUpdate({ ...settings, kioskName: e.target.value })} className="block w-full rounded-xl border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm py-3 px-4 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Proprietário</label>
                    <input type="text" value={settings.ownerName} onChange={(e) => onUpdate({ ...settings, ownerName: e.target.value })} className="block w-full rounded-xl border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm py-3 px-4 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all" />
                </div>
            </div>
        </div>
    );
};

const FinanceSettings: React.FC<{ settings: AppSettings, onUpdate: (s: AppSettings) => void }> = ({ settings, onUpdate }) => {
    return (
        <div className="space-y-6 animate-fade-in max-w-2xl mx-auto pb-32 md:pb-0">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Meta Mensal (R$)</label>
                <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-400 font-bold">R$</span>
                    <input type="number" min="0" value={settings.monthlyGoal} onChange={(e) => onUpdate({ ...settings, monthlyGoal: Number(e.target.value) })} className="block w-full rounded-xl border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-xl font-bold py-2.5 pl-12 pr-4 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all appearance-none" />
                </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700">
                <h4 className="font-bold text-gray-900 dark:text-white mb-6 text-sm uppercase flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
                    Taxas da Maquininha
                </h4>
                <div className="space-y-4">
                    {[
                        { label: 'Crédito (%)', key: 'credit' },
                        { label: 'Débito (%)', key: 'debit' },
                        { label: 'Pix (%)', key: 'pix' }
                    ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between group">
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-300">{item.label}</label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    min="0" 
                                    step="0.01"
                                    value={settings.fees[item.key as keyof typeof settings.fees]} 
                                    onChange={(e) => onUpdate({ ...settings, fees: { ...settings.fees, [item.key]: Number(e.target.value) } })} 
                                    className="w-28 rounded-lg border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm py-2 px-3 text-right focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all appearance-none" 
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ProductManager: React.FC<{ settings: AppSettings, onUpdate: (s: AppSettings) => void, onStatus: (t: 'success' | 'error', m: string) => void }> = ({ settings, onUpdate, onStatus }) => {
    const [editingProdId, setEditingProdId] = useState<string | null>(null);
    const [prodName, setProdName] = useState('');
    const [prodPrice, setProdPrice] = useState('');
    const [prodStock, setProdStock] = useState('');
    const [prodMinStock, setProdMinStock] = useState('');
    const [prodBarcode, setProdBarcode] = useState('');
    const [prodCat, setProdCat] = useState<'food' | 'drink' | 'other'>('drink');
    const [search, setSearch] = useState('');
    const [showScanner, setShowScanner] = useState(false);

    const resetForm = () => { 
        setEditingProdId(null); 
        setProdName(''); 
        setProdPrice(''); 
        setProdStock('');
        setProdMinStock('');
        setProdBarcode('');
        setProdCat('drink'); 
    };

    const handleSave = () => {
        if (!prodName || !prodPrice) return onStatus('error', 'Preencha nome e preço');
        if (Number(prodPrice) < 0) return onStatus('error', 'O preço não pode ser negativo');
        
        const newProductData = {
            name: prodName,
            price: Number(prodPrice),
            category: prodCat,
            stock: prodStock ? Number(prodStock) : 0,
            minStock: prodMinStock ? Number(prodMinStock) : 5,
            barcode: prodBarcode || undefined
        };

        let newProducts = [...(settings.products || [])];
        if (editingProdId) {
            newProducts = newProducts.map(p => p.id === editingProdId ? { ...p, ...newProductData } : p);
            onStatus('success', 'Produto atualizado!');
        } else {
            newProducts.push({ id: generateId(), ...newProductData });
            onStatus('success', 'Produto adicionado!');
        }
        onUpdate({ ...settings, products: newProducts });
        vibrate();
        resetForm();
    };

    const handleEditClick = (prod: Product) => { 
        setEditingProdId(prod.id); 
        setProdName(prod.name); 
        setProdPrice(String(prod.price)); 
        setProdStock(String(prod.stock || 0));
        setProdMinStock(String(prod.minStock || 5));
        setProdBarcode(prod.barcode || '');
        setProdCat(prod.category); 
    };
    const handleDelete = (id: string) => { onUpdate({ ...settings, products: settings.products.filter(p => p.id !== id) }); if (editingProdId === id) resetForm(); vibrate(); };

    const filteredProducts = useMemo(() => {
        return (settings.products || []).filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    }, [settings.products, search]);

    return (
        <div className="flex flex-col h-full gap-6 animate-fade-in relative max-w-2xl mx-auto pb-32 md:pb-0">
            {showScanner && <BarcodeScanner onScan={(code) => { setProdBarcode(code); setShowScanner(false); onStatus('success', 'Código lido!'); vibrate(); }} onClose={() => setShowScanner(false)} />}
            
            {/* Form de Produto Repaginado para Mobile */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm z-10">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide flex items-center gap-2">
                         <span className={`w-2.5 h-2.5 rounded-full ${editingProdId ? 'bg-blue-500' : 'bg-rose-500'}`}></span>
                         {editingProdId ? 'Editar Produto' : 'Novo Produto'}
                    </h4>
                    {editingProdId && <button onClick={resetForm} className="text-[10px] font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 px-2 py-1.5 rounded transition-colors uppercase">Cancelar</button>}
                </div>
                
                {/* Layout Stacked para Mobile */}
                <div className="flex flex-col gap-4">
                    {/* Nome (Full Width) */}
                    <div className="w-full">
                        <input type="text" value={prodName} onChange={(e) => setProdName(e.target.value)} placeholder="Nome do Produto (ex: Cerveja)" className="w-full rounded-xl border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-base py-3 px-4 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all placeholder-gray-400" />
                    </div>

                    {/* Preço e Categoria (Row) */}
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-3.5 text-gray-400 text-xs font-bold">R$</span>
                            <input type="number" min="0" step="0.50" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} placeholder="Preço" className="w-full rounded-xl border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-base py-3 px-4 pl-9 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all placeholder-gray-400 appearance-none" />
                        </div>
                        <div className="relative flex-1">
                             <select value={prodCat} onChange={(e) => setProdCat(e.target.value as any)} className="w-full rounded-xl border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-base py-3 px-4 outline-none appearance-none cursor-pointer focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all">
                                <option value="drink">🍺 Bebida</option><option value="food">🍔 Comida</option><option value="other">📦 Outro</option>
                            </select>
                        </div>
                    </div>

                    {/* Código de Barras (New) */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                             <input type="text" value={prodBarcode} onChange={(e) => setProdBarcode(e.target.value)} placeholder="Código de Barras (Opcional)" className="w-full rounded-xl border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm py-3 px-4 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all" />
                        </div>
                        <button onClick={() => setShowScanner(true)} className="bg-gray-800 dark:bg-white text-white dark:text-gray-900 p-3 rounded-xl shadow-sm hover:scale-105 transition-transform" title="Escanear Código">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75zM16.5 19.5h.75v.75h-.75v-.75z" /></svg>
                        </button>
                    </div>

                    {/* Estoque Inicial e Minimo (Row) - Only if needed, can be collapsible */}
                    <div className="flex gap-3 bg-gray-50 dark:bg-slate-700/50 p-3 rounded-xl border border-dashed border-gray-200 dark:border-slate-600">
                         <div className="flex-1">
                             <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Estoque Atual</label>
                             <input type="number" value={prodStock} onChange={(e) => setProdStock(e.target.value)} placeholder="0" className="w-full rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 p-2 text-sm font-bold text-center appearance-none" />
                         </div>
                         <div className="flex-1">
                             <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Estoque Mínimo</label>
                             <input type="number" value={prodMinStock} onChange={(e) => setProdMinStock(e.target.value)} placeholder="5" className="w-full rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 p-2 text-sm font-bold text-center appearance-none" />
                         </div>
                    </div>
                    
                    {/* Botão (Full Width) */}
                    <button onClick={handleSave} className={`w-full rounded-xl py-3.5 flex items-center justify-center text-white font-bold shadow-md transition-all active:scale-95 ${editingProdId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-rose-500 hover:bg-rose-600'}`}>
                        {editingProdId ? 'Salvar Alterações' : 'Adicionar ao Cardápio'}
                    </button>
                </div>
            </div>

            {/* Lista com Busca */}
            <div className="flex-1 flex flex-col min-h-0">
                <div className="relative mb-3">
                    <input type="text" placeholder="Buscar no cardápio..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 py-3 bg-white dark:bg-slate-800 rounded-xl text-sm border border-gray-100 dark:border-slate-700 text-gray-900 dark:text-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all shadow-sm" />
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 absolute left-3 top-3 text-gray-400"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" /></svg>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pb-4">
                    <AnimatePresence mode="popLayout">
                        {filteredProducts.map(prod => (
                            <motion.div layout key={prod.id} initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0}} onClick={() => handleEditClick(prod)} className={`flex justify-between items-center p-3 rounded-xl border cursor-pointer transition-all group ${editingProdId === prod.id ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700'}`}>
                                <div className="flex items-center gap-4">
                                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm border border-white/50 dark:border-white/5 ${prod.category === 'drink' ? 'bg-blue-100 text-blue-600' : prod.category === 'food' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'}`}>{prod.category === 'drink' ? '🍺' : prod.category === 'food' ? '🍔' : '📦'}</span>
                                    <div><p className="font-bold text-gray-800 dark:text-white text-sm">{prod.name}</p><p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{formatCurrency(prod.price)}</p></div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Estoque</p>
                                        <p className={`text-xs font-black ${ (prod.stock || 0) <= (prod.minStock || 5) ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>{prod.stock || 0}</p>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(prod.id); }} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-500 opacity-0 group-hover:opacity-100 transition-all"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.14-2.007-2.203L13.78 3.69a1.25 1.25 0 00-1.294 0l-1.007.31c-1.096.34-2.006 1.3-2.006 2.484V6.25m3.75-1.5H10.5" /></svg></button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {filteredProducts.length === 0 && <p className="text-center text-gray-400 text-sm py-8 italic">Nenhum produto encontrado.</p>}
                </div>
            </div>
        </div>
    );
};

const SecuritySettings: React.FC<{ settings: AppSettings, onUpdate: (s: AppSettings) => void, onStatus: (t: 'success' | 'error', m: string) => void }> = ({ settings, onUpdate, onStatus }) => {
    const [pinStep, setPinStep] = useState<'enter' | 'confirm'>('enter');
    const [tempPin, setTempPin] = useState('');
    const [pinInput, setPinInput] = useState('');
    const [confirmRemovePin, setConfirmRemovePin] = useState(false);

    const handlePinLogic = () => {
        if (pinStep === 'enter') {
            if (pinInput.length !== 4) return onStatus('error', 'PIN deve ter 4 números.');
            setTempPin(pinInput); setPinInput(''); setPinStep('confirm');
        } else {
            if (pinInput !== tempPin) return onStatus('error', 'PINs não coincidem.');
            onUpdate({ ...settings, securityPin: tempPin });
            setPinInput(''); setTempPin(''); setPinStep('enter');
            onStatus('success', 'PIN ativado!');
        }
    };

    return (
        <div className="space-y-6 animate-fade-in flex flex-col items-center justify-center h-full max-w-sm mx-auto pb-32 md:pb-0">
             <div className="text-center mb-4">
                 <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm border border-blue-100 dark:border-blue-900/50">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                 </div>
                 <h4 className="font-bold text-gray-900 dark:text-white text-xl">Proteção por PIN</h4>
                 <p className="text-sm text-gray-500 dark:text-gray-400">Bloqueie o acesso a áreas sensíveis do caixa</p>
             </div>

             {settings.securityPin ? (
                 <div className="text-center w-full space-y-4">
                     <div className="bg-green-50 dark:bg-green-900/20 py-3 px-4 rounded-xl border border-green-200 dark:border-green-800 flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-green-600 dark:text-green-400"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
                        <span className="font-bold text-green-700 dark:text-green-300">Segurança Ativa</span>
                     </div>
                     {confirmRemovePin ? (
                        <div className="flex gap-2">
                             <button onClick={() => setConfirmRemovePin(false)} className="flex-1 py-3 font-bold text-gray-500 bg-gray-100 dark:bg-slate-700 rounded-xl hover:bg-gray-200">Cancelar</button>
                             <button onClick={() => { onUpdate({ ...settings, securityPin: null }); setConfirmRemovePin(false); onStatus('success', 'PIN removido'); }} className="flex-[2] text-white bg-red-500 hover:bg-red-600 py-3 rounded-xl font-bold shadow-lg shadow-red-500/30 transition-all">Confirmar</button>
                        </div>
                     ) : <button onClick={() => setConfirmRemovePin(true)} className="w-full text-red-500 font-bold border-2 border-red-100 dark:border-red-900/30 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Desativar PIN</button>}
                 </div>
             ) : (
                 <div className="flex flex-col gap-4 w-full">
                     <input type="password" maxLength={4} value={pinInput} onChange={(e) => setPinInput(e.target.value)} placeholder={pinStep === 'enter' ? "Digite 4 números" : "Confirme o PIN"} className="block w-full rounded-2xl border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-2xl py-4 px-3 focus:border-rose-500 focus:ring-0 outline-none text-center font-black tracking-[0.5em] transition-all placeholder:text-base placeholder:font-normal placeholder:tracking-normal appearance-none" />
                     <button onClick={handlePinLogic} className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl px-6 py-4 font-bold shadow-xl hover:scale-105 transition-transform">{pinStep === 'enter' ? 'Continuar' : 'Salvar Senha'}</button>
                 </div>
             )}
        </div>
    );
};

const DataSettings: React.FC<{ settings: AppSettings, expenses: Expense[], onImport: (e: Expense[], s: AppSettings, o?: Order[]) => void, onClear: () => void, onStatus: (t: 'success' | 'error', m: string) => void }> = ({ settings, expenses, onImport, onClear, onStatus }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDeleteArmed, setIsDeleteArmed] = useState(false);
    const [deleteInput, setDeleteInput] = useState('');

    const handleExport = () => {
        const dataStr = JSON.stringify({ settings, expenses }, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `backup_quiosque_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        onStatus('success', 'Backup baixado!');
        vibrate();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const json = JSON.parse(ev.target?.result as string);
                if (json.settings && json.expenses) {
                    onImport(json.expenses, json.settings);
                    onStatus('success', 'Dados restaurados com sucesso!');
                    vibrate();
                } else onStatus('error', 'Arquivo inválido.');
            } catch { onStatus('error', 'Erro ao ler arquivo.'); }
        };
        reader.readAsText(file);
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-2xl mx-auto pb-32 md:pb-0">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 space-y-4">
                 <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694-4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" /></svg>
                    Gerenciamento de Backup
                 </h4>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button onClick={handleExport} className="flex flex-col items-center justify-center p-6 bg-teal-50 dark:bg-teal-900/10 rounded-2xl border border-teal-100 dark:border-teal-900/30 hover:bg-teal-100 dark:hover:bg-teal-900/20 transition-colors group">
                         <div className="bg-teal-100 dark:bg-teal-800 text-teal-600 dark:text-teal-200 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform"><svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg></div>
                         <span className="font-bold text-gray-700 dark:text-gray-200">Exportar Dados</span>
                         <span className="text-xs text-gray-500 mt-1">Salvar arquivo .json</span>
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors group">
                         <div className="bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-200 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform"><svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" transform="rotate(180 10 10)" /></svg></div>
                         <span className="font-bold text-gray-700 dark:text-gray-200">Restaurar Dados</span>
                         <span className="text-xs text-gray-500 mt-1">Carregar arquivo .json</span>
                    </button>
                 </div>
                 <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
            </div>

            <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-2xl border border-red-100 dark:border-red-900/30">
                <h5 className="font-bold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
                    Zona de Perigo
                </h5>
                {isDeleteArmed ? (
                    <div className="space-y-3 animate-fade-in">
                        <p className="text-sm text-red-600 dark:text-red-300">Digite <strong>DELETAR</strong> para confirmar a exclusão de todos os dados.</p>
                        <input type="text" value={deleteInput} onChange={(e) => setDeleteInput(e.target.value)} placeholder="DELETAR" className="w-full text-center border-2 border-red-200 dark:border-red-800 bg-white dark:bg-slate-700 rounded-lg py-2 font-bold text-red-600 outline-none focus:border-red-500" />
                        <div className="flex gap-2">
                             <button onClick={() => { setIsDeleteArmed(false); setDeleteInput(''); }} className="flex-1 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-white font-bold py-2 rounded-lg">Cancelar</button>
                             <button disabled={deleteInput !== 'DELETAR'} onClick={() => { if(deleteInput === 'DELETAR') { onClear(); setIsDeleteArmed(false); setDeleteInput(''); onStatus('success', 'Dados apagados'); vibrate(); } }} className="flex-[2] bg-red-600 text-white font-bold py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-600/30">Confirmar Exclusão</button>
                        </div>
                    </div>
                ) : <button onClick={() => setIsDeleteArmed(true)} className="w-full text-red-500 dark:text-red-400 font-bold py-3 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">Apagar Todos os Dados</button>}
            </div>
        </div>
    );
};

// --- MAIN MASTER-DETAIL COMPONENT ---

type ViewState = 'menu' | 'general' | 'finance' | 'menu_items' | 'security' | 'data';

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onUpdateSettings, onClearData, expenses, onImportData }) => {
  const [activeView, setActiveView] = useState<ViewState>('menu');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Responsive check
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  useEffect(() => {
      const handleResize = () => {
          const desk = window.innerWidth >= 768;
          setIsDesktop(desk);
          if (desk && activeView === 'menu') setActiveView('general'); // Default to general on desktop
      };
      window.addEventListener('resize', handleResize);
      handleResize(); // Init
      return () => window.removeEventListener('resize', handleResize);
  }, [activeView]);

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const menuItems = [
      { id: 'general', label: 'Identidade Visual', section: 'QUIOSQUE', icon: 'M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z' },
      { id: 'menu_items', label: 'Cardápio & Produtos', section: 'GESTÃO', icon: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25' },
      { id: 'finance', label: 'Metas & Taxas', section: 'GESTÃO', icon: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.305 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
      { id: 'security', label: 'Segurança (PIN)', section: 'SISTEMA', icon: 'M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z' },
      { id: 'data', label: 'Backup & Dados', section: 'SISTEMA', icon: 'M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694-4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125' },
  ];

  const sections = ['QUIOSQUE', 'GESTÃO', 'SISTEMA'];

  const getTitle = () => {
      switch(activeView) {
          case 'general': return 'Identidade Visual';
          case 'finance': return 'Metas & Taxas';
          case 'menu_items': return 'Cardápio';
          case 'security': return 'Segurança';
          case 'data': return 'Dados';
          default: return 'Ajustes';
      }
  };

  return (
    <div className="h-full w-full relative bg-white dark:bg-slate-900 md:flex overflow-hidden">
      <AnimatePresence>
        {statusMessage && (
          <motion.div initial={{ opacity: 0, y: -20, x: '-50%' }} animate={{ opacity: 1, y: 10, x: '-50%' }} exit={{ opacity: 0, y: -20, x: '-50%' }} className={`absolute top-0 left-1/2 transform -translate-x-1/2 z-[60] px-6 py-3 rounded-full shadow-xl font-bold text-sm text-white ${statusMessage.type === 'success' ? 'bg-teal-500' : 'bg-rose-500'}`}>
            {statusMessage.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT COLUMN: MENU (Always visible on Desktop, Conditional on Mobile) */}
      <div className={`md:w-72 bg-gray-50 dark:bg-slate-900/50 md:border-r border-gray-200 dark:border-slate-800 flex flex-col h-full absolute md:relative w-full z-10 transition-transform duration-300 ${!isDesktop && activeView !== 'menu' ? '-translate-x-full' : 'translate-x-0'}`}>
          <div className="p-6 pb-2">
               <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Ajustes</h2>
               <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Configuração do Sistema</p>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 pt-2 space-y-6">
             {sections.map(section => (
                 <div key={section}>
                     <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-2 ml-3">{section}</h4>
                     <div className="space-y-1">
                         {menuItems.filter(item => item.section === section).map(item => (
                             <button 
                                 key={item.id}
                                 onClick={() => { setActiveView(item.id as ViewState); vibrate(); }}
                                 className={`w-full flex items-center justify-between p-3 rounded-xl transition-all group ${activeView === item.id ? 'bg-white dark:bg-slate-800 shadow-sm text-rose-500' : 'hover:bg-gray-100 dark:hover:bg-slate-800/50 text-gray-600 dark:text-gray-400'}`}
                             >
                                 <div className="flex items-center gap-3">
                                     <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${activeView === item.id ? 'bg-rose-100 text-rose-500 dark:bg-rose-900/20' : 'bg-gray-200 dark:bg-slate-800 text-gray-500 dark:text-gray-500 group-hover:bg-white dark:group-hover:bg-slate-700'}`}>
                                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
                                     </div>
                                     <span className="font-bold text-sm">{item.label}</span>
                                 </div>
                                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 transition-transform ${activeView === item.id ? 'text-rose-500 translate-x-1' : 'text-gray-300 dark:text-gray-700'}`}><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" /></svg>
                             </button>
                         ))}
                     </div>
                 </div>
             ))}
          </div>

          <div className="p-6 text-center border-t border-gray-200 dark:border-slate-800">
                <p className="text-xs font-bold text-gray-900 dark:text-white">Quiosque Estrela do Mar</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-0.5">Versão 2.4.0 • PWA</p>
          </div>
      </div>

      {/* RIGHT COLUMN: CONTENT (Always visible on Desktop, Slide-in on Mobile) */}
      <div className={`flex-1 bg-white dark:bg-slate-900 flex flex-col h-full absolute md:relative w-full z-20 transition-transform duration-300 ${!isDesktop && activeView === 'menu' ? 'translate-x-full' : 'translate-x-0'}`}>
          {/* Header Mobile */}
          <div className="md:hidden flex items-center gap-3 p-4 border-b border-gray-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shrink-0">
             <button onClick={() => setActiveView('menu')} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" /></svg>
             </button>
             <h3 className="font-bold text-lg text-gray-900 dark:text-white">{getTitle()}</h3>
          </div>
          
          {/* Header Desktop */}
          <div className="hidden md:flex items-center justify-between p-8 pb-4">
              <div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white">{getTitle()}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Gerencie as preferências desta seção</p>
              </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 relative">
                {activeView === 'general' && <GeneralSettings settings={settings} onUpdate={onUpdateSettings} onStatus={showStatus} />}
                {activeView === 'finance' && <FinanceSettings settings={settings} onUpdate={onUpdateSettings} />}
                {activeView === 'menu_items' && <ProductManager settings={settings} onUpdate={onUpdateSettings} onStatus={showStatus} />}
                {activeView === 'security' && <SecuritySettings settings={settings} onUpdate={onUpdateSettings} onStatus={showStatus} />}
                {activeView === 'data' && <DataSettings settings={settings} expenses={expenses} onImport={onImportData} onClear={onClearData} onStatus={showStatus} />}
          </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
