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
import { Eye, EyeOff, Loader2, Lock, Mail, Compass } from 'lucide-react'
import { APP_NAME } from '@/lib/constants/common'
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
      <Card className="border-accent border-t-4 shadow-2xl">
        <CardHeader className="pb-2 text-center">
          <Link
            href="/"
            className="mb-4 inline-flex items-center justify-center gap-2"
          >
            <div className="bg-primary text-accent flex h-10 w-10 rotate-45 items-center justify-center rounded-md">
              <Compass className="h-5 w-5 -rotate-45" />
            </div>
            <span className="font-display text-primary ml-1 text-2xl font-semibold">{APP_NAME}</span>
          </Link>
          <h1 className="text-xl font-semibold">Chào mừng trở lại!</h1>
          <p className="text-muted-foreground text-sm">
            Đăng nhập để tiếp tục khám phá
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
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
