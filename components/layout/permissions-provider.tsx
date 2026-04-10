'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react'
import { usePathname } from 'next/navigation'
import { UserRole } from '@/types/auth'
import { getCurrentUserWithRole } from '@/components/layout/actions/user-info-action'

const PATHNAME_CHANGE_DEBOUNCE_MS = 500

interface PermissionsContextValue {
  role: UserRole | null
  userId: string | null
  loading: boolean
  refreshRole: (needLoading?: boolean) => Promise<void>
}

const PermissionsContext = createContext<PermissionsContextValue | undefined>(
  undefined
)

interface PermissionsProviderProps {
  children: React.ReactNode
  initialRole?: UserRole | null
  initialUserId?: string | null
}

export function PermissionsProvider({
  children,
  initialRole,
  initialUserId,
}: PermissionsProviderProps) {
  const pathname = usePathname()
  const [role, setRole] = useState<UserRole | null>(initialRole ?? null)
  const [userId, setUserId] = useState<string | null>(initialUserId ?? null)
  const [loading, setLoading] = useState(!initialRole)
  const previousPathnameRef = useRef<string | null>(null)
  const previousInitialRoleRef = useRef(initialRole)
  const lastRefreshTimeRef = useRef<number>(0)

  const refreshRole = useCallback(async (needLoading: boolean = true) => {
    if (needLoading) {
      setLoading(true)
    }
    const result = await getCurrentUserWithRole()
    if (result.success) {
      setRole(result.data?.role ?? null)
      setUserId(result.data?.userId ?? null)
    } else {
      setRole(null)
      setUserId(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (initialRole === undefined) {
      let cancelled = false
      const loadRole = async () => {
        setLoading(true)
        const result = await getCurrentUserWithRole()
        if (!cancelled) {
          if (result.success) {
            setRole(result.data?.role ?? null)
            setUserId(result.data?.userId ?? null)
          } else {
            setRole(null)
            setUserId(null)
          }
          setLoading(false)
        }
      }
      void loadRole()

      return () => {
        cancelled = true
      }
    }
  }, [initialRole])

  useEffect(() => {
    const previousInitialRole = previousInitialRoleRef.current
    if (initialRole !== previousInitialRole) {
      previousInitialRoleRef.current = initialRole

      if (initialRole !== undefined && initialRole !== role) {
        const timeoutId = requestAnimationFrame(() => {
          setRole(initialRole)
        })

        return () => cancelAnimationFrame(timeoutId)
      }
    }
  }, [initialRole, role])

  useEffect(() => {
    const previousPathname = previousPathnameRef.current

    if (previousPathname === null) {
      previousPathnameRef.current = pathname
      return
    }

    if (previousPathname !== pathname) {
      previousPathnameRef.current = pathname

      // CHỈ refresh tự động khi chuyển từ trang login sang trang khác (vừa đăng nhập xong)
      if (previousPathname === '/login' && pathname !== '/login') {
        const timeoutId = requestAnimationFrame(() => {
          void refreshRole(true)
        })
        return () => cancelAnimationFrame(timeoutId)
      }

      // Xóa bỏ việc refresh trên mọi pathname change để tránh bão request khi pre-fetch
      // Role sẽ được duy trì ổn định trừ khi có sự kiện logout/login chủ động.
    }
  }, [pathname, refreshRole])

  return (
    <PermissionsContext.Provider value={{ role, userId, loading, refreshRole }}>
      {children}
    </PermissionsContext.Provider>
  )
}

export function usePermissionsContext() {
  const context = useContext(PermissionsContext)

  if (context === undefined) {
    throw new Error(
      'usePermissionsContext must be used within a PermissionsProvider'
    )
  }

  return context
}
