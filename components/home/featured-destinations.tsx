'use client'

import { motion } from 'framer-motion'
import { MapPin, Star, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils/common'
import { Destination } from '@/types/destination'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

interface FeaturedDestinationsProps {
  destinations: Destination[]
}

export const FeaturedDestinations = ({
  destinations,
}: FeaturedDestinationsProps) => {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="border-border mb-10 flex items-end justify-between border-b pb-6">
        <div>
          <span className="eyebrow mb-3">Cảm hứng xê dịch</span>
          <h2 className="mb-2 text-3xl font-semibold lg:text-4xl">
            Điểm đến <span className="text-gradient">nổi bật</span>
          </h2>
          <p className="text-muted-foreground">
            Những địa điểm được yêu thích nhất Việt Nam
          </p>
        </div>
        <Link
          href="/destinations"
          className="border-primary text-primary hover:bg-primary hover:text-primary-foreground hidden items-center gap-1 rounded-full border px-4 py-2 text-sm font-medium transition-colors sm:flex"
        >
          Xem tất cả
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        {destinations.map((dest) => (
          <motion.div key={dest.id} variants={item}>
            <Link href={`/destinations/${dest.slug}`}>
              <div className="group relative h-[22rem] overflow-hidden rounded-md">
                {dest.cover_image ? (
                  <Image
                    src={dest.cover_image}
                    alt={dest.name}
                    fill sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw" quality={85}
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="bg-muted flex h-full w-full items-center justify-center">
                    <MapPin className="text-muted-foreground h-8 w-8" />
                  </div>
                )}
                <div className="from-[#12302a] via-[#12302a]/40 absolute inset-0 bg-linear-to-t to-transparent" />
                <div className="absolute top-3 left-3">
                  <Badge className="bg-card/90 text-foreground rounded-sm backdrop-blur-sm">
                    {dest.destination_type === 'beach'
                      ? '🏖️ Biển'
                      : dest.destination_type === 'mountain'
                        ? '⛰️ Núi'
                        : dest.destination_type === 'culture'
                          ? '🏛️ Văn hóa'
                          : dest.destination_type === 'island'
                            ? '🏝️ Đảo'
                            : dest.destination_type}
                  </Badge>
                </div>
                <div className="bg-accent text-[#12302a] absolute top-3 right-3 flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-bold">
                  <Star className="h-3 w-3 fill-current" />
                  {dest.avg_rating ?? 0}
                </div>
                <div className="absolute inset-x-0 bottom-0 p-5 text-[#f7f3ec]">
                  <div className="mb-1 flex items-center gap-1 text-xs tracking-[0.15em] text-[#f7f3ec]/70 uppercase">
                    <MapPin className="h-3 w-3" />
                    {dest.province}
                  </div>
                  <h3 className="mb-2 text-2xl font-semibold">{dest.name}</h3>
                  <p className="mb-3 line-clamp-2 max-h-0 text-sm text-[#f7f3ec]/75 opacity-0 transition-all duration-500 group-hover:max-h-12 group-hover:opacity-100">
                    {dest.description}
                  </p>
                  <div className="flex items-center justify-between border-t border-[#f7f3ec]/20 pt-3 text-sm">
                    <span className="text-[#f7f3ec]/70">
                      {dest.review_count ?? 0} đánh giá
                    </span>
                    {dest.min_price !== null && dest.min_price > 0 ? (
                      <span className="text-accent font-semibold">
                        Từ {formatPrice(dest.min_price)}
                      </span>
                    ) : (
                      <ArrowRight className="text-accent h-4 w-4 transition-transform group-hover:translate-x-1" />
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <div className="mt-8 text-center sm:hidden">
        <Link
          href="/destinations"
          className="text-primary inline-flex items-center gap-1 font-medium"
        >
          Xem tất cả điểm đến
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}
