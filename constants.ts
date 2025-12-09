
import { ExpenseCategory, PaymentMethod } from './types';

export const EXPENSE_CATEGORIES_OPTIONS = [
  { value: ExpenseCategory.EMPLOYEE_PAYMENT, label: 'Pagamento de Funcionário' },
  { value: ExpenseCategory.STOCK_REPLENISHMENT, label: 'Reposição de Estoque' },
  { value: ExpenseCategory.VEHICLE_FUEL, label: 'Combustível / Transporte' },
  { value: ExpenseCategory.WATER_BILL, label: 'Conta de Água' },
  { value: ExpenseCategory.ELECTRICITY_BILL, label: 'Conta de Energia' },
  { value: ExpenseCategory.GAS_BILL, label: 'Gás de Cozinha' },
  { value: ExpenseCategory.CASH_IN, label: 'Venda / Entrada', isIncome: true },
  { value: ExpenseCategory.CASH_OUT, label: 'Outras Saídas' },
];

export const PAYMENT_METHOD_OPTIONS = [
  { value: PaymentMethod.MONEY, label: 'Dinheiro (Espécie)' },
  { value: PaymentMethod.PIX, label: 'Pix' },
  { value: PaymentMethod.DEBIT_CARD, label: 'Débito' },
  { value: PaymentMethod.CREDIT_CARD, label: 'Crédito' },
];

export const CURRENT_YEAR = new Date().getFullYear();
export const START_YEAR = 2023;

// Starfish Theme Colors - Optimized for Charts in Dark/Light
export const CHART_COLORS = ['#f43f5e', '#fb923c', '#38bdf8', '#a78bfa', '#2dd4bf', '#facc15', '#ec4899', '#818cf8'];

// Specific Palettes for clearer data visualization
export const INCOME_COLORS = ['#2dd4bf', '#0ea5e9', '#6366f1', '#8b5cf6']; // Teal, Sky, Indigo, Violet
export const EXPENSE_COLORS = ['#f43f5e', '#fb923c', '#facc15', '#ef4444', '#db2777']; // Rose, Orange, Yellow, Red, Pink

// Helper for UI icons/colors based on category
export const CATEGORY_STYLES: Record<string, { color: string; bg: string; darkBg: string; icon: string }> = {
  [ExpenseCategory.EMPLOYEE_PAYMENT]: { 
    color: 'text-rose-600 dark:text-rose-400', 
    bg: 'bg-rose-100', 
    darkBg: 'dark:bg-rose-900/30',
    icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z' 
  },
  [ExpenseCategory.STOCK_REPLENISHMENT]: { 
    color: 'text-orange-600 dark:text-orange-400', 
    bg: 'bg-orange-100', 
    darkBg: 'dark:bg-orange-900/30',
    icon: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z' 
  },
  [ExpenseCategory.VEHICLE_FUEL]: { 
    color: 'text-slate-600 dark:text-slate-400', 
    bg: 'bg-slate-100', 
    darkBg: 'dark:bg-slate-700/50',
    icon: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12' 
  },
  [ExpenseCategory.WATER_BILL]: { 
    color: 'text-cyan-600 dark:text-cyan-400', 
    bg: 'bg-cyan-100', 
    darkBg: 'dark:bg-cyan-900/30',
    icon: 'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S12 3 12 3s-4.5 4.97-4.5 9 2.015 9 4.5 9z' 
  },
  [ExpenseCategory.ELECTRICITY_BILL]: { 
    color: 'text-yellow-600 dark:text-yellow-400', 
    bg: 'bg-yellow-100', 
    darkBg: 'dark:bg-yellow-900/30',
    icon: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z' 
  },
  [ExpenseCategory.GAS_BILL]: { 
    color: 'text-red-600 dark:text-red-400', 
    bg: 'bg-red-100', 
    darkBg: 'dark:bg-red-900/30',
    icon: 'M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.047 8.287 8.287 0 009 9.601a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z' 
  },
  [ExpenseCategory.CASH_IN]: { 
    color: 'text-teal-600 dark:text-teal-400', 
    bg: 'bg-teal-100', 
    darkBg: 'dark:bg-teal-900/30',
    icon: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z' 
  },
  [ExpenseCategory.CASH_OUT]: { 
    color: 'text-gray-600 dark:text-gray-400', 
    bg: 'bg-gray-100', 
    darkBg: 'dark:bg-gray-700/50',
    icon: 'M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3' 
  },
};
