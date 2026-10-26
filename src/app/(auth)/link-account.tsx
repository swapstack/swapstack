import { useRouter } from 'expo-router';

import { AuthScreen } from '@/features/auth/components/auth-screen';
import { EmailPasswordForm } from '@/features/auth/components/email-password-form';
import { useAuthSession } from '@/features/auth/session';

export default function LinkAccountScreen() {
  const { auth } = useAuthSession();
  const router = useRouter();

  return (
    <AuthScreen title="Upgrade your account" description="Keep your data and sign in on other devices.">
      <EmailPasswordForm
        submitLabel="Link email and password"
        onSubmit={async (credentials) => {
          const session = await auth.linkAccount(credentials);
          if (!session) {
            router.push({ pathname: '/email-verification-pending', params: { email: credentials.email } });
          }
        }}
      />
    </AuthScreen>
  );
}
