import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDate } from '../utils/helpers'
import api from '../services/api'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  CreditCard,
  PiggyBank,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

const COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

export default function Dashboard() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [recentTransactions, setRecentTransactions] = useState([])
  const [portfolio, setPortfolio] = useState(null)
  const [goals, setGoals] = useState([])
  const [expenseAnalytics, setExpenseAnalytics] = useState(null)
  const [netWorth, setNetWorth] = useState(null)
  const [trends, setTrends] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const results = await Promise.allSettled([
          api.get('/accounts'),
          api.get('/transactions?limit=5&sort_by=transaction_date&sort_order=DESC'),
          api.get('/investments/portfolio/summary'),
          api.get('/goals'),
          api.get('/analytics/expenses'),
          api.get('/analytics/net-worth'),
          api.get('/analytics/monthly-trends'),
        ])

        if (results[0].status === 'fulfilled') setAccounts(results[0].value.data.accounts || [])
        if (results[1].status === 'fulfilled') setRecentTransactions(results[1].value.data.transactions || [])
        if (results[2].status === 'fulfilled') setPortfolio(results[2].value.data)
        if (results[3].status === 'fulfilled') setGoals(results[3].value.data.goals || [])
        if (results[4].status === 'fulfilled') setExpenseAnalytics(results[4].value.data)
        if (results[5].status === 'fulfilled') setNetWorth(results[5].value.data)
        if (results[6].status === 'fulfilled') setTrends(results[6].value.data.trends || [])
      } catch {
        // Silent
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0)
  const totalIncome = trends.length > 0 ? trends[trends.length - 1]?.income || 0 : 0
  const totalExpenses = expenseAnalytics?.total_expenses || 0

  const stats = [
    {
      label: 'Total Balance',
      value: formatCurrency(totalBalance),
      icon: Wallet,
      color: 'bg-blue-100 text-blue-700',
    },
    {
      label: 'Monthly Income',
      value: formatCurrency(totalIncome),
      icon: TrendingUp,
      color: 'bg-green-100 text-green-700',
    },
    {
      label: 'Monthly Expenses',
      value: formatCurrency(totalExpenses),
      icon: TrendingDown,
      color: 'bg-red-100 text-red-600',
    },
    {
      label: 'Investment Value',
      value: formatCurrency(portfolio?.current_value || 0),
      icon: CreditCard,
      color: 'bg-purple-100 text-purple-700',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.full_name?.split(' ')[0]}
          </h1>
          <p className="text-gray-500 mt-1">Here&apos;s an overview of your finances</p>
        </div>
        <Link to="/transfers" className="btn-primary hidden sm:flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Transfer
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-2.5 rounded-xl ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Income vs Expenses</h2>
            <span className="text-xs text-gray-400">Last 6 months</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
            <Link to="/transactions" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentTransactions.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">No transactions yet</p>
            )}
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div
                  className={`p-2 rounded-lg ${
                    tx.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}
                >
                  {tx.type === 'income' ? (
                    <ArrowDownRight className="h-4 w-4" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{tx.description || tx.category}</p>
                  <p className="text-xs text-gray-400">{formatDate(tx.transaction_date)}</p>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Financial Goals</h2>
            <Link to="/goals" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all
            </Link>
          </div>
          {goals.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No goals yet</p>
          ) : (
            <div className="space-y-4">
              {goals.slice(0, 3).map((goal) => {
                const target = parseFloat(goal.target_amount || 0)
                const current = parseFloat(goal.current_amount || 0)
                const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0
                return (
                  <div key={goal.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{goal.name}</span>
                      <span className="text-xs text-gray-500">{pct.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          goal.status === 'completed' ? 'bg-green-500' :
                          goal.status === 'behind' ? 'bg-red-500' : 'bg-primary-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>{formatCurrency(current)}</span>
                      <span>{formatCurrency(target)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Spending Breakdown</h2>
          </div>
          {expenseAnalytics?.breakdown?.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseAnalytics.breakdown.map(b => ({ name: b.category, value: b.total }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {expenseAnalytics.breakdown.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No expense data yet</p>
          )}
        </div>
      </div>

      {netWorth && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Net Worth</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Assets</h3>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Bank Accounts</span>
                  <span className="font-medium">{formatCurrency(netWorth.assets?.accounts || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Investments</span>
                  <span className="font-medium">{formatCurrency(netWorth.assets?.investments || 0)}</span>
                </div>
                <div className="border-t pt-1 flex justify-between text-sm font-semibold">
                  <span>Total Assets</span>
                  <span>{formatCurrency(netWorth.assets?.total || 0)}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Liabilities</h3>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Liabilities</span>
                  <span className="font-medium text-red-600">{formatCurrency(netWorth.liabilities || 0)}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Net Worth</h3>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(netWorth.net_worth || 0)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Your Accounts</h2>
          <Link to="/accounts" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            Manage accounts
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8 col-span-full">No accounts found</p>
          )}
          {accounts.slice(0, 3).map((account) => (
            <div
              key={account.id}
              className="border border-gray-200 rounded-xl p-4 hover:border-primary-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary-50 text-primary-600">
                  <PiggyBank className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{account.account_name}</p>
                  <p className="text-xs text-gray-400 capitalize">{account.account_type}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Balance</span>
                <span className="text-lg font-bold text-gray-900">{formatCurrency(account.balance)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
