'use client'

import { motion } from 'framer-motion'
import { Star, MapPin, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils/common'
import { Hotel } from '@/types/hotel'

interface FeaturedHotelsProps {
  hotels: Hotel[]
}

export const FeaturedHotels = ({ hotels }: FeaturedHotelsProps) => {
  return (
    <section className="bg-primary-light/60 border-border border-y">
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="border-border mb-10 flex items-end justify-between border-b pb-6">
        <div>
          <span className="eyebrow mb-3">Nơi dừng chân</span>
          <h2 className="mb-2 text-3xl font-semibold lg:text-4xl">
            Khách sạn <span className="text-gradient">hàng đầu</span>
          </h2>
          <p className="text-muted-foreground">
            Những nơi lưu trú sang trọng, chất lượng cao
          </p>
        </div>
        <Link
          href="/hotels"
          className="border-primary text-primary hover:bg-primary hover:text-primary-foreground hidden items-center gap-1 rounded-full border px-4 py-2 text-sm font-medium transition-colors sm:flex"
        >
          Xem tất cả
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {hotels.map((hotel, index: number) => (
          <motion.div
            key={hotel.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            viewport={{ once: true }}
          >
            <Link href={`/hotels/${hotel.slug}`}>
              <div className="group border-border card-hover bg-card overflow-hidden rounded-md border p-3">
                <div className="relative h-56 overflow-hidden rounded-sm">
                  {hotel.cover_image ? (
                    <Image
                      src={hotel.cover_image}
                      alt={hotel.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="bg-muted flex h-full w-full items-center justify-center">
                      <MapPin className="text-muted-foreground h-8 w-8" />
                    </div>
                  )}
                  <div className="bg-[#12302a] text-accent absolute bottom-3 left-3 flex items-center gap-1 rounded-sm px-2 py-1">
                    <Star className="fill-warning text-warning h-3.5 w-3.5" />
                    <span className="text-sm font-semibold">
                      {hotel.avg_rating ?? 0}
                    </span>
                  </div>
                </div>
                <div className="px-2 pt-4 pb-1">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex">
                      {Array.from({ length: hotel.star_rating || 0 }).map(
                        (_, i: number) => (
                          <Star
                            key={i}
                            className="fill-warning text-warning h-3.5 w-3.5"
                          />
                        )
                      )}
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {hotel.review_count ?? 0} đánh giá
                    </span>
                  </div>
                  <h3 className="group-hover:text-secondary mb-1 text-xl font-semibold transition-colors">
                    {hotel.name}
                  </h3>
                  <div className="text-muted-foreground mb-4 flex items-center gap-1 text-sm">
                    <MapPin className="h-3.5 w-3.5" />
                    {hotel.province}
                  </div>
                  <div className="border-border flex items-center justify-between border-t border-dashed pt-3">
                    <div>
                      <span className="font-display text-primary text-xl font-semibold">
                        {formatPrice(hotel.min_price || 0)}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {' '}
                        /đêm
                      </span>
                    </div>
                    <span className="bg-secondary text-secondary-foreground flex h-8 w-8 items-center justify-center rounded-full transition-transform group-hover:translate-x-1">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
    </section>
  )
}
