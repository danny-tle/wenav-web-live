import { setGlobalOptions } from "firebase-functions";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { createTransport } from "nodemailer";
import { randomInt } from "crypto";

initializeApp();
setGlobalOptions({ maxInstances: 10 });

const db = getFirestore();

export const sendVerificationCode = onCall(
  { secrets: ["GMAIL_USER", "GMAIL_APP_PASSWORD"] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in");
    }

    const uid = request.auth.uid;
    const user = await getAuth().getUser(uid);
    const email = user.email;
    if (!email) {
      throw new HttpsError("failed-precondition", "No email on account");
    }

    const code = randomInt(100000, 999999).toString();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

    await db.collection("verificationCodes").doc(email).set({
      code,
      uid,
      createdAt: now,
      expiresAt,
      attempts: 0,
    });

    const transporter = createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"WeNav" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Your WeNav verification code",
      html: `<div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
        <h2>Verify your email</h2>
        <p>Your verification code is:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; margin: 24px 0;">${code}</p>
        <p style="color: #666;">This code expires in 10 minutes.</p>
        <p style="color: #999; font-size: 12px;">If you didn't create a WeNav account, you can ignore this email.</p>
      </div>`,
    });

    return { success: true };
  }
);

export const verifyEmailCode = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in");
  }

  const { code } = request.data as { code: string };
  if (!code || code.length !== 6) {
    throw new HttpsError("invalid-argument", "Invalid code");
  }

  const uid = request.auth.uid;
  const user = await getAuth().getUser(uid);
  const email = user.email;
  if (!email) {
    throw new HttpsError("failed-precondition", "No email on account");
  }

  const docRef = db.collection("verificationCodes").doc(email);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new HttpsError("not-found", "No verification code found. Request a new one.");
  }

  const data = doc.data()!;

  if (data.attempts >= 5) {
    throw new HttpsError("resource-exhausted", "Too many attempts. Request a new code.");
  }

  if (new Date() > data.expiresAt.toDate()) {
    await docRef.delete();
    throw new HttpsError("deadline-exceeded", "Code expired. Request a new one.");
  }

  if (data.code !== code) {
    await docRef.update({ attempts: FieldValue.increment(1) });
    throw new HttpsError("permission-denied", "Incorrect code. Please try again.");
  }

  // Code is correct — mark email as verified
  await getAuth().updateUser(uid, { emailVerified: true });
  await docRef.delete();

  return { success: true };
});

/**
 * Keeps the unauthenticated map isolated from private incident reports.
 * Only fields needed by the map are copied; reporter identity, descriptions,
 * and administrator notes remain in the private `incidents` collection.
 */
export const syncPublicIncident = onDocumentWritten(
  "incidents/{incidentId}",
  async (event) => {
    const publicRef = db
      .collection("publicIncidents")
      .doc(event.params.incidentId);
    const incident = event.data?.after;
    const data = incident?.data();

    if (!incident?.exists || !data || data.status !== "approved") {
      await publicRef.delete();
      return;
    }

    await publicRef.set({
      type: data.type,
      location: data.location,
      address: data.address ?? "",
      reportedAt: data.reportedAt ?? FieldValue.serverTimestamp(),
      lastUpdated: data.lastUpdated ?? FieldValue.serverTimestamp(),
      publishedAt: FieldValue.serverTimestamp(),
    });
  },
);

// ─── Caregiver pairing ───────────────────────────────────────────────────────
//
// A caregiver relationship is a document, not an account role. The same person
// can wear a vest and also watch over someone else, so "caregiver" is a
// property of the link rather than of the user. See `links` in firestore.rules.
//
// Direction is deliberate: the user being cared for mints the code, and the
// caregiver redeems it. The person whose location is shared is the one issuing
// the invitation — that is the consent step described in the design document.

/** Minutes a pairing code stays valid after it is minted. */
const PAIRING_CODE_TTL_MINUTES = 10;

/**
 * Unambiguous alphabet — no O/0, I/1/L. Codes get read aloud over the phone by
 * users who cannot see the screen, so characters that sound or look alike are
 * excluded. 32^6 ≈ 1.07 billion combinations.
 */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

/** Redemption attempts allowed per caregiver per window, to blunt guessing. */
const MAX_REDEEM_ATTEMPTS = 10;
const REDEEM_WINDOW_MINUTES = 10;

function generateCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[randomInt(0, CODE_ALPHABET.length)];
  }
  return code;
}

