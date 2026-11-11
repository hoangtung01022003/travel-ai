'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Star,
  MapPin,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  Users,
  BedDouble,
  Bath,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import Image from 'next/image'
import Link from 'next/link'
import { formatPrice, timeAgo } from '@/lib/utils/common'
import { HotelDetail } from '@/types/hotel'
import BookingModal from '@/components/booking/booking-modal'
import { useWishlist } from '@/components/wishlist/use-wishlist'

interface HotelDetailPageClientProps {
  hotel: HotelDetail
}

export const HotelDetailPageClient = ({
  hotel,
}: HotelDetailPageClientProps) => {
  const [imgIndex, setImgIndex] = useState(0)
  const [bookingOpen, setBookingOpen] = useState(false)
  const [selectedPrice, setSelectedPrice] = useState(0)
  const wishlist = useWishlist('hotel', hotel.id as string)

  // Ưu tiên toạ độ; nếu chưa có thì tìm theo tên + địa chỉ + tỉnh
  const mapQuery = encodeURIComponent(
    hotel.latitude != null && hotel.longitude != null
      ? `${hotel.latitude},${hotel.longitude}`
      : [hotel.name, hotel.address, hotel.province].filter(Boolean).join(', ')
  )

  const images = hotel.hotel_images || []
  const allImages = hotel.cover_image
    ? [{ image_url: hotel.cover_image as string }, ...images]
    : images
  const roomTypes = hotel.room_types || []
  const amenities = hotel.amenities || []
  const reviews = hotel.reviews || []

  const nextImg = () =>
    setImgIndex((i) => (i + 1) % Math.max(allImages.length, 1))
  const prevImg = () =>
    setImgIndex(
      (i) => (i - 1 + allImages.length) % Math.max(allImages.length, 1)
    )
  console.log(hotel)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="text-muted-foreground mb-6 flex items-center gap-2 text-sm">
        <Link href="/" className="hover:text-primary">
          Trang chủ
        </Link>
        <span>/</span>
        <Link href="/hotels" className="hover:text-primary">
          Khách sạn
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">
          {hotel.name as string}
        </span>
      </nav>

      {/* Header */}
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <div className="flex">
              {Array.from({ length: (hotel.star_rating as number) || 0 }).map(
                (_, i) => (
                  <Star key={i} className="fill-warning text-warning h-4 w-4" />
                )
              )}
            </div>
          </div>
          <h1 className="text-primary mb-2 text-4xl font-semibold lg:text-5xl">
            {hotel.name as string}
          </h1>
          <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />{' '}
              {(hotel.address as string) || (hotel.province as string)}
            </span>
            <span className="flex items-center gap-1">
              <Star className="fill-warning text-warning h-4 w-4" />{' '}
              {Number(hotel.avg_rating).toFixed(1)} (
              {hotel.review_count as number} đánh giá)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={wishlist.toggle}
            disabled={wishlist.pending}
            aria-pressed={wishlist.saved}
          >
            <Heart
              className={`h-4 w-4 ${wishlist.saved ? 'fill-[#b5432a] text-[#b5432a]' : ''}`}
            />
            {wishlist.saved ? 'Đã lưu' : 'Yêu thích'}
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            <Share2 className="h-4 w-4" /> Chia sẻ
          </Button>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="relative mb-8 h-[300px] overflow-hidden rounded-md shadow-[10px_10px_0_0_#e3efe9] ring-1 ring-[#e4ddd0] md:h-[450px]">
        {allImages.length > 0 ? (
          <Image
            src={allImages[imgIndex]?.image_url || ''}
            alt={hotel.name as string}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="bg-muted flex h-full w-full items-center justify-center">
            <MapPin className="text-muted-foreground h-12 w-12" />
          </div>
        )}
        {allImages.length > 1 && (
          <>
            <button
              onClick={prevImg}
              className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full bg-white/80 p-2 backdrop-blur-sm transition hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={nextImg}
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-white/80 p-2 backdrop-blur-sm transition hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
              {allImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setImgIndex(idx)}
                  className={`h-2.5 w-2.5 rounded-full transition ${idx === imgIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-8 lg:col-span-2">
          {/* Description */}
          <section>
            <h2 className="mb-3 flex items-center gap-3 text-2xl font-semibold before:h-7 before:w-1.5 before:rounded-full before:bg-[#b5432a] before:content-['']">Giới thiệu</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {hotel.description as string}
            </p>
          </section>

          {/* Amenities */}
          {amenities.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-3 text-2xl font-semibold before:h-7 before:w-1.5 before:rounded-full before:bg-[#b5432a] before:content-['']">Tiện nghi</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {amenities.map((a) => (
                  <div
                    key={a.id}
                    className="border-border bg-background flex items-center gap-2 rounded-xl border p-3"
                  >
                    <span className="text-sm">{a.name}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Room Types */}
          {roomTypes.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-3 text-2xl font-semibold before:h-7 before:w-1.5 before:rounded-full before:bg-[#b5432a] before:content-['']">Các loại phòng</h2>
              <div className="space-y-4">
                {roomTypes.map((room) => (
                  <motion.div
                    key={room.id as string}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-border bg-card flex flex-col overflow-hidden rounded-md border border-l-4 border-l-[#0f5c4d] transition-shadow hover:shadow-[6px_6px_0_0_#e3efe9] sm:flex-row"
                  >
                    {!!room.image_url && (
                      <div className="relative h-40 w-full shrink-0 sm:h-auto sm:w-56">
                        <Image
                          src={room.image_url as string}
                          alt={room.name as string}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col justify-between p-5">
                      <div>
                        <h3 className="mb-1 text-lg font-semibold">
                          {room.name as string}
                        </h3>
                        {!!room.description && (
                          <p className="text-muted-foreground mb-3 text-sm">
                            {room.description as string}
                          </p>
                        )}
                        <div className="text-muted-foreground flex flex-wrap gap-3 text-sm">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />{' '}
                            {(room.max_guests as number) || 2} khách
                          </span>
                          {!!room.bed_type && (
                            <span className="flex items-center gap-1">
                              <BedDouble className="h-4 w-4" />{' '}
                              {room.bed_type as string}
                            </span>
                          )}
                          {!!room.room_size && (
                            <span className="flex items-center gap-1">
                              <Bath className="h-4 w-4" />{' '}
                              {room.room_size as number}m²
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="border-border mt-4 flex items-center justify-between border-t pt-4">
                        <div>
                          <span className="text-primary text-xl font-bold">
                            {formatPrice(Number(room.price_per_night))}
                          </span>
                          <span className="text-muted-foreground text-sm">
                            {' '}
                            /đêm
                          </span>
                        </div>
                        <Button onClick={() => { setSelectedPrice(Number(room.price_per_night)); setBookingOpen(true) }}>Đặt phòng</Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Map */}
          <section>
            <h2 className="mb-4 flex items-center gap-3 text-2xl font-semibold before:h-7 before:w-1.5 before:rounded-full before:bg-[#b5432a] before:content-['']">
              Vị trí
            </h2>
            <p className="text-muted-foreground mb-3 flex items-center gap-1 text-sm">
              <MapPin className="h-4 w-4" />
              {[hotel.address, hotel.province].filter(Boolean).join(', ') || (hotel.name as string)}
            </p>
            <div className="border-border overflow-hidden rounded-lg border">
              <iframe
                title={`Bản đồ ${hotel.name}`}
                src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                className="h-72 w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary mt-2 inline-block text-sm font-medium hover:underline"
            >
              Chỉ đường trên Google Maps →
            </a>
          </section>

          {/* Reviews */}
          <section>
            <h2 className="mb-4 flex items-center gap-3 text-2xl font-semibold before:h-7 before:w-1.5 before:rounded-full before:bg-[#b5432a] before:content-['']">
              Đánh giá ({hotel.review_count as number})
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
          <div className="sticky top-24 lg:top-32 space-y-4">
            <div className="border-border bg-card rounded-md border border-t-4 border-t-[#b5432a] p-6 shadow-[0_14px_30px_-20px_rgba(18,48,42,0.5)]">
              <p className="text-muted-foreground mb-1 text-sm">Giá chỉ từ</p>
              <p className="text-primary mb-1 text-3xl font-bold">
                {formatPrice(Number(hotel.min_price))}
              </p>
              <p className="text-muted-foreground mb-4 text-sm">/đêm</p>
              <Button
                className="mb-3 w-full"
                size="lg"
                onClick={() => {
                  setSelectedPrice(Number(hotel.min_price))
                  setBookingOpen(true)
                }}
              >
                Đặt ngay
              </Button>
              <Button variant="outline" className="w-full" size="lg">
                Liên hệ tư vấn
              </Button>
            </div>

            <div className="border-border rounded-md border bg-[#e3efe9]/60 p-6">
              <h3 className="mb-3 font-semibold">Vị trí</h3>
              <div className="bg-muted text-muted-foreground flex h-40 items-center justify-center rounded-xl text-sm">
                <MapPin className="mr-2 h-5 w-5" /> Bản đồ sẽ hiển thị ở đây
              </div>
              <p className="text-muted-foreground mt-2 text-sm">
                {(hotel.address as string) || (hotel.province as string)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <BookingModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        type="hotel"
        itemId={hotel.id as string}
        itemName={hotel.name as string}
        pricePerUnit={selectedPrice || Number(hotel.min_price)}
        priceLabel="/đêm"
      />
    </div>
  )
}
