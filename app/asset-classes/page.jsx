'use client'
import { useState, useEffect } from 'react'
import { apiGet, apiPost, apiPut, apiDelete } from '../../lib/api'

export default function AssetClassesPage() {
  const [assetClasses, setAssetClasses] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchAssetClasses = async () => {
    try {
      const data = await apiGet('api/asset-classes')
      setAssetClasses(Array.isArray(data) ? data : [])
      setError('')
    } catch (e) {
      setError('获取投资产品失败: ' + (e.message || ''))
    }
  }

  useEffect(() => {
    fetchAssetClasses()
  }, [])

  const openAdd = () => {
    setEditingItem(null)
    setForm({ name: '', description: '' })
    setModalOpen(true)
  }

  const openEdit = (item) => {
    setEditingItem(item)
    setForm({ name: item.name, description: item.description })
    setModalOpen(true)
  }

  const saveAssetClass = async () => {
    const name = (form.name || '').trim()
    if (!name) {
      setError('请输入产品名称')
      return
    }
    setSaving(true)
    setError('')
    try {
      if (editingItem) {
        await apiPut(`api/asset-classes?id=${editingItem.id}`, form)
      } else {
        await apiPost('api/asset-classes', form)
      }
      setModalOpen(false)
      await fetchAssetClasses()
    } catch (e) {
      setError('保存失败: ' + (e.message || ''))
    } finally {
      setSaving(false)
    }
  }

  const deleteAssetClass = async (id) => {
    if (!confirm('确定要删除这个投资产品吗？')) return
    try {
      await apiDelete(`api/asset-classes?id=${id}`)
      await fetchAssetClasses()
    } catch (e) {
      setError('删除失败: ' + (e.message || ''))
    }
  }

  return (
    <div>
      <div className="glass" style={{ padding: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600 }}>投资产品管理 · 共 {assetClasses.length} 个</h2>
        <button className="btn btn-primary" onClick={openAdd}>添加投资产品</button>
      </div>
      {error && <div className="alert" style={{ background: 'rgba(255,77,79,0.15)' }}>{error}</div>}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>产品名称</th>
              <th>描述</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {assetClasses.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.name}</td>
                <td>{item.description || '-'}</td>
                <td>{item.created_at ? String(item.created_at).slice(0, 19).replace('T', ' ') : '-'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-ghost" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={() => openEdit(item)}>
                      编辑
                    </button>
                    <button className="btn btn-ghost" style={{ padding: '4px 12px', fontSize: '12px', color: 'var(--danger)' }} onClick={() => deleteAssetClass(item.id)}>
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {assetClasses.length === 0 && <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>暂无投资产品，点击「添加投资产品」创建</div>}
      </div>

      {modalOpen && (
        <div className="overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingItem ? '编辑投资产品' : '添加投资产品'}</h3>
            <div className="form-group">
              <label>产品名称 *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="请输入产品名称"
              />
            </div>
            <div className="form-group">
              <label>描述</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="请输入产品描述"
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>取消</button>
              <button className="btn btn-primary" onClick={saveAssetClass} disabled={saving}>{saving ? '保存中...' : '保存'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}