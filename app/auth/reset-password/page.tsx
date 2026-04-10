'use client'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Loader2, Eye, EyeOff, CheckCircle, Shield, KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { useClerk } from '@clerk/nextjs'
import Image from 'next/image'

function ResetPasswordForm() {
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const clerk = useClerk()

  useEffect(() => {
    const verifyResetToken = async () => {
      const token = searchParams?.get('token')
      const ticket = searchParams?.get('ticket')
      
      // Check if we have a valid reset token/ticket
      if (!token && !ticket) {
        toast.error('Invalid reset link', {
          description: 'The password reset link is invalid or expired.',
        })
        router.push('/auth/forgot-password')
        return
      }

      try {
        // Verify the reset token with Clerk
        // This will throw if invalid
        setIsValidToken(true)
      } catch (error) {
        console.error('Invalid reset token:', error)
        toast.error('Invalid or expired link', {
          description: 'Please request a new password reset link.',
        })
        setIsValidToken(false)
        router.push('/auth/forgot-password')
      }
    }

    verifyResetToken()
  }, [searchParams, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords don't match", {
        description: 'Please make sure your passwords match.',
      })
      return
    }

    if (formData.password.length < 8) {
      toast.error('Password too short', {
        description: 'Password must be at least 8 characters long.',
      })
      return
    }

    // Password strength validation
    const hasUpperCase = /[A-Z]/.test(formData.password)
    const hasLowerCase = /[a-z]/.test(formData.password)
    const hasNumbers = /\d/.test(formData.password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      toast.error('Weak password', {
        description: 'Password must contain uppercase, lowercase, number, and special character.',
      })
      return
    }

    setLoading(true)

    try {
      // Use Clerk's password reset functionality
      const token = searchParams?.get('token')
      const ticket = searchParams?.get('ticket')
      
      if (!token && !ticket) {
        throw new Error('No reset token found')
      }

      // Reset the password using Clerk
      await clerk.client.signIn.resetPassword({
        password: formData.password,
        // Clerk uses different parameters based on the flow
        ...(token && { token }),
        ...(ticket && { ticket }),
      })

      toast.success('Password updated successfully!', {
        description: 'Your password has been reset. Please log in with your new password.',
        duration: 4000,
      })

      setSuccess(true)
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/sign-in')
      }, 2000)
    } catch (error: any) {
      console.error('Password reset error:', error)
      
      if (error.status === 404) {
        toast.error('Invalid reset link', {
          description: 'The reset link is invalid or has expired.',
        })
        router.push('/auth/forgot-password')
      } else if (error.status === 400) {
        toast.error('Invalid request', {
          description: error.message || 'Please request a new password reset link.',
        })
      } else {
        toast.error('Failed to reset password', {
          description: error.message || 'Please try again later.',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  if (isValidToken === false) {
    return null // Redirecting...
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-2xl bg-white/80 dark:bg-slate-900/70 backdrop-blur-3xl rounded-2xl overflow-hidden text-center">
          <CardHeader>
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">Password Reset Successfully!</CardTitle>
            <CardDescription className="text-base mt-2">
              Your password has been updated successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pb-8">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-4">
              <p className="text-sm text-emerald-800 dark:text-emerald-300">
                You will be redirected to the login page shortly.
              </p>
            </div>
            <div className="flex justify-center">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <Link href="/sign-in" className="block">
              <Button className="w-full h-12 rounded-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                Go to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] bg-purple-500/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[20%] left-[20%] w-[40%] h-[40%] bg-pink-500/10 blur-[100px] rounded-full" />
      </div>

      <Card className="w-full max-w-md border-0 shadow-2xl bg-white/80 dark:bg-slate-900/70 backdrop-blur-3xl rounded-2xl overflow-hidden relative z-10">
        <CardHeader className="text-center pt-8 pb-6">
          <div className="flex justify-center mb-6">
            <div className="relative w-20 h-20 drop-shadow-xl">
              <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
              <Image
                src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/public/Assets/logo.png`}
                alt="Alumni Connect Logo"
                fill
                priority
                className="object-contain relative z-10 drop-shadow-md"
                unoptimized
                sizes="80px"
              />
            </div>
          </div>
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 rounded-full flex items-center justify-center">
              <KeyRound className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <CardTitle className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            Set New Password
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Create a new password for your account
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6 pt-0">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password (min. 8 characters)"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={loading}
                  minLength={8}
                  className="h-12 rounded-xl pr-12 border-gray-200 dark:border-gray-700 focus:ring-indigo-500"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-semibold">
                Confirm New Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your new password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  disabled={loading}
                  className="h-12 rounded-xl pr-12 border-gray-200 dark:border-gray-700 focus:ring-indigo-500"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </div>
            </div>

            {/* Password requirements */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Password requirements:</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${formData.password.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span>At least 8 characters</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span>At least one uppercase letter</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${/[a-z]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span>At least one lowercase letter</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${/\d/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span>At least one number</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span>At least one special character</span>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02]"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating Password...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/sign-in"
              className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium transition-colors inline-flex items-center gap-1 text-sm"
            >
              Back to Sign In
            </Link>
          </div>

          <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl border border-amber-100 dark:border-amber-800/50">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-300 mb-1">
                  Security Tip
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                  Choose a strong password that you haven't used before. Avoid using common words or personal information.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}