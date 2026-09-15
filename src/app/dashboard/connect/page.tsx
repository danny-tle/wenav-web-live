"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/shared/Card";
import PairingCodeInput from "@/components/shared/PairingCodeInput";
import { redeemPairingCode } from "@/lib/firestore";
import { PAIRING_CODE_LENGTH, pairingMessageFor } from "@/lib/pairing";

/**
 * Where a caregiver redeems a pairing code read out by the person they look
 * after.
 *
 * The code is minted in the mobile app by the person being cared for — the
 * one whose location gets shared issues the invitation, which is the consent
 * step. Redemption goes through a Cloud Function; no client can write a link
 * document directly.
 */
export default function ConnectPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [linkedName, setLinkedName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = code.length === PAIRING_CODE_LENGTH && !submitting;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    await submit(code);
  }

  async function submit(value: string) {
    if (value.length !== PAIRING_CODE_LENGTH || submitting) return;

    setSubmitting(true);
    setError("");
    try {
      const name = await redeemPairingCode(value);
      setLinkedName(name);
      setCode("");
    } catch (err) {
      setError(pairingMessageFor(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-wenav-dark">Connect</h1>
        <p className="text-sm text-gray-500 mt-1">
          Enter the pairing code from the person you look after. They can
          generate one in the WeNav app under Caregiver.
        </p>
      </div>

      <Card>
        {linkedName ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              You&apos;re now connected to{" "}
              <span className="font-semibold text-wenav-dark">
                {linkedName}
              </span>
              . Their location appears on your dashboard while they&apos;re
              walking, for as long as they keep sharing it.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => router.push("/dashboard")}
                className="px-4 py-2 bg-wenav-dark text-white text-sm rounded-wenav"
              >
                Go to dashboard
              </button>
              <button
                onClick={() => setLinkedName("")}
                className="px-4 py-2 text-sm text-gray-600 rounded-wenav"
              >
                Connect someone else
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <PairingCodeInput
                value={code}
                onChange={(next) => {
                  setCode(next);
                  setError("");
                }}
                onComplete={(next) => submit(next)}
                length={PAIRING_CODE_LENGTH}
                disabled={submitting}
                autoFocus
                aria-describedby={error ? "pairing-error" : undefined}
              />
              <p className="text-xs text-gray-400 mt-3 text-center">
                {PAIRING_CODE_LENGTH} characters. Codes expire ten minutes
                after they&apos;re generated.
              </p>
            </div>

            {error && (
              <p id="pairing-error" role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="px-4 py-2 bg-wenav-dark text-white text-sm rounded-wenav disabled:opacity-40"
            >
              {submitting ? "Connecting…" : "Connect"}
            </button>
          </form>
        )}
      </Card>
    </div>
  );
}
