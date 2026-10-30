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
  const [editedName, setEditedName] = React.useState<string>();
  const [error, setError] = React.useState<string>();
  const [success, setSuccess] = React.useState<string>();
  const [isSaving, setIsSaving] = React.useState(false);
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [confirmGuestSignOut, setConfirmGuestSignOut] = React.useState(false);
  const isBusy = isSaving || isSigningOut || isDeleting;

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

  const signOut = React.useCallback(() => {
    if (isBusy) {
      return;
    }
    setIsSigningOut(true);
    void runAction(() => auth.signOut()).finally(() => setIsSigningOut(false));
  }, [auth, isBusy, runAction]);

  if (!user) {
    return null;
  }

  const displayName = editedName ?? user.displayName ?? '';
  const initials = (user.displayName?.trim() || user.email || 'Guest').slice(0, 1).toUpperCase();

  return (
    <AuthScreen title="Your profile" description="Manage your account details and session.">
      <View className="mb-6 items-center">
        <Avatar size="xl" src={user.avatarUrl} initials={initials} />
        <Text className="mt-3 font-semibold text-lg">{user.displayName || (user.isAnonymous ? 'Guest account' : 'Your account')}</Text>
        {user.email && <Text className="text-sm text-neutral-500">{user.email}</Text>}
      </View>

      {user.isAnonymous && (
        <Card className="mb-6">
          <CardTitle>Upgrade your account</CardTitle>
          <CardDescription>Add email and password to keep your data and sign in on other devices.</CardDescription>
          <CardContent>
            <Link href="/link-account" asChild>
              <Button testID="upgrade-button" className="mt-3" label="Link email and password" disabled={isBusy} />
            </Link>
          </CardContent>
        </Card>
      )}

      <Input testID="name-input" label="Display name" value={displayName} onChangeText={setEditedName} disabled={isBusy} />
      {error && <FormMessage kind="error">{error}</FormMessage>}
      {success && <FormMessage kind="success">{success}</FormMessage>}
      <Button
        testID="save-profile-button"
        label="Save profile"
        loading={isSaving}
        disabled={isSigningOut || isDeleting}
        onPress={() => {
          if (isBusy) {
            return;
          }
          setIsSaving(true);
          void runAction(async () => {
            await auth.updateProfile({ displayName: displayName.trim() });
            setEditedName(undefined);
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
          disabled={isSaving || isDeleting}
          onPress={() => {
            if (user.isAnonymous) {
              setConfirmGuestSignOut(true);
            }
            else {
              signOut();
            }
          }}
        />
        {confirmGuestSignOut && (
          <View className="mt-4">
            <Text className="mb-3 text-sm text-danger-600 dark:text-danger-300">Signing out now will permanently lose this guest account and its data. Create an account first to keep it.</Text>
            <Link href="/link-account" asChild>
              <Button label="Create account" disabled={isBusy} />
            </Link>
            <Button
              testID="confirm-guest-sign-out-button"
              variant="destructive"
              label="Sign out and lose guest data"
              loading={isSigningOut}
              disabled={isSaving || isDeleting}
              onPress={signOut}
            />
            <Button label="Cancel" variant="ghost" disabled={isBusy} onPress={() => setConfirmGuestSignOut(false)} />
          </View>
        )}
        {confirmDelete
          ? (
              <View className="mt-4">
                <Text className="mb-2 text-sm text-danger-600 dark:text-danger-300">This permanently deletes your account and cannot be undone.</Text>
                <Button
                  testID="confirm-delete-button"
                  variant="destructive"
                  label="Confirm account deletion"
                  loading={isDeleting}
                  disabled={isSaving || isSigningOut}
                  onPress={() => {
                    if (isBusy) {
                      return;
                    }
                    setIsDeleting(true);
                    void runAction(() => auth.deleteAccount()).finally(() => setIsDeleting(false));
                  }}
                />
                <Button label="Cancel" variant="ghost" disabled={isBusy} onPress={() => setConfirmDelete(false)} />
              </View>
            )
          : <Button testID="delete-button" variant="ghost" label="Delete account" disabled={isBusy} onPress={() => setConfirmDelete(true)} />}
      </View>
    </AuthScreen>
  );
}
