/**
 * Module-level cache for the initial deep-link URL.
 *
 * React Navigation's `linking` prop consumes `Linking.getInitialURL()` as soon
 * as the NavigationContainer mounts, making it unavailable to screens that
 * mount later. This module captures the URL early in App.tsx so screens like
 * ResetPasswordScreen can access it reliably.
 */

let cachedInitialUrl: string | null = null;

export function setInitialUrl(url: string | null) {
  cachedInitialUrl = url;
}

export function getInitialUrl(): string | null {
  return cachedInitialUrl;
}
