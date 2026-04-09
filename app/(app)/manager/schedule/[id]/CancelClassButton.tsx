'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function CancelClassButton({ classId }: { classId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)

  async function handleCancel() {
    if (!confirm) { setConfirm(true); return }
    setLoading(true)
    try {
      await fetch(`/api/scheduled-classes/${classId}`, { method: 'DELETE' })
      router.push('/manager/schedule')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      {confirm && (
        <p className="text-sm text-red-600 text-center">
          确认取消？将退还所有学员的课时
        </p>
      )}
      <Button
        variant="danger"
        size="lg"
        className="w-full"
        loading={loading}
        onClick={handleCancel}
      >
        {confirm ? '确认取消课程' : '取消此次课程'}
      </Button>
      {confirm && (
        <Button variant="secondary" size="lg" className="w-full" onClick={() => setConfirm(false)}>
          我再想想
        </Button>
      )}
    </div>
  )
}
