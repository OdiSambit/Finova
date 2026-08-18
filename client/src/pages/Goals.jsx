import { useState, useEffect } from 'react'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDate } from '../utils/helpers'
import api from '../services/api'
import { Target, Plus, Pencil, Trash2, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = [
  { value: 'on_track', label: 'On Track' },
  { value: 'behind', label: 'Behind' },
  { value: 'completed', label: 'Completed' },
]

const STATUS_COLORS = {
  on_track: 'bg-green-100 text-green-700',
  behind: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
}

const PROGRESS_COLORS = {
  on_track: 'bg-green-500',
  behind: 'bg-red-500',
  completed: 'bg-blue-500',
}

const EMPTY_FORM = { name: '', target_amount: '', current_amount: '', deadline: '', status: 'on_track' }

export default function Goals() {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchGoals()
  }, [])

  const fetchGoals = async () => {
    try {
      const res = await api.get('/goals')
      setGoals(res.data.goals || [])
    } catch {
      toast.error('Failed to load goals')
    } finally {
      setLoading(false)
    }
  }

  const summary = goals.reduce(
    (acc, g) => {
      acc.total += 1
      if (g.status === 'on_track') acc.on_track += 1
      if (g.status === 'behind') acc.behind += 1
      if (g.status === 'completed') acc.completed += 1
      return acc
    },
    { total: 0, on_track: 0, behind: 0, completed: 0 }
  )

  const openCreate = () => {
    setEditingGoal(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  const openEdit = (goal) => {
    setEditingGoal(goal)
    setForm({
      name: goal.name || '',
      target_amount: goal.target_amount || '',
      current_amount: goal.current_amount || '',
      deadline: goal.deadline ? goal.deadline.slice(0, 10) : '',
      status: goal.status || 'on_track',
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingGoal(null)
    setForm(EMPTY_FORM)
  }

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.target_amount) {
      toast.error('Name and target amount are required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        target_amount: Number(form.target_amount),
        current_amount: Number(form.current_amount) || 0,
        deadline: form.deadline || null,
        status: form.status,
      }
      if (editingGoal) {
        await api.put(`/goals/${editingGoal.id}`, payload)
        toast.success('Goal updated')
      } else {
        await api.post('/goals', payload)
        toast.success('Goal created')
      }
      closeModal()
      fetchGoals()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save goal')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this goal?')) return
    try {
      await api.delete(`/goals/${id}`)
      toast.success('Goal deleted')
      fetchGoals()
    } catch {
      toast.error('Failed to delete goal')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Goals</h1>
          <p className="text-gray-500 mt-1">Set and track your financial goals</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Goal
        </button>
      </div>

      {!loading && goals.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="card flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100">
              <Target className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Goals</p>
              <p className="text-xl font-bold text-gray-900">{summary.total}</p>
            </div>
          </div>
          <div className="card flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">On Track</p>
              <p className="text-xl font-bold text-green-600">{summary.on_track}</p>
            </div>
          </div>
          <div className="card flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Behind</p>
              <p className="text-xl font-bold text-red-600">{summary.behind}</p>
            </div>
          </div>
          <div className="card flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <CheckCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-xl font-bold text-blue-600">{summary.completed}</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="h-8 w-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : goals.length === 0 ? (
        <div className="card text-center py-12">
          <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No goals yet. Create a goal to start saving!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const target = Number(goal.target_amount) || 0
            const current = Number(goal.current_amount) || 0
            const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0
            const status = goal.status || 'on_track'
            return (
              <div key={goal.id} className="card flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{goal.name}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}>
                      {STATUS_OPTIONS.find((s) => s.value === status)?.label || status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(goal)}
                      className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-500">{formatCurrency(current)}</span>
                    <span className="text-gray-900 font-medium">{formatCurrency(target)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${PROGRESS_COLORS[status] || PROGRESS_COLORS.on_track}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 text-right mt-1">{pct.toFixed(0)}%</p>
                </div>

                {goal.deadline && (
                  <p className="text-xs text-gray-400 mt-3">Deadline: {formatDate(goal.deadline)}</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingGoal ? 'Edit Goal' : 'Create Goal'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Goal Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Emergency Fund"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Target Amount</label>
                <input
                  type="number"
                  name="target_amount"
                  value={form.target_amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="1"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Amount</label>
                <input
                  type="number"
                  name="current_amount"
                  value={form.current_amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Deadline</label>
                <input
                  type="date"
                  name="deadline"
                  value={form.deadline}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="input-field"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Saving...' : editingGoal ? 'Update Goal' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
