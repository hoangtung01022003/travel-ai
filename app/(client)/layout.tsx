import { getCurrentUserWithRole, getFullProfile } from '@/components/layout/actions/user-info-action'
import ClientLayout from '@/components/layout/client/client-layout'
import Footer from '@/components/layout/client/footer'
import Header from '@/components/layout/client/header'

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const result = await getCurrentUserWithRole()
  const userEmail = result.success ? result.data?.email : undefined
  const initialRole = result.success ? result.data?.role : null
  const initialUserId = result.success ? result.data?.userId : null
  const profileResult = await getFullProfile()
  const serverProfile = profileResult.success ? profileResult.data : null

  return (
    <ClientLayout
      userEmail={userEmail}
      initialRole={initialRole}
      initialUserId={initialUserId}
    >
      <Header serverProfile={serverProfile} />
      <div className="mt-20">{children}</div>
      <Footer />
    </ClientLayout>
  )
}
