import { Link, useSearchParams } from 'react-router-dom'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { FormField } from '@/components/auth/FormField'
import { GoogleButton } from '@/components/auth/GoogleButton'
import { AuthDivider } from '@/components/auth/AuthDivider'
import { FormError } from '@/components/auth/FormError'
import { Button } from '@/components/ui/button'
import { useLoginForm } from '@/hooks/useAuthForms'

// Messages for the ?error=... values the backend adds when a Google sign-in goes wrong
const googleErrorMessages: Record<string, string> = {
  google_unavailable: 'Google sign-in is not set up on this server yet. Please use your email and password.',
  oauth_failed: 'Google sign-in did not complete. Please try again.',
  oauth_state_mismatch: 'That Google sign-in link expired or looked suspicious. Please start again.',
}

export default function LoginPage() {
  const { values, errors, setValue, markTouched, formError, isSubmitting, handleSubmit } = useLoginForm()
  const [searchParams] = useSearchParams()
  const redirectError = googleErrorMessages[searchParams.get('error') ?? '']

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to see what needs checking today."
      footer={
        <>
          New to SiteReady?{' '}
          <Link to="/register" className="font-medium text-primary underline-offset-4 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <FormError message={formError ?? redirectError} />

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={values.email}
          onChange={(event) => setValue('email', event.target.value)}
          onBlur={() => markTouched('email')}
          error={errors.email}
        />
        <FormField
          label="Password"
          type="password"
          autoComplete="current-password"
          value={values.password}
          onChange={(event) => setValue('password', event.target.value)}
          onBlur={() => markTouched('password')}
          error={errors.password}
        />
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          {isSubmitting ? 'Signing in' : 'Sign in'}
        </Button>
      </form>

      <AuthDivider />
      <GoogleButton />
    </AuthLayout>
  )
}
