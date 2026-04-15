import { setGlobalOptions } from "firebase-functions";
import { onCall, HttpsError } from "firebase-functions/v2/https";
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
