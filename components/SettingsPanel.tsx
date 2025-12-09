import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppSettings, Expense, SettingsTab, ExpenseCategory, PaymentMethod, Product, Order, OrderItem } from '../types';
import { generateId, getDateFromDay, formatCurrency } from '../utils';

interface SettingsPanelProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onClearData: () => void;
  expenses: Expense[];
  onImportData: (expenses: Expense[], settings: AppSettings, orders?: Order[]) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onUpdateSettings, onClearData, expenses, onImportData }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // General & Security states
  const [pinStep, setPinStep] = useState<'enter' | 'confirm'>('enter');
  const [tempPin, setTempPin] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [confirmRemovePin, setConfirmRemovePin] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleteArmed, setIsDeleteArmed] = useState(false);
  const [confirmDemoData, setConfirmDemoData] = useState(false);
  const [importPreview, setImportPreview] = useState<{ count: number, hasSettings: boolean, data: any } | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Menu Product States
  const [editingProdId, setEditingProdId] = useState<string | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodCat, setProdCat] = useState<'food' | 'drink' | 'other'>('drink');

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleSaveProduct = () => {
    if (!prodName || !prodPrice) return showStatus('error', 'Preencha nome e preço');
    if (Number(prodPrice) < 0) return showStatus('error', 'O preço não pode ser negativo');
    
    let newProducts = [...(settings.products || [])];

    if (editingProdId) {
      // Edit existing
      newProducts = newProducts.map(p => 
        p.id === editingProdId 
          ? { ...p, name: prodName, price: Number(prodPrice), category: prodCat }
          : p
      );
      showStatus('success', 'Produto atualizado!');
    } else {
      // Add new
      const newProd: Product = {
        id: generateId(),
        name: prodName,
        price: Number(prodPrice),
        category: prodCat
      };
      newProducts.push(newProd);
      showStatus('success', 'Produto adicionado!');
    }

    onUpdateSettings({ ...settings, products: newProducts });
    resetForm();
  };

  const handleEditClick = (prod: Product) => {
    setEditingProdId(prod.id);
    setProdName(prod.name);
    setProdPrice(String(prod.price));
    setProdCat(prod.category);
  };

  const handleDeleteProduct = (id: string) => {
    onUpdateSettings({ ...settings, products: settings.products.filter(p => p.id !== id) });
    if (editingProdId === id) resetForm();
  };

  const resetForm = () => {
    setEditingProdId(null);
    setProdName('');
    setProdPrice('');
    setProdCat('drink');
  };

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
    showStatus('success', 'Backup baixado com sucesso!');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.settings && json.expenses) {
          setImportPreview({ count: json.expenses.length, hasSettings: !!json.settings, data: json });
        } else {
          showStatus('error', 'Arquivo inválido.');
        }
      } catch (err) { showStatus('error', 'Erro ao ler arquivo.'); }
    };
    reader.readAsText(file);
    e.target.value = ''; 
  };

  const generateDemoData = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const demoExpenses: Expense[] = [];
    const demoOrders: Order[] = [];
    
    // 1. Ensure Products Exist
    let demoProducts = [...(settings.products || [])];
    if (demoProducts.length === 0) {
      demoProducts = [
        { id: generateId(), name: 'Água de Coco', price: 12.00, category: 'drink' },
        { id: generateId(), name: 'Heineken 600ml', price: 18.00, category: 'drink' },
        { id: generateId(), name: 'Caipirinha', price: 25.00, category: 'drink' },
        { id: generateId(), name: 'Refrigerante', price: 8.00, category: 'drink' },
        { id: generateId(), name: 'Isca de Peixe', price: 65.00, category: 'food' },
        { id: generateId(), name: 'Batata Frita', price: 35.00, category: 'food' },
        { id: generateId(), name: 'Camarão Alho e Óleo', price: 85.00, category: 'food' },
        { id: generateId(), name: 'Pastel (Unid)', price: 12.00, category: 'food' },
      ];
    }

    const getRandomItem = () => demoProducts[Math.floor(Math.random() * demoProducts.length)];
    const getRandomPayment = () => {
      const r = Math.random();
      if (r < 0.4) return PaymentMethod.PIX;
      if (r < 0.7) return PaymentMethod.CREDIT_CARD;
      if (r < 0.9) return PaymentMethod.DEBIT_CARD;
      return PaymentMethod.MONEY;
    };

    // 2. Loop through days of the current month until today
    for (let day = 1; day <= today.getDate(); day++) {
        const dateStr = getDateFromDay(day, currentMonth, currentYear);
        const dateObj = new Date(currentYear, currentMonth, day);
        const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6; // Sun or Sat
        const isFriday = dateObj.getDay() === 5;
        
        // Volume multiplier: Weekends are busier
        let dailyVolume = isWeekend ? Math.floor(Math.random() * 8) + 8 : Math.floor(Math.random() * 4) + 2; 
        if (isFriday) dailyVolume += 3;

        // Generate Daily Closed Orders & Income
        for (let k = 0; k < dailyVolume; k++) {
            const numItems = Math.floor(Math.random() * 4) + 1;
            const items: OrderItem[] = [];
            let orderTotal = 0;

            for (let j = 0; j < numItems; j++) {
                const prod = getRandomItem();
                const qty = Math.floor(Math.random() * 2) + 1;
                items.push({
                    id: generateId(),
                    name: prod.name,
                    price: prod.price,
                    quantity: qty,
                    status: 'delivered',
                    isCourtesy: false
                });
                orderTotal += prod.price * qty;
            }

            const payment = getRandomPayment();
            const serviceFee = Math.random() > 0.5;
            const finalTotal = serviceFee ? orderTotal * 1.1 : orderTotal;

            // Create Closed Order
            demoOrders.push({
                id: generateId(),
                tableOrName: `Mesa ${Math.floor(Math.random() * 20) + 1}`,
                items,
                status: 'closed',
                openedAt: new Date(dateObj.setHours(10 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 59))).toISOString(),
                closedAt: new Date(dateObj.setHours(dateObj.getHours() + 1)).toISOString(),
                total: parseFloat(finalTotal.toFixed(2)),
                paymentMethod: payment,
                serviceFee,
                discount: 0
            });

            // Create Income Expense Entry
            demoExpenses.push({
                id: generateId(),
                date: dateStr,
                category: ExpenseCategory.CASH_IN,
                description: `Venda Mesa (Demo)`,
                amount: parseFloat(finalTotal.toFixed(2)),
                type: 'income',
                paymentMethod: payment
            });
        }

        // Generate Random Expenses (Not everyday)
        if (Math.random() > 0.7) {
            const expType = Math.random();
            if (expType < 0.5) {
                demoExpenses.push({ id: generateId(), date: dateStr, category: ExpenseCategory.STOCK_REPLENISHMENT, description: 'Gelo e Bebidas', amount: 300 + Math.random() * 400, type: 'expense', paymentMethod: PaymentMethod.PIX });
            } else if (expType < 0.8) {
                demoExpenses.push({ id: generateId(), date: dateStr, category: ExpenseCategory.VEHICLE_FUEL, description: 'Gasolina', amount: 50 + Math.random() * 50, type: 'expense', paymentMethod: PaymentMethod.DEBIT_CARD });
            }
        }
    }

    // 3. Fixed Expenses (Start of month)
    const fifth = getDateFromDay(5, currentMonth, currentYear);
    if (today.getDate() >= 5) {
        demoExpenses.push({ id: generateId(), date: fifth, category: ExpenseCategory.EMPLOYEE_PAYMENT, description: 'Diarista Fim de Semana', amount: 600, type: 'expense', paymentMethod: PaymentMethod.PIX });
    }
    const tenth = getDateFromDay(10, currentMonth, currentYear);
    if (today.getDate() >= 10) {
        demoExpenses.push({ id: generateId(), date: tenth, category: ExpenseCategory.ELECTRICITY_BILL, description: 'Conta de Luz', amount: 450.00, type: 'expense', paymentMethod: PaymentMethod.PIX });
    }

    // 4. Generate OPEN orders for TODAY (Live Simulation)
    const openTablesCount = Math.floor(Math.random() * 4) + 2;
    for (let i = 0; i < openTablesCount; i++) {
         const numItems = Math.floor(Math.random() * 3) + 1;
         const items: OrderItem[] = [];
         let orderTotal = 0;
         for (let j = 0; j < numItems; j++) {
            const prod = getRandomItem();
            const qty = 1;
            items.push({
                id: generateId(),
                name: prod.name,
                price: prod.price,
                quantity: qty,
                status: Math.random() > 0.5 ? 'delivered' : 'pending', // Mixed status
                isCourtesy: false
            });
            orderTotal += prod.price * qty;
         }
         
         // Start time: 30 mins ago to 2 hours ago
         const now = new Date();
         const openedAt = new Date(now.getTime() - (Math.random() * 1000 * 60 * 120)).toISOString();

         demoOrders.push({
            id: generateId(),
            tableOrName: `Mesa ${Math.floor(Math.random() * 15) + 1}`, // Overlap might happen, realistic
            items,
            status: 'open',
            openedAt,
            total: orderTotal,
            serviceFee: false,
            discount: 0
         });
    }

    // 5. Update State
    const newSettings = { ...settings, products: demoProducts };
    onImportData([...expenses, ...demoExpenses], newSettings, demoOrders);
    setConfirmDemoData(false);
    showStatus('success', 'Dados realistas carregados!');
  };

  const handlePinLogic = () => {
    if (pinStep === 'enter') {
      if (pinInput.length !== 4) return showStatus('error', 'PIN deve ter 4 números.');
      setTempPin(pinInput); setPinInput(''); setPinStep('confirm');
    } else {
      if (pinInput !== tempPin) return showStatus('error', 'PINs não coincidem.');
      onUpdateSettings({ ...settings, securityPin: tempPin });
      setPinInput(''); setTempPin(''); setPinStep('enter');
      showStatus('success', 'PIN ativado!');
    }
  };

  const inputClasses = "block w-full rounded-xl border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-sm py-2.5 px-3 focus:ring-rose-500 focus:border-rose-500 transition-colors outline-none";
  const labelClasses = "block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5";
  const tabs = [
    { id: 'general', label: 'Quiosque', icon: 'M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z' },
    { id: 'finance', label: 'Financeiro', icon: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.305 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'menu', label: 'Cardápio', icon: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25' },
    { id: 'security', label: 'Segurança', icon: 'M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z' },
    { id: 'data', label: 'Backup', icon: 'M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694-4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125' },
  ];

  return (
    <div className="flex flex-col md:flex-row h-full w-full relative">
      <AnimatePresence>
        {statusMessage && (
          <motion.div initial={{ opacity: 0, y: -20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: -20, x: '-50%' }} className={`absolute top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-xl font-bold text-sm text-white ${statusMessage.type === 'success' ? 'bg-teal-500' : 'bg-rose-500'}`}>
            {statusMessage.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full md:w-64 bg-orange-50/30 dark:bg-slate-800/50 border-r border-gray-100 dark:border-slate-700 p-2 md:p-4 flex md:flex-col gap-2 overflow-x-auto shrink-0">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as SettingsTab)} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white dark:bg-slate-700 text-rose-500 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-white/50'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} /></svg>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar h-full">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} className="h-full flex flex-col">
            {activeTab === 'general' && (
              <div className="space-y-6">
                 <div className="flex items-center gap-4 bg-orange-50 dark:bg-orange-900/10 p-4 rounded-2xl border border-orange-100 dark:border-orange-900/20">
                   <h3 className="font-bold text-gray-900 dark:text-white text-lg">{settings.kioskName}</h3>
                 </div>
                 <div><label className={labelClasses}>Nome Quiosque</label><input type="text" value={settings.kioskName} onChange={(e) => onUpdateSettings({ ...settings, kioskName: e.target.value })} className={inputClasses} /></div>
                 <div><label className={labelClasses}>Proprietário</label><input type="text" value={settings.ownerName} onChange={(e) => onUpdateSettings({ ...settings, ownerName: e.target.value })} className={inputClasses} /></div>
              </div>
            )}
            {activeTab === 'finance' && (
               <div className="space-y-6">
                  <div><label className={labelClasses}>Meta Mensal (R$)</label><input type="number" min="0" value={settings.monthlyGoal} onChange={(e) => onUpdateSettings({ ...settings, monthlyGoal: Number(e.target.value) })} className={inputClasses} /></div>
                  <div className="grid grid-cols-3 gap-4">
                     <div><label className={labelClasses}>Tx Crédito (%)</label><input type="number" min="0" value={settings.fees.credit} onChange={(e) => onUpdateSettings({ ...settings, fees: { ...settings.fees, credit: Number(e.target.value) } })} className={inputClasses} /></div>
                     <div><label className={labelClasses}>Tx Débito (%)</label><input type="number" min="0" value={settings.fees.debit} onChange={(e) => onUpdateSettings({ ...settings, fees: { ...settings.fees, debit: Number(e.target.value) } })} className={inputClasses} /></div>
                     <div><label className={labelClasses}>Tx Pix (%)</label><input type="number" min="0" value={settings.fees.pix} onChange={(e) => onUpdateSettings({ ...settings, fees: { ...settings.fees, pix: Number(e.target.value) } })} className={inputClasses} /></div>
                  </div>
               </div>
            )}
            {activeTab === 'menu' && (
              <div className="flex flex-col h-full gap-6">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm relative shrink-0">
                   <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-bold text-gray-800 dark:text-white">
                        {editingProdId ? 'Editar Produto' : 'Novo Produto'}
                      </h4>
                      {editingProdId && (
                        <button onClick={resetForm} className="text-xs text-rose-500 font-bold hover:underline">Cancelar Edição</button>
                      )}
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                     <div className="md:col-span-2">
                       <label className={labelClasses}>Nome do Item</label>
                       <input type="text" value={prodName} onChange={(e) => setProdName(e.target.value)} placeholder="Ex: Cerveja Lata" className={inputClasses} />
                     </div>
                     <div>
                       <label className={labelClasses}>Preço (R$)</label>
                       <input type="number" min="0" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} placeholder="0.00" className={inputClasses} />
                     </div>
                     <div>
                       <label className={labelClasses}>Tipo</label>
                       <div className="flex gap-2">
                        <select value={prodCat} onChange={(e) => setProdCat(e.target.value as any)} className={`${inputClasses} flex-1 appearance-none`}>
                          <option value="drink">Bebida</option>
                          <option value="food">Comida</option>
                          <option value="other">Outro</option>
                        </select>
                        <button onClick={handleSaveProduct} className={`${editingProdId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-rose-500 hover:bg-rose-600'} text-white rounded-xl px-3 flex items-center justify-center transition-colors shadow-lg`}>
                          {editingProdId ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                          )}
                        </button>
                       </div>
                     </div>
                   </div>
                </div>

                <div className="flex flex-col flex-1 overflow-hidden">
                   <div className="flex justify-between items-end mb-2 shrink-0">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Catálogo Atual</h4>
                      <span className="text-[10px] text-gray-400">{settings.products?.length || 0} itens</span>
                   </div>
                   
                   {(settings.products || []).length === 0 ? (
                     <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-8 text-center border border-dashed border-gray-200 dark:border-slate-700">
                        <p className="text-gray-400 italic text-sm mb-2">Nenhum produto cadastrado.</p>
                        <p className="text-xs text-gray-500">Adicione itens acima para agilizar suas vendas.</p>
                     </div>
                   ) : (
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto custom-scrollbar pr-2 flex-1 pb-2">
                       {[...(settings.products || [])].reverse().map(prod => (
                         <div 
                           key={prod.id} 
                           onClick={() => handleEditClick(prod)}
                           className={`flex justify-between items-center p-3 rounded-xl border cursor-pointer transition-all group ${editingProdId === prod.id ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 ring-1 ring-blue-300' : 'bg-white dark:bg-slate-700 border-gray-100 dark:border-slate-600 hover:border-blue-300 dark:hover:border-slate-500'}`}
                         >
                            <div className="flex items-center gap-3">
                               <span className={`w-9 h-9 rounded-lg flex items-center justify-center text-base shadow-sm ${prod.category === 'drink' ? 'bg-blue-100 text-blue-600' : prod.category === 'food' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'}`}>
                                 {prod.category === 'drink' ? '🍺' : prod.category === 'food' ? '🍔' : '📦'}
                               </span>
                               <div>
                                 <p className="font-bold text-gray-800 dark:text-white text-sm">{prod.name}</p>
                                 <p className="text-xs text-gray-500 font-medium">{formatCurrency(prod.price)}</p>
                               </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleDeleteProduct(prod.id); }} 
                                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
                                  title="Excluir"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.14-2.007-2.203L13.78 3.69a1.25 1.25 0 00-1.294 0l-1.007.31c-1.096.34-2.006 1.3-2.006 2.484V6.25m3.75-1.5H10.5" /></svg>
                                </button>
                            </div>
                         </div>
                       ))}
                     </div>
                   )}
                </div>
              </div>
            )}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h4 className="font-bold text-blue-700 dark:text-blue-400">Proteção por PIN</h4>
                {settings.securityPin ? (
                  <div className="text-center">
                    <p className="font-bold text-gray-800 dark:text-white mb-4">App Protegido</p>
                    {confirmRemovePin ? <button onClick={() => { onUpdateSettings({ ...settings, securityPin: null }); setConfirmRemovePin(false); showStatus('success', 'PIN removido'); }} className="text-white bg-red-500 px-4 py-2 rounded-lg font-bold">Confirmar Remoção</button> : <button onClick={() => setConfirmRemovePin(true)} className="text-red-500 font-bold underline">Remover PIN</button>}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input type="password" maxLength={4} value={pinInput} onChange={(e) => setPinInput(e.target.value)} placeholder="0000" className={`${inputClasses} text-center font-bold`} />
                    <button onClick={handlePinLogic} className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl px-6 font-bold">{pinStep === 'enter' ? 'Continuar' : 'Salvar'}</button>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'data' && (
              <div className="space-y-4">
                 {importPreview && <div className="p-4 bg-blue-50 rounded-xl mb-4"><p className="font-bold text-blue-800">Restaurar {importPreview.count} itens?</p><button onClick={() => { onImportData(importPreview.data.expenses, importPreview.data.settings); setImportPreview(null); showStatus('success', 'Restaurado!'); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg mt-2 font-bold">Sim, Restaurar</button></div>}
                 <div className="flex gap-3">
                    <button onClick={handleExport} className="flex-1 p-3 bg-teal-50 text-teal-700 rounded-xl font-bold border border-teal-100">Baixar Backup</button>
                    <button onClick={() => fileInputRef.current?.click()} className="flex-1 p-3 bg-blue-50 text-blue-700 rounded-xl font-bold border border-blue-100">Importar</button>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                 </div>
                 <div className="p-4 border border-indigo-100 rounded-2xl bg-indigo-50/50">
                    <h5 className="font-bold text-indigo-700 dark:text-indigo-400 mb-2">Dados de Exemplo</h5>
                    <p className="text-xs text-gray-500 mb-3">Gera vendas diárias, comandas e despesas para o mês atual.</p>
                    {confirmDemoData ? <div className="flex gap-2"><button onClick={() => setConfirmDemoData(false)} className="flex-1 bg-white dark:bg-slate-700 text-gray-500 rounded-lg font-bold py-2">Cancelar</button><button onClick={generateDemoData} className="flex-1 bg-indigo-600 text-white rounded-lg font-bold py-2">Confirmar</button></div> : <button onClick={() => setConfirmDemoData(true)} className="w-full bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-lg font-bold py-2 border border-indigo-200 dark:border-indigo-900">Carregar Demo Realista</button>}
                 </div>
                 <div className="p-4 border border-red-100 rounded-2xl bg-red-50/50">
                    <h5 className="font-bold text-red-700 mb-2">Zona de Perigo</h5>
                    {isDeleteArmed ? <div className="space-y-2"><input type="text" value={deleteInput} onChange={(e) => setDeleteInput(e.target.value)} placeholder="Digite DELETAR" className="w-full text-center border-red-300 rounded-lg" /><button disabled={deleteInput !== 'DELETAR'} onClick={() => { if(deleteInput === 'DELETAR') { onClearData(); setIsDeleteArmed(false); setDeleteInput(''); showStatus('success', 'Dados apagados'); } }} className="w-full bg-red-600 text-white font-bold py-2 rounded-lg disabled:opacity-50">Apagar Tudo</button></div> : <button onClick={() => setIsDeleteArmed(true)} className="w-full bg-red-500 text-white font-bold py-2 rounded-lg">Apagar Dados</button>}
                 </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SettingsPanel;