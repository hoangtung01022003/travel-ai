'use client'

import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Navigation, Sparkles, Ticket } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils/common'

export interface QuickViewAttraction {
  id: string
  name: string
  description?: string | null
  image_url?: string | null
  entry_fee?: number | null
}

interface AttractionQuickViewProps {
  attraction: QuickViewAttraction | null
  destinationName: string
  onOpenChange: (open: boolean) => void
}

export function AttractionQuickView({
  attraction,
  destinationName,
  onOpenChange,
}: AttractionQuickViewProps) {
  const query = attraction ? `${attraction.name}, ${destinationName}` : ''
  const encoded = encodeURIComponent(query)
  const fee = Number(attraction?.entry_fee ?? 0)

  return (
    <Dialog open={!!attraction} onOpenChange={onOpenChange}>
      <DialogContent
        size="xl"
        className="max-h-[90vh] overflow-y-auto rounded-md p-0 [&>button:last-child]:z-20 [&>button:last-child]:rounded-full [&>button:last-child]:bg-white/90 [&>button:last-child]:p-1.5 [&>button:last-child]:opacity-100"
      >
        {attraction && (
          <div className="grid md:grid-cols-2">
            {/* Ảnh lớn */}
            <div className="relative h-64 bg-[#12302a] md:h-full md:min-h-[440px]">
              {attraction.image_url ? (
                <Image
                  src={attraction.image_url}
                  alt={attraction.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <MapPin className="h-12 w-12 text-[#e0a93b]/50" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#12302a]/90 via-[#12302a]/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-[#f7f3ec]">
                <p className="mb-1 flex items-center gap-1 text-xs tracking-[0.18em] text-[#e9c77b] uppercase">
                  <MapPin className="h-3 w-3" />
                  {destinationName}
                </p>
                <DialogTitle className="font-display text-3xl font-semibold text-[#f7f3ec]">
                  {attraction.name}
                </DialogTitle>
              </div>
            </div>

            {/* Thông tin */}
            <div className="flex flex-col gap-5 p-6">
              <div className="flex items-center gap-3 rounded-md border border-[#c9932b]/40 bg-[#faf1dc] px-4 py-3">
                <Ticket className="h-5 w-5 text-[#b07a12]" />
                <div>
                  <p className="text-muted-foreground text-xs">Giá vé tham quan</p>
                  <p className="font-display text-primary text-xl font-semibold">
                    {fee > 0 ? formatPrice(fee) : 'Miễn phí'}
                  </p>
                </div>
              </div>

              <DialogDescription asChild>
                <div className="text-foreground/80 text-sm leading-relaxed whitespace-pre-line">
                  {attraction.description || 'Chưa có mô tả cho điểm tham quan này.'}
                </div>
              </DialogDescription>

              <div className="border-border overflow-hidden rounded-md border">
                <iframe
                  title={`Bản đồ ${attraction.name}`}
                  src={`https://www.google.com/maps?q=${encoded}&output=embed`}
                  className="h-52 w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              <div className="mt-auto flex flex-wrap gap-3">
                <Button variant="outline" className="h-10 flex-1 rounded-full" asChild>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encoded}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Navigation className="mr-1 h-4 w-4" />
                    Chỉ đường
                  </a>
                </Button>
                <Button variant="secondary" className="h-10 flex-1 rounded-full" asChild>
                  <Link href={`/ai-planner?destination=${encodeURIComponent(destinationName)}`}>
                    <Sparkles className="mr-1 h-4 w-4" />
                    Tạo lịch trình AI
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
