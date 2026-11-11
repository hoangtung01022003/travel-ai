import { getTourByslug } from '@/components/tour/actions/tour-actions'
import { TourDetailPageClient } from '@/components/tour/tour-detail-page-client'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function TourDetailPage({ params }: PageProps) {
  const { slug } = await params

  const result = await getTourByslug(slug)

  if (!result.success || !result.data) {
    notFound()
  }

  return <TourDetailPageClient tour={result.data} />
}