/** Best-effort display name: profile first, then auth, then email local part. */
async function resolveDisplayName(uid: string): Promise<string> {
  const profile = await db.collection("users").doc(uid).get();
  const fromProfile = profile.data()?.displayName as string | undefined;
  if (fromProfile && fromProfile.trim().length > 0) return fromProfile;

  const user = await getAuth().getUser(uid);
  if (user.displayName && user.displayName.trim().length > 0) {
    return user.displayName;
  }
  return user.email?.split("@")[0] ?? "WeNav user";
}

/**
 * Mints a single-use pairing code for the signed-in user.
 *
 * Any code this user minted earlier is invalidated, so only the most recently
 * displayed code works. Codes live in a collection no client can read or write
 * (rules deny both); only this function and `redeemPairingCode` touch them.
 */
export const createPairingCode = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in");
  }
  const uid = request.auth.uid;

  // Only one live code per user: drop any earlier ones.
  const existing = await db
    .collection("pairingCodes")
    .where("userId", "==", uid)
    .get();
  await Promise.all(existing.docs.map((d) => d.ref.delete()));

  // Collisions are vanishingly unlikely but cheap to rule out.
  let code = generateCode();
  for (let i = 0; i < 5; i++) {
    const clash = await db.collection("pairingCodes").doc(code).get();
    if (!clash.exists) break;
    code = generateCode();
  }

  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + PAIRING_CODE_TTL_MINUTES * 60 * 1000
  );

  await db.collection("pairingCodes").doc(code).set({
    userId: uid,
    createdAt: now,
    expiresAt,
  });

  return { code, expiresAt: expiresAt.toISOString() };
});

/**
 * Redeems a pairing code, creating the caregiver link.
 *
 * Idempotent: redeeming when a link already exists returns the existing one
 * rather than erroring, so a double tap on a slow connection is harmless.
 */
export const redeemPairingCode = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in");
  }
  const caregiverId = request.auth.uid;

  const raw = (request.data as { code?: string }).code ?? "";
  const code = raw.trim().toUpperCase().replace(/[\s-]/g, "");
  if (code.length !== CODE_LENGTH) {
    throw new HttpsError("invalid-argument", "Enter the 6-character code.");
  }

  // Per-caller throttle. Guessing a code that does not exist leaves no counter
  // on the code document itself, so the limit has to live with the caller.
  const throttleRef = db.collection("pairingAttempts").doc(caregiverId);
  const now = new Date();
  const windowStart = new Date(
    now.getTime() - REDEEM_WINDOW_MINUTES * 60 * 1000
  );
  const throttle = await throttleRef.get();
  const throttleData = throttle.data();
  const windowOpenedAt = throttleData?.windowStartedAt?.toDate() as
    | Date
    | undefined;

  if (windowOpenedAt && windowOpenedAt > windowStart) {
    if ((throttleData?.attempts ?? 0) >= MAX_REDEEM_ATTEMPTS) {
      throw new HttpsError(
        "resource-exhausted",
        "Too many attempts. Try again in a few minutes."
      );
    }
    await throttleRef.update({ attempts: FieldValue.increment(1) });
  } else {
    await throttleRef.set({ windowStartedAt: now, attempts: 1 });
  }

  const codeRef = db.collection("pairingCodes").doc(code);
  const codeDoc = await codeRef.get();
  if (!codeDoc.exists) {
    throw new HttpsError("not-found", "That code isn't valid. Ask for a new one.");
  }

  const codeData = codeDoc.data()!;
  if (now > codeData.expiresAt.toDate()) {
    await codeRef.delete();
    throw new HttpsError("deadline-exceeded", "That code expired. Ask for a new one.");
  }

  const userId = codeData.userId as string;
  if (userId === caregiverId) {
    throw new HttpsError(
      "failed-precondition",
      "You can't pair with your own account."
    );
  }

  const linkId = `${userId}_${caregiverId}`;
  const linkRef = db.collection("links").doc(linkId);
  const existingLink = await linkRef.get();
  if (existingLink.exists) {
    await codeRef.delete();
    return {
      linkId,
      userId,
      userName: existingLink.data()?.userName ?? "WeNav user",
      alreadyLinked: true,
    };
  }

  const [userName, caregiverName] = await Promise.all([
    resolveDisplayName(userId),
    resolveDisplayName(caregiverId),
  ]);

  await linkRef.set({
    userId,
    caregiverId,
    userName,
    caregiverName,
    scopes: { liveLocation: true, incidents: true, history: false },
    createdAt: FieldValue.serverTimestamp(),
  });

  // Single use.
  await codeRef.delete();

  return { linkId, userId, userName, alreadyLinked: false };
});
