
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Expense, ExpenseCategory, MonthlySummaryData, PaymentMethod } from '../types';
import { 
  XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, CartesianGrid, Sector
} from 'recharts';
import { getMonthlyAnalysis } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import Markdown from 'react-markdown';
import { INCOME_COLORS, EXPENSE_COLORS, CATEGORY_STYLES } from '../constants';

interface MonthlySummaryProps {
  expenses: Expense[];
  selectedMonth: number;
  selectedYear: number;
  monthlyGoal?: number; 
  feesConfig?: { credit: number; debit: number; pix: number };
}

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;

  return (
    <g>
      <text x={cx} y={cy} dy={-10} textAnchor="middle" fill={fill} className="text-sm font-bold dark:fill-white">
        {payload.name || payload.category}
      </text>
      <text x={cx} y={cy} dy={15} textAnchor="middle" fill="#94a3b8" className="text-xs font-medium">
        {`(${(percent * 100).toFixed(0)}%)`}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={innerRadius - 4}
        outerRadius={outerRadius + 12}
        fill={fill}
        opacity={0.15}
      />
    </g>
  );
};

const MonthlySummary: React.FC<MonthlySummaryProps> = ({ 
  expenses, 
  selectedMonth, 
  selectedYear,
  monthlyGoal = 10000,
  feesConfig = { credit: 0, debit: 0, pix: 0 }
}) => {
  const [geminiAnalysis, setGeminiAnalysis] = useState<string | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(false);
  const [errorAnalysis, setErrorAnalysis] = useState<string | null>(null);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState<boolean>(false);
  
  const [activeIndexExpenses, setActiveIndexExpenses] = useState(0);
  const [activeIndexIncome, setActiveIndexIncome] = useState(0);

  const formatCurrency = (value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const { 
    totalIncome, 
    totalExpenses, 
    netBalance, 
    chartData, 
    pieData, 
    dailyData,
    cashBalance,
    paymentMethodData,
    estimatedFees
  } = useMemo(() => {
    let totalIncome = 0;
    let totalExpenses = 0;
    let cashIncome = 0;
    let cashExpenses = 0;
    let estimatedFees = 0;

    const categorySummary: { [key in ExpenseCategory]?: number } = {};
    const dailyMap: { [day: number]: { day: number, income: number, expense: number } } = {};
    const paymentMap: { [key in PaymentMethod]?: number } = {};

    expenses.forEach((expense) => {
      if (expense.type === 'income') {
        totalIncome += expense.amount;
        if (expense.paymentMethod === PaymentMethod.MONEY) {
          cashIncome += expense.amount;
        }
        
        if (expense.paymentMethod === PaymentMethod.CREDIT_CARD) {
          estimatedFees += expense.amount * (feesConfig.credit / 100);
        } else if (expense.paymentMethod === PaymentMethod.DEBIT_CARD) {
          estimatedFees += expense.amount * (feesConfig.debit / 100);
        } else if (expense.paymentMethod === PaymentMethod.PIX) {
           estimatedFees += expense.amount * (feesConfig.pix / 100);
        }

        if (expense.paymentMethod) {
            paymentMap[expense.paymentMethod] = (paymentMap[expense.paymentMethod] || 0) + expense.amount;
        }
      } else {
        totalExpenses += expense.amount;
        if (expense.paymentMethod === PaymentMethod.MONEY) {
          cashExpenses += expense.amount;
        }
      }

      if (expense.type === 'expense') {
        categorySummary[expense.category] =
          (categorySummary[expense.category] || 0) + expense.amount;
      }

      const day = parseInt(expense.date.split('-')[2], 10);
      
      if (!dailyMap[day]) {
        dailyMap[day] = { day, income: 0, expense: 0 };
      }
      if (expense.type === 'income') {
        dailyMap[day].income += expense.amount;
      } else {
        dailyMap[day].expense += expense.amount;
      }
    });

    const netBalance = totalIncome - totalExpenses;
    const cashBalance = cashIncome - cashExpenses;

    const chartData: MonthlySummaryData[] = Object.keys(categorySummary).map((key) => {
      const category = key as ExpenseCategory;
      const amount = categorySummary[category] || 0;
      return { category, amount };
    });

    const pieData = chartData.filter(d => d.amount > 0).sort((a, b) => b.amount - a.amount);

    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const dailyData = [];
    for (let i = 1; i <= daysInMonth; i++) {
        dailyData.push(dailyMap[i] || { day: i, income: 0, expense: 0 });
    }

    const paymentMethodData = Object.keys(paymentMap).map(key => ({
        name: key,
        value: paymentMap[key as PaymentMethod] || 0
    })).sort((a, b) => b.value - a.value);

    return { totalIncome, totalExpenses, netBalance, chartData, pieData, dailyData, cashBalance, paymentMethodData, estimatedFees };
  }, [expenses, selectedMonth, selectedYear, feesConfig]);

  const generateAnalysis = useCallback(async () => {
    setIsLoadingAnalysis(true);
    setErrorAnalysis(null);
    setGeminiAnalysis(null);

    const dataString = `
      Mês/Ano: ${selectedMonth + 1}/${selectedYear}
      Receita Total: R$ ${totalIncome.toFixed(2)}
      Despesas Totais: R$ ${totalExpenses.toFixed(2)}
      Saldo Líquido: R$ ${netBalance.toFixed(2)}
      Saldo em Caixa (Físico): R$ ${cashBalance.toFixed(2)}
      Taxas Estimadas (Maquininha): R$ ${estimatedFees.toFixed(2)}
      Métodos de Pagamento (Receita): ${paymentMethodData.map(p => `${p.name}: ${p.value.toFixed(2)}`).join(', ')}
      Categorias: ${chartData.map((item) => `${item.category}: ${item.amount.toFixed(2)}`).join(', ')}
    `;

    try {
      const analysis = await getMonthlyAnalysis(dataString);
      setGeminiAnalysis(analysis);
    } catch (error: any) {
      setErrorAnalysis('Erro na conexão com IA.');
      console.error(error);
    } finally {
      setIsLoadingAnalysis(false);
    }
  }, [selectedMonth, selectedYear, totalIncome, totalExpenses, netBalance, cashBalance, chartData, paymentMethodData, estimatedFees]);

  useEffect(() => {
    if (isAnalysisOpen && !geminiAnalysis && !isLoadingAnalysis && expenses.length > 0) {
      generateAnalysis();
    }
  }, [isAnalysisOpen, geminiAnalysis, isLoadingAnalysis, expenses, generateAnalysis]);

  useEffect(() => {
    setGeminiAnalysis(null);
    setIsAnalysisOpen(false);
  }, [selectedMonth, selectedYear]);

  const downloadCSV = () => {
    const headers = ['Data', 'Categoria', 'Descrição', 'Método Pagamento', 'Tipo', 'Valor'];
    const csvRows = [headers.join(',')];

    expenses.forEach(expense => {
      const row = [
        expense.date,
        expense.category,
        `"${expense.description.replace(/"/g, '""')}"`,
        expense.paymentMethod || 'N/A',
        expense.type === 'income' ? 'Receita' : 'Despesa',
        expense.amount.toFixed(2)
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-quiosque-${selectedMonth + 1}-${selectedYear}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md p-3 rounded-2xl border border-gray-100 dark:border-slate-600 shadow-xl z-50">
          <p className="font-bold text-gray-800 dark:text-gray-100 mb-2 text-xs uppercase tracking-wider border-b border-gray-100 dark:border-slate-700 pb-1">
            {label ? `Dia ${label}` : payload[0].name}
          </p>
          {payload.map((p: any, index: number) => (
             <div key={index} className="flex items-center justify-between gap-4 mb-1">
                <span className="text-xs font-bold flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <span className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: p.color || p.payload.fill }}></span>
                  {p.name}: 
                </span>
                <span className="text-xs font-black text-gray-900 dark:text-white">{formatCurrency(p.value)}</span>
             </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const goalPercentage = Math.min((totalIncome / monthlyGoal) * 100, 100);

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      
      {/* Header with Export */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
         <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <span className="w-2 h-6 bg-rose-500 rounded-full inline-block"></span>
            Visão Geral
         </h2>
         <motion.button 
           whileHover={{ scale: 1.05 }}
           whileTap={{ scale: 0.95 }}
           onClick={downloadCSV}
           className="w-full sm:w-auto flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-4 py-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
         >
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
           </svg>
           Baixar CSV
         </motion.button>
      </div>

       {/* Monthly Goal Progress */}
       <motion.div variants={cardVariants} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-soft relative overflow-hidden group">
           {/* Background Decoration */}
           <div className="absolute right-0 top-0 w-32 h-32 bg-orange-100/50 dark:bg-orange-900/10 rounded-bl-[100px] pointer-events-none transition-all group-hover:bg-orange-100/80 dark:group-hover:bg-orange-900/20"></div>

          <div className="flex justify-between items-end mb-3 relative z-10">
            <div>
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Meta de Vendas</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                 <span className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{formatCurrency(totalIncome)}</span>
                 <span className="text-xs font-bold text-gray-400">/ {formatCurrency(monthlyGoal)}</span>
              </div>
            </div>
            <span className="text-3xl font-black text-rose-500">{goalPercentage.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-slate-700 h-4 rounded-full overflow-hidden relative z-10 p-1">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${goalPercentage}%` }}
              transition={{ duration: 1.5, type: 'spring', bounce: 0 }}
              className="h-full bg-gradient-to-r from-orange-400 to-rose-500 rounded-full shadow-glow-rose"
            />
          </div>
       </motion.div>

      {/* AI Analysis Drawer */}
      <motion.div 
        layout
        variants={cardVariants}
        className={`rounded-3xl shadow-soft border overflow-hidden relative transition-all duration-300 ${isAnalysisOpen ? 'bg-gradient-to-br from-indigo-900 to-slate-900 border-indigo-700 ring-2 ring-indigo-500/20' : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-900'}`}
      >
        <div 
          onClick={() => setIsAnalysisOpen(!isAnalysisOpen)}
          className="p-5 flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center gap-4">
             <div className={`p-3 rounded-2xl transition-colors ${isAnalysisOpen ? 'bg-white/10 backdrop-blur-md text-indigo-300' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
             </div>
             <div>
               <h4 className={`text-base font-bold leading-none ${isAnalysisOpen ? 'text-white' : 'text-gray-900 dark:text-white'}`}>Análise Inteligente</h4>
               <p className={`text-xs mt-1.5 font-medium ${isAnalysisOpen ? 'text-indigo-300' : 'text-gray-500 dark:text-gray-400'}`}>
                 {isAnalysisOpen ? 'Consultoria do Quiosque' : 'Toque para expandir'}
               </p>
             </div>
          </div>
          <motion.div 
            animate={{ rotate: isAnalysisOpen ? 180 : 0 }}
            className={`p-2 rounded-full ${isAnalysisOpen ? 'text-indigo-300' : 'text-gray-400 dark:text-gray-500 group-hover:bg-gray-100 dark:group-hover:bg-slate-700'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </motion.div>
        </div>

        <AnimatePresence>
          {isAnalysisOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="px-6 md:px-8 pb-8 pt-0 relative z-10">
                 <div className="h-px w-full bg-indigo-500/20 mb-6"></div>
                {isLoadingAnalysis ? (
                   <div className="flex flex-col items-center py-6">
                     <LoadingSpinner />
                     <p className="text-indigo-200 text-sm mt-4 animate-pulse font-medium">Analisando o fluxo do quiosque...</p>
                   </div>
                ) : errorAnalysis ? (
                  <div className="flex flex-col gap-4">
                     <p className="text-rose-200 bg-rose-900/40 p-4 rounded-xl border border-rose-500/30 text-sm">{errorAnalysis}</p>
                     <button onClick={generateAnalysis} className="self-start text-xs font-bold uppercase tracking-widest text-indigo-300 hover:text-white transition-colors flex items-center gap-2">Tentar Novamente</button>
                  </div>
                ) : geminiAnalysis ? (
                   <>
                     <div className="prose prose-invert prose-sm max-w-none text-indigo-100 leading-relaxed">
                       <Markdown>{geminiAnalysis}</Markdown>
                     </div>
                     <div className="mt-6 flex justify-end">
                        <button onClick={generateAnalysis} disabled={isLoadingAnalysis} className="text-xs font-bold uppercase tracking-widest text-indigo-300 hover:text-white transition-colors flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10">Atualizar Dados</button>
                     </div>
                   </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-indigo-300 text-sm italic mb-4">Adicione receitas e despesas para liberar a análise.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Unified KPI Dashboard Card */}
      <motion.div 
        variants={cardVariants}
        className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-soft overflow-hidden relative"
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-gray-100 dark:divide-slate-700">
           
           {/* 1. Cash Balance (Highlight) */}
           <div className="p-6 relative overflow-hidden group bg-gradient-to-b from-teal-50/50 to-transparent dark:from-teal-900/10">
              <div className="flex flex-col h-full justify-between">
                <div>
                  <p className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M1 4a1 1 0 011-1h16a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4zm12 4a3 3 0 11-6 0 3 3 0 016 0zM4 9a1 1 0 100-2 1 1 0 000 2zm13-1a1 1 0 11-2 0 1 1 0 012 0zM1.75 14.5a.75.75 0 000 1.5c4.417 0 8.693.603 12.749 1.73 1.111.309 2.251-.512 2.251-1.696v-.784a.75.75 0 00-1.5 0v.784a.75.75 0 01-.35.668 24.162 24.162 0 00-13.15-1.702z" clipRule="evenodd" /></svg>
                     Gaveta
                  </p>
                  <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">{formatCurrency(cashBalance)}</p>
                </div>
                <div className="mt-4">
                  <span className="text-[10px] text-teal-700 dark:text-teal-300 font-bold bg-teal-100 dark:bg-teal-900/40 inline-block px-2 py-0.5 rounded-lg">Dinheiro Vivo</span>
                </div>
              </div>
           </div>

           {/* 2. Real Profit */}
           <div className="p-6 relative overflow-hidden group">
              <div className="flex flex-col h-full justify-between">
                 <div>
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Lucro Real</p>
                    </div>
                    <p className={`text-2xl sm:text-3xl font-black tracking-tight ${netBalance - estimatedFees >= 0 ? 'text-gray-900 dark:text-white' : 'text-rose-500'}`}>
                      {formatCurrency(netBalance - estimatedFees)}
                    </p>
                 </div>
                 <div className="mt-4 flex items-center gap-2">
                    {estimatedFees > 0 && <span className="text-[10px] text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-2 py-0.5 rounded-lg font-bold">-{formatCurrency(estimatedFees)} taxas</span>}
                 </div>
              </div>
           </div>

           {/* 3. Income */}
           <div className="p-6 relative overflow-hidden group">
               <div className="flex flex-col h-full justify-between">
                  <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                     Entradas
                  </p>
                  <p className="text-2xl sm:text-3xl font-black text-teal-600 dark:text-teal-400 tracking-tight">{formatCurrency(totalIncome)}</p>
                  <div className="mt-4 w-full bg-gray-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                     <div className="h-full bg-teal-400 rounded-full" style={{ width: '100%' }}></div>
                  </div>
               </div>
           </div>

           {/* 4. Expenses */}
           <div className="p-6 relative overflow-hidden group">
               <div className="flex flex-col h-full justify-between">
                  <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                     Saídas
                  </p>
                  <p className="text-2xl sm:text-3xl font-black text-rose-500 dark:text-rose-400 tracking-tight">{formatCurrency(totalExpenses)}</p>
                  <div className="mt-4 w-full bg-gray-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                     <div className="h-full bg-rose-400 rounded-full" style={{ width: `${Math.min((totalExpenses / (totalIncome || 1)) * 100, 100)}%` }}></div>
                  </div>
               </div>
           </div>
        </div>
      </motion.div>

      {/* Charts Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* Daily Flow - Bar Chart */}
        <motion.div variants={cardVariants} className="xl:col-span-3 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-soft">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Fluxo Diário</h4>
            <div className="flex gap-2">
              <span className="flex items-center text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2.5 py-1 rounded-lg border border-teal-100 dark:border-teal-800/50"><span className="w-2 h-2 rounded-full bg-teal-400 mr-2"></span>Entrada</span>
              <span className="flex items-center text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-2.5 py-1 rounded-lg border border-rose-100 dark:border-rose-800/50"><span className="w-2 h-2 rounded-full bg-rose-400 mr-2"></span>Saída</span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                   <linearGradient id="barIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2dd4bf" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#0d9488" stopOpacity={1}/>
                  </linearGradient>
                  <linearGradient id="barExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fb7185" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#e11d48" stopOpacity={1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.1} />
                <XAxis dataKey="day" style={{ fontSize: '11px', fontWeight: 600, fill: '#94a3b8' }} tickCount={10} axisLine={false} tickLine={false} />
                <YAxis style={{ fontSize: '11px', fontWeight: 600, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                <Bar dataKey="income" name="Entradas" fill="url(#barIncome)" radius={[4, 4, 0, 0]} barSize={14} animationDuration={1000} />
                <Bar dataKey="expense" name="Saídas" fill="url(#barExpense)" radius={[4, 4, 0, 0]} barSize={14} animationDuration={1000} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Payment Methods - Donut Chart with Legend */}
        <motion.div variants={cardVariants} className="lg:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-soft flex flex-col">
          <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-4 uppercase tracking-widest">Receitas por Pagamento</h4>
           {paymentMethodData.length > 0 ? (
            <div className="flex flex-col h-full">
              <div className="flex-grow relative w-full h-48 sm:h-56">
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</span>
                    <span className="text-xl font-black text-gray-800 dark:text-white tracking-tight">{formatCurrency(totalIncome)}</span>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                      <Pie
                        activeIndex={activeIndexIncome}
                        activeShape={renderActiveShape}
                        data={paymentMethodData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                        onMouseEnter={(_, index) => setActiveIndexIncome(index)}
                        animationDuration={800}
                      >
                        {paymentMethodData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={INCOME_COLORS[index % INCOME_COLORS.length]} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                   </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Visible Legend for Payment Methods */}
              <div className="grid grid-cols-2 gap-3 mt-4 pt-5 border-t border-gray-100 dark:border-slate-700">
                  {paymentMethodData.map((entry, index) => {
                     const color = INCOME_COLORS[index % INCOME_COLORS.length];
                     const percent = ((entry.value / totalIncome) * 100).toFixed(0);
                     return (
                       <div key={index} className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: color }}></span>
                          <div className="flex flex-col leading-none">
                             <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-0.5">{entry.name}</span>
                             <span className="text-xs font-bold text-gray-800 dark:text-white">{percent}%</span>
                          </div>
                       </div>
                     )
                  })}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm italic">
               Sem dados de receita.
            </div>
          )}
        </motion.div>

        {/* Expenses Pie Chart + Top List */}
        <motion.div variants={cardVariants} className="lg:col-span-1 xl:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-soft flex flex-col">
          <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-6 uppercase tracking-widest">Distribuição de Despesas</h4>
          
          <div className="flex flex-col md:flex-row items-center h-full gap-8">
            {pieData.length > 0 ? (
              <>
                <div className="w-full md:w-1/2 h-64 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        activeIndex={activeIndexExpenses}
                        activeShape={renderActiveShape}
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="amount"
                        onMouseEnter={(_, index) => setActiveIndexExpenses(index)}
                        animationDuration={800}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="w-full md:w-1/2 space-y-3">
                   <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wide">Principais Gastos</p>
                   {pieData.slice(0, 4).map((item, index) => {
                      const style = CATEGORY_STYLES[item.category];
                      const percent = ((item.amount / totalExpenses) * 100).toFixed(1);
                      return (
                        <div key={item.category} className="flex items-center justify-between p-3 rounded-2xl bg-surface-50 dark:bg-slate-700/30 border border-transparent hover:border-gray-200 dark:hover:border-slate-600 transition-colors">
                           <div className="flex items-center gap-3 overflow-hidden">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${style?.bg || 'bg-gray-200'} ${style?.color || 'text-gray-600'} dark:bg-opacity-20`}>
                                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d={style?.icon || 'M12 6v6m0 0v6m0-6h6m-6 0H6'} />
                                  </svg>
                              </div>
                              <div className="flex flex-col overflow-hidden">
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate pr-2">{item.category}</span>
                                <span className="text-[10px] text-gray-400 font-medium">{percent}% do total</span>
                              </div>
                           </div>
                           <span className="text-sm font-black text-gray-900 dark:text-white whitespace-nowrap">{formatCurrency(item.amount)}</span>
                        </div>
                      )
                   })}
                </div>
              </>
            ) : (
               <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm italic">
                Nenhuma despesa para exibir.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default MonthlySummary;
