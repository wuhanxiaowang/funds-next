'use client'
import { useState, useEffect } from 'react'
import { apiGet, apiPost } from '../../lib/api'

export default function RulesPage() {
  const [rules, setRules] = useState([])
  const [assetClasses, setAssetClasses] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRuleId, setEditingRuleId] = useState(null)
  const [form, setForm] = useState({ rule_name: '', keywords: '', asset_class: '', operation: '买入', threshold: 70 })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchRules = async () => {
    try {
      const data = await apiGet('api/rules', { skip: 0, limit: 200 })
      setRules(Array.isArray(data) ? data : [])
      setError('')
    } catch (e) {
      setError(e.message || '获取规则失败')
    }
  }

  const fetchAssetClasses = async () => {
    try {
      const data = await apiGet('api/asset-classes')
      setAssetClasses(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('获取投资产品失败:', e)
    }
  }

  useEffect(() => {
    fetchRules()
    fetchAssetClasses()
  }, [])

  const openAdd = () => {
    setEditingRuleId(null)
    setForm({ rule_name: '', keywords: '', asset_class: '', operation: '买入', threshold: 70 })
    setModalOpen(true)
  }

  const openEdit = (rule) => {
    setEditingRuleId(rule.id)
    setForm({
      rule_name: rule.rule_name || '',
      keywords: rule.keywords || '',
      asset_class: rule.asset_class || '',
      operation: rule.operation || '买入',
      threshold: rule.threshold || 70
    })
    setModalOpen(true)
  }

  const saveRule = async () => {
    const name = (form.rule_name || '').trim()
    if (!name) {
      setError('请输入规则名称')
      return
    }
    setSaving(true)
    setError('')
    try {
      if (editingRuleId) {
        // 更新现有规则
        await fetch(`/api/rules?id=${editingRuleId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            rule_name: name,
            keywords: (form.keywords || '').trim() || '',
            asset_class: (form.asset_class || '').trim() || '',
            operation: form.operation || '无操作',
            threshold: form.threshold ?? 0,
          })
        })
      } else {
        // 创建新规则
        await apiPost('api/rules', {
          rule_name: name,
          keywords: (form.keywords || '').trim() || '',
          asset_class: (form.asset_class || '').trim() || '',
          operation: form.operation || '无操作',
          threshold: form.threshold ?? 0,
        })
      }
      setModalOpen(false)
      setEditingRuleId(null)
      await fetchRules()
    } catch (e) {
      setError('保存失败: ' + (e.message || ''))
    } finally {
      setSaving(false)
    }
  }

  const deleteRule = async (id) => {
    try {
      await fetch(`/api/rules?id=${id}`, {
        method: 'DELETE'
      })
      await fetchRules()
    } catch (e) {
      setError('删除失败: ' + (e.message || ''))
    }
  }

  return (
    <div>
      <div className="glass" style={{ padding: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600 }}>规则管理 · 共 {rules.length} 条</h2>
        <button className="btn btn-primary" onClick={openAdd}>添加规则</button>
      </div>
      {error && <div className="alert" style={{ background: 'rgba(255,77,79,0.15)' }}>{error}</div>}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>规则名称</th>
              <th>触发关键词</th>
              <th>影响品类</th>
              <th>操作建议</th>
              <th>强度阈值</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.rule_name}</td>
                <td>{r.keywords}</td>
                <td>{r.asset_class}</td>
                <td><span className={`tag ${r.operation === '买入' ? 'tag-success' : r.operation === '卖出' ? 'tag-danger' : 'tag-info'}`}>{r.operation}</span></td>
                <td>{r.threshold}</td>
                <td>{r.created_at ? String(r.created_at).slice(0, 19).replace('T', ' ') : '-'}</td>
                <td>
                  <button className="btn btn-ghost" style={{ padding: '4px 12px', fontSize: '12px', color: 'var(--primary)', marginRight: '8px' }} onClick={() => openEdit(r)}>
                    编辑
                  </button>
                  <button className="btn btn-ghost" style={{ padding: '4px 12px', fontSize: '12px', color: 'var(--danger)' }} onClick={() => deleteRule(r.id)}>
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rules.length === 0 && <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>暂无规则，点击「添加规则」创建</div>}
      </div>

      {modalOpen && (
        <div className="overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingRuleId ? '编辑规则' : '添加规则'}</h3>
            <div className="form-group">
              <label>规则名称 *</label>
              <input
                value={form.rule_name}
                onChange={(e) => setForm({ ...form, rule_name: e.target.value })}
                placeholder="请输入规则名称"
              />
            </div>
            <div className="form-group">
              <label>触发关键词（逗号分隔）</label>
              <input
                value={form.keywords}
                onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                placeholder="关键词1, 关键词2"
              />
            </div>
            <div className="form-group">
              <label>影响品类</label>
              <select
                value={form.asset_class}
                onChange={(e) => setForm({ ...form, asset_class: e.target.value })}
              >
                <option value="">请选择</option>
                {assetClasses.map((item) => (
                  <option key={item.id} value={item.name}>{item.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>操作建议 *</label>
              <select
                value={form.operation}
                onChange={(e) => setForm({ ...form, operation: e.target.value })}
              >
                <option value="买入">买入</option>
                <option value="卖出">卖出</option>
                <option value="规避">规避</option>
              </select>
            </div>
            <div className="form-group">
              <label>强度阈值 (0-100) *</label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.threshold}
                onChange={(e) => setForm({ ...form, threshold: parseInt(e.target.value, 10) || 0 })}
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>取消</button>
              <button className="btn btn-primary" onClick={saveRule} disabled={saving}>{saving ? '保存中...' : '保存'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
