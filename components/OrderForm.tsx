
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Order, OrderItem, PaymentMethod, Product } from '../types';
import { generateId, formatCurrency } from '../utils';
import { PAYMENT_METHOD_OPTIONS } from '../constants';
import { useSettingsManager } from '../hooks';
import BarcodeScanner from './BarcodeScanner';

interface OrderFormProps {
  existingOrder?: Order | null;
  onSaveOrder: (order: Order) => void;
  onCloseOrder?: (order: Order, paymentMethod: PaymentMethod) => void;
  onCancel: () => void;
}

type MobileTab = 'menu' | 'ticket';

const OrderForm: React.FC<OrderFormProps> = ({ existingOrder, onSaveOrder, onCloseOrder, onCancel }) => {
  const { settings, setSettings } = useSettingsManager();
  const customItemInputRef = useRef<HTMLInputElement>(null);
  
  // Mobile Tab State
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>('menu');
  const [searchTerm, setSearchTerm] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [linkProductModal, setLinkProductModal] = useState<{code: string} | null>(null);

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

  // Helper for haptics
  const vibrate = (ms: number = 10) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(ms);
    }
  };

  useEffect(() => {
    if (existingOrder) {
      setTableOrName(existingOrder.tableOrName);
      setItems(existingOrder.items);
      setDiscount(existingOrder.discount || '');
      setServiceFee(existingOrder.serviceFee || false);
      // Se for edição, começa vendo a comanda. Se for nova, começa no cardápio.
      setActiveMobileTab('ticket'); 
    } else {
      setActiveMobileTab('menu');
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
    vibrate(15);
    
    // Focus back on input using Ref
    setTimeout(() => {
        customItemInputRef.current?.focus();
    }, 50);
  };

  const addCatalogItem = (product: Product) => {
     // Check if item exists to increment
     const existingItemIndex = items.findIndex(i => (i.productId === product.id || i.name === product.name) && !i.isCourtesy && i.status === 'pending');
     
     if (existingItemIndex >= 0) {
        const updatedItems = [...items];
        updatedItems[existingItemIndex].quantity += 1;
        setItems(updatedItems);
     } else {
        const newItem: OrderItem = {
            id: generateId(),
            productId: product.id, // Vínculo importante para o estoque
            name: product.name,
            price: product.price,
            quantity: 1,
            status: 'pending',
            isCourtesy: false
        };
        setItems([...items, newItem]);
     }
     vibrate(15);
  };

  const handleScan = (code: string) => {
      // 1. Try to find product with this code
      const foundProduct = settings.products.find(p => p.barcode === code);
      
      if (foundProduct) {
          addCatalogItem(foundProduct);
          // Optional: Beep or Toast here
      } else {
          // 2. Not found, ask to link
          setShowScanner(false);
          setLinkProductModal({ code });
      }
  };

  const linkProductToBarcode = (product: Product) => {
      if (!linkProductModal) return;
      
      // Update Settings with new barcode
      const updatedProducts = settings.products.map(p => 
          p.id === product.id ? { ...p, barcode: linkProductModal.code } : p
      );
      setSettings({ ...settings, products: updatedProducts });
      
      // Add item to order
      addCatalogItem(product);
      
      // Close modal
      setLinkProductModal(null);
  };

  const getProductQuantity = (productName: string) => {
      return items
        .filter(i => i.name === productName && !i.isCourtesy && i.status === 'pending')
        .reduce((acc, i) => acc + i.quantity, 0);
  };

  const incrementQuantity = (id: string) => {
    setItems(items.map(i => i.id === id ? { ...i, quantity: i.quantity + 1 } : i));
    vibrate(5);
  };

  const decrementQuantity = (id: string) => {
    setItems(items.map(i => {
      if (i.id === id) {
        return { ...i, quantity: Math.max(1, i.quantity - 1) };
      }
      return i;
    }));
    vibrate(5);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
    vibrate(10);
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
    vibrate(20);
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
        <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col h-full justify-between p-4 md:p-8 text-center overflow-y-auto"
        >
            <div className="max-w-md mx-auto w-full">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Pagamento</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-2 font-bold text-lg">{tableOrName}</p>
                
                <div className="bg-teal-500 text-white p-8 rounded-3xl mb-8 shadow-lg shadow-teal-500/20">
                    <p className="text-sm font-bold uppercase opacity-80 mb-1">Total a Pagar</p>
                    <p className="text-5xl font-black tracking-tight">{formatCurrency(total)}</p>
                </div>

                <div className="bg-gray-50 dark:bg-slate-700/50 p-6 rounded-2xl mb-8 border border-gray-200 dark:border-slate-600">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4 block">Dividir Conta</label>
                    <div className="flex items-center justify-center gap-6 mb-4">
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSplitCount(Math.max(1, splitCount - 1))} className="w-12 h-12 rounded-xl bg-white dark:bg-slate-600 border border-gray-200 dark:border-slate-500 shadow-sm text-xl font-bold text-gray-700 dark:text-white flex items-center justify-center hover:bg-gray-50">-</motion.button>
                        <span className="text-3xl font-black w-12 text-gray-800 dark:text-white">{splitCount}</span>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSplitCount(splitCount + 1)} className="w-12 h-12 rounded-xl bg-white dark:bg-slate-600 border border-gray-200 dark:border-slate-500 shadow-sm text-xl font-bold text-gray-700 dark:text-white flex items-center justify-center hover:bg-gray-50">+</motion.button>
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
                                onClick={() => { setSelectedPayment(opt.value as PaymentMethod); vibrate(5); }}
                                className={`p-4 rounded-xl font-bold transition-all border ${selectedPayment === opt.value ? 'bg-rose-500 border-rose-600 text-white shadow-lg scale-105' : 'bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50'}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex gap-3 mt-4 shrink-0 pb-safe">
                    <button onClick={() => setIsClosing(false)} className="flex-1 py-4 font-bold text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors">Voltar</button>
                    <button onClick={handleConfirmClose} className="flex-[2] py-4 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-teal-500/30">Confirmar</button>
                </div>
            </div>
        </motion.div>
    );
  }

  // Filter Products by Category for Quick Touch with Search
  const allProducts = settings.products || [];
  const filteredProducts = allProducts.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  
  const drinks = filteredProducts.filter(p => p.category === 'drink');
  const foods = filteredProducts.filter(p => p.category === 'food');
  const others = filteredProducts.filter(p => p.category === 'other');

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-transparent relative">
      {/* Link Product Modal */}
      {linkProductModal && (
          <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Novo Código Detectado!</h3>
                  <p className="text-sm text-gray-500 mb-4">O código <strong>{linkProductModal.code}</strong> não está cadastrado. Selecione um produto abaixo para vincular:</p>
                  <div className="max-h-60 overflow-y-auto mb-4 border rounded-xl divide-y dark:divide-slate-700 border-gray-200 dark:border-slate-700">
                      {allProducts.map(p => (
                          <button key={p.id} onClick={() => linkProductToBarcode(p)} className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-slate-700 flex justify-between items-center">
                              <span className="font-bold text-gray-800 dark:text-gray-200">{p.name}</span>
                              <span className="text-xs text-gray-500">{formatCurrency(p.price)}</span>
                          </button>
                      ))}
                  </div>
                  <button onClick={() => setLinkProductModal(null)} className="w-full py-3 text-red-500 font-bold border border-red-200 rounded-xl hover:bg-red-50">Cancelar</button>
              </div>
          </div>
      )}

      {showScanner && <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}

      {/* MOBILE TAB NAVIGATION (Fixed Top) */}
      <div className="md:hidden flex p-2 gap-2 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shrink-0 z-20">
          <button 
             onClick={() => { setActiveMobileTab('menu'); vibrate(5); }}
             className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${activeMobileTab === 'menu' ? 'bg-rose-500 text-white shadow-md transform scale-105' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400'}`}
          >
             Cardápio
          </button>
          <button 
             onClick={() => { setActiveMobileTab('ticket'); vibrate(5); }}
             className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wide transition-all relative ${activeMobileTab === 'ticket' ? 'bg-teal-500 text-white shadow-md transform scale-105' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400'}`}
          >
             Comanda {items.length > 0 && <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white min-w-[1.25rem] h-5 rounded-full flex items-center justify-center text-[10px] border-2 border-white dark:border-slate-800 shadow-sm">{items.reduce((acc, i) => acc + i.quantity, 0)}</span>}
          </button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden md:gap-6 md:p-0">
        
        {/* LEFT COLUMN: TICKET (Visible on Desktop OR when Mobile Tab is 'ticket') */}
        <div className={`${activeMobileTab === 'ticket' ? 'flex' : 'hidden'} md:flex w-full md:w-1/3 flex-col h-full bg-slate-50 dark:bg-slate-900/50 md:rounded-3xl border-b md:border border-gray-300 dark:border-slate-700 overflow-hidden shadow-inner relative z-10 shrink-0`}>
            {/* Ticket Header */}
            <div className="p-4 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shrink-0">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight truncate max-w-[200px]">
                        {existingOrder ? existingOrder.tableOrName : 'Nova Comanda'}
                    </h2>
                    {!existingOrder && (
                        <input type="text" placeholder="Mesa / Nome" value={tableOrName} onChange={(e) => setTableOrName(e.target.value)} className="w-36 text-right bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-2 py-1 focus:border-rose-500 outline-none font-bold text-gray-800 dark:text-white" autoFocus />
                    )}
                    {existingOrder && <button onClick={() => setTableOrName(prompt('Editar nome:', tableOrName) || tableOrName)} className="text-gray-400 hover:text-rose-500 bg-gray-100 dark:bg-slate-700 p-2 rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg></button>}
                </div>
                
                {/* Manual Add - Vertical Stack on Mobile, Row on Desktop */}
                <div className="flex flex-col sm:flex-row gap-2">
                    <input ref={customItemInputRef} id="newItemName" type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="Item manual..." className="w-full sm:flex-[2] bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 text-gray-900 dark:text-white" />
                    <div className="flex gap-2 w-full sm:flex-1">
                        <div className="flex-1 relative">
                            <span className="absolute left-2 top-2 text-xs text-gray-400 font-bold">R$</span>
                            <input type="number" min="0" value={newItemPrice} onChange={(e) => setNewItemPrice(e.target.value ? Math.abs(parseFloat(e.target.value)) : '')} className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg pl-6 pr-2 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 text-gray-900 dark:text-white appearance-none" />
                        </div>
                        <button onClick={addCustomItem} className="bg-gray-800 dark:bg-white text-white dark:text-gray-900 rounded-lg w-12 flex items-center justify-center font-bold shadow-sm hover:scale-105 transition-transform border border-transparent">+</button>
                    </div>
                </div>
            </div>

            {/* Scrollable Items List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2 bg-slate-50 dark:bg-transparent min-h-0 pb-32 md:pb-4">
                {items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                        <p className="text-sm font-medium">Comanda vazia</p>
                        <p className="text-xs">Adicione itens na aba Cardápio</p>
                    </div>
                ) : (
                    <AnimatePresence initial={false} mode="popLayout">
                        {items.map(item => (
                            <motion.div 
                                layout
                                key={item.id} 
                                initial={{ opacity: 0, x: -10, scale: 0.95 }} 
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
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

            {/* Totals Footer - Always visible in Ticket Tab or Desktop */}
            <div className="bg-white dark:bg-slate-800 p-4 border-t border-gray-200 dark:border-slate-700 shrink-0 shadow-[0_-5px_20px_rgba(0,0,0,0.03)] z-10 absolute bottom-0 md:relative w-full">
                <div className="flex items-center justify-between mb-3 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-600 dark:text-gray-400 font-bold text-xs">10% Serviço</span>
                        <div onClick={() => setServiceFee(!serviceFee)} className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors border ${serviceFee ? 'bg-teal-500 border-teal-600' : 'bg-gray-200 dark:bg-slate-600 border-gray-300 dark:border-slate-500'}`}>
                            <motion.div layout className={`w-3.5 h-3.5 bg-white rounded-full shadow-sm ${serviceFee ? 'ml-auto' : 'ml-0'}`}></motion.div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-600 dark:text-gray-400 font-bold text-xs">Desc.</span>
                        <div className="relative">
                            <span className="absolute left-1.5 top-1 text-xs text-gray-400">R$</span>
                            <input type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value ? Math.abs(parseFloat(e.target.value)) : '')} className="w-20 bg-gray-50 dark:bg-slate-700 rounded border border-gray-300 dark:border-slate-600 px-2 pl-5 py-1 text-right text-xs font-bold outline-none focus:border-rose-500 appearance-none" placeholder="0.00" />
                        </div>
                    </div>
                </div>
                
                <div className="flex justify-between items-end mb-4 bg-gray-50 dark:bg-slate-900/50 p-3 rounded-xl border border-gray-200 dark:border-slate-700">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">TOTAL</span>
                    <span className="text-3xl font-black text-gray-900 dark:text-white">{formatCurrency(total)}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleSave} className="py-3 rounded-xl border border-gray-300 dark:border-slate-600 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors bg-white dark:bg-transparent">Salvar</button>
                    <button onClick={() => setIsClosing(true)} className="py-3 rounded-xl bg-gray-800 dark:bg-white text-white dark:text-gray-900 font-bold shadow-lg hover:bg-black transition-transform active:scale-95">Fechar Conta</button>
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN: CATALOG (Visible on Desktop OR when Mobile Tab is 'menu') */}
        <div className={`${activeMobileTab === 'menu' ? 'flex' : 'hidden'} md:flex flex-1 flex-col h-full bg-white dark:bg-slate-800/50 md:rounded-3xl border-l-0 md:border border-gray-300 dark:border-slate-700 overflow-hidden shadow-sm relative`}>
            {/* Desktop Header for Catalog */}
            <div className="hidden md:flex p-4 border-b border-gray-200 dark:border-slate-700 justify-between items-center bg-gray-50 dark:bg-slate-800/80 backdrop-blur-sm shrink-0">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    <span className="text-xs font-bold uppercase tracking-widest">Toque Rápido</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowScanner(true)} className="bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 p-2 rounded-lg text-gray-700 dark:text-white transition-colors" title="Escanear Código">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75zM16.5 19.5h.75v.75h-.75v-.75z" /></svg>
                    </button>
                    <div className="relative">
                       <input 
                          type="text" 
                          placeholder="Buscar item..." 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-xs py-1.5 px-3 pl-8 focus:ring-1 focus:ring-rose-500 outline-none"
                       />
                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 absolute left-2.5 top-2 text-gray-400"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" /></svg>
                    </div>
                </div>
            </div>

            {/* Mobile Header for Catalog (Search) */}
            <div className="md:hidden p-3 border-b border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0 flex gap-2">
                 <button onClick={() => setShowScanner(true)} className="bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 px-3 rounded-xl text-gray-700 dark:text-white transition-colors flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75zM16.5 19.5h.75v.75h-.75v-.75z" /></svg>
                 </button>
                 <div className="relative flex-1">
                   <input 
                      type="text" 
                      placeholder="Buscar produto..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-gray-100 dark:bg-slate-700/50 border border-transparent dark:border-slate-600 rounded-xl text-sm py-3 px-4 pl-10 focus:bg-white dark:focus:bg-slate-700 focus:border-rose-500 outline-none transition-all shadow-inner"
                   />
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 absolute left-3 top-3 text-gray-400"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" /></svg>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6 bg-white dark:bg-transparent pb-32 md:pb-4">
                {/* Drinks Section */}
                {drinks.length > 0 && (
                    <section>
                        <h3 className="text-xs font-bold text-blue-600 dark:text-blue-500 uppercase tracking-widest mb-3 flex items-center gap-2 px-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Bebidas
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                            {drinks.map(prod => {
                                const qty = getProductQuantity(prod.name);
                                return (
                                <motion.button 
                                    key={prod.id} 
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => addCatalogItem(prod)}
                                    className={`relative bg-white dark:bg-slate-800 p-3 rounded-2xl border transition-all text-left flex flex-col justify-between h-28 group shadow-sm overflow-hidden ${qty > 0 ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200 dark:border-slate-700 hover:border-blue-400'}`}
                                >
                                    {qty > 0 && <span className="absolute top-2 right-2 bg-blue-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-md z-10">{qty}</span>}
                                    <div className="text-2xl mb-1 group-hover:scale-110 transition-transform origin-left">🍺</div>
                                    <div>
                                        <p className="font-bold text-xs text-gray-800 dark:text-white leading-tight line-clamp-2 mb-1">{prod.name}</p>
                                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400">{formatCurrency(prod.price)}</p>
                                    </div>
                                </motion.button>
                            )})}
                        </div>
                    </section>
                )}

                {/* Foods Section */}
                {foods.length > 0 && (
                    <section>
                        <h3 className="text-xs font-bold text-orange-600 dark:text-orange-500 uppercase tracking-widest mb-3 flex items-center gap-2 px-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Comidas
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                            {foods.map(prod => {
                                const qty = getProductQuantity(prod.name);
                                return (
                                <motion.button 
                                    key={prod.id} 
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => addCatalogItem(prod)}
                                    className={`relative bg-white dark:bg-slate-800 p-3 rounded-2xl border transition-all text-left flex flex-col justify-between h-28 group shadow-sm overflow-hidden ${qty > 0 ? 'border-orange-500 ring-1 ring-orange-500' : 'border-gray-200 dark:border-slate-700 hover:border-orange-400'}`}
                                >
                                    {qty > 0 && <span className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-md z-10">{qty}</span>}
                                    <div className="text-2xl mb-1 group-hover:scale-110 transition-transform origin-left">🍔</div>
                                    <div>
                                        <p className="font-bold text-xs text-gray-800 dark:text-white leading-tight line-clamp-2 mb-1">{prod.name}</p>
                                        <p className="text-xs font-bold text-orange-600 dark:text-orange-400">{formatCurrency(prod.price)}</p>
                                    </div>
                                </motion.button>
                            )})}
                        </div>
                    </section>
                )}

                {/* Other Section */}
                {others.length > 0 && (
                    <section>
                        <h3 className="text-xs font-bold text-gray-600 dark:text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2 px-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span> Outros
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                            {others.map(prod => {
                                const qty = getProductQuantity(prod.name);
                                return (
                                <motion.button 
                                    key={prod.id} 
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => addCatalogItem(prod)}
                                    className={`relative bg-white dark:bg-slate-800 p-3 rounded-2xl border transition-all text-left flex flex-col justify-between h-28 group shadow-sm overflow-hidden ${qty > 0 ? 'border-gray-500 ring-1 ring-gray-500' : 'border-gray-200 dark:border-slate-700 hover:border-gray-400'}`}
                                >
                                    {qty > 0 && <span className="absolute top-2 right-2 bg-gray-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-md z-10">{qty}</span>}
                                    <div className="text-2xl mb-1 group-hover:scale-110 transition-transform origin-left">📦</div>
                                    <div>
                                        <p className="font-bold text-xs text-gray-800 dark:text-white leading-tight line-clamp-2 mb-1">{prod.name}</p>
                                        <p className="text-xs font-bold text-gray-600 dark:text-gray-400">{formatCurrency(prod.price)}</p>
                                    </div>
                                </motion.button>
                            )})}
                        </div>
                    </section>
                )}

                {filteredProducts.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-48 text-center text-gray-400">
                        <p className="text-sm font-bold mb-1">Nenhum item encontrado</p>
                        <p className="text-xs">Tente outro termo ou verifique o cardápio.</p>
                    </div>
                )}
            </div>

            {/* Mobile Floating Summary Button (Only when in Menu Tab and has items) */}
            {activeMobileTab === 'menu' && items.length > 0 && (
               <div className="md:hidden absolute bottom-4 left-4 right-4 z-20">
                  <motion.button 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    onClick={() => { setActiveMobileTab('ticket'); vibrate(10); }}
                    className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl shadow-2xl font-black flex justify-between px-6 items-center text-sm ring-1 ring-white/20"
                  >
                     <div className="flex items-center gap-2">
                        <span className="bg-rose-500 text-white text-[10px] w-6 h-6 flex items-center justify-center rounded-full shadow-sm">{items.reduce((acc, i) => acc + i.quantity, 0)}</span>
                        <span>Ver Comanda</span>
                     </div>
                     <span>{formatCurrency(total)}</span>
                  </motion.button>
               </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default OrderForm;
