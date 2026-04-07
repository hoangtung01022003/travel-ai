export const AUTH_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/link-expired',
]

export const PUBLIC_PATHS = ['/', '/tours', '/destinations', '/hotels', '/ai-planner']

export const APP_NAME = 'VietTravel'
export const APP_DESCRIPTION = 'Khám phá Việt Nam - Nền tảng du lịch thông minh'

export const REGIONS = [
  { value: 'north', label: 'Miền Bắc' },
  { value: 'central', label: 'Miền Trung' },
  { value: 'south', label: 'Miền Nam' },
] as const

export const DESTINATION_TYPES = [
  { value: 'beach', label: 'Biển', icon: '🏖️' },
  { value: 'mountain', label: 'Núi', icon: '⛰️' },
  { value: 'culture', label: 'Văn hóa', icon: '🏛️' },
  { value: 'city', label: 'Thành phố', icon: '🏙️' },
  { value: 'countryside', label: 'Làng quê', icon: '🌾' },
  { value: 'island', label: 'Đảo', icon: '🏝️' },
] as const

export const STAR_RATINGS = [1, 2, 3, 4, 5] as const

export const PRICE_RANGES = [
  { value: '0-500000', label: 'Dưới 500K', min: 0, max: 500000 },
  {
    value: '500000-1000000',
    label: '500K - 1 triệu',
    min: 500000,
    max: 1000000,
  },
  {
    value: '1000000-3000000',
    label: '1 - 3 triệu',
    min: 1000000,
    max: 3000000,
  },
  {
    value: '3000000-5000000',
    label: '3 - 5 triệu',
    min: 3000000,
    max: 5000000,
  },
  { value: '5000000+', label: 'Trên 5 triệu', min: 5000000, max: Infinity },
] as const

export const NAV_ITEMS = [
  { href: '/destinations', label: 'Điểm đến' },
  { href: '/hotels', label: 'Khách sạn' },
  { href: '/tours', label: 'Tour' },
  { href: '/ai-planner', label: 'AI Lịch trình' },
] as const

export const ADMIN_NAV_ITEMS = [
  { href: '/admin', label: 'Tổng quan', icon: 'LayoutDashboard' },
  { href: '/admin/destinations', label: 'Điểm đến', icon: 'MapPin' },
  { href: '/admin/attractions', label: 'Tham quan', icon: 'Landmark' },
  { href: '/admin/hotels', label: 'Khách sạn', icon: 'Hotel' },
  { href: '/admin/tours', label: 'Tour', icon: 'Route' },
  { href: '/admin/tags', label: 'Tags', icon: 'Tags' },
  { href: '/admin/users', label: 'Users', icon: 'Users' },
  { href: '/admin/bookings', label: 'Bookings', icon: 'Receipt' },
  { href: '/admin/reviews', label: 'Reviews', icon: 'MessageSquare' },
  { href: '/admin/ai-logs', label: 'AI Logs', icon: 'Bot' },
] as const

export const DASHBOARD_NAV_ITEMS = [
  { href: '/profile', label: 'Tổng quan', icon: 'User' },
  { href: '/itineraries', label: 'Lịch trình AI', icon: 'Sparkles' },
  { href: '/my-tours', label: 'Các tours đã đặt', icon: 'Map' },
] as const
