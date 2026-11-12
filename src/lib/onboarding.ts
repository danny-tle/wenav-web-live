/**
 * Whether someone has finished (or skipped) the first-run tour.
 *
 * Kept in localStorage, per account, rather than on the Firestore profile:
 * the profile's update rule only allows `displayName` and `status`, and a
 * tour flag isn't worth a rules change and deploy. The cost is that someone
 * signing in on a new browser sees the tour again — and can skip it in one
 * click.
 *
 * Bump the version to show an updated tour to everyone again.
 */
const KEY_PREFIX = "wenav:onboarding:v1:";

function keyFor(uid: string): string {
  return `${KEY_PREFIX}${uid}`;
}

/** How long after sign-up an account still counts as new. */
export const NEW_ACCOUNT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * True for accounts created in the last week. The tour only opens by itself
 * for these — people who were using WeNav before the tour existed don't need
 * it sprung on them, and can still start it from Settings.
 */
export function isNewAccount(creationTime: string | undefined, now: number = Date.now()): boolean {
  if (!creationTime) return false;
  const created = Date.parse(creationTime);
  return Number.isFinite(created) && now - created < NEW_ACCOUNT_WINDOW_MS;
}

export function hasCompletedOnboarding(uid: string): boolean {
  try {
    return window.localStorage.getItem(keyFor(uid)) !== null;
  } catch {
    // Storage blocked (private mode, strict settings). Don't nag on every
    // page load when we can't remember the answer.
    return true;
  }
}

export function markOnboardingComplete(uid: string): void {
  try {
    window.localStorage.setItem(keyFor(uid), new Date().toISOString());
  } catch {
    // Nothing to do — see hasCompletedOnboarding.
  }
}
