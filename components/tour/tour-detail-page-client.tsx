'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Star, Heart, Share2, Clock, Users, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import Image from 'next/image'
import Link from 'next/link'
import { formatPrice, timeAgo } from '@/lib/utils/common'
import { TourDetail } from '@/types/tour'
import BookingModal from '@/components/booking/booking-modal'

interface TourDetailPageClientProps {
  tour: TourDetail
}

export const TourDetailPageClient = ({ tour }: TourDetailPageClientProps) => {
  const [bookingOpen, setBookingOpen] = useState(false)

  const coverImages = tour.cover_image
    ? [{ image_url: tour.cover_image as string }]
    : []
  const itinerary = (tour.tour_itineraries || []).sort(
    (a, b) => (a.day_number as number) - (b.day_number as number)
  )
  const reviews = tour.reviews || []
  const startDates: string[] = Array.isArray(tour.start_dates)
    ? (tour.start_dates as unknown as string[])
    : []

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="text-muted-foreground mb-6 flex items-center gap-2 text-sm">
        <Link href="/" className="hover:text-primary">
          Trang chủ
        </Link>
        <span>/</span>
        <Link href="/tours" className="hover:text-primary">
          Tour
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">
          {tour.name as string}
        </span>
      </nav>

      {/* Header */}
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="warning">
              {tour.duration_days as number}N
              {(tour.duration_days as number) - 1}Đ
            </Badge>
          </div>
          <h1 className="mb-2 text-3xl font-bold lg:text-4xl">
            {tour.name as string}
          </h1>
          <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Star className="fill-warning text-warning h-4 w-4" />{' '}
              {Number(tour.avg_rating).toFixed(1)} (
              {tour.review_count as number} đánh giá)
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" /> Tối đa{' '}
              {(tour.max_group_size as number) || 20} người
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1">
            <Heart className="h-4 w-4" /> Yêu thích
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            <Share2 className="h-4 w-4" /> Chia sẻ
          </Button>
        </div>
      </div>

      {/* Cover Image */}
      {coverImages.length > 0 && (
        <div className="relative mb-8 h-[300px] overflow-hidden rounded-2xl md:h-[450px]">
          <Image
            src={coverImages[0].image_url}
            alt={tour.name as string}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main */}
        <div className="space-y-8 lg:col-span-2">
          {/* Description */}
          <section>
            <h2 className="mb-3 text-xl font-bold">Giới thiệu</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {tour.description as string}
            </p>
          </section>

          {/* Itinerary */}
          {itinerary.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-bold">Lịch trình</h2>
              <div className="space-y-4">
                {itinerary.map((day, idx) => (
                  <motion.div
                    key={day.id as string}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="border-primary/20 relative border-l-2 pb-6 pl-8 last:border-0 last:pb-0"
                  >
                    <div className="bg-primary absolute top-0 -left-3 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white">
                      {day.day_number as number}
                    </div>
                    <h3 className="mb-1 text-lg font-semibold">
                      {day.title as string}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {day.description as string}
                    </p>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Reviews */}
          <section>
            <h2 className="mb-4 text-xl font-bold">
              Đánh giá ({tour.review_count as number})
            </h2>
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((r) => {
                  const profile = r.profiles as Record<string, unknown> | null
                  return (
                    <div
                      key={r.id as string}
                      className="border-border rounded-xl border bg-white p-4"
                    >
                      <div className="mb-3 flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {((profile?.full_name as string) || 'U').charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">
                            {(profile?.full_name as string) || 'Ẩn danh'}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {timeAgo(r.created_at as string)}
                          </p>
                        </div>
                        <div className="flex">
                          {Array.from({ length: r.rating as number }).map(
                            (_, i) => (
                              <Star
                                key={i}
                                className="fill-warning text-warning h-3.5 w-3.5"
                              />
                            )
                          )}
                        </div>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {r.comment as string}
                      </p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Chưa có đánh giá nào.
              </p>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            <div className="border-border rounded-2xl border bg-white p-6">
              <p className="text-muted-foreground mb-1 text-sm">Giá tour</p>
              <p className="text-primary mb-1 text-3xl font-bold">
                {formatPrice(Number(tour.price))}
              </p>
              <p className="text-muted-foreground mb-4 text-sm">/người</p>

              <div className="mb-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-4 w-4" /> Thời gian
                  </span>
                  <span className="font-medium">
                    {tour.duration_days as number} ngày{' '}
                    {(tour.duration_days as number) - 1} đêm
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Users className="h-4 w-4" /> Nhóm
                  </span>
                  <span className="font-medium">
                    Tối đa {(tour.max_group_size as number) || 20} người
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="h-4 w-4" /> Khởi hành
                  </span>
                  <span className="font-medium">Hàng tuần</span>
                </div>
              </div>

              <Button className="mb-3 w-full" size="lg" onClick={() => setBookingOpen(true)}>
                Đặt tour ngay
              </Button>
              <Button variant="outline" className="w-full" size="lg">
                Liên hệ tư vấn
              </Button>
            </div>

            <div className="border-border from-primary/5 to-accent/5 rounded-2xl border bg-gradient-to-br p-6">
              <h3 className="mb-2 font-semibold">Cần hỗ trợ?</h3>
              <p className="text-muted-foreground mb-3 text-sm">
                Liên hệ hotline để được tư vấn miễn phí
              </p>
              <p className="text-primary text-lg font-bold">1900 xxxx</p>
            </div>
          </div>
        </div>
      </div>

      <BookingModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        type="tour"
        itemId={tour.id as string}
        itemName={tour.name as string}
        pricePerUnit={Number(tour.price)}
        priceLabel="/người"
        startDates={startDates}
      />
    </div>
  )
}
