import { useState, useEffect } from 'react'
import { formatCurrency } from '../utils/formatCurrency'
import { maskAccountNumber } from '../utils/helpers'
import api from '../services/api'
import { Plus, Wallet, CreditCard, Landmark, Building2, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const accountTypeIcons = {
  savings: Wallet,
  current: Landmark,
  cash: Building2,
  credit_card: CreditCard,
  other: Building2,
}

const accountTypeColors = {
  savings: 'bg-green-100 text-green-700',
  current: 'bg-primary-100 text-primary-700',
  cash: 'bg-gray-100 text-gray-600',
  credit_card: 'bg-red-100 text-red-600',
  other: 'bg-purple-100 text-purple-700',
}

export default function Accounts() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState(null)
  const [form, setForm] = useState({
    account_name: '',
    account_type: 'savings',
    institution: '',
    account_number: '',
    balance: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/accounts')
      setAccounts(res.data.accounts || [])
    } catch {
      toast.error('Failed to load accounts')
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditingAccount(null)
    setForm({ account_name: '', account_type: 'savings', institution: '', account_number: '', balance: '' })
    setShowModal(true)
  }

  const openEdit = (account) => {
    setEditingAccount(account)
    setForm({
      account_name: account.account_name || '',
      account_type: account.account_type || 'savings',
      institution: account.institution || '',
      account_number: account.account_number || '',
      balance: account.balance?.toString() || '0',
    })
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.account_name) {
      toast.error('Account name is required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        account_name: form.account_name,
        account_type: form.account_type,
        institution: form.institution || null,
        account_number: form.account_number || null,
        balance: Number(form.balance) || 0,
      }
      if (editingAccount) {
        await api.put(`/accounts/${editingAccount.id}`, payload)
        toast.success('Account updated')
      } else {
        await api.post('/accounts', payload)
        toast.success('Account created')
      }
      setShowModal(false)
      setEditingAccount(null)
      fetchAccounts()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save account')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this account?')) return
    try {
      await api.delete(`/accounts/${id}`)
      toast.success('Account deleted')
      fetchAccounts()
    } catch {
      toast.error('Failed to delete account')
    }
  }

  const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0)
  const savingsTotal = accounts.filter(a => a.account_type === 'savings').reduce((s, a) => s + parseFloat(a.balance || 0), 0)
  const creditTotal = accounts.filter(a => a.account_type === 'credit_card').reduce((s, a) => s + parseFloat(a.balance || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
          <p className="text-gray-500 mt-1">Manage your bank accounts</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Account
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <p className="text-blue-100 text-sm">Total Balance</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(totalBalance)}</p>
          <p className="text-blue-200 text-sm mt-1">{accounts.length} account{accounts.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Savings</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(savingsTotal)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Credit Cards</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(creditTotal)}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="h-8 w-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="card text-center py-12">
          <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No accounts yet. Create your first account to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => {
            const type = account.account_type || 'other'
            const Icon = accountTypeIcons[type] || accountTypeIcons.other
            const color = accountTypeColors[type] || accountTypeColors.other
            return (
              <div key={account.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{account.account_name}</p>
                      <p className="text-xs text-gray-400 capitalize">{account.account_type?.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(account)} className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-primary-50">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(account.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-4 mt-2">
                  {account.institution && (
                    <p className="text-xs text-gray-400 mb-1">{account.institution}</p>
                  )}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Account No.</span>
                    <span className="text-sm font-mono text-gray-700">{maskAccountNumber(account.account_number)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Balance</span>
                    <span className="text-xl font-bold text-gray-900">{formatCurrency(account.balance)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{editingAccount ? 'Edit Account' : 'Add Account'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Account Name</label>
                <input
                  type="text"
                  value={form.account_name}
                  onChange={(e) => setForm({ ...form, account_name: e.target.value })}
                  placeholder="e.g. HDFC Savings"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Account Type</label>
                <select
                  value={form.account_type}
                  onChange={(e) => setForm({ ...form, account_type: e.target.value })}
                  className="input-field"
                >
                  <option value="savings">Savings</option>
                  <option value="current">Current</option>
                  <option value="cash">Cash</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Institution</label>
                <input
                  type="text"
                  value={form.institution}
                  onChange={(e) => setForm({ ...form, institution: e.target.value })}
                  placeholder="e.g. HDFC Bank"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Account Number</label>
                <input
                  type="text"
                  value={form.account_number}
                  onChange={(e) => setForm({ ...form, account_number: e.target.value })}
                  placeholder="e.g. 1234567890"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Balance</label>
                <input
                  type="number"
                  value={form.balance}
                  onChange={(e) => setForm({ ...form, balance: e.target.value })}
                  placeholder="0.00"
                  step="0.01"
                  className="input-field"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setEditingAccount(null) }} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Saving...' : editingAccount ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
