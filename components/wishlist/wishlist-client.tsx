'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import { Heart, MapPin, Star, Hotel, Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils/common'
import { toggleWishlist, type WishlistItem, type WishlistTarget } from './actions/wishlist-actions'

type Filter = 'all' | WishlistTarget

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'destination', label: 'Điểm đến' },
  { value: 'hotel', label: 'Khách sạn' },
]

export default function WishlistClient({ initialItems }: { initialItems: WishlistItem[] }) {
  const [items, setItems] = useState(initialItems)
  const [filter, setFilter] = useState<Filter>('all')
  const [, startTransition] = useTransition()

  const visible = filter === 'all' ? items : items.filter((i) => i.targetType === filter)
  const count = (f: Filter) =>
    f === 'all' ? items.length : items.filter((i) => i.targetType === f).length

  const remove = (item: WishlistItem) => {
    setItems((prev) => prev.filter((i) => i.wishlistId !== item.wishlistId))
    startTransition(async () => {
      const res = await toggleWishlist(item.targetType, item.targetId)
      if (!res.ok || res.saved) {
        setItems((prev) =>
          [...prev, item].sort((a, b) => (b.savedAt ?? '').localeCompare(a.savedAt ?? ''))
        )
        toast.error('Không thể bỏ yêu thích, vui lòng thử lại')
        return
      }
      toast.success('Đã bỏ khỏi yêu thích')
    })
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <span className="eyebrow mb-1">Cá nhân</span>
        <h1 className="text-3xl font-semibold">Yêu thích của tôi</h1>
        <p className="text-muted-foreground text-sm">Các điểm đến và khách sạn bạn đã lưu</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={filter === f.value ? 'default' : 'outline'}
            onClick={() => setFilter(f.value)}
          >
            {f.label} ({count(f.value)})
          </Button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="border-border bg-card flex flex-col items-center gap-3 rounded-lg border border-dashed p-12 text-center">
          <Heart className="text-muted-foreground h-10 w-10" />
          <p className="font-medium">Chưa có mục yêu thích nào</p>
          <p className="text-muted-foreground text-sm">
            Bấm biểu tượng trái tim ở trang điểm đến hoặc khách sạn để lưu lại.
          </p>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/destinations">Khám phá điểm đến</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/hotels">Xem khách sạn</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((item) => {
            const isHotel = item.targetType === 'hotel'
            const href = `/${isHotel ? 'hotels' : 'destinations'}/${item.slug}`
            const TypeIcon = isHotel ? Hotel : Compass
            return (
              <div
                key={item.wishlistId}
                className="border-border bg-card group overflow-hidden rounded-lg border"
              >
                <div className="bg-muted relative aspect-[4/3]">
                  <Link href={href} aria-label={item.name}>
                    {item.coverImage && (
                      <Image
                        src={item.coverImage}
                        alt={item.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                  </Link>
                  <span className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-white/85 px-2.5 py-1 text-xs font-medium">
                    <TypeIcon className="h-3 w-3" />
                    {isHotel ? 'Khách sạn' : 'Điểm đến'}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(item)}
                    title="Bỏ yêu thích"
                    className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 hover:bg-white"
                  >
                    <Heart className="h-4 w-4 fill-[#b5432a] text-[#b5432a]" />
                  </button>
                </div>
                <Link href={href} className="block p-4">
                  <h3 className="line-clamp-1 font-semibold">{item.name}</h3>
                  <div className="text-muted-foreground mt-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      {item.province && (
                        <>
                          <MapPin className="h-3.5 w-3.5" />
                          {item.province}
                        </>
                      )}
                    </span>
                    {item.rating ? (
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {isHotel ? `${item.rating} sao` : item.rating.toFixed(1)}
                      </span>
                    ) : null}
                  </div>
                  {item.minPrice ? (
                    <p className="text-primary mt-2 text-sm font-semibold">
                      Từ {formatPrice(item.minPrice)}
                    </p>
                  ) : null}
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
