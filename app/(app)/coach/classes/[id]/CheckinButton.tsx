'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function CheckinButton({ bookingId }: { bookingId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleCheckin() {
    setLoading(true)
    try {
      await fetch(`/api/bookings/${bookingId}/checkin`, { method: 'POST' })
      setDone(true)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  if (done) return <span className="text-xs text-green-600 font-medium">已签到</span>

  return (
    <button
      onClick={handleCheckin}
      disabled={loading}
      className="text-xs bg-green-500 text-white px-2.5 py-1 rounded-lg font-medium disabled:opacity-50 active:bg-green-600"
    >
      {loading ? '...' : '签到'}
    </button>
  )
}
