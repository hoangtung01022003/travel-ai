import { getHotels } from '@/components/hotel/actions/hotel-actions'
import { HotelPageClient } from '@/components/hotel/hotel-page-client'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Khách Sạn Chất Lượng — VietTravel AI',
  description: 'Tìm nơi lưu trú hoàn hảo cho chuyến đi của bạn',
}

interface PageProps {
  searchParams: Promise<{
    keyword?: string
    starRating?: string
    province?: string
    minPrice?: string
    maxPrice?: string
    minRating?: string
    limit?: string
    offset?: string
    featured?: string
  }>
}

export default async function HotelsPage({ searchParams }: PageProps) {
  const params = await searchParams

  const results = await getHotels({
    search: params.keyword,
    starRating: params.starRating ? Number(params.starRating) : undefined,
    province: params.province,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    minRating: params.minRating ? Number(params.minRating) : undefined,
    limit: params.limit ? Number(params.limit) : undefined,
    offset: params.offset ? Number(params.offset) : undefined,
    featured: params.featured === 'true' ? true : undefined,
  })

  if (!results.success) {
    notFound()
  }

  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Đang tải dữ liệu...</div>}>
      <HotelPageClient hotels={results.success ? results.data.hotels : []} totalCount={results.success ? results.data.count : 0} />
    </Suspense>
  )
}
