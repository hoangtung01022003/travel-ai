'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  MapPin,
  Star,
  Clock,
  Camera,
  ChevronLeft,
  Heart,
  Share2,
  DollarSign,
} from 'lucide-react'
import { DestinationDetail } from '@/types/destination'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatPrice, timeAgo } from '@/lib/utils/common'
import { DESTINATION_TYPES } from '@/lib/constants/common'

interface DestinationDetailPageClientProps {
  destination: DestinationDetail
}

export const DestinationDetailPageClient = ({
  destination,
}: DestinationDetailPageClientProps) => {
  const [currentImage, setCurrentImage] = useState(0)

  const images = destination.destination_images || []
  const allImages = destination.cover_image
    ? [{ image_url: destination.cover_image as string, caption: '' }, ...images]
    : images
  const attractions =
    (destination.attractions as Array<Record<string, unknown>>) || []
  const reviews = destination.reviews || []
  const tags = destination.tags || []
  const typeLabel =
    DESTINATION_TYPES.find((t) => t.value === destination.destination_type)
      ?.label || (destination.destination_type as string)
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="text-muted-foreground mb-6 flex items-center gap-2 text-sm">
        <Link
          href="/destinations"
          className="hover:text-foreground flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Điểm đến
        </Link>
        <span>/</span>
        <span className="text-foreground">{destination.name as string}</span>
      </div>

      {/* Gallery */}
      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="relative h-100 overflow-hidden rounded-2xl">
          {allImages.length > 0 ? (
            <Image
              src={allImages[currentImage]?.image_url || ''}
              alt={destination.name as string}
              fill
              className="object-cover"
            />
          ) : (
            <div className="bg-muted flex h-full w-full items-center justify-center">
              <MapPin className="text-muted-foreground h-12 w-12" />
            </div>
          )}
          {allImages.length > 1 && (
            <div className="absolute bottom-4 left-4 flex gap-2">
              {allImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImage(i)}
                  className={`h-3 w-3 rounded-full transition-colors ${
                    i === currentImage ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
          <div className="absolute top-4 right-4 flex gap-2">
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm transition-colors hover:bg-white">
              <Heart
                className={`h-5 w-5 ${false ? 'fill-destructive text-destructive' : 'text-foreground'}`}
              />
            </button>
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm transition-colors hover:bg-white">
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {allImages.slice(1, 5).map((img, i) => (
            <div
              key={i}
              className="relative h-47.5 cursor-pointer overflow-hidden rounded-xl"
              onClick={() => setCurrentImage(i + 1)}
            >
              <Image
                src={img.image_url}
                alt=""
                fill
                className="object-cover transition-transform hover:scale-105"
              />
              {i === 3 && allImages.length > 5 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <span className="flex items-center gap-1 font-semibold text-white">
                    <Camera className="h-5 w-5" />+{allImages.length - 5}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-8 lg:col-span-2">
          {/* Title & Info */}
          <div>
            {tags.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {tags.map((t) => (
                  <Badge key={t.id} variant="muted">
                    {t.name}
                  </Badge>
                ))}
              </div>
            )}
            <h1 className="mb-2 text-3xl font-bold lg:text-4xl">
              {destination.name as string}
            </h1>
            <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {destination.province as string}
                {destination.region ? `, ${destination.region}` : ''}
              </span>
              <span className="flex items-center gap-1">
                <Star className="fill-warning text-warning h-4 w-4" />
                {Number(destination.avg_rating).toFixed(1)} (
                {destination.review_count as number} đánh giá)
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Gợi ý {destination.suggested_days as number} ngày
              </span>
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div>
            <h2 className="mb-3 text-xl font-semibold">Giới thiệu</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {destination.description as string}
            </p>
          </div>

          {/* Attractions */}
          {attractions.length > 0 && (
            <div>
              <h2 className="mb-4 text-xl font-semibold">Điểm tham quan</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {attractions.map((attraction) => (
                  <Card
                    key={attraction.id as string}
                    className="card-hover overflow-hidden"
                  >
                    {!!attraction.image_url && (
                      <div className="relative h-40">
                        <Image
                          src={attraction.image_url as string}
                          alt={attraction.name as string}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <h3 className="mb-1 font-semibold">
                        {attraction.name as string}
                      </h3>
                      {!!attraction.description && (
                        <p className="text-muted-foreground mb-2 text-sm">
                          {attraction.description as string}
                        </p>
                      )}
                      <div className="flex items-center gap-1 text-sm">
                        <DollarSign className="text-primary h-3.5 w-3.5" />
                        <span className="font-medium">
                          {Number(attraction.entry_fee) > 0
                            ? formatPrice(Number(attraction.entry_fee))
                            : 'Miễn phí'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div>
            <h2 className="mb-4 text-xl font-semibold">
              Đánh giá ({destination.review_count as number})
            </h2>
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => {
                  const profile = review.profiles as Record<
                    string,
                    unknown
                  > | null
                  return (
                    <Card key={review.id as string}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold">
                            {((profile?.full_name as string) || 'U').charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="mb-1 flex items-center justify-between">
                              <span className="font-medium">
                                {(profile?.full_name as string) || 'Ẩn danh'}
                              </span>
                              <span className="text-muted-foreground text-xs">
                                {timeAgo(review.created_at as string)}
                              </span>
                            </div>
                            <div className="mb-2 flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3.5 w-3.5 ${
                                    i < (review.rating as number)
                                      ? 'fill-warning text-warning'
                                      : 'text-border'
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-muted-foreground text-sm">
                              {review.comment as string}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Chưa có đánh giá nào.
              </p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="sticky top-24">
            <CardContent className="p-6">
              <div className="mb-4 text-center">
                <span className="text-muted-foreground text-sm">
                  Giá tham khảo từ
                </span>
                <div className="text-primary text-3xl font-bold">
                  {formatPrice(Number(destination.min_price))}
                </div>
                <span className="text-muted-foreground text-sm">
                  /người/ngày
                </span>
              </div>
              <Separator className="my-4" />
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Thời gian gợi ý</span>
                  <span className="font-medium">
                    {destination.suggested_days as number} ngày
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Loại hình</span>
                  <span className="font-medium">{typeLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Điểm tham quan</span>
                  <span className="font-medium">{attractions.length}</span>
                </div>
              </div>
              <Separator className="my-4" />
              <Button className="w-full" size="lg" asChild>
                <Link href={`/ai-planner?destination=${encodeURIComponent(destination.name as string)}`}>✨ Tạo lịch trình AI</Link>
              </Button>
              <Button variant="outline" className="mt-2 w-full" size="lg">
                <Heart
                  className={`mr-2 h-4 w-4 ${false ? 'fill-destructive text-destructive' : ''}`}
                />
                Lưu yêu thích
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
