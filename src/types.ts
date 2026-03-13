export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id?: number;
  type: TransactionType;
  amount: number;
  category: string;
  subcategory?: string;
  date: string;
  note?: string;
  is_bazaar?: boolean;
  created_at?: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  savingsRate: number;
}

export interface CategoryData {
  name: string;
  value: number;
}

export interface TrendData {
  date: string;
  amount: number;
}
