/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  PlusCircle, 
  ShoppingBag, 
  FileText, 
  TrendingUp, 
  Settings,
  Menu,
  X,
  Plus,
  Trash2,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { format, startOfMonth, endOfMonth, isWithinInterval, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  LineChart, Line
} from "recharts";
import { Transaction, FinancialSummary, CategoryData, TrendData, TransactionType } from "./types";
import { CATEGORIES, FOOD_SUBCATEGORIES, BAZAAR_ITEMS } from "./constants";
import { cn } from "./lib/utils";
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

type View = "dashboard" | "add" | "bazaar" | "reports" | "forecast";

export default function App() {
  const [view, setView] = useState<View>("dashboard");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await fetch("/api/transactions");
      const data = await res.json();
      setTransactions(data);
    } catch (err) {
      console.error("Failed to fetch transactions", err);
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (t: Transaction) => {
    try {
      await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(t),
      });
      fetchTransactions();
      setView("dashboard");
    } catch (err) {
      console.error("Failed to add transaction", err);
    }
  };

  const addBulkTransactions = async (ts: Transaction[]) => {
    try {
      await fetch("/api/transactions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ts),
      });
      fetchTransactions();
      setView("dashboard");
    } catch (err) {
      console.error("Failed to add bulk transactions", err);
    }
  };

  const deleteTransaction = async (id: number) => {
    try {
      await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      fetchTransactions();
    } catch (err) {
      console.error("Failed to delete transaction", err);
    }
  };

  const NavItem = ({ icon: Icon, label, id }: { icon: any, label: string, id: View }) => (
    <button
      onClick={() => {
        setView(id);
        setIsSidebarOpen(false);
      }}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 w-full text-left",
        view === id 
          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" 
          : "text-slate-600 hover:bg-slate-100"
      )}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold">B</div>
          <h1 className="font-bold text-lg">BazaarBudget</h1>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-600">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 p-6 transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="hidden md:flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-200">B</div>
          <h1 className="font-bold text-xl tracking-tight">BazaarBudget</h1>
        </div>

        <nav className="space-y-2">
          <NavItem icon={LayoutDashboard} label="Dashboard" id="dashboard" />
          <NavItem icon={PlusCircle} label="Add Transaction" id="add" />
          <NavItem icon={ShoppingBag} label="Bazaar Mode" id="bazaar" />
          <NavItem icon={FileText} label="Reports" id="reports" />
          <NavItem icon={TrendingUp} label="Forecasting" id="forecast" />
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="p-4 bg-slate-900 rounded-2xl text-white">
            <p className="text-xs text-slate-400 mb-1">Financial Health</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold">84</span>
              <span className="text-xs text-emerald-400 mb-1 font-medium">+2.4%</span>
            </div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-emerald-500 h-full w-[84%]"></div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
        <AnimatePresence mode="wait">
          {view === "dashboard" && (
            <Dashboard 
              transactions={transactions} 
              onDelete={deleteTransaction} 
              onAddClick={() => setView("add")}
            />
          )}
          {view === "add" && (
            <TransactionForm onAdd={addTransaction} onCancel={() => setView("dashboard")} />
          )}
          {view === "bazaar" && (
            <BazaarMode onAdd={addBulkTransactions} onCancel={() => setView("dashboard")} />
          )}
          {view === "reports" && (
            <Reports transactions={transactions} />
          )}
          {view === "forecast" && (
            <Forecasting transactions={transactions} />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- Components ---

function Dashboard({ transactions, onDelete, onAddClick }: { transactions: Transaction[], onDelete: (id: number) => void, onAddClick: () => void }) {
  const now = new Date();
  const currentMonthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const totalIncome = currentMonthTransactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = currentMonthTransactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;

  const categoryData = CATEGORIES.expense.map(cat => ({
    name: cat,
    value: currentMonthTransactions
      .filter(t => t.category === cat)
      .reduce((sum, t) => sum + t.amount, 0)
  })).filter(c => c.value > 0);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b', '#06b6d4'];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Financial Overview</h2>
          <p className="text-slate-500">Welcome back! Here's what's happening this month.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onAddClick}
            className="bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-colors"
          >
            <Plus size={20} />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Income" amount={totalIncome} icon={ArrowUpRight} color="emerald" />
        <StatCard title="Total Expenses" amount={totalExpenses} icon={ArrowDownRight} color="rose" />
        <StatCard title="Net Balance" amount={balance} icon={Wallet} color="blue" />
        <StatCard title="Savings Rate" amount={savingsRate} isPercent icon={TrendingUp} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Spending by Category */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-lg mb-6">Spending by Category</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {categoryData.slice(0, 4).map((c, i) => (
              <div key={c.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="text-slate-600">{c.name}</span>
                </div>
                <span className="font-semibold">${c.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg">Recent Transactions</h3>
            <button className="text-emerald-500 text-sm font-semibold hover:underline">View All</button>
          </div>
          <div className="space-y-4 overflow-y-auto max-h-[400px] pr-2">
            {transactions.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <Calendar size={48} className="mx-auto mb-3 opacity-20" />
                <p>No transactions yet. Start by adding one!</p>
              </div>
            ) : (
              transactions.slice(0, 10).map((t) => (
                <div key={t.id} className="group flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center",
                      t.type === "income" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                    )}>
                      {t.type === "income" ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{t.category}{t.subcategory ? ` • ${t.subcategory}` : ""}</p>
                      <p className="text-xs text-slate-500">{format(new Date(t.date), "MMM d, yyyy")} {t.note ? `• ${t.note}` : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className={cn(
                      "font-bold text-lg",
                      t.type === "income" ? "text-emerald-600" : "text-slate-900"
                    )}>
                      {t.type === "income" ? "+" : "-"}${t.amount.toLocaleString()}
                    </p>
                    <button 
                      onClick={() => t.id && onDelete(t.id)}
                      className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ title, amount, icon: Icon, color, isPercent }: { title: string, amount: number, icon: any, color: string, isPercent?: boolean }) {
  const colorClasses = {
    emerald: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
  }[color as 'emerald' | 'rose' | 'blue' | 'amber'];

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-3 rounded-2xl", colorClasses)}>
          <Icon size={24} />
        </div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <h4 className="text-2xl font-bold text-slate-900">
          {isPercent ? "" : "$"}{amount.toLocaleString()}{isPercent ? "%" : ""}
        </h4>
      </div>
    </div>
  );
}

function TransactionForm({ onAdd, onCancel }: { onAdd: (t: Transaction) => void, onCancel: () => void }) {
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [note, setNote] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category || !date) return;
    onAdd({
      type,
      amount: parseFloat(amount),
      category,
      subcategory: category === "Food" ? subcategory : undefined,
      date,
      note
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-xl"
    >
      <h2 className="text-2xl font-bold mb-8">Add Transaction</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setType("expense")}
            className={cn(
              "flex-1 py-3 rounded-xl font-bold transition-all",
              type === "expense" ? "bg-white text-rose-600 shadow-sm" : "text-slate-500"
            )}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setType("income")}
            className={cn(
              "flex-1 py-3 rounded-xl font-bold transition-all",
              type === "income" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500"
            )}
          >
            Income
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 font-bold text-lg"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 font-medium"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Category</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setSubcategory("");
              }}
              className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 font-medium appearance-none"
              required
            >
              <option value="">Select Category</option>
              {CATEGORIES[type].map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {category === "Food" && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Subcategory</label>
              <select
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 font-medium appearance-none"
              >
                <option value="">Select Subcategory</option>
                {FOOD_SUBCATEGORIES.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Note (Optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 font-medium min-h-[100px]"
            placeholder="What was this for?"
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-4 rounded-2xl font-bold bg-emerald-500 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-colors"
          >
            Save Transaction
          </button>
        </div>
      </form>
    </motion.div>
  );
}

function BazaarMode({ onAdd, onCancel }: { onAdd: (ts: Transaction[]) => void, onCancel: () => void }) {
  const [items, setItems] = useState<{ name: string, amount: string, subcategory: string }[]>([
    { name: "", amount: "", subcategory: "" }
  ]);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const addItem = () => setItems([...items, { name: "", amount: "", subcategory: "" }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));
  
  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    
    // Auto-classify if name matches preset
    if (field === "name") {
      const preset = BAZAAR_ITEMS.find(bi => bi.name.toLowerCase() === value.toLowerCase());
      if (preset) {
        newItems[index].subcategory = preset.subcategory;
      }
    }
    
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.filter(i => i.name && i.amount);
    if (validItems.length === 0) return;

    const transactions: Transaction[] = validItems.map(i => ({
      type: "expense",
      amount: parseFloat(i.amount),
      category: "Food",
      subcategory: i.subcategory || "Other groceries",
      date,
      note: `Bazaar: ${i.name}`,
      is_bazaar: true
    }));

    onAdd(transactions);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-3xl mx-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-xl"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold">Bazaar Purchase Mode</h2>
          <p className="text-slate-500">Quickly add multiple items from your bazaar visit.</p>
        </div>
        <ShoppingBag className="text-emerald-500" size={32} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2 max-w-xs">
          <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Visit Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 font-medium"
            required
          />
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-4 px-2">
            <div className="col-span-5 text-xs font-bold text-slate-400 uppercase">Item Name</div>
            <div className="col-span-3 text-xs font-bold text-slate-400 uppercase">Amount</div>
            <div className="col-span-3 text-xs font-bold text-slate-400 uppercase">Subcategory</div>
            <div className="col-span-1"></div>
          </div>

          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-5">
                <input
                  list="bazaar-presets"
                  value={item.name}
                  onChange={(e) => updateItem(index, "name", e.target.value)}
                  placeholder="e.g. Tomatoes"
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 font-medium"
                />
                <datalist id="bazaar-presets">
                  {BAZAAR_ITEMS.map(bi => <option key={bi.name} value={bi.name} />)}
                </datalist>
              </div>
              <div className="col-span-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={item.amount}
                    onChange={(e) => updateItem(index, "amount", e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>
              </div>
              <div className="col-span-3">
                <select
                  value={item.subcategory}
                  onChange={(e) => updateItem(index, "subcategory", e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 font-medium appearance-none"
                >
                  <option value="">Auto</option>
                  {FOOD_SUBCATEGORIES.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-1 flex justify-center">
                {items.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => removeItem(index)}
                    className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-2 text-emerald-500 font-bold hover:bg-emerald-50 px-4 py-2 rounded-xl transition-colors"
        >
          <Plus size={20} />
          Add Another Item
        </button>

        <div className="flex gap-4 pt-8 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-4 rounded-2xl font-bold bg-emerald-500 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-colors"
          >
            Save All Items
          </button>
        </div>
      </form>
    </motion.div>
  );
}

function Reports({ transactions }: { transactions: Transaction[] }) {
  const [reportType, setReportType] = useState<"weekly" | "monthly">("monthly");
  const [insights, setInsights] = useState<string>("");
  const [loadingInsights, setLoadingInsights] = useState(false);

  const now = new Date();
  const reportTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    if (reportType === "monthly") {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    } else {
      const start = startOfWeek(now);
      const end = endOfWeek(now);
      return isWithinInterval(d, { start, end });
    }
  });

  const income = reportTransactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenses = reportTransactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const bazaarSpending = reportTransactions.filter(t => t.is_bazaar).reduce((s, t) => s + t.amount, 0);

  const generateInsights = async () => {
    setLoadingInsights(true);
    try {
      const prompt = `Analyze this ${reportType} financial data and provide 3 short, actionable insights:
        Total Income: $${income}
        Total Expenses: $${expenses}
        Bazaar Spending: $${bazaarSpending}
        Transactions: ${JSON.stringify(reportTransactions.slice(0, 20))}
        Focus on spending patterns and potential savings. Keep it concise.`;
      
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }]
      });
      setInsights(result.text || "No insights available.");
    } catch (err) {
      console.error("Failed to generate insights", err);
      setInsights("Unable to generate AI insights at this time.");
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => {
    if (reportTransactions.length > 0) {
      generateInsights();
    }
  }, [reportType, transactions.length]);

  const exportCSV = () => {
    const headers = ["Date", "Type", "Amount", "Category", "Subcategory", "Note", "Bazaar"];
    const rows = reportTransactions.map(t => [
      t.date,
      t.type,
      t.amount,
      t.category,
      t.subcategory || "",
      t.note || "",
      t.is_bazaar ? "Yes" : "No"
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `BazaarBudget_Report_${reportType}_${format(now, "yyyy-MM")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Financial Reports</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <FileText size={18} />
            Export CSV
          </button>
          <div className="flex p-1 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <button
            onClick={() => setReportType("weekly")}
            className={cn(
              "px-6 py-2 rounded-xl font-bold transition-all",
              reportType === "weekly" ? "bg-emerald-500 text-white shadow-md" : "text-slate-500"
            )}
          >
            Weekly
          </button>
          <button
            onClick={() => setReportType("monthly")}
            className={cn(
              "px-6 py-2 rounded-xl font-bold transition-all",
              reportType === "monthly" ? "bg-emerald-500 text-white shadow-md" : "text-slate-500"
            )}
          >
            Monthly
          </button>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-xl mb-6">Income vs Expenses</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Income', amount: income },
                  { name: 'Expenses', amount: expenses },
                  { name: 'Bazaar', amount: bazaarSpending }
                ]}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                    <Cell fill="#10b981" />
                    <Cell fill="#ef4444" />
                    <Cell fill="#3b82f6" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-xl mb-6">AI Insights</h3>
            {loadingInsights ? (
              <div className="flex items-center gap-3 text-slate-400">
                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p>Analyzing your spending patterns...</p>
              </div>
            ) : (
              <div className="prose prose-slate max-w-none">
                <p className="whitespace-pre-wrap text-slate-600 leading-relaxed">{insights}</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl">
            <h4 className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-4">Summary</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Net Flow</span>
                <span className={cn("font-bold text-xl", income - expenses >= 0 ? "text-emerald-400" : "text-rose-400")}>
                  ${(income - expenses).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Bazaar Impact</span>
                <span className="font-bold text-xl text-blue-400">
                  {expenses > 0 ? Math.round((bazaarSpending / expenses) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h4 className="font-bold mb-4">Top Categories</h4>
            <div className="space-y-4">
              {CATEGORIES.expense.map(cat => {
                const amount = reportTransactions.filter(t => t.category === cat).reduce((s, t) => s + t.amount, 0);
                if (amount === 0) return null;
                const percent = Math.round((amount / expenses) * 100);
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600 font-medium">{cat}</span>
                      <span className="font-bold">${amount.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Forecasting({ transactions }: { transactions: Transaction[] }) {
  const [forecast, setForecast] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generateForecast = async () => {
    setLoading(true);
    try {
      // Simple logic: average of last 3 months
      const now = new Date();
      const last3Months = [0, 1, 2].map(i => {
        const d = subMonths(now, i + 1);
        const monthTs = transactions.filter(t => {
          const td = new Date(t.date);
          return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
        });
        return {
          income: monthTs.filter(t => t.type === "income").reduce((s, m) => s + m.amount, 0),
          expenses: monthTs.filter(t => t.type === "expense").reduce((s, m) => s + m.amount, 0)
        };
      });

      const avgIncome = last3Months.reduce((s, m) => s + m.income, 0) / 3;
      const avgExpenses = last3Months.reduce((s, m) => s + m.expenses, 0) / 3;

      // AI Recommendations
      const prompt = `Based on these historical averages:
        Avg Monthly Income: $${avgIncome}
        Avg Monthly Expenses: $${avgExpenses}
        Transactions: ${JSON.stringify(transactions.slice(0, 50))}
        
        Provide:
        1. Forecast for next month.
        2. 3 specific recommendations to reduce expenses.
        3. 2 ideas for additional income based on common household skills.
        Keep it concise and actionable.`;
      
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }]
      });
      
      setForecast({
        income: avgIncome,
        expenses: avgExpenses,
        recommendations: result.text
      });
    } catch (err) {
      console.error("Forecasting failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (transactions.length > 0) {
      generateForecast();
    }
  }, [transactions.length]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <h2 className="text-3xl font-bold tracking-tight">Smart Forecasting</h2>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-medium">Calculating your financial future...</p>
        </div>
      ) : forecast ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-lg mb-6">Next Month Forecast</h3>
              <div className="space-y-6">
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase mb-1">Expected Income</p>
                  <p className="text-3xl font-bold text-emerald-600">${Math.round(forecast.income).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase mb-1">Expected Expenses</p>
                  <p className="text-3xl font-bold text-slate-900">${Math.round(forecast.expenses).toLocaleString()}</p>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-slate-400 text-xs font-bold uppercase mb-1">Projected Savings</p>
                  <p className="text-2xl font-bold text-blue-600">${Math.round(forecast.income - forecast.expenses).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-emerald-500 p-8 rounded-3xl text-white shadow-lg shadow-emerald-200">
              <h3 className="font-bold text-lg mb-2">Pro Tip</h3>
              <p className="text-emerald-50 opacity-90 leading-relaxed">
                Setting aside just 10% of your projected income at the start of the month can improve your financial health score by 15 points.
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                <TrendingUp size={24} />
              </div>
              <h3 className="font-bold text-xl">AI Recommendations & Income Ideas</h3>
            </div>
            <div className="prose prose-slate max-w-none">
              <p className="whitespace-pre-wrap text-slate-600 leading-relaxed">{forecast.recommendations}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 text-slate-400">
          <p>Not enough data to generate a forecast yet. Keep tracking!</p>
        </div>
      )}
    </motion.div>
  );
}
