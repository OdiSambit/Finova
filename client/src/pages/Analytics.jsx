import { useState, useEffect } from 'react'
import { formatCurrency } from '../utils/formatCurrency'
import api from '../services/api'
import toast from 'react-hot-toast'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Wallet,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i)

export default function Analytics() {
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())

  const [expenses, setExpenses] = useState(null)
  const [income, setIncome] = useState(null)
  const [netWorth, setNetWorth] = useState(null)
  const [portfolio, setPortfolio] = useState(null)
  const [trends, setTrends] = useState([])

  const [loading, setLoading] = useState(true)
  const [loadingTrends, setLoadingTrends] = useState(true)

  useEffect(() => {
    fetchPeriodData()
  }, [selectedMonth, selectedYear])

  useEffect(() => {
    fetchTrends()
  }, [])

  const fetchPeriodData = async () => {
    setLoading(true)
    try {
      const [expRes, incRes, nwRes, portRes] = await Promise.allSettled([
        api.get('/analytics/expenses', { params: { month: selectedMonth, year: selectedYear } }),
        api.get('/analytics/income', { params: { month: selectedMonth, year: selectedYear } }),
        api.get('/analytics/net-worth'),
        api.get('/analytics/portfolio'),
      ])

      if (expRes.status === 'fulfilled') setExpenses(expRes.value.data)
      else setExpenses(null)

      if (incRes.status === 'fulfilled') setIncome(incRes.value.data)
      else setIncome(null)

      if (nwRes.status === 'fulfilled') setNetWorth(nwRes.value.data)
      else setNetWorth(null)

      if (portRes.status === 'fulfilled') setPortfolio(portRes.value.data)
      else setPortfolio(null)
    } catch {
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const fetchTrends = async () => {
    setLoadingTrends(true)
    try {
      const res = await api.get('/analytics/monthly-trends')
      setTrends(res.data.trends || [])
    } catch {
      setTrends([])
    } finally {
      setLoadingTrends(false)
    }
  }

  const recentTrends = trends.slice(-6)

  const expenseBreakdown = (expenses?.breakdown || []).map((b) => ({
    name: b.category,
    value: parseFloat(b.total || 0),
  }))

  const pieData = portfolio?.type_distribution
    ? Object.entries(portfolio.type_distribution).map(([type, value]) => ({
        name: type,
        value: parseFloat(value || 0),
      }))
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 mt-1">Detailed insights into your finances</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="input-field py-1.5 px-3 text-sm"
            >
              {MONTHS.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="input-field py-1.5 px-3 text-sm"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {formatCurrency(expenses?.total_expenses)}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-red-100 text-red-600">
                  <TrendingDown className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">Average Daily</p>
                  <p className="text-2xl font-bold text-amber-600 mt-1">
                    {formatCurrency(expenses?.average_daily)}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">Highest Category</p>
                  <p className="text-2xl font-bold text-primary-700 mt-1 capitalize">
                    {expenses?.highest_category || 'N/A'}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-primary-100 text-primary-700">
                  <BarChart3 className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>

          {expenseBreakdown.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Expense Breakdown - {MONTH_SHORT[selectedMonth - 1]} {selectedYear}
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expenseBreakdown} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={100} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {expenseBreakdown.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Income vs Expense Trends</h3>
              <span className="text-xs text-gray-400">Last 6 months</span>
            </div>
            {loadingTrends ? (
              <div className="flex items-center justify-center h-64">
                <div className="h-6 w-6 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              </div>
            ) : recentTrends.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={recentTrends} barGap={4}>
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
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">No trend data available</p>
            )}
          </div>

          {netWorth && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Net Worth</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Assets</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Bank Accounts</span>
                      <span className="font-medium">{formatCurrency(netWorth.assets?.accounts)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Investments</span>
                      <span className="font-medium">{formatCurrency(netWorth.assets?.investments)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between text-sm font-semibold">
                      <span>Total Assets</span>
                      <span className="text-green-600">{formatCurrency(netWorth.assets?.total)}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Liabilities</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Liabilities</span>
                      <span className="font-medium text-red-600">{formatCurrency(netWorth.liabilities)}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Net Worth</h4>
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(netWorth.net_worth)}</p>
                </div>
              </div>
            </div>
          )}

          {portfolio && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Distribution</h3>
                {pieData.length > 0 ? (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {pieData.map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-8">No portfolio data</p>
                )}
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Invested</span>
                    <span className="font-medium">{formatCurrency(portfolio.total_invested)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Current Value</span>
                    <span className="font-medium">{formatCurrency(portfolio.current_value)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="text-sm font-semibold text-gray-900">Overall Return</span>
                    <span className={`text-sm font-bold ${parseFloat(portfolio.overall_return) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {parseFloat(portfolio.overall_return) >= 0 ? '+' : ''}{parseFloat(portfolio.overall_return || 0).toFixed(2)}%
                    </span>
                  </div>

                  {portfolio.top_performers && portfolio.top_performers.length > 0 && (
                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-medium text-gray-500 mb-3">Top Performers</h4>
                      <div className="space-y-3">
                        {portfolio.top_performers.map((item, i) => (
                          <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-lg bg-primary-50 text-primary-600">
                                <TrendingUp className="h-3.5 w-3.5" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{item.name || item.symbol}</p>
                                <p className="text-xs text-gray-400 capitalize">{item.type || item.asset_type}</p>
                              </div>
                            </div>
                            <span className={`text-sm font-semibold ${parseFloat(item.return_percent || item.gain_loss_percent || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {parseFloat(item.return_percent || item.gain_loss_percent || 0) >= 0 ? '+' : ''}
                              {parseFloat(item.return_percent || item.gain_loss_percent || 0).toFixed(2)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
