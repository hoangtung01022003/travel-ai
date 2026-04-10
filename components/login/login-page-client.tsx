'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

import { useFormWithServerAction } from '@/hooks/use-form-with-server-action'
import { useToast } from '@/hooks/use-toast-notifications'
import { loginSchema } from '@/lib/schema/auth'
import { loginAction } from '@/components/login/actions/login-action'

import { Button } from '@/components/ui/button'
import { FieldGroup } from '@/components/ui/field'
import { ControlledInput } from '@/components/ui/controlled-input'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Eye, EyeOff, Loader2, Lock, Mail, MapPin } from 'lucide-react'
import { APP_NAME } from '@/lib/constants/common'
import { Separator } from '../ui/separator'
import { Label } from '../ui/label'
import { useState } from 'react'

export const LoginPageClient = () => {
  const router = useRouter()
  const { error, success } = useToast()
  const [showPassword, setShowPassword] = useState(false)

  const { form, handleSubmit, isPending, canSubmit } = useFormWithServerAction({
    schema: loginSchema,
    action: loginAction,
    defaultValues: {
      email: '',
      password: '',
    },
    onSuccess: (role) => {
      success('Đăng nhập thành công')
      router.replace(role === 'admin' ? '/admin' : '/')
    },
    onError: (errors) => {
      if (errors.root) {
        error(errors.root)
      }
    },
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
    >
      <Card className="border-0 shadow-xl">
        <CardHeader className="pb-2 text-center">
          <Link
            href="/"
            className="mb-4 inline-flex items-center justify-center gap-2"
          >
            <div className="bg-primary flex h-10 w-10 items-center justify-center rounded-xl">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <span className="text-gradient text-2xl font-bold">{APP_NAME}</span>
          </Link>
          <h1 className="text-xl font-semibold">Chào mừng trở lại!</h1>
          <p className="text-muted-foreground text-sm">
            Đăng nhập để tiếp tục khám phá
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Google OAuth */}
          <Button
            variant="outline"
            className="h-11 w-full"
            // onClick={handleGoogleLogin}
            type="button"
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Đăng nhập với Google
          </Button>

          <div className="relative">
            <Separator />
            <span className="text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs">
              hoặc
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FieldGroup>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <ControlledInput
                  control={form.control}
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  disabled={isPending}
                  inputClassName="pl-10"
                  prefix={
                    <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <ControlledInput
                  control={form.control}
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  disabled={isPending}
                  inputClassName="pl-10"
                  prefix={
                    <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  }
                  suffix={
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  }
                />
              </div>
            </FieldGroup>

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-muted-foreground text-sm hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </div>

            <Button
              type="submit"
              className="h-11 w-full"
              disabled={isPending || !canSubmit}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Đăng nhập
            </Button>
          </form>

          <p className="text-muted-foreground text-center text-sm">
            Chưa có tài khoản?
            <Link
              href="/register"
              className="text-primary font-medium hover:underline"
            >
              Đăng ký ngay
            </Link>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
