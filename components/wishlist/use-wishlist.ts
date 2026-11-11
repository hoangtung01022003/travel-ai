'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { getWishlistStatus, toggleWishlist, type WishlistTarget } from './actions/wishlist-actions'

/** Trạng thái + hành động lưu yêu thích cho một điểm đến / khách sạn. */
export function useWishlist(targetType: WishlistTarget, targetId: string) {
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  useEffect(() => {
    let active = true
    getWishlistStatus(targetType, targetId).then((v) => {
      if (active) setSaved(v)
    })
    return () => {
      active = false
    }
  }, [targetType, targetId])

  const toggle = () => {
    const prev = saved
    setSaved(!prev) // cập nhật lạc quan
    startTransition(async () => {
      const res = await toggleWishlist(targetType, targetId)
      if (!res.ok) {
        setSaved(prev)
        if (res.reason === 'unauthenticated') {
          toast.info('Vui lòng đăng nhập để lưu yêu thích')
          router.push('/login')
        } else {
          toast.error('Không thể lưu yêu thích, vui lòng thử lại')
        }
        return
      }
      setSaved(res.saved)
      toast.success(res.saved ? 'Đã lưu vào yêu thích' : 'Đã bỏ khỏi yêu thích')
    })
  }

  return { saved, pending, toggle }
}
