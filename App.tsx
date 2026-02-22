
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import Toast, { ToastMessage } from './components/Toast';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import MonthlySummary from './components/MonthlySummary';
import Modal from './components/Modal';
import SettingsPanel from './components/SettingsPanel';
import Header from './components/Header';
import LockScreen from './components/LockScreen';
import OrdersPage from './components/OrdersPage';
import StockPage from './components/StockPage';
import { CURRENT_YEAR, START_YEAR } from './constants';
import { useExpenseManager, useSettingsManager, useTheme, useLockScreen, useOrderManager } from './hooks';
import { generateId, getLocalDateString, formatCurrency } from './utils';
import { ExpenseCategory, Order, PaymentMethod } from './types';

const App: React.FC = () => {
  // Logic extracted to Hooks
  const { expenses, addExpense, deleteExpense, clearExpenses, setAllExpenses } = useExpenseManager();
  const { settings, setSettings, updateProductStock } = useSettingsManager();
  const { themeMode, setThemeMode } = useTheme();
  const { validatePin } = useLockScreen();
  const { orders, addOrder, updateOrder, closeOrder, deleteOrder, setAllOrders } = useOrderManager();

  // UI State
  // App starts at 'orders' (Comandas) by default now
  const [currentView, setCurrentView] = useState<'dashboard' | 'orders' | 'stock'>('orders');
  const [financeUnlocked, setFinanceUnlocked] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => removeToast(id), 3000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Security Logic: Lock Finance when leaving the tab
  useEffect(() => {
     if (currentView !== 'dashboard') {
         setFinanceUnlocked(false);
     }
  }, [currentView]);

  const handleUnlockFinance = (pin: string) => {
      const isValid = validatePin(pin, settings.securityPin);
      if (isValid) {
          setFinanceUnlocked(true);
          addToast('success', 'Acesso liberado!');
      } else {
          addToast('error', 'PIN incorreto!');
      }
      return isValid;
  };

  // Filter Expenses by Month/Year
  const filteredExpenses = expenses.filter((expense) => {
    const [yearStr, monthStr] = expense.date.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    return month === selectedMonth && year === selectedYear;
  });

  const handleCloseOrder = (updatedOrder: Order, paymentMethod: PaymentMethod) => {
    // 1. Close order in order manager with the FINAL updated object (including correct totals)
    closeOrder(updatedOrder, paymentMethod);
    
    // 2. Add income expense
    addExpense({
      id: generateId(),
      category: ExpenseCategory.CASH_IN,
      description: `Comanda: ${updatedOrder.tableOrName}`,
      amount: updatedOrder.total, // Now uses the correct total from the passed object
      date: getLocalDateString(),
      type: 'income',
      paymentMethod: paymentMethod
    });

    // 3. Update Stock (Baixa de Estoque)
    const currentProducts = [...settings.products];
    let stockUpdated = false;

    updatedOrder.items.forEach(item => {
        // Tenta encontrar pelo ID primeiro (mais seguro), senão pelo nome (fallback)
        const productIndex = currentProducts.findIndex(p => 
          (item.productId && p.id === item.productId) || p.name === item.name
        );
        
        if (productIndex >= 0) {
            const currentStock = currentProducts[productIndex].stock || 0;
            // Lógica: Sai do estoque independente se foi cobrado ou não.
            const newStock = Math.max(0, currentStock - item.quantity);
            
            currentProducts[productIndex] = {
                ...currentProducts[productIndex],
                stock: newStock
            };
            stockUpdated = true;
        }
    });

    if (stockUpdated) {
        setSettings({ ...settings, products: currentProducts });
        addToast('info', 'Estoque atualizado.');
    }
    
    addToast('success', `Comanda fechada! +${formatCurrency(updatedOrder.total)}`);

    // Haptic Feedback for success
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([50, 50, 50]);
    }
  };

  // Render Helpers
  const years = Array.from({ length: CURRENT_YEAR - START_YEAR + 1 }, (_, i) => START_YEAR + i).reverse();
  const months = [
    { value: 0, label: 'Janeiro' }, { value: 1, label: 'Fevereiro' }, { value: 2, label: 'Março' },
    { value: 3, label: 'Abril' }, { value: 4, label: 'Maio' }, { value: 5, label: 'Junho' },
    { value: 6, label: 'Julho' }, { value: 7, label: 'Agosto' }, { value: 8, label: 'Setembro' },
    { value: 9, label: 'Outubro' }, { value: 10, label: 'Novembro' }, { value: 11, label: 'Dezembro' },
  ];

  const renderDashboardContent = () => {
      // Check if PIN is configured AND not unlocked yet
      if (settings.securityPin && !financeUnlocked) {
          return (
             <LockScreen 
                kioskName={settings.kioskName} 
                onUnlock={handleUnlockFinance} 
                customLogo={settings.logoUrl} 
                embedded={true}
             />
          );
      }

      return (
          <>
            {/* Date Filter Bar */}
            <motion.div 
              layout
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex justify-center md:justify-start mb-8"
            >
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-300 dark:border-slate-700 p-1.5 flex gap-2 items-center">
                <span className="hidden sm:block text-xs font-bold text-gray-500 dark:text-gray-500 uppercase tracking-widest px-3">Período</span>
                <div className="h-6 w-px bg-gray-300 dark:bg-slate-700 hidden sm:block"></div>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="bg-transparent text-gray-900 dark:text-white text-sm font-bold cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 py-2 px-3 rounded-xl transition-colors border-none focus:ring-0 outline-none appearance-none"
                >
                  {months.map((m) => <option key={m.value} value={m.value} className="bg-white dark:bg-slate-800">{m.label}</option>)}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-transparent text-gray-900 dark:text-white text-sm font-bold cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 py-2 px-3 rounded-xl transition-colors border-none focus:ring-0 outline-none appearance-none"
                >
                  {years.map((y) => <option key={y} value={y} className="bg-white dark:bg-slate-800">{y}</option>)}
                </select>
              </div>
            </motion.div>

            <MonthlySummary 
              expenses={filteredExpenses} 
              selectedMonth={selectedMonth} 
              selectedYear={selectedYear} 
              monthlyGoal={settings.monthlyGoal}
              feesConfig={settings.fees}
            />
            
            <ExpenseList expenses={filteredExpenses} onDeleteExpense={deleteExpense} />
          </>
      );
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900 transition-colors duration-500 font-sans text-gray-900 dark:text-gray-100 selection:bg-rose-500 selection:text-white overflow-x-hidden pb-24 md:pb-0">
      
      <Header 
        kioskName={settings.kioskName} 
        themeMode={themeMode} 
        setThemeMode={setThemeMode} 
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenNewExpense={() => setIsModalOpen(true)}
        customLogo={settings.logoUrl}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-40 pb-32 md:pb-12">
        
        {/* View Switcher Tabs (Desktop Only - Mobile uses Bottom Bar) */}
        <div className="hidden md:flex justify-center mb-8 gap-4">
           <button onClick={() => setCurrentView('dashboard')} className={`px-6 py-2 rounded-xl font-bold transition-all border ${currentView === 'dashboard' ? 'bg-rose-500 border-rose-600 text-white shadow-lg shadow-rose-500/30' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:bg-rose-50 dark:hover:bg-slate-700'}`}>Financeiro</button>
           <button onClick={() => setCurrentView('orders')} className={`px-6 py-2 rounded-xl font-bold transition-all border ${currentView === 'orders' ? 'bg-teal-500 border-teal-600 text-white shadow-lg shadow-teal-500/30' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:bg-teal-50 dark:hover:bg-slate-700'}`}>Comandas</button>
           <button onClick={() => setCurrentView('stock')} className={`px-6 py-2 rounded-xl font-bold transition-all border ${currentView === 'stock' ? 'bg-orange-500 border-orange-600 text-white shadow-lg shadow-orange-500/30' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:bg-orange-50 dark:hover:bg-slate-700'}`}>Estoque</button>
        </div>

        <LayoutGroup>
          <AnimatePresence mode="wait">
            {currentView === 'dashboard' ? (
              <motion.div key="dashboard" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                {renderDashboardContent()}
              </motion.div>
            ) : currentView === 'orders' ? (
              <motion.div key="orders" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                 <OrdersPage 
                   orders={orders}
                   onAddOrder={addOrder}
                   onUpdateOrder={updateOrder}
                   onCloseOrder={handleCloseOrder}
                   onDeleteOrder={deleteOrder}
                   onShowToast={addToast}
                 />
              </motion.div>
            ) : (
              <motion.div key="stock" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                 <StockPage 
                   products={settings.products || []}
                   onUpdateStock={updateProductStock}
                   onOpenSettings={() => setIsSettingsOpen(true)}
                   onShowToast={addToast}
                 />
              </motion.div>
            )}
          </AnimatePresence>
        </LayoutGroup>
      </main>

      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Bottom Navigation Bar (Mobile) */}
      <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 p-2 md:hidden z-50 flex justify-around items-center pb-safe shadow-[0_-5px_10px_rgba(0,0,0,0.05)]">
         <button onClick={() => { setCurrentView('dashboard'); if(navigator.vibrate) navigator.vibrate(5); }} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${currentView === 'dashboard' ? 'text-rose-600 bg-rose-50 dark:bg-rose-900/20' : 'text-gray-500 dark:text-gray-500'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill={currentView === 'dashboard' ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={currentView === 'dashboard' ? 0 : 2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" /></svg>
            <span className="text-[10px] font-bold">Financeiro</span>
         </button>
         
         <button onClick={() => { setCurrentView('orders'); if(navigator.vibrate) navigator.vibrate(5); }} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${currentView === 'orders' ? 'text-teal-600 bg-teal-50 dark:bg-teal-900/20' : 'text-gray-500 dark:text-gray-500'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill={currentView === 'orders' ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={currentView === 'orders' ? 0 : 2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
            <span className="text-[10px] font-bold">Comandas</span>
         </button>

         <button onClick={() => { setCurrentView('stock'); if(navigator.vibrate) navigator.vibrate(5); }} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${currentView === 'stock' ? 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'text-gray-500 dark:text-gray-500'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill={currentView === 'stock' ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={currentView === 'stock' ? 0 : 2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
            <span className="text-[10px] font-bold">Estoque</span>
         </button>
      </div>

      {/* Center FAB (Adjusted position for 3 tabs) */}
      {currentView === 'dashboard' && (!settings.securityPin || financeUnlocked) && (
           <motion.button
            initial={{ scale: 0 }} animate={{ scale: 1 }} whileTap={{ scale: 0.9 }}
            onClick={() => { setIsModalOpen(true); if(navigator.vibrate) navigator.vibrate(10); }}
            className="md:hidden fixed bottom-24 right-4 z-40 w-14 h-14 bg-gradient-to-br from-rose-500 to-orange-500 text-white rounded-full shadow-xl shadow-rose-500/40 flex items-center justify-center border-2 border-white dark:border-slate-900"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          </motion.button>
      )}

      {/* Modals */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Lançamento">
        <ExpenseForm onAddExpense={(e) => { addExpense(e); setIsModalOpen(false); }} />
      </Modal>

      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Ajustes & Configurações" maxWidth="max-w-[90vw]">
         <SettingsPanel 
           settings={settings}
           onUpdateSettings={setSettings}
           onClearData={() => { clearExpenses(); setAllOrders([]); setIsSettingsOpen(false); }}
           expenses={expenses}
           onImportData={(newExp, newSett, newOrders) => { 
             setAllExpenses(newExp); 
             setSettings(newSett); 
             if(newOrders) setAllOrders(newOrders);
             setIsSettingsOpen(false); 
           }}
           onShowToast={addToast}
         />
      </Modal>
    </div>
  );
};

export default App;
