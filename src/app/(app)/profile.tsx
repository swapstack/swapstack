import { Link } from 'expo-router';
import * as React from 'react';

import { Avatar, Button, Card, CardContent, CardDescription, CardTitle, Input, Text, View } from '@/components/ui';
import { AuthScreen } from '@/features/auth/components/auth-screen';
import { FormMessage } from '@/features/auth/components/form-message';
import { useAuthSession } from '@/features/auth/session';
import { getErrorMessage } from '@/features/auth/validation';

export default function ProfileScreen() {
  const { auth, session } = useAuthSession();
  const user = session?.user;
  const [displayName, setDisplayName] = React.useState(user?.displayName ?? '');
  const [error, setError] = React.useState<string>();
  const [success, setSuccess] = React.useState<string>();
  const [isSaving, setIsSaving] = React.useState(false);
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const runAction = React.useCallback(async (action: () => Promise<void>) => {
    setError(undefined);
    setSuccess(undefined);
    try {
      await action();
    }
    catch (cause) {
      setError(getErrorMessage(cause));
    }
  }, []);

  if (!user) {
    return null;
  }

  const initials = (user.displayName?.trim() || user.email || 'Guest').slice(0, 1).toUpperCase();

  return (
    <AuthScreen title="Your profile" description="Manage your account details and session.">
      <View className="mb-6 items-center">
        <Avatar size="xl" src={user.avatarUrl} initials={initials} />
        <Text className="mt-3 text-lg font-semibold">{user.displayName || (user.isAnonymous ? 'Guest account' : 'Your account')}</Text>
        {user.email && <Text className="text-sm text-neutral-500">{user.email}</Text>}
      </View>

      {user.isAnonymous && (
        <Card className="mb-6">
          <CardTitle>Upgrade your account</CardTitle>
          <CardDescription>Add email and password to keep your data and sign in on other devices.</CardDescription>
          <CardContent>
            <Link href="/link-account" asChild>
              <Button testID="upgrade-button" className="mt-3" label="Link email and password" />
            </Link>
          </CardContent>
        </Card>
      )}

      <Input testID="name-input" label="Display name" value={displayName} onChangeText={setDisplayName} disabled={isSaving} />
      {error && <FormMessage kind="error">{error}</FormMessage>}
      {success && <FormMessage kind="success">{success}</FormMessage>}
      <Button
        testID="save-profile-button"
        label="Save profile"
        loading={isSaving}
        onPress={() => {
          setIsSaving(true);
          void runAction(async () => {
            await auth.updateProfile({ displayName: displayName.trim() });
            setSuccess('Profile updated.');
          }).finally(() => setIsSaving(false));
        }}
      />

      <View className="mt-8 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <Button
          testID="sign-out-button"
          variant="outline"
          label="Sign out"
          loading={isSigningOut}
          onPress={() => {
            setIsSigningOut(true);
            void runAction(() => auth.signOut()).finally(() => setIsSigningOut(false));
          }}
        />
        {confirmDelete
          ? (
              <View className="mt-4">
                <Text className="mb-2 text-sm text-danger-600">This permanently deletes your account and cannot be undone.</Text>
                <Button
                  testID="confirm-delete-button"
                  variant="destructive"
                  label="Confirm account deletion"
                  loading={isDeleting}
                  onPress={() => {
                    setIsDeleting(true);
                    void runAction(() => auth.deleteAccount()).finally(() => setIsDeleting(false));
                  }}
                />
                <Button label="Cancel" variant="ghost" onPress={() => setConfirmDelete(false)} />
              </View>
            )
          : <Button testID="delete-button" variant="ghost" label="Delete account" onPress={() => setConfirmDelete(true)} />}
      </View>
    </AuthScreen>
  );
}
