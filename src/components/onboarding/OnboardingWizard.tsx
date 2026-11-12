"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Check, Link2, PartyPopper, Sparkles, X } from "lucide-react";
import PairingCodeInput from "@/components/shared/PairingCodeInput";
import { redeemPairingCode, subscribeToMyLinks } from "@/lib/firestore";
import { PAIRING_CODE_LENGTH, pairingMessageFor } from "@/lib/pairing";

interface OnboardingWizardProps {
  /** "intro" opens the tour; "outro" closes it after the walkthrough. */
  stage: "intro" | "outro";
  /** The signed-in caregiver. */
  uid: string;
  displayName: string;
  /** Intro only: move on to the guided walkthrough. */
  onStart?: () => void;
  /** Ends the tour, whether finished or skipped. */
  onClose: () => void;
}

/**
 * The bookends of the first-run tour, as a centered dialog.
 *
 * Intro: a welcome, then hand over to the guided walkthrough of the pages.
 * Outro: if they aren't connected to anyone yet, a chance to do it for real
 * with the pairing code, then a send-off.
 */
export default function OnboardingWizard({ stage, uid, displayName, onStart, onClose }: OnboardingWizardProps) {
  const [page, setPage] = useState<"welcome" | "connect" | "done">(stage === "intro" ? "welcome" : "connect");

  const titleId = useId();
  const bodyId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);

  // Pairing, for the outro's connect page.
  const [linkCount, setLinkCount] = useState<number | null>(null);
  const [code, setCode] = useState("");
  const [pairingError, setPairingError] = useState("");
  const [pairing, setPairing] = useState(false);
  const [justPairedWith, setJustPairedWith] = useState("");

  useEffect(() => {
    if (stage !== "outro" || !uid) return;
    return subscribeToMyLinks(uid, (links) => setLinkCount(links.length));
  }, [stage, uid]);

  // Already connected to someone? Nothing to ask; go straight to the send-off.
  useEffect(() => {
    if (page === "connect" && !justPairedWith && linkCount !== null && linkCount > 0) setPage("done");
  }, [page, linkCount, justPairedWith]);

  async function pair(value: string) {
    if (value.length !== PAIRING_CODE_LENGTH || pairing) return;
    setPairing(true);
    setPairingError("");
    try {
      const name = await redeemPairingCode(value);
      setJustPairedWith(name);
      setCode("");
    } catch (err) {
      setPairingError(pairingMessageFor(err));
    } finally {
      setPairing(false);
    }
  }

  // Land keyboard and screen reader users on the new content. The connect
  // page's code field takes focus itself.
  useEffect(() => {
    if (page !== "connect" || justPairedWith) primaryRef.current?.focus();
  }, [page, justPairedWith]);

  // Escape ends the tour; Tab stays inside the dialog.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const firstName = displayName.trim().split(/\s+/)[0] || "there";

  let Icon = Sparkles;
  let title: string;
  let body: ReactNode;
  let primaryLabel: string;
  let onPrimary: () => void;

  if (page === "welcome") {
    title = `Welcome to WeNav, ${firstName}`;
    body = (
      <p>
        This dashboard is where you keep an eye on the people you look after
        while they&apos;re out walking. Let us show you around. It takes about a
        minute.
      </p>
    );
    primaryLabel = "Show me around";
    onPrimary = () => onStart?.();
  } else if (page === "connect") {
    Icon = Link2;
    title = justPairedWith ? "You're connected" : "One last thing: connect someone";
    body = justPairedWith ? (
      <p className="flex items-start gap-2 rounded-wenav bg-green-50 px-3 py-2.5 text-green-800">
        <Check size={16} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
        <span>
          You&apos;re connected to <strong>{justPairedWith}</strong>. Their
          location will show on your map while they&apos;re walking.
        </span>
      </p>
    ) : (
      <>
        <p>
          If the person you look after is with you, ask them to open the WeNav
          app and generate a pairing code under <strong>Caregiver</strong>, then
          enter it here.
        </p>
        <div className="mt-5">
          <PairingCodeInput
            value={code}
            onChange={(value) => {
              setCode(value);
              setPairingError("");
            }}
            onComplete={pair}
            length={PAIRING_CODE_LENGTH}
            disabled={pairing}
            autoFocus
            aria-describedby={pairingError ? `${bodyId}-error` : undefined}
          />
          {pairingError ? (
            <p id={`${bodyId}-error`} role="alert" className="mt-3 text-center text-sm text-red-600">
              {pairingError}
            </p>
          ) : (
            <p className="mt-3 text-center text-xs text-gray-400">
              {pairing
                ? "Connecting…"
                : `${PAIRING_CODE_LENGTH} characters. Codes expire ten minutes after they're generated.`}
            </p>
          )}
        </div>
      </>
    );
    primaryLabel = justPairedWith ? "Next" : "I'll do this later";
    onPrimary = () => setPage("done");
  } else {
    Icon = PartyPopper;
    title = "You're all set";
    body = (
      <p>
        You can take this tour again any time from <strong>Settings</strong>.
      </p>
    );
    primaryLabel = "Go to my dashboard";
    onPrimary = onClose;
  }

  return (
    <div className="fixed inset-0 z-[3000] flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="relative flex h-28 items-center justify-center bg-gradient-to-br from-wenav-purple to-[#8B5CF6]">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/30">
            <Icon size={28} aria-hidden="true" />
          </div>
          {page !== "done" && (
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-white/85 transition-colors hover:bg-white/15 hover:text-white"
            >
              Skip tour
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="px-6 pb-6 pt-5 sm:px-8">
          <h2 id={titleId} className="text-xl font-bold text-wenav-dark">
            {title}
          </h2>
          <div id={bodyId} className="mt-3 text-sm leading-relaxed text-gray-600">
            {body}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              ref={primaryRef}
              type="button"
              onClick={onPrimary}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-wenav bg-wenav-dark px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-wenav-dark/85"
            >
              {primaryLabel}
              {page !== "done" && <ArrowRight size={16} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
