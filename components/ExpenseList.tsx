
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Expense } from '../types';
import { CATEGORY_STYLES } from '../constants';
import { formatCurrency, formatDateDisplay } from '../utils';

interface ExpenseListProps {
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onDeleteExpense }) => {
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredList = expenses
    .filter(e => filter === 'all' ? true : e.type === filter)
    .filter(e => 
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
      e.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.paymentMethod?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalAmount = filteredList.reduce((acc, curr) => acc + curr.amount, 0);

  const handleRequestDelete = (id: string) => {
    if (confirmDeleteId === id) {
      onDeleteExpense(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(prev => (prev === id ? null : prev)), 3000);
    }
  };

  return (
    <div className="mt-8 space-y-4">
      {/* Controls Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-4 rounded-3xl border border-gray-100 dark:border-slate-700">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          Histórico <span className="text-xs font-medium text-gray-400 bg-white dark:bg-slate-700 border border-gray-100 dark:border-slate-600 px-2.5 py-0.5 rounded-full">{expenses.length}</span>
        </h3>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:flex-initial">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 absolute left-3 top-3 text-gray-400">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
             </svg>
             <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full sm:w-64 pl-9 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-rose-500 outline-none transition-all shadow-sm" />
          </div>
          <div className="flex bg-gray-100 dark:bg-slate-900 p-1 rounded-xl border border-gray-200 dark:border-slate-700">
            {(['all', 'income', 'expense'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`flex-1 px-4 py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${filter === f ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/5' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>{f === 'all' ? 'Todos' : f === 'income' ? 'Entradas' : 'Saídas'}</button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {filteredList.length > 0 && (
          <motion.div layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-2xl p-3 flex justify-between items-center px-5 shadow-sm">
             <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Total Filtrado</span>
             <span className="text-sm font-bold text-indigo-900 dark:text-indigo-100 bg-white/50 dark:bg-slate-800/50 px-3 py-1 rounded-lg border border-indigo-100 dark:border-indigo-800/30">{formatCurrency(totalAmount)}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        {filteredList.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center opacity-50">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-300 mb-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" /></svg>
            <p className="text-gray-500 font-medium">Nenhum lançamento encontrado.</p>
          </div>
        ) : (
          <>
            {/* Mobile View: Cards */}
            <ul className="block md:hidden divide-y divide-gray-50 dark:divide-slate-700">
              <AnimatePresence mode="popLayout" initial={false}>
                {filteredList.map((expense) => {
                  const style = CATEGORY_STYLES[expense.category] || { color: 'text-gray-600', bg: 'bg-gray-100', darkBg: 'dark:bg-slate-700', icon: '' };
                  return (
                    <motion.li key={expense.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="p-4 flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${style.bg} ${style.darkBg} ${style.color}`}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d={style.icon} /></svg></div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{expense.description || expense.category}</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <span className="text-[10px] font-bold text-gray-400">{formatDateDisplay(expense.date)}</span>
                            <span className="text-[10px] font-bold uppercase bg-gray-100 dark:bg-slate-700 text-gray-500 px-1.5 py-0.5 rounded">{expense.paymentMethod}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-base font-black whitespace-nowrap ${expense.type === 'income' ? 'text-teal-600 dark:text-teal-400' : 'text-rose-500 dark:text-rose-400'}`}>{expense.type === 'income' ? '+' : '-'} {formatCurrency(expense.amount)}</span>
                        <button onClick={() => handleRequestDelete(expense.id)} className={`transition-all rounded-lg flex items-center justify-center ${confirmDeleteId === expense.id ? 'bg-rose-500 text-white w-20 h-7' : 'text-gray-300 hover:text-rose-500 p-1'}`}>{confirmDeleteId === expense.id ? <span className="text-[10px] font-bold uppercase">Confirmar</span> : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.14-2.007-2.203L13.78 3.69a1.25 1.25 0 00-1.294 0l-1.007.31c-1.096.34-2.006 1.3-2.006 2.484V6.25m3.75-1.5H10.5" /></svg>}</button>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>

            {/* Desktop View: Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-slate-700/30 border-b border-gray-100 dark:border-slate-700 text-left">
                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Categoria</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Descrição</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Data</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Pagamento</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Valor</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {filteredList.map((expense) => {
                      const style = CATEGORY_STYLES[expense.category] || { color: 'text-gray-600', bg: 'bg-gray-100', darkBg: 'dark:bg-slate-700', icon: '' };
                      return (
                        <motion.tr 
                          key={expense.id} 
                          layout
                          initial={{ opacity: 0 }} 
                          animate={{ opacity: 1 }} 
                          exit={{ opacity: 0 }} 
                          className="group hover:bg-blue-50/30 dark:hover:bg-slate-700/30 transition-colors"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${style.bg} ${style.darkBg} ${style.color}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d={style.icon} /></svg>
                              </div>
                              <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{expense.category}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                             <span className="text-sm font-medium text-gray-900 dark:text-white block max-w-[200px] truncate" title={expense.description}>{expense.description || '-'}</span>
                          </td>
                          <td className="py-4 px-6">
                             <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">{formatDateDisplay(expense.date)}</span>
                          </td>
                          <td className="py-4 px-6">
                             <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{expense.paymentMethod}</span>
                          </td>
                          <td className="py-4 px-6 text-right">
                             <span className={`text-sm font-black whitespace-nowrap ${expense.type === 'income' ? 'text-teal-600 dark:text-teal-400' : 'text-rose-500 dark:text-rose-400'}`}>
                               {expense.type === 'income' ? '+' : '-'} {formatCurrency(expense.amount)}
                             </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                             <div className="flex justify-center">
                               <button onClick={() => handleRequestDelete(expense.id)} className={`transition-all rounded-lg flex items-center justify-center ${confirmDeleteId === expense.id ? 'bg-rose-500 text-white w-20 h-8 shadow-lg shadow-rose-500/30' : 'text-gray-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 w-8 h-8'}`}>
                                  {confirmDeleteId === expense.id ? <span className="text-[10px] font-bold uppercase">Confirmar</span> : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.14-2.007-2.203L13.78 3.69a1.25 1.25 0 00-1.294 0l-1.007.31c-1.096.34-2.006 1.3-2.006 2.484V6.25m3.75-1.5H10.5" /></svg>}
                               </button>
                             </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ExpenseList;
