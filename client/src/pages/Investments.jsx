import { useState, useEffect } from 'react'
import { formatCurrency } from '../utils/formatCurrency'
import api from '../services/api'
import {
  TrendingUp,
  Plus,
  Pencil,
  Trash2,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  DollarSign,
  BarChart3,
  Star,
  Eye,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const ASSET_TYPES = [
  { value: 'stock', label: 'Stock' },
  { value: 'mutual_fund', label: 'Mutual Fund' },
  { value: 'etf', label: 'ETF' },
  { value: 'gold', label: 'Gold' },
  { value: 'fixed_income', label: 'Fixed Income' },
  { value: 'other', label: 'Other' },
]

const CHART_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6']

const emptyInvestmentForm = {
  asset_name: '',
  asset_type: 'stock',
  symbol: '',
  quantity: '',
  buy_price: '',
  current_price: '',
}

const emptyWatchlistForm = {
  asset_name: '',
  symbol: '',
  current_price: '',
  price_change: '',
  price_change_percent: '',
}

export default function Investments() {
  const [activeTab, setActiveTab] = useState('portfolio')
  const [investments, setInvestments] = useState([])
  const [watchlist, setWatchlist] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showInvestmentModal, setShowInvestmentModal] = useState(false)
  const [showWatchlistModal, setShowWatchlistModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [investmentForm, setInvestmentForm] = useState(emptyInvestmentForm)
  const [watchlistForm, setWatchlistForm] = useState(emptyWatchlistForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [investRes, summaryRes, watchRes] = await Promise.allSettled([
        api.get('/investments'),
        api.get('/investments/portfolio/summary'),
        api.get('/watchlist'),
      ])
      if (investRes.status === 'fulfilled') {
        setInvestments(investRes.value.data.investments || [])
      }
      if (summaryRes.status === 'fulfilled') {
        setSummary(summaryRes.value.data)
      }
      if (watchRes.status === 'fulfilled') {
        setWatchlist(watchRes.value.data.watchlist || [])
      }
    } catch {
      // Silent fallback
    } finally {
      setLoading(false)
    }
  }

  const fetchPortfolio = async () => {
    try {
      const res = await api.get('/investments/portfolio/summary')
      setSummary(res.data)
    } catch {
      // Silent
    }
  }

  const portfolioInvestments = summary?.investments || investments

  const computedSummary = (() => {
    if (summary && summary.total_invested !== undefined) {
      return {
        totalInvested: Number(summary.total_invested) || 0,
        currentValue: Number(summary.current_value) || 0,
        profitLoss: Number(summary.profit_loss) || 0,
        returnPercentage: Number(summary.return_percentage) || 0,
      }
    }
    let totalInvested = 0
    let currentValue = 0
    portfolioInvestments.forEach((inv) => {
      const qty = Number(inv.quantity) || 0
      const buy = Number(inv.buy_price) || 0
      const cur = Number(inv.current_price) || 0
      totalInvested += qty * buy
      currentValue += qty * cur
    })
    return {
      totalInvested,
      currentValue,
      profitLoss: currentValue - totalInvested,
      returnPercentage: totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0,
    }
  })()

  const allocationData = (() => {
    const map = {}
    portfolioInvestments.forEach((inv) => {
      const type = inv.asset_type || 'other'
      const cur = (Number(inv.quantity) || 0) * (Number(inv.current_price) || 0)
      map[type] = (map[type] || 0) + cur
    })
    return Object.entries(map)
      .map(([name, value]) => ({ name: name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), value }))
      .filter((d) => d.value > 0)
  })()

  const handleInvestmentSubmit = async (e) => {
    e.preventDefault()
    if (!investmentForm.asset_name.trim()) {
      toast.error('Asset name is required')
      return
    }
    if (!investmentForm.quantity || Number(investmentForm.quantity) <= 0) {
      toast.error('Quantity must be greater than 0')
      return
    }
    if (!investmentForm.buy_price || Number(investmentForm.buy_price) <= 0) {
      toast.error('Buy price must be greater than 0')
      return
    }
    setSaving(true)
    try {
      const payload = {
        asset_name: investmentForm.asset_name.trim(),
        asset_type: investmentForm.asset_type,
        symbol: investmentForm.symbol.trim(),
        quantity: Number(investmentForm.quantity),
        buy_price: Number(investmentForm.buy_price),
        current_price: Number(investmentForm.current_price) || Number(investmentForm.buy_price),
      }
      if (editingId) {
        await api.put(`/investments/${editingId}`, payload)
        toast.success('Investment updated')
      } else {
        await api.post('/investments', payload)
        toast.success('Investment added')
      }
      setShowInvestmentModal(false)
      setEditingId(null)
      setInvestmentForm(emptyInvestmentForm)
      await Promise.all([fetchPortfolio(), fetchAll()])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save investment')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteInvestment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this investment?')) return
    try {
      await api.delete(`/investments/${id}`)
      toast.success('Investment deleted')
      await Promise.all([fetchPortfolio(), fetchAll()])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete investment')
    }
  }

  const handleEditInvestment = (inv) => {
    setEditingId(inv.id)
    setInvestmentForm({
      asset_name: inv.asset_name || '',
      asset_type: inv.asset_type || 'stock',
      symbol: inv.symbol || '',
      quantity: inv.quantity ?? '',
      buy_price: inv.buy_price ?? '',
      current_price: inv.current_price ?? '',
    })
    setShowInvestmentModal(true)
  }

  const handleWatchlistSubmit = async (e) => {
    e.preventDefault()
    if (!watchlistForm.asset_name.trim()) {
      toast.error('Asset name is required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        asset_name: watchlistForm.asset_name.trim(),
        symbol: watchlistForm.symbol.trim(),
        current_price: Number(watchlistForm.current_price) || 0,
        price_change: Number(watchlistForm.price_change) || 0,
        price_change_percent: Number(watchlistForm.price_change_percent) || 0,
      }
      await api.post('/watchlist', payload)
      toast.success('Added to watchlist')
      setShowWatchlistModal(false)
      setWatchlistForm(emptyWatchlistForm)
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to watchlist')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveWatchlist = async (id) => {
    try {
      await api.delete(`/watchlist/${id}`)
      toast.success('Removed from watchlist')
      setWatchlist((prev) => prev.filter((w) => w.id !== id))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove')
    }
  }

  const openAddInvestment = () => {
    setEditingId(null)
    setInvestmentForm(emptyInvestmentForm)
    setShowInvestmentModal(true)
  }

  const closeInvestmentModal = () => {
    setShowInvestmentModal(false)
    setEditingId(null)
    setInvestmentForm(emptyInvestmentForm)
  }

  const closeWatchlistModal = () => {
    setShowWatchlistModal(false)
    setWatchlistForm(emptyWatchlistForm)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investments</h1>
          <p className="text-gray-500 mt-1">Track your portfolio and watchlist</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('portfolio')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'portfolio'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          Portfolio
        </button>
        <button
          onClick={() => setActiveTab('watchlist')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'watchlist'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Star className="h-4 w-4" />
          Watchlist
        </button>
      </div>

      {activeTab === 'portfolio' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-600">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Portfolio Value</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(computedSummary.currentValue)}</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Invested</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(computedSummary.totalInvested)}</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${computedSummary.profitLoss >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                  {computedSummary.profitLoss >= 0 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Profit/Loss</p>
                  <p className={`text-xl font-bold ${computedSummary.profitLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {computedSummary.profitLoss >= 0 ? '+' : ''}{formatCurrency(computedSummary.profitLoss)}
                  </p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${computedSummary.returnPercentage >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Return %</p>
                  <p className={`text-xl font-bold ${computedSummary.returnPercentage >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {computedSummary.returnPercentage >= 0 ? '+' : ''}{computedSummary.returnPercentage.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Holdings Table */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Holdings</h2>
                <button onClick={openAddInvestment} className="btn-primary flex items-center gap-2 text-sm">
                  <Plus className="h-4 w-4" />
                  Add Investment
                </button>
              </div>
              {portfolioInvestments.length === 0 ? (
                <div className="card text-center py-12">
                  <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No investments yet. Add your first investment to start tracking.</p>
                </div>
              ) : (
                <div className="card overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Asset</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Symbol</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-500">Qty</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-500">Buy Price</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-500">Current</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-500">Invested</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-500">Value</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-500">P&L</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-500">Return</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portfolioInvestments.map((inv) => {
                        const qty = Number(inv.quantity) || 0
                        const buy = Number(inv.buy_price) || 0
                        const cur = Number(inv.current_price) || 0
                        const invested = qty * buy
                        const currentValue = qty * cur
                        const pl = currentValue - invested
                        const returnPct = invested > 0 ? ((currentValue - invested) / invested) * 100 : 0
                        return (
                          <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                            <td className="py-3 px-4 font-medium text-gray-900">{inv.asset_name}</td>
                            <td className="py-3 px-4 text-gray-600">{inv.symbol || '-'}</td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 capitalize">
                                {(inv.asset_type || 'other').replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right text-gray-700">{qty}</td>
                            <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(buy)}</td>
                            <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(cur)}</td>
                            <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(invested)}</td>
                            <td className="py-3 px-4 text-right text-gray-900 font-medium">{formatCurrency(currentValue)}</td>
                            <td className={`py-3 px-4 text-right font-medium ${pl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {pl >= 0 ? '+' : ''}{formatCurrency(pl)}
                            </td>
                            <td className={`py-3 px-4 text-right font-medium ${returnPct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(2)}%
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleEditInvestment(inv)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                  title="Edit"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteInvestment(inv.id)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pie Chart */}
            {allocationData.length > 0 && (
              <div className="lg:w-80">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Asset Allocation</h2>
                <div className="card">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={allocationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {allocationData.map((_, index) => (
                          <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatCurrency(value)}
                        contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-2">
                    {allocationData.map((entry, index) => {
                      const total = allocationData.reduce((s, d) => s + d.value, 0)
                      const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0'
                      return (
                        <div key={entry.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                            />
                            <span className="text-gray-700">{entry.name}</span>
                          </div>
                          <span className="text-gray-500">{pct}%</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'watchlist' && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Watchlist</h2>
            <button
              onClick={() => setShowWatchlistModal(true)}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus className="h-4 w-4" />
              Add to Watchlist
            </button>
          </div>
          {watchlist.length === 0 ? (
            <div className="card text-center py-12">
              <Eye className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Your watchlist is empty. Add assets to monitor their prices.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {watchlist.map((item) => {
                const priceChange = Number(item.price_change) || 0
                const priceChangePercent = Number(item.price_change_percent) || 0
                const isPositive = priceChange >= 0
                return (
                  <div key={item.id} className="card flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{item.asset_name}</p>
                        <p className="text-sm text-gray-500">{item.symbol}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveWatchlist(item.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(item.current_price)}</p>
                        <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                          {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                          <span>
                            {isPositive ? '+' : ''}{formatCurrency(priceChange)} ({isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Investment Modal */}
      {showInvestmentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Edit Investment' : 'Add Investment'}
              </h2>
              <button onClick={closeInvestmentModal} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleInvestmentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Asset Name *</label>
                <input
                  type="text"
                  value={investmentForm.asset_name}
                  onChange={(e) => setInvestmentForm({ ...investmentForm, asset_name: e.target.value })}
                  placeholder="e.g. Reliance Industries"
                  className="input-field"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Asset Type *</label>
                  <select
                    value={investmentForm.asset_type}
                    onChange={(e) => setInvestmentForm({ ...investmentForm, asset_type: e.target.value })}
                    className="input-field"
                  >
                    {ASSET_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Symbol</label>
                  <input
                    type="text"
                    value={investmentForm.symbol}
                    onChange={(e) => setInvestmentForm({ ...investmentForm, symbol: e.target.value })}
                    placeholder="e.g. RELIANCE"
                    className="input-field"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantity *</label>
                  <input
                    type="number"
                    value={investmentForm.quantity}
                    onChange={(e) => setInvestmentForm({ ...investmentForm, quantity: e.target.value })}
                    placeholder="0"
                    min="0"
                    step="any"
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Buy Price *</label>
                  <input
                    type="number"
                    value={investmentForm.buy_price}
                    onChange={(e) => setInvestmentForm({ ...investmentForm, buy_price: e.target.value })}
                    placeholder="0.00"
                    min="0"
                    step="any"
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Price</label>
                  <input
                    type="number"
                    value={investmentForm.current_price}
                    onChange={(e) => setInvestmentForm({ ...investmentForm, current_price: e.target.value })}
                    placeholder="0.00"
                    min="0"
                    step="any"
                    className="input-field"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeInvestmentModal} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Saving...' : editingId ? 'Update Investment' : 'Add Investment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Watchlist Modal */}
      {showWatchlistModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Add to Watchlist</h2>
              <button onClick={closeWatchlistModal} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleWatchlistSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Asset Name *</label>
                <input
                  type="text"
                  value={watchlistForm.asset_name}
                  onChange={(e) => setWatchlistForm({ ...watchlistForm, asset_name: e.target.value })}
                  placeholder="e.g. Tata Motors"
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Symbol</label>
                <input
                  type="text"
                  value={watchlistForm.symbol}
                  onChange={(e) => setWatchlistForm({ ...watchlistForm, symbol: e.target.value })}
                  placeholder="e.g. TATAMOTORS"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Price</label>
                <input
                  type="number"
                  value={watchlistForm.current_price}
                  onChange={(e) => setWatchlistForm({ ...watchlistForm, current_price: e.target.value })}
                  placeholder="0.00"
                  min="0"
                  step="any"
                  className="input-field"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Price Change</label>
                  <input
                    type="number"
                    value={watchlistForm.price_change}
                    onChange={(e) => setWatchlistForm({ ...watchlistForm, price_change: e.target.value })}
                    placeholder="0.00"
                    step="any"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Change %</label>
                  <input
                    type="number"
                    value={watchlistForm.price_change_percent}
                    onChange={(e) => setWatchlistForm({ ...watchlistForm, price_change_percent: e.target.value })}
                    placeholder="0.00"
                    step="any"
                    className="input-field"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeWatchlistModal} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Adding...' : 'Add to Watchlist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
