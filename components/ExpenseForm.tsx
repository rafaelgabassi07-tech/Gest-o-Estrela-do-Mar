
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Expense, ExpenseCategory, PaymentMethod } from '../types';
import { EXPENSE_CATEGORIES_OPTIONS, PAYMENT_METHOD_OPTIONS } from '../constants';
import { generateId, getLocalDateString, formatCurrency } from '../utils';

interface ExpenseFormProps {
  onAddExpense: (expense: Expense) => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onAddExpense }) => {
  const [date, setDate] = useState<string>(getLocalDateString());
  const [category, setCategory] = useState<ExpenseCategory>(ExpenseCategory.EMPLOYEE_PAYMENT);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.MONEY);
  const [description, setDescription] = useState<string>('');
  const [amount, setAmount] = useState<number | ''>('');
  const [receivedAmount, setReceivedAmount] = useState<number | ''>('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount === '' || amount <= 0) {
      setError('Por favor, insira um valor positivo.');
      setTimeout(() => setError(null), 3000);
      return;
    }

    const selectedCategoryOption = EXPENSE_CATEGORIES_OPTIONS.find(op => op.value === category);
    const type = selectedCategoryOption?.isIncome ? 'income' : 'expense';

    const newExpense: Expense = {
      id: generateId(),
      date,
      category,
      description,
      amount: Number(amount),
      type,
      paymentMethod,
    };
    onAddExpense(newExpense);
    
    // Reset fields partial
    setDescription('');
    setAmount('');
    setReceivedAmount('');
  };

  const isCashIncome = category === ExpenseCategory.CASH_IN && paymentMethod === PaymentMethod.MONEY;
  const changeValue = (typeof amount === 'number' && typeof receivedAmount === 'number' && receivedAmount > amount) ? receivedAmount - amount : 0;
  const inputClasses = "block w-full rounded-xl border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 sm:text-sm p-3.5 transition-all outline-none";
  const labelClasses = "block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-2xl p-5">
        <p className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-4 flex items-center gap-2">
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 7.5a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" /><path fillRule="evenodd" d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 14.625v-9.75zM8.25 9.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM18.75 9a.75.75 0 00-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 00.75-.75V9.75a.75.75 0 00-.75-.75h-.008zM4.5 9.75A.75.75 0 015.25 9h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75V9.75z" clipRule="evenodd" /><path d="M2.25 18a.75.75 0 000 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 00-.75-.75H2.25z" /></svg>
           Valor da Venda / Gasto
        </p>
        <div className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="amount" className={labelClasses}>Valor Total (R$)</label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-rose-500 dark:text-rose-400 font-bold sm:text-lg">R$</span>
              <input type="number" id="amount" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || '')} required autoFocus min="0.01" step="0.01" placeholder="0.00" className="block w-full rounded-xl border-gray-200 dark:border-slate-600 dark:bg-slate-700 pl-11 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-3xl font-black text-gray-900 dark:text-white py-2 placeholder-gray-300 dark:placeholder-gray-600 transition-all outline-none" />
            </div>
          </div>
          <div className="w-2/5">
             <label htmlFor="date" className={labelClasses}>Data</label>
             <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} required className={`${inputClasses} font-medium`} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="category" className={labelClasses}>Categoria</label>
          <div className="relative">
             <select id="category" value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)} required className={`${inputClasses} appearance-none cursor-pointer`}>
              {EXPENSE_CATEGORIES_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="paymentMethod" className={labelClasses}>Meio de Pagamento</label>
          <div className="relative">
             <select id="paymentMethod" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} required className={`${inputClasses} appearance-none cursor-pointer`}>
              {PAYMENT_METHOD_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isCashIncome && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-white dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-600 rounded-none shadow-sm relative mx-2">
              <div className="absolute -top-2 left-0 w-full h-2 bg-transparent" style={{ backgroundImage: 'linear-gradient(45deg, transparent 33.333%, #fff 33.333%, #fff 66.667%, transparent 66.667%), linear-gradient(-45deg, transparent 33.333%, #fff 33.333%, #fff 66.667%, transparent 66.667%)', backgroundSize: '12px 24px', backgroundPosition: '0 -12px' }}></div>
              <div className="p-4 border-b border-dashed border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50">
                 <h4 className="text-center text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-300 mb-4">Calculadora de Troco</h4>
                 <div className="flex-1">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-400 uppercase mb-1">Valor Recebido</label>
                    <div className="relative">
                       <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">R$</span>
                       <input type="number" value={receivedAmount} onChange={(e) => setReceivedAmount(parseFloat(e.target.value) || '')} placeholder="0.00" className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg py-2 pl-9 pr-2 font-mono font-bold text-lg text-gray-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none" />
                    </div>
                 </div>
              </div>
              <div className="p-4 bg-teal-50/50 dark:bg-teal-900/10 flex justify-between items-center">
                 <span className="text-sm font-bold text-teal-700 dark:text-teal-400 uppercase">Troco a Devolver</span>
                 <span className={`text-2xl font-mono font-black ${changeValue > 0 ? 'text-teal-600 dark:text-teal-400' : 'text-gray-300 dark:text-gray-600'}`}>
                    {formatCurrency(changeValue)}
                 </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div>
        <label htmlFor="description" className={labelClasses}>Descrição (Opcional)</label>
        <input type="text" id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Água de coco, Cerveja..." className={inputClasses} />
      </div>

      {error && <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg font-bold text-center border border-red-100 dark:border-red-900/30">{error}</motion.p>}

      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="w-full inline-flex justify-center items-center py-4 px-6 border border-transparent shadow-lg shadow-rose-500/30 text-base font-bold rounded-2xl text-white bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 focus:outline-none focus:ring-4 focus:ring-rose-500/30 transition-all">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
        Confirmar Lançamento
      </motion.button>
    </form>
  );
};

export default ExpenseForm;
