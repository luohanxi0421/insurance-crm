# Release Crash Checklist (Expo / EAS)

## Why Expo Go works but installed APK crashes

Most common cause in this project: missing `EXPO_PUBLIC_*` env during EAS cloud build.

`src/lib/supabase.ts` reads:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

If these are not injected in build env, release app can fail very early.

## 1) Set EAS environment variables

Run:

```bash
eas env:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://<your-project>.supabase.co"
eas env:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "<your-anon-key>"
```

Then verify:

```bash
eas env:list
```

## 2) Build preview APK again

```bash
eas build -p android --profile preview
```

## 3) If still crash, capture native logs immediately

```bash
adb logcat | findstr /i "FATAL EXCEPTION AndroidRuntime"
```

Start this first, then open app and reproduce crash.

## 4) Add Crash reporting

For managed Expo projects, recommend Sentry first (fastest path):

```bash
npx expo install sentry-expo @sentry/react-native
```

Initialize Sentry in app entry and run new EAS build.

For this project, also set:

```bash
eas env:create --scope project --name EXPO_PUBLIC_SENTRY_DSN --value "https://<key>@<org>.ingest.sentry.io/<project-id>"
```

If you must use Firebase Crashlytics:

1. Install `@react-native-firebase/app` and `@react-native-firebase/crashlytics`
2. Add `google-services.json` and `GoogleService-Info.plist`
3. Run `npx expo prebuild`
4. Build via EAS

Crashlytics requires native setup and is heavier than Sentry in managed workflow.
