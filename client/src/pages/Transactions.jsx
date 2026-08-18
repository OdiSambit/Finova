import { useState, useEffect, useCallback } from 'react'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDate } from '../utils/helpers'
import api from '../services/api'
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
  Plus,
  Search,
  X,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import toast from 'react-hot-toast'

const TYPE_OPTIONS = ['all', 'income', 'expense', 'transfer']
const CATEGORY_OPTIONS = [
  'Food',
  'Travel',
  'Shopping',
  'Entertainment',
  'Bills',
  'Education',
  'Healthcare',
  'Salary',
  'Investment',
  'Transfer',
  'Other',
]

const TYPE_STYLES = {
  income: 'bg-green-100 text-green-700',
  expense: 'bg-red-100 text-red-700',
  transfer: 'bg-blue-100 text-blue-700',
}

const CATEGORY_STYLES = {
  Food: 'bg-orange-100 text-orange-700',
  Travel: 'bg-sky-100 text-sky-700',
  Shopping: 'bg-pink-100 text-pink-700',
  Entertainment: 'bg-purple-100 text-purple-700',
  Bills: 'bg-yellow-100 text-yellow-700',
  Education: 'bg-indigo-100 text-indigo-700',
  Healthcare: 'bg-red-100 text-red-700',
  Salary: 'bg-green-100 text-green-700',
  Investment: 'bg-teal-100 text-teal-700',
  Transfer: 'bg-blue-100 text-blue-700',
  Other: 'bg-gray-100 text-gray-700',
}

