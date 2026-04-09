import { getTours } from '@/components/tour/actions/tour-actions'
import { notFound } from 'next/navigation'
import { TourPageClient } from '@/components/tour/tour-page-client'
import { Suspense } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tour Du Lịch Hấp Dẫn — VietTravel AI',
  description: 'Hành trình được thiết kế bởi chuyên gia, trải nghiệm không giới hạn',
}

interface PageProps {
  searchParams: Promise<{
    keyword?: string
    minPrice?: string
    maxPrice?: string
    minDays?: string
    maxDays?: string
    destinationId?: string
    limit?: string
    offset?: string
  }>
}

export default async function TourPage({ searchParams }: PageProps) {
  const params = await searchParams

  const results = await getTours({
    search: params.keyword,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    minDays: params.minDays ? Number(params.minDays) : undefined,
    maxDays: params.maxDays ? Number(params.maxDays) : undefined,
    destinationId: params.destinationId,
    limit: params.limit ? Number(params.limit) : undefined,
    offset: params.offset ? Number(params.offset) : undefined,
  })

  if (!results.success) {
    notFound()
  }

  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Đang tải dữ liệu...</div>}>
      <TourPageClient tours={results.success ? results.data.tours : []} totalCount={results.success ? results.data.count : 0} />
    </Suspense>
  )
}
