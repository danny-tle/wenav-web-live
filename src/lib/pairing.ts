import { FirebaseError } from "firebase/app";

/**
 * Length of a pairing code. Must match CODE_LENGTH in
 * `functions/src/index.ts` and the box count in the mobile app's
 * `pairing_code_screen.dart`.
 */
export const PAIRING_CODE_LENGTH = 6;

/** Turns a callable's error code into something worth showing a caregiver. */
export function pairingMessageFor(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "functions/not-found":
        return "That code isn't valid. Ask for a new one.";
      case "functions/deadline-exceeded":
        return "That code expired. Ask them to generate a new one.";
      case "functions/resource-exhausted":
        return "Too many attempts. Try again in a few minutes.";
      case "functions/failed-precondition":
        return "You can't pair with your own account.";
      case "functions/unauthenticated":
        return "Please sign in again to pair.";
      case "functions/invalid-argument":
        return `Enter the ${PAIRING_CODE_LENGTH}-character code.`;
    }
  }
  return "Pairing failed. Check your connection and try again.";
}