const EMPTY_FORM = {
  account_id: '',
  type: 'expense',
  category: 'Other',
  amount: '',
  description: '',
  transaction_date: new Date().toISOString().split('T')[0],
}

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const limit = 10

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [accountFilter, setAccountFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [sortBy, setSortBy] = useState('transaction_date')
  const [sortOrder, setSortOrder] = useState('desc')

  const [showModal, setShowModal] = useState(false)
  const [editingTx, setEditingTx] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const offset = (page - 1) * limit
  const totalPages = Math.max(1, Math.ceil(total / limit))

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await api.get('/accounts')
      setAccounts(res.data.accounts || res.data || [])
    } catch {
      toast.error('Failed to load accounts')
    }
  }, [])

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const params = { limit, offset, sort_by: sortBy, sort_order: sortOrder }
      if (typeFilter !== 'all') params.type = typeFilter
      if (categoryFilter) params.category = categoryFilter
      if (accountFilter) params.account_id = accountFilter
      if (startDate) params.start_date = startDate
      if (endDate) params.end_date = endDate
      if (search.trim()) params.search = search.trim()

      const res = await api.get('/transactions', { params })
      setTransactions(res.data.transactions || [])
      setTotal(res.data.total || 0)
    } catch {
      toast.error('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }, [typeFilter, categoryFilter, accountFilter, startDate, endDate, search, sortBy, sortOrder, limit, offset])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  useEffect(() => {
    setPage(1)
  }, [typeFilter, categoryFilter, accountFilter, startDate, endDate, search, sortBy, sortOrder])

  const clearFilters = () => {
    setSearch('')
    setTypeFilter('all')
    setCategoryFilter('')
    setAccountFilter('')
    setStartDate('')
    setEndDate('')
    setSortBy('transaction_date')
    setSortOrder('desc')
    setPage(1)
  }

  const hasActiveFilters =
    search || typeFilter !== 'all' || categoryFilter || accountFilter || startDate || endDate

  const openAddModal = () => {
    setEditingTx(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  const openEditModal = (tx) => {
    setEditingTx(tx)
    setForm({
      account_id: tx.account_id || '',
      type: tx.type || 'expense',
      category: tx.category || 'Other',
      amount: tx.amount ?? '',
      description: tx.description || '',
      transaction_date: tx.transaction_date
        ? tx.transaction_date.split('T')[0]
        : '',
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingTx(null)
    setForm(EMPTY_FORM)
  }

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.account_id) {
      toast.error('Please select an account')
      return
    }
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    if (!form.transaction_date) {
      toast.error('Please select a date')
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
      }

      if (editingTx) {
        await api.put(`/transactions/${editingTx.id}`, payload)
        toast.success('Transaction updated')
      } else {
        await api.post('/transactions', payload)
        toast.success('Transaction created')
      }
      closeModal()
      fetchTransactions()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save transaction')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await api.delete(`/transactions/${deleteId}`)
      toast.success('Transaction deleted')
      setDeleteId(null)
      fetchTransactions()
    } catch {
      toast.error('Failed to delete transaction')
    } finally {
      setDeleting(false)
    }
  }

  const getAccountName = (tx) => {
    if (tx.account_name) return tx.account_name
    const acc = accounts.find((a) => a.id === tx.account_id)
    return acc ? acc.account_name : '-'
  }

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const TypeIcon = ({ type }) => {
    if (type === 'income') return <ArrowDownRight className="h-4 w-4" />
    if (type === 'expense') return <ArrowUpRight className="h-4 w-4" />
    return <ArrowRightLeft className="h-4 w-4" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-500 mt-1">Manage your financial transactions</p>
        </div>
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Transaction
        </button>
      </div>

      {/* Filter bar */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Account filter */}
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.account_name}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={`${sortBy}:${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split(':')
              setSortBy(sb)
              setSortOrder(so)
            }}
            className="border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="transaction_date:desc">Date (newest)</option>
            <option value="transaction_date:asc">Date (oldest)</option>
            <option value="amount:desc">Amount (highest)</option>
            <option value="amount:asc">Amount (lowest)</option>
          </select>
        </div>

        {/* Date range */}
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 ml-auto"
            >
              <X className="h-3.5 w-3.5" />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Desktop table */}
      <div className="card overflow-hidden p-0 hidden md:block">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="h-8 w-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No transactions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th
                    onClick={() => toggleSort('transaction_date')}
                    className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 cursor-pointer hover:text-gray-700"
                  >
                    Date {sortBy === 'transaction_date' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                    Description
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                    Category
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                    Account
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                    Type
                  </th>
                  <th
                    onClick={() => toggleSort('amount')}
                    className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 cursor-pointer hover:text-gray-700"
                  >
                    Amount {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(tx.transaction_date)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${TYPE_STYLES[tx.type] || 'bg-gray-100 text-gray-600'}`}>
                          <TypeIcon type={tx.type} />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {tx.description || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${CATEGORY_STYLES[tx.category] || 'bg-gray-100 text-gray-700'}`}
                      >
                        {tx.category || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{getAccountName(tx)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${TYPE_STYLES[tx.type] || 'bg-gray-100 text-gray-700'}`}
                      >
                        {tx.type ? tx.type.charAt(0).toUpperCase() + tx.type.slice(1) : '-'}
                      </span>
                    </td>
                    <td
                      className={`px-6 py-4 text-sm font-semibold text-right ${
                        tx.type === 'income'
                          ? 'text-green-600'
                          : tx.type === 'expense'
                            ? 'text-red-600'
                            : 'text-blue-600'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(tx)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(tx.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary text-sm disabled:opacity-50 flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="btn-secondary text-sm disabled:opacity-50 flex items-center gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="h-8 w-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-400">No transactions found</p>
          </div>
        ) : (
          transactions.map((tx) => (
            <div key={tx.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${TYPE_STYLES[tx.type] || 'bg-gray-100 text-gray-600'}`}>
                    <TypeIcon type={tx.type} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{tx.description || 'No description'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatDate(tx.transaction_date)} &middot; {getAccountName(tx)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-semibold ${
                      tx.type === 'income'
                        ? 'text-green-600'
                        : tx.type === 'expense'
                          ? 'text-red-600'
                          : 'text-blue-600'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                    {formatCurrency(tx.amount)}
                  </p>
                  <div className="flex items-center gap-1 mt-1 justify-end">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_STYLES[tx.type] || 'bg-gray-100 text-gray-700'}`}
                    >
                      {tx.type ? tx.type.charAt(0).toUpperCase() + tx.type.slice(1) : '-'}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_STYLES[tx.category] || 'bg-gray-100 text-gray-700'}`}
                    >
                      {tx.category || '-'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => openEditModal(tx)}
                  className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50"
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </button>
                <button
                  onClick={() => setDeleteId(tx.id)}
                  className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
              </div>
            </div>
          ))
        )}

        {total > limit && (
          <div className="flex items-center justify-between px-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary text-sm disabled:opacity-50 flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <span className="text-sm text-gray-500">
              {page}/{totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="btn-secondary text-sm disabled:opacity-50 flex items-center gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingTx ? 'Edit Transaction' : 'Add Transaction'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              {/* Account */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
                <select
                  value={form.account_id}
                  onChange={(e) => handleFormChange('account_id', e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select account</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.account_name} ({a.account_type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Type & Category row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => handleFormChange('type', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                    <option value="transfer">Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => handleFormChange('category', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.amount}
                  onChange={(e) => handleFormChange('amount', e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  placeholder="What was this transaction for?"
                  className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={form.transaction_date}
                  onChange={(e) => handleFormChange('transaction_date', e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-secondary text-sm"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-sm flex items-center gap-2"
                  disabled={saving}
                >
                  {saving && (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {editingTx ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !deleting && setDeleteId(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900">Delete Transaction</h3>
            <p className="text-sm text-gray-500 mt-2">
              Are you sure you want to delete this transaction? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setDeleteId(null)}
                className="btn-secondary text-sm"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                disabled={deleting}
              >
                {deleting && (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
