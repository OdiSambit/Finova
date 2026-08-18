import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDate } from '../utils/helpers'

const INITIAL_FORM = {
  from_account_id: '',
  to_account_id: '',
  amount: '',
  description: '',
}

export default function Transfers() {
  const [accounts, setAccounts] = useState([])
  const [transfers, setTransfers] = useState([])
  const [loading, setLoading] = useState(true)
  const [transferring, setTransferring] = useState(false)
  const [formData, setFormData] = useState(INITIAL_FORM)

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get('/accounts')
      setAccounts(res.data?.accounts || res.data || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load accounts')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTransfers = useCallback(async () => {
    try {
      const res = await api.get('/transfers')
      setTransfers(res.data?.transfers || res.data?.data || res.data || [])
    } catch (err) {
      // silent
    }
  }, [])

  useEffect(() => {
    fetchAccounts()
    fetchTransfers()
  }, [fetchAccounts, fetchTransfers])

  const fromAccount = accounts.find((a) => (a._id || a.id) === formData.from_account_id)
  const toAccount = accounts.find((a) => (a._id || a.id) === formData.to_account_id)

  const availableToAccounts = accounts.filter((a) => (a._id || a.id) !== formData.from_account_id)

  function handleChange(e) {
    const { name, value } = e.target
    setFormData((prev) => {
      const next = { ...prev, [name]: value }
      if (name === 'from_account_id' && next.to_account_id === value) {
        next.to_account_id = ''
      }
      return next
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!formData.from_account_id) {
      toast.error('Please select a source account')
      return
    }
    if (!formData.to_account_id) {
      toast.error('Please select a destination account')
      return
    }
    if (formData.from_account_id === formData.to_account_id) {
      toast.error('Cannot transfer to the same account')
      return
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error('Amount must be greater than 0')
      return
    }
    if (fromAccount && Number(formData.amount) > Number(fromAccount.balance)) {
      toast.error('Insufficient balance in source account')
      return
    }

    try {
      setTransferring(true)
      await api.post('/transfers', {
        from_account_id: formData.from_account_id,
        to_account_id: formData.to_account_id,
        amount: Number(formData.amount),
        description: formData.description,
      })
      toast.success('Transfer completed successfully')
      setFormData(INITIAL_FORM)
      fetchAccounts()
      fetchTransfers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transfer failed')
    } finally {
      setTransferring(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-gray-500">Loading accounts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Money Transfers</h1>
        <p className="text-gray-500 mt-1">Transfer funds between your accounts</p>
      </div>

      {/* Transfer Form Card */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">New Transfer</h2>

        {accounts.length < 2 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <p className="text-gray-500">You need at least 2 accounts to make a transfer</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
              {/* From Account */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Account</label>
                <select
                  name="from_account_id"
                  value={formData.from_account_id}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Select source</option>
                  {accounts.map((a) => (
                    <option key={a._id || a.id} value={a._id || a.id}>
                      {a.account_name} ({formatCurrency(a.balance)})
                    </option>
                  ))}
                </select>
                {fromAccount && (
                  <p className="text-sm text-gray-500 mt-1.5">
                    Available: <span className="font-semibold text-gray-900">{formatCurrency(fromAccount.balance)}</span>
                  </p>
                )}
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center pb-1">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </div>

              {/* To Account */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Account</label>
                <select
                  name="to_account_id"
                  value={formData.to_account_id}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Select destination</option>
                  {availableToAccounts.map((a) => (
                    <option key={a._id || a.id} value={a._id || a.id}>
                      {a.account_name} ({formatCurrency(a.balance)})
                    </option>
                  ))}
                </select>
                {toAccount && (
                  <p className="text-sm text-gray-500 mt-1.5">
                    Current balance: <span className="font-semibold text-gray-900">{formatCurrency(toAccount.balance)}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Amount + Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                />
                {fromAccount && formData.amount && Number(formData.amount) > Number(fromAccount.balance) && (
                  <p className="text-sm text-red-500 mt-1">Amount exceeds available balance</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g. Rent payment"
                />
              </div>
            </div>

            {/* Transfer Summary */}
            {fromAccount && toAccount && formData.amount && Number(formData.amount) > 0 && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm font-medium text-gray-500 mb-2">Transfer Summary</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{fromAccount.account_name}</span>
                  <span className="font-semibold text-red-600">-{formatCurrency(formData.amount)}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-600">{toAccount.account_name}</span>
                  <span className="font-semibold text-green-600">+{formatCurrency(formData.amount)}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={transferring}
              className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
            >
              {transferring ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  Transfer Money
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Recent Transfers */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Transfers</h2>

        {transfers.length === 0 ? (
          <div className="text-center py-10">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <p className="text-gray-500">No transfers yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transfers.map((transfer) => {
              const id = transfer._id || transfer.id
              const status = transfer.status || 'completed'
              const fromName = transfer.from_account_id?.account_name || accounts.find((a) => (a._id || a.id) === transfer.from_account_id)?.account_name || 'Unknown'
              const toName = transfer.to_account_id?.account_name || accounts.find((a) => (a._id || a.id) === transfer.to_account_id)?.account_name || 'Unknown'

              return (
                <div key={id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-gray-900 truncate">{fromName}</span>
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                      <span className="font-medium text-gray-900 truncate">{toName}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatDate(transfer.created_at || transfer.transaction_date || transfer.date)}
                      {transfer.description && <> &middot; {transfer.description}</>}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-bold text-gray-900">{formatCurrency(transfer.amount)}</p>
                    <span className={`text-xs font-medium capitalize ${
                      status === 'completed' || status === 'success'
                        ? 'text-green-600'
                        : status === 'failed'
                        ? 'text-red-600'
                        : 'text-yellow-600'
                    }`}>
                      {status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
