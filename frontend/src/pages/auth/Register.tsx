import { Link } from 'react-router-dom'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { FormField } from '@/components/forms/FormField'
import { GoogleButton } from '@/components/auth/GoogleButton'
import { AuthDivider } from '@/components/auth/AuthDivider'
import { FormError } from '@/components/forms/FormError'
import { Button } from '@/components/ui/button'
import { useRegisterForm } from '@/hooks/useAuthForms'
import { PASSWORD_MIN_LENGTH } from '@/utils/validators'

export default function RegisterPage() {
  const { values, errors, setValue, markTouched, formError, isSubmitting, handleSubmit } = useRegisterForm()

  return (
    <AuthLayout
      title="Set up your workspace"
      subtitle="You will be the manager. Add your staff once you are in."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <FormError message={formError} />

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField
          label="Full name"
          autoComplete="name"
          value={values.name}
          onChange={(event) => setValue('name', event.target.value)}
          onBlur={() => markTouched('name')}
          error={errors.name}
        />
        <FormField
          label="Work email"
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
          autoComplete="new-password"
          value={values.password}
          onChange={(event) => setValue('password', event.target.value)}
          onBlur={() => markTouched('password')}
          error={errors.password}
          hint={`At least ${PASSWORD_MIN_LENGTH} characters.`}
        />
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          {isSubmitting ? 'Creating account' : 'Create account'}
        </Button>
      </form>

      <AuthDivider />
      <GoogleButton label="Sign up with Google" />
    </AuthLayout>
  )
}
