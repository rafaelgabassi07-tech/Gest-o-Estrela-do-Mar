
import { useState, useEffect } from 'react';
import { Expense, AppSettings, ThemeMode, Order, OrderStatus } from './types';

// Hook para Gerenciar Despesas
export const useExpenseManager = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('kioskExpenses');
    if (stored) setExpenses(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem('kioskExpenses', JSON.stringify(expenses));
  }, [expenses]);

  const addExpense = (newExpense: Expense) => {
    setExpenses((prev) => [...prev, newExpense]);
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const clearExpenses = () => setExpenses([]);

  const setAllExpenses = (newExpenses: Expense[]) => setExpenses(newExpenses);

  return { expenses, addExpense, deleteExpense, clearExpenses, setAllExpenses };
};

// Hook para Gerenciar Configurações
export const useSettingsManager = () => {
  const [settings, setSettings] = useState<AppSettings>({
    kioskName: 'Estrela do Mar',
    ownerName: '',
    contactPhone: '',
    logoUrl: null,
    monthlyGoal: 10000,
    fees: { credit: 3.5, debit: 1.5, pix: 0 },
    securityPin: null,
    products: []
  });

  useEffect(() => {
    const stored = localStorage.getItem('kioskSettings');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure products array exists for migration
      setSettings((prev) => ({ ...prev, ...parsed, products: parsed.products || [] }));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('kioskSettings', JSON.stringify(settings));
  }, [settings]);

  return { settings, setSettings };
};

// Hook para Tema
export const useTheme = () => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('auto');

  useEffect(() => {
    const stored = localStorage.getItem('themeMode') as ThemeMode;
    if (stored) setThemeMode(stored);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    if (themeMode === 'auto') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(systemDark ? 'dark' : 'light');
    } else {
      root.classList.add(themeMode);
    }
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);

  return { themeMode, setThemeMode };
};

// Hook para Bloqueio de Tela
export const useLockScreen = (securityPin: string | null) => {
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (securityPin) setIsLocked(true);
  }, [securityPin]);

  const unlock = (pin: string) => {
    if (pin === securityPin) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  return { isLocked, unlock };
};

// Hook para Gerenciar Comandas (Orders)
export const useOrderManager = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('kioskOrders');
    if (stored) setOrders(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem('kioskOrders', JSON.stringify(orders));
  }, [orders]);

  const addOrder = (newOrder: Order) => {
    setOrders((prev) => [...prev, newOrder]);
  };

  const updateOrder = (updatedOrder: Order) => {
    setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
  };

  // UPDATED: Now accepts the full updated order object to ensure totals/items are correct
  const closeOrder = (finalOrder: Order, paymentMethod: any) => { 
    setOrders((prev) => prev.map((o) => 
      o.id === finalOrder.id 
        ? { 
            ...finalOrder, // Save items, totals, fees from the form
            status: 'closed', 
            closedAt: new Date().toISOString(), 
            paymentMethod 
          } 
        : o
    ));
  };

  const deleteOrder = (id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
  };

  const setAllOrders = (newOrders: Order[]) => setOrders(newOrders);

  return { orders, addOrder, updateOrder, closeOrder, deleteOrder, setAllOrders };
};
