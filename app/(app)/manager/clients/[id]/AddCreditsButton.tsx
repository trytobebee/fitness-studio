'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type Package = { id: string; name: string; credits: number; price: number }

export function AddCreditsButton({ clientProfileId, packages }: { clientProfileId: string; packages: Package[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selectedPackageId, setSelectedPackageId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!selectedPackageId) { setError('请选择套餐'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/clients/${clientProfileId}/credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: selectedPackageId }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error || '开通失败'); return }
      setOpen(false)
      router.refresh()
    } catch {
      setError('网络错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-2xl px-4 py-3 text-sm font-medium active:bg-indigo-700"
      >
        <Plus className="w-4 h-4" />
        开通课时
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title="开通课时包">
        <div className="space-y-3">
          {packages.map((pkg) => (
            <label
              key={pkg.id}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                selectedPackageId === pkg.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
              }`}
            >
              <input
                type="radio"
                name="package"
                value={pkg.id}
                checked={selectedPackageId === pkg.id}
                onChange={() => setSelectedPackageId(pkg.id)}
                className="sr-only"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{pkg.name}</p>
                <p className="text-xs text-gray-500">{pkg.credits} 课时</p>
              </div>
              <p className="text-sm font-bold text-indigo-600">¥{pkg.price}</p>
            </label>
          ))}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button className="w-full" loading={loading} onClick={handleSubmit}>确认开通</Button>
        </div>
      </Dialog>
    </>
  )
}
