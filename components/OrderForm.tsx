import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Order, OrderItem, PaymentMethod } from '../types';
import { generateId, formatCurrency } from '../utils';
import { PAYMENT_METHOD_OPTIONS } from '../constants';
import { useSettingsManager } from '../hooks';

interface OrderFormProps {
  existingOrder?: Order | null;
  onSaveOrder: (order: Order) => void;
  onCloseOrder?: (order: Order, paymentMethod: PaymentMethod) => void;
  onCancel: () => void;
}

const OrderForm: React.FC<OrderFormProps> = ({ existingOrder, onSaveOrder, onCloseOrder, onCancel }) => {
  const { settings } = useSettingsManager();
  const customItemInputRef = useRef<HTMLInputElement>(null);
  
  const [tableOrName, setTableOrName] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  
  // Custom Item Inputs
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState<number | ''>('');
  
  // Order Details
  const [discount, setDiscount] = useState<number | ''>('');
  const [serviceFee, setServiceFee] = useState<boolean>(false);
  const [splitCount, setSplitCount] = useState<number>(1);

  // Close Order State
  const [isClosing, setIsClosing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>(PaymentMethod.MONEY);

  useEffect(() => {
    if (existingOrder) {
      setTableOrName(existingOrder.tableOrName);
      setItems(existingOrder.items);
      setDiscount(existingOrder.discount || '');
      setServiceFee(existingOrder.serviceFee || false);
    }
  }, [existingOrder]);

  const addCustomItem = () => {
    if (!newItemName || !newItemPrice || Number(newItemPrice) < 0) return;
    const newItem: OrderItem = {
      id: generateId(),
      name: newItemName,
      price: Number(newItemPrice),
      quantity: 1,
      status: 'pending',
      isCourtesy: false
    };
    setItems([...items, newItem]);
    setNewItemName('');
    setNewItemPrice('');
    
    // Focus back on input using Ref
    setTimeout(() => {
        customItemInputRef.current?.focus();
    }, 50);
  };

  const addCatalogItem = (product: any) => {
     // Check if item exists to increment
     const existingItemIndex = items.findIndex(i => i.name === product.name && !i.isCourtesy && i.status === 'pending');
     
     if (existingItemIndex >= 0) {
        const updatedItems = [...items];
        updatedItems[existingItemIndex].quantity += 1;
        setItems(updatedItems);
     } else {
        const newItem: OrderItem = {
            id: generateId(),
            name: product.name,
            price: product.price,
            quantity: 1,
            status: 'pending',
            isCourtesy: false
        };
        setItems([...items, newItem]);
     }
  };

  const incrementQuantity = (id: string) => {
    setItems(items.map(i => i.id === id ? { ...i, quantity: i.quantity + 1 } : i));
  };

  const decrementQuantity = (id: string) => {
    setItems(items.map(i => {
      if (i.id === id) {
        return { ...i, quantity: Math.max(1, i.quantity - 1) };
      }
      return i;
    }));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const toggleStatus = (id: string) => {
      setItems(items.map(i => i.id === id ? { ...i, status: i.status === 'pending' ? 'delivered' : 'pending' } : i));
  };

  const toggleCourtesy = (id: string) => {
      setItems(items.map(i => i.id === id ? { ...i, isCourtesy: !i.isCourtesy } : i));
  };

  // Calculations
  const subtotal = items.reduce((acc, item) => acc + (item.isCourtesy ? 0 : item.price * item.quantity), 0);
  const discountValue = (typeof discount === 'number' && !isNaN(discount)) ? Math.abs(discount) : 0;
  const serviceFeeValue = serviceFee ? subtotal * 0.1 : 0;
  const total = Math.max(0, subtotal + serviceFeeValue - discountValue);
  const splitValue = total / (Math.max(1, splitCount) || 1);

  const handleSave = () => {
    if (!tableOrName) return alert('Informe a mesa ou nome.');
    const order: Order = {
      id: existingOrder?.id || generateId(),
      tableOrName,
      items,
      status: existingOrder?.status || 'open',
      openedAt: existingOrder?.openedAt || new Date().toISOString(),
      total,
      discount: discountValue,
      serviceFee
    };
    onSaveOrder(order);
  };

  const handleConfirmClose = () => {
    if (!tableOrName) return alert('Informe a mesa ou nome.');
    const order: Order = {
      id: existingOrder?.id || generateId(),
      tableOrName,
      items,
      status: 'closed',
      openedAt: existingOrder?.openedAt || new Date().toISOString(),
      closedAt: new Date().toISOString(),
      total,
      discount: discountValue,
      serviceFee
    };
    if (onCloseOrder) onCloseOrder(order, selectedPayment);
  };

  if (isClosing) {
    return (
        <div className="flex flex-col h-full justify-between p-4 text-center overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Pagamento</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-2 font-bold text-lg">{tableOrName}</p>
            
            <div className="bg-teal-500 text-white p-8 rounded-3xl mb-8 shadow-lg">
                <p className="text-sm font-bold uppercase opacity-80 mb-1">Total a Pagar</p>
                <p className="text-5xl font-black tracking-tight">{formatCurrency(total)}</p>
            </div>

            <div className="bg-gray-50 dark:bg-slate-700/50 p-6 rounded-2xl mb-8 border border-gray-200 dark:border-slate-600">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4 block">Dividir Conta</label>
                <div className="flex items-center justify-center gap-6 mb-4">
                    <button onClick={() => setSplitCount(Math.max(1, splitCount - 1))} className="w-12 h-12 rounded-xl bg-white dark:bg-slate-600 border border-gray-200 dark:border-slate-500 shadow-sm text-xl font-bold text-gray-700 dark:text-white flex items-center justify-center hover:bg-gray-50">-</button>
                    <span className="text-3xl font-black w-12 text-gray-800 dark:text-white">{splitCount}</span>
                    <button onClick={() => setSplitCount(splitCount + 1)} className="w-12 h-12 rounded-xl bg-white dark:bg-slate-600 border border-gray-200 dark:border-slate-500 shadow-sm text-xl font-bold text-gray-700 dark:text-white flex items-center justify-center hover:bg-gray-50">+</button>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-slate-600">
                    <span className="font-bold text-gray-600 dark:text-gray-300">Por Pessoa:</span>
                    <span className="text-2xl font-black text-teal-600 dark:text-teal-400">{formatCurrency(splitValue)}</span>
                </div>
            </div>

            <div className="flex-1">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4 block text-left">Forma de Pagamento</label>
                <div className="grid grid-cols-2 gap-3 pb-6">
                    {PAYMENT_METHOD_OPTIONS.map(opt => (
                        <button 
                            key={opt.value} 
                            onClick={() => setSelectedPayment(opt.value as PaymentMethod)}
                            className={`p-4 rounded-xl font-bold transition-all border ${selectedPayment === opt.value ? 'bg-rose-500 border-rose-600 text-white shadow-lg scale-105' : 'bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50'}`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex gap-3 mt-4 shrink-0">
                <button onClick={() => setIsClosing(false)} className="flex-1 py-4 font-bold text-gray-500 hover:text-gray-800 transition-colors">Voltar</button>
                <button onClick={handleConfirmClose} className="flex-[2] py-4 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-teal-500/30">Confirmar</button>
            </div>
        </div>
    );
  }

  // Filter Products by Category for Quick Touch
  const drinks = (settings.products || []).filter(p => p.category === 'drink');
  const foods = (settings.products || []).filter(p => p.category === 'food');
  const others = (settings.products || []).filter(p => p.category === 'other');

  return (
    <div className="flex flex-col md:flex-row h-full gap-6 overflow-hidden bg-gray-50 dark:bg-transparent">
      {/* LEFT COLUMN: TICKET */}
      <div className="w-full md:w-1/3 flex flex-col h-full bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-gray-300 dark:border-slate-700 overflow-hidden shadow-inner">
        {/* Ticket Header */}
        <div className="p-4 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shrink-0">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight truncate max-w-[200px]">
                    {existingOrder ? existingOrder.tableOrName : 'Nova Comanda'}
                </h2>
                {!existingOrder && (
                     <input type="text" placeholder="Mesa / Nome" value={tableOrName} onChange={(e) => setTableOrName(e.target.value)} className="w-36 text-right bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-2 py-1 focus:border-rose-500 outline-none font-bold text-gray-800 dark:text-white" autoFocus />
                )}
                {existingOrder && <button onClick={() => setTableOrName(prompt('Editar nome:', tableOrName) || tableOrName)} className="text-gray-400 hover:text-rose-500 bg-gray-100 dark:bg-slate-700 p-2 rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg></button>}
            </div>
            
            {/* Manual Add */}
            <div className="flex gap-2">
                <input ref={customItemInputRef} id="newItemName" type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="Item manual..." className="flex-[2] bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 text-gray-900 dark:text-white" />
                <div className="flex-1 relative">
                    <span className="absolute left-2 top-2 text-xs text-gray-400 font-bold">R$</span>
                    <input type="number" min="0" value={newItemPrice} onChange={(e) => setNewItemPrice(e.target.value ? Math.abs(parseFloat(e.target.value)) : '')} className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg pl-6 pr-2 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 text-gray-900 dark:text-white" />
                </div>
                <button onClick={addCustomItem} className="bg-gray-800 dark:bg-white text-white dark:text-gray-900 rounded-lg w-10 flex items-center justify-center font-bold shadow-sm hover:scale-105 transition-transform border border-transparent">+</button>
            </div>
        </div>

        {/* Scrollable Items List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2 bg-slate-50 dark:bg-transparent">
            {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                    <p className="text-sm font-medium">Comanda vazia</p>
                    <p className="text-xs">Adicione itens ao lado</p>
                </div>
            ) : (
                <AnimatePresence initial={false}>
                    {items.map(item => (
                        <motion.div 
                            key={item.id} 
                            initial={{ opacity: 0, x: -10 }} 
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            className={`p-3 rounded-xl border flex flex-col gap-2 transition-all shadow-sm ${item.isCourtesy ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'}`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col items-center bg-gray-100 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 p-0.5">
                                        <button onClick={() => incrementQuantity(item.id)} className="w-6 h-5 flex items-center justify-center text-xs font-bold hover:bg-white dark:hover:bg-slate-600 rounded text-gray-600 dark:text-gray-300">+</button>
                                        <span className="text-sm font-black w-6 text-center text-gray-800 dark:text-white">{item.quantity}</span>
                                        <button onClick={() => decrementQuantity(item.id)} className="w-6 h-5 flex items-center justify-center text-xs font-bold hover:bg-white dark:hover:bg-slate-600 rounded text-gray-600 dark:text-gray-300">-</button>
                                    </div>
                                    <div>
                                        <span className={`font-bold text-sm block ${item.status === 'delivered' ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-gray-200'}`}>{item.name}</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{formatCurrency(item.price)} un</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`font-black block ${item.isCourtesy ? 'text-amber-500 line-through' : 'text-gray-900 dark:text-white'}`}>
                                        {formatCurrency(item.price * item.quantity)}
                                    </span>
                                    {item.status === 'delivered' ? (
                                        <span onClick={() => toggleStatus(item.id)} className="text-[10px] font-bold text-green-600 cursor-pointer flex items-center justify-end gap-1 hover:underline">
                                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                                           Entregue
                                        </span>
                                    ) : (
                                        <span onClick={() => toggleStatus(item.id)} className="text-[10px] font-bold text-gray-400 cursor-pointer hover:text-gray-600 hover:underline bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-600">Pendente</span>
                                    )}
                                </div>
                            </div>
                            
                            {/* Actions Row */}
                            <div className="flex justify-end gap-2 border-t border-gray-100 dark:border-slate-700/50 pt-2 mt-1">
                                <button onClick={() => toggleCourtesy(item.id)} className={`text-[10px] font-bold uppercase px-2 py-1 rounded transition-colors ${item.isCourtesy ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 hover:bg-amber-50 hover:text-amber-600 border border-gray-200 dark:border-slate-600'}`}>
                                    {item.isCourtesy ? 'Cortesia Ativa' : 'Cortesia'}
                                </button>
                                <button onClick={() => removeItem(item.id)} className="text-[10px] font-bold text-rose-500 uppercase px-2 py-1 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 border border-transparent hover:border-rose-200">
                                    Remover
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            )}
        </div>

        {/* Totals Footer */}
        <div className="bg-white dark:bg-slate-800 p-4 border-t border-gray-200 dark:border-slate-700 shrink-0 shadow-[0_-5px_20px_rgba(0,0,0,0.03)] z-10">
            <div className="flex items-center justify-between mb-3 text-sm">
                <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400 font-bold text-xs">10% Serviço</span>
                    <div onClick={() => setServiceFee(!serviceFee)} className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors border ${serviceFee ? 'bg-teal-500 border-teal-600' : 'bg-gray-200 dark:bg-slate-600 border-gray-300 dark:border-slate-500'}`}>
                        <div className={`w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-transform ${serviceFee ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400 font-bold text-xs">Desc.</span>
                    <div className="relative">
                        <span className="absolute left-1.5 top-1 text-xs text-gray-400">R$</span>
                        <input type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value ? Math.abs(parseFloat(e.target.value)) : '')} className="w-20 bg-gray-50 dark:bg-slate-700 rounded border border-gray-300 dark:border-slate-600 px-2 pl-5 py-1 text-right text-xs font-bold outline-none focus:border-rose-500" placeholder="0.00" />
                    </div>
                </div>
            </div>
            
            <div className="flex justify-between items-end mb-4 bg-gray-50 dark:bg-slate-900/50 p-3 rounded-xl border border-gray-200 dark:border-slate-700">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">TOTAL</span>
                <span className="text-3xl font-black text-gray-900 dark:text-white">{formatCurrency(total)}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <button onClick={handleSave} className="py-3 rounded-xl border border-gray-300 dark:border-slate-600 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors bg-white dark:bg-transparent">Salvar</button>
                <button onClick={() => setIsClosing(true)} className="py-3 rounded-xl bg-gray-800 dark:bg-white text-white dark:text-gray-900 font-bold shadow-lg hover:bg-black transition-transform">Fechar Conta</button>
            </div>
        </div>
      </div>

      {/* RIGHT COLUMN: CATALOG */}
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-800/50 rounded-3xl border border-gray-300 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/80 backdrop-blur-sm shrink-0">
             <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                <span className="text-xs font-bold uppercase tracking-widest">Toque Rápido</span>
             </div>
             <span className="bg-white dark:bg-slate-700 px-2 py-1 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-slate-600">{(settings.products || []).length} itens</span>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6 bg-white dark:bg-transparent">
            {/* Drinks Section */}
            {drinks.length > 0 && (
                <section>
                    <h3 className="text-xs font-bold text-blue-600 dark:text-blue-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Bebidas
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {drinks.map(prod => (
                            <motion.button 
                                key={prod.id} 
                                whileTap={{ scale: 0.95 }}
                                onClick={() => addCatalogItem(prod)}
                                className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm hover:border-blue-400 dark:hover:border-blue-800 transition-colors text-left flex flex-col justify-between h-32 group hover:shadow-md"
                            >
                                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform origin-left">🍺</div>
                                <div>
                                    <p className="font-bold text-sm text-gray-800 dark:text-white leading-tight line-clamp-2">{prod.name}</p>
                                    <div className="flex justify-between items-center mt-1">
                                        <p className="text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800">{formatCurrency(prod.price)}</p>
                                    </div>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </section>
            )}

            {/* Foods Section */}
            {foods.length > 0 && (
                <section>
                    <h3 className="text-xs font-bold text-orange-600 dark:text-orange-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Comidas
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {foods.map(prod => (
                            <motion.button 
                                key={prod.id} 
                                whileTap={{ scale: 0.95 }}
                                onClick={() => addCatalogItem(prod)}
                                className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm hover:border-orange-400 dark:hover:border-orange-800 transition-colors text-left flex flex-col justify-between h-32 group hover:shadow-md"
                            >
                                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform origin-left">🍔</div>
                                <div>
                                    <p className="font-bold text-sm text-gray-800 dark:text-white leading-tight line-clamp-2">{prod.name}</p>
                                    <div className="flex justify-between items-center mt-1">
                                        <p className="text-xs font-bold text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-1.5 py-0.5 rounded border border-orange-100 dark:border-orange-800">{formatCurrency(prod.price)}</p>
                                    </div>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </section>
            )}

             {/* Other Section */}
             {others.length > 0 && (
                <section>
                    <h3 className="text-xs font-bold text-gray-600 dark:text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span> Outros
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {others.map(prod => (
                            <motion.button 
                                key={prod.id} 
                                whileTap={{ scale: 0.95 }}
                                onClick={() => addCatalogItem(prod)}
                                className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm hover:border-gray-400 transition-colors text-left flex flex-col justify-between h-32 group hover:shadow-md"
                            >
                                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform origin-left">📦</div>
                                <div>
                                    <p className="font-bold text-sm text-gray-800 dark:text-white leading-tight line-clamp-2">{prod.name}</p>
                                    <div className="flex justify-between items-center mt-1">
                                        <p className="text-xs font-bold text-gray-700 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600">{formatCurrency(prod.price)}</p>
                                    </div>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </section>
            )}

            {(settings.products || []).length === 0 && (
                <div className="flex flex-col items-center justify-center h-48 text-center text-gray-400">
                    <p className="text-sm font-bold mb-1">Cardápio Vazio</p>
                    <p className="text-xs">Vá em Ajustes > Cardápio para cadastrar.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default OrderForm;