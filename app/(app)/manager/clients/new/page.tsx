'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/PageHeader'

export default function NewClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    phone: '',
    password: 'client123',
    gender: '',
    birthday: '',
    notes: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.phone) { setError('姓名和手机号为必填项'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || '创建失败'); return }
      router.push(`/manager/clients/${data.data.id}`)
    } catch {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  const f = (key: string) => ({
    value: form[key as keyof typeof form],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value })),
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="新增客户" backHref="/manager/clients" />
      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4 mb-nav">
        {[
          { label: '姓名 *', key: 'name', placeholder: '请输入客户姓名', type: 'text' },
          { label: '手机号 *', key: 'phone', placeholder: '11位手机号', type: 'tel' },
          { label: '初始密码', key: 'password', placeholder: '默认 client123', type: 'text' },
          { label: '生日', key: 'birthday', placeholder: '', type: 'date' },
        ].map(({ label, key, placeholder, type }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
            <input
              type={type}
              placeholder={placeholder}
              className="w-full px-3 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              {...f(key)}
            />
          </div>
        ))}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">性别</label>
          <select
            className="w-full px-3 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            {...f('gender')}
          >
            <option value="">不填写</option>
            <option value="MALE">男</option>
            <option value="FEMALE">女</option>
            <option value="OTHER">其他</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">备注</label>
          <textarea
            rows={3}
            placeholder="健康状况、特殊需求等"
            className="w-full px-3 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            {...f('notes')}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
        )}
        <Button type="submit" size="lg" loading={loading} className="w-full">创建客户</Button>
      </form>
    </div>
  )
}
