import { Link, useRouter } from 'expo-router';

import { AuthScreen } from '@/features/auth/components/auth-screen';
import { EmailPasswordForm } from '@/features/auth/components/email-password-form';
import { useAuthSession } from '@/features/auth/session';

export default function SignUpScreen() {
  const { auth } = useAuthSession();
  const router = useRouter();

  return (
    <AuthScreen title="Create your account" description="Use at least 8 characters for your password.">
      <EmailPasswordForm
        mode="sign-up"
        submitLabel="Create account"
        onSubmit={async (credentials) => {
          const session = await auth.signUp(credentials);
          if (!session) {
            router.replace({ pathname: '/email-verification-pending', params: { email: credentials.email } });
          }
        }}
      />
      <Link href="/login" className="mt-4 py-3 text-center text-sm text-neutral-600 dark:text-neutral-300">
        Already have an account? Sign in
      </Link>
    </AuthScreen>
  );
}
