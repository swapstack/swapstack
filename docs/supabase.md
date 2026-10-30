# Supabase setup

Swapstack includes Supabase adapters for authentication and profile storage. Screens do not change when you switch from mock providers.

## 1. Create a Supabase project

Create a project in Supabase and open the SQL editor.

## 2. Run the migration

Run the SQL in [`supabase/migrations/20261030000000_profiles.sql`](../supabase/migrations/20261030000000_profiles.sql). It creates:

- a `public.profiles` table linked to `auth.users`,
- row-level security policies so users can read and update only their own profile,
- a trigger that creates a profile for new users,
- `public.delete_current_user()` for the app's account-deletion flow.

## 3. Configure the app

Set these values in `.env`:

```sh
EXPO_PUBLIC_AUTH_PROVIDER=supabase
EXPO_PUBLIC_DATA_PROVIDER=supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

Use the project's **anon public** key. Never put a service-role key in the mobile app.

## 4. Test the switch

Restart Expo after changing `.env`:

```sh
pnpm start
```

The app should use the same login, sign-up, guest, profile, and delete-account screens through the Supabase adapter. Unknown provider names or missing Supabase variables fail during startup validation.

## Notes

- OAuth currently requires a native OAuth token and suitable redirect configuration. The adapter exposes the standard interface, but production OAuth needs provider-specific native setup.
- Email confirmation-dependent sign-up returns `null`, and the app routes to the verification-pending screen.
- Account deletion uses `delete_current_user()`, which must be installed by the migration.
