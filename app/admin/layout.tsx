import type { Metadata } from 'next'
import AdminSidebar from '@/components/admin/admin-sidebar'

export const metadata: Metadata = {
  title: 'Admin Dashboard — VietTravel',
  description: 'Quản trị hệ thống VietTravel',
}

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex min-h-screen bg-muted/40">
      <AdminSidebar />
      <div className="flex flex-1 flex-col lg:pl-64">
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
