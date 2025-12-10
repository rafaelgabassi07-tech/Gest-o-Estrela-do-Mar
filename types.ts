
export enum ExpenseCategory {
  EMPLOYEE_PAYMENT = 'Pagamento de Funcionário',
  STOCK_REPLENISHMENT = 'Reposição de Estoque',
  VEHICLE_FUEL = 'Combustível do Veículo',
  WATER_BILL = 'Conta de Água',
  ELECTRICITY_BILL = 'Conta de Energia',
  GAS_BILL = 'Conta de Gás',
  CASH_IN = 'Entrada de Dinheiro',
  CASH_OUT = 'Saída de Dinheiro (Outros)',
}

export enum PaymentMethod {
  MONEY = 'Dinheiro',
  PIX = 'Pix',
  CREDIT_CARD = 'Cartão de Crédito',
  DEBIT_CARD = 'Cartão de Débito',
}

export type ExpenseType = 'expense' | 'income';
export type ThemeMode = 'light' | 'dark' | 'auto';

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  description: string;
  amount: number; // Always positive; type determines debit/credit
  type: ExpenseType;
  paymentMethod?: PaymentMethod;
}

export interface MonthlySummaryData {
  category: ExpenseCategory;
  amount: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: 'food' | 'drink' | 'other';
  stock?: number; // Quantidade atual
  minStock?: number; // Alerta de estoque mínimo
  unit?: 'un' | 'kg' | 'L'; // Unidade de medida
  barcode?: string; // Código de barras (EAN-13, QR, etc)
}

export interface AppSettings {
  kioskName: string;
  ownerName?: string;
  contactPhone?: string;
  logoUrl?: string | null; // Base64 string of the custom logo
  monthlyGoal: number;
  fees: {
    credit: number;
    debit: number;
    pix: number;
  };
  securityPin: string | null; // 4 digit pin
  products: Product[];
}

export type SettingsTab = 'general' | 'finance' | 'menu' | 'security' | 'data';

// --- ORDER TYPES ---

export type ItemStatus = 'pending' | 'delivered';

export interface OrderItem {
  id: string;
  productId?: string; // ID for stock tracking
  name: string;
  quantity: number;
  price: number;
  status: ItemStatus;
  isCourtesy: boolean;
}

export type OrderStatus = 'open' | 'closed';

export interface Order {
  id: string;
  tableOrName: string;
  items: OrderItem[];
  status: OrderStatus;
  openedAt: string; // ISO String
  closedAt?: string;
  total: number;
  paymentMethod?: PaymentMethod;
  discount?: number;
  serviceFee?: boolean; // 10%
}
