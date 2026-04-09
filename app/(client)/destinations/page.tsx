import { getDestinations } from '@/components/destination/actions/destination-actions'
import { DestinationPageClient } from '@/components/destination/destination-page-client'
import { Suspense } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Khám phá Điểm Đến — VietTravel AI',
  description: 'Tìm kiếm và khám phá những địa điểm du lịch tuyệt vời tại Việt Nam',
}

interface PageProps {
  searchParams: Promise<{
    keyword?: string
    type?: string
    region?: string
    minPrice?: string
    maxPrice?: string
    minRating?: string
    limit?: string
    offset?: string
    featured?: string
  }>
}

export default async function DestinationsPage({ searchParams }: PageProps) {
  const params = await searchParams

  const results = await getDestinations({
    search: params.keyword,
    type: params.type,
    region: params.region,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    minRating: params.minRating ? Number(params.minRating) : undefined,
    limit: params.limit ? Number(params.limit) : undefined,
    offset: params.offset ? Number(params.offset) : undefined,
    featured: params.featured === 'true' ? true : undefined,
  })

  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Đang tải dữ liệu...</div>}>
      <DestinationPageClient
        destinations={results.success ? results.data.destinations : []}
        totalCount={results.success ? results.data.count : 0}
      />
    </Suspense>
  )
}
