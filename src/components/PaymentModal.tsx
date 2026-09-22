"use client";

import { useEffect, useRef, useState } from "react";
import {
  X,

  Bitcoin,
  CheckCircle2,
  Copy,

} from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId?: string;
  planName?: string;
  pricePerGb?: number;
  initialGb?: number;
  onSuccess?: () => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  planId = "residential_dynamic",
  planName = "Residential Dynamic",
  pricePerGb = 3.5,
  initialGb = 10,
  onSuccess,
}: PaymentModalProps) {
  const [method] = useState<"crypto">("crypto");
  const [currency, setCurrency] = useState<"USDT" | "BTC" | "LTC">("USDT");
  const [gbAmount, setGbAmount] = useState(initialGb);
  const [usdPreset, setUsdPreset] = useState<
    "10" | "25" | "50" | "100" | "custom"
  >("10");
  const [customUsdAmount, setCustomUsdAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [invoice, setInvoice] = useState<{
    paymentIntentId: string;
    currency: string;
    address: string;
    network: string;
    minConfirmations: number;
    usdAmount: number;
    cryptoAmount: string;
    priceUsd: number;
    quoteExpiresAt: string;
  } | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "awaiting" | "detected" | "confirming" | "underpaid" | "completed" | "error"
  >("idle");
  const [paymentMessage, setPaymentMessage] = useState("");
  const paymentSuccessNotified = useRef(false);
  const [copied, setCopied] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
const totalCost = (gbAmount * pricePerGb).toFixed(2);

  const requestedUsdAmount =
    usdPreset === "custom"
      ? Number(customUsdAmount)
      : Number(usdPreset);

  const handleCreateCryptoDeposit = async () => {
    if (
      !Number.isFinite(requestedUsdAmount) ||
      requestedUsdAmount < 1 ||
      requestedUsdAmount > 10000
    ) {
      alert(
        "Enter a valid USD top-up amount between $1.00 and $10,000.00."
      );
      return;
    }
    setLoading(true);
    setPaymentStatus("idle");
    setPaymentMessage("");
    

    try {
      const res = await fetch("/api/payments/crypto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action: "create_deposit",
            currency,
            usdAmount: requestedUsdAmount,
          }),
      });

      const data = await res.json();

      if (data.success && data.deposit) {
        setInvoice({
        paymentIntentId: String(data.deposit.paymentIntentId || ""),
        currency: data.deposit.currency || currency,
        address: data.deposit.address || data.deposit.depositAddress,
        network: data.deposit.network,
        minConfirmations: Number(
          data.deposit.minConfirmations ||
            data.deposit.min_confirmations ||
            0
        ),
        usdAmount: Number(
          data.deposit.usdAmount || requestedUsdAmount
        ),
        cryptoAmount: String(
          data.deposit.cryptoAmount || "0"
        ),
        priceUsd: Number(data.deposit.priceUsd || 0),
        quoteExpiresAt: String(
          data.deposit.quoteExpiresAt || ""
        ),
      });
      } else {
        alert(data.error || "Failed to create crypto deposit address");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating crypto deposit");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (!isOpen || !invoice?.paymentIntentId) {
      return;
    }

    let stopped = false;

    const checkPaymentStatus = async () => {
      try {
        const response = await fetch(
          `/api/payments/crypto/status?paymentIntentId=${encodeURIComponent(
            invoice.paymentIntentId
          )}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (stopped) {
          return;
        }

        if (!response.ok || !data.success) {
          setPaymentStatus("error");
          setPaymentMessage(
            data?.error || "Unable to check payment status right now."
          );
          return;
        }

        const status = String(data.payment?.status || "pending");
        const confirmations = Number(data.payment?.confirmations || 0);
        const requiredConfirmations = Number(
          data.payment?.requiredConfirmations ||
            invoice.minConfirmations ||
            0
        );

        if (status === "completed") {
          setPaymentStatus("completed");
          setPaymentMessage(
            "Payment confirmed. Your Navasocks balance has been credited."
          );
          setPaymentSuccess(true);
          setSuccessMessage(
            "Payment confirmed. Your Navasocks balance has been credited."
          );

          if (!paymentSuccessNotified.current) {
            paymentSuccessNotified.current = true;
            onSuccess?.();
          }

          return;
        }

        if (status === "underpaid") {
          setPaymentStatus("underpaid");
          setPaymentMessage(
            "Payment detected, but the amount received is below the quoted amount. Additional payment can be sent to the same deposit address."
          );
          return;
        }

        if (status === "confirming") {
          setPaymentStatus("confirming");
          setPaymentMessage(
            `Payment detected. Confirmations: ${confirmations}/${requiredConfirmations}.`
          );
          return;
        }

        if (status === "detected") {
          setPaymentStatus("detected");
          setPaymentMessage(
            "Payment detected on the blockchain. Waiting for confirmations."
          );
          return;
        }

        setPaymentStatus("awaiting");
        setPaymentMessage(
          `Awaiting payment. Send ${invoice.cryptoAmount} ${invoice.currency} to the deposit address above.`
        );
      } catch (error) {
        if (!stopped) {
          console.error(error);
          setPaymentStatus("error");
          setPaymentMessage(
            "Unable to check payment status right now. The system will retry automatically."
          );
        }
      }
    };

    void checkPaymentStatus();

    const timer = window.setInterval(() => {
      void checkPaymentStatus();
    }, 4000);

    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [
    isOpen,
    invoice?.paymentIntentId,
    invoice?.cryptoAmount,
    invoice?.currency,
    invoice?.minConfirmations,
    onSuccess,
  ]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#0e1424] border border-cyan-800/60 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-white max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {paymentSuccess ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">Payment Confirmed!</h3>
            <p className="text-slate-300 text-sm max-w-sm mx-auto">{successMessage}</p>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-400">
              Proxy bandwidth is immediately available in your generator and credentials list.
            </div>
            <button
              onClick={() => {
                setPaymentSuccess(false);
                setInvoice(null);
setPaymentStatus("idle");
setPaymentMessage("");
paymentSuccessNotified.current = false;
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition font-mono"
            >
              Continue to Proxy Generator
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                Checkout & Top-Up
              </span>
              <h2 className="text-xl font-bold text-white mt-0.5">{planName}</h2>
              <p className="text-xs text-slate-400">
${pricePerGb.toFixed(2)} / GB &middot; Instant Activation &middot; Zero Expiration
              </p>
            </div>

            {/* USD TOP-UP AMOUNT */}
            <div className="mb-5 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-slate-300">
                  Top-Up Amount:
                </span>
                <span className="text-lg font-mono font-extrabold text-cyan-300">
                  {usdPreset === "custom" && customUsdAmount
                    ? `$${Number(customUsdAmount || 0).toFixed(2)}`
                    : `$${requestedUsdAmount.toFixed(2)}`}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(["10", "25", "50", "100"] as const).map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => {
                      setUsdPreset(amount);
                      setInvoice(null);
setPaymentStatus("idle");
setPaymentMessage("");
paymentSuccessNotified.current = false;
                      
                      setPaymentStatus("idle");
                      setPaymentMessage("");
                    }}
                    className={`rounded-lg border px-2 py-2 text-sm font-semibold transition ${
                      usdPreset === amount
                        ? "border-cyan-400 bg-cyan-400/10 text-cyan-300"
                        : "border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.06]"
                    }`}
                  >
                    ${amount}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setUsdPreset("custom");
                  setInvoice(null);
setPaymentStatus("idle");
setPaymentMessage("");
paymentSuccessNotified.current = false;
                  
                  setPaymentStatus("idle");
                  setPaymentMessage("");
                }}
                className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                  usdPreset === "custom"
                    ? "border-cyan-400 bg-cyan-400/10 text-cyan-300"
                    : "border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.06]"
                }`}
              >
                Custom Amount
              </button>

              {usdPreset === "custom" && (
                <div className="mt-3">
                  <label className="text-[11px] font-medium uppercase tracking-wide text-white/50">
                    USD Amount
                  </label>

                  <input
                    value={customUsdAmount}
                    onChange={(e) => {
                      setCustomUsdAmount(
                        e.target.value.replace(/[^0-9.]/g, "")
                      );
                      setInvoice(null);
setPaymentStatus("idle");
setPaymentMessage("");
paymentSuccessNotified.current = false;
                    }}
                    inputMode="decimal"
                    placeholder="25.00"
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30"
                  />
                </div>
              )}

              <div className="mt-3 pt-2.5 border-t border-slate-800 text-xs text-slate-400">
                Choose the USD amount you want credited to your Navasocks balance.
              </div>
            </div>

            {/* CRYPTO TAB */}
            {method === "crypto" && (
              <div className="space-y-4">
                {!invoice ? (
                  <>
                    <div>
                      <label className="text-xs font-medium text-slate-300 block">
                        Select Crypto Asset
                      </label>

                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {(["USDT", "BTC", "LTC"] as const).map((asset) => (
                          <button
                            key={asset}
                            type="button"
                            onClick={() => {
                              setCurrency(asset);
                              setInvoice(null);
setPaymentStatus("idle");
setPaymentMessage("");
paymentSuccessNotified.current = false;
                              
                              setPaymentStatus("idle");
                              setPaymentMessage("");
                            }}
                            className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                              currency === asset
                                ? "border-cyan-400 bg-cyan-400/10 text-cyan-300"
                                : "border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.06]"
                            }`}
                          >
                            {asset}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-sm font-semibold text-white">
                        Direct blockchain payment
                      </div>
                      <p className="mt-1 text-xs leading-5 text-white/60">
                        Send the payment to the Navasocks deposit address shown
                        below. After the transaction is broadcast, the payment is broadcast, the system will automatically detect and verify it.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleCreateCryptoDeposit}
                      disabled={loading}
                      className="w-full rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-black transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading
                        ? "Loading..."
                        : `Get ${currency} Deposit Address`}
                    </button>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4">
                      <div>
                        <div className="text-sm font-semibold text-white">
                          Send {invoice.cryptoAmount} {invoice.currency}
                        </div>
                        <div className="mt-1 text-xs text-white/50">
to your {invoice.currency} top-up address &middot; {invoice.network}
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                          <div className="text-[10px] uppercase tracking-wide text-white/40">
                            Balance Credit
                          </div>
                          <div className="mt-1 text-sm font-semibold text-cyan-300">
                            ${invoice.usdAmount.toFixed(2)} USD
                          </div>
                        </div>

                        <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                          <div className="text-[10px] uppercase tracking-wide text-white/40">
                            Quote Expires
                          </div>
                          <div className="mt-1 text-sm font-semibold text-white/80">
                            {invoice.quoteExpiresAt
                              ? new Date(
                                  invoice.quoteExpiresAt
                                ).toLocaleTimeString([], {
                                  hour: "numeric",
                                  minute: "2-digit",
                                })
                              : "15 minutes"}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="text-xs font-medium uppercase tracking-wide text-white/50">
                          Deposit Address
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                          <div className="min-w-0 flex-1 break-all rounded-lg border border-white/10 bg-black/20 px-3 py-2 font-mono text-xs text-white/80">
                            {invoice.address}
                          </div>

                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(
                                  invoice.address
                                );
                                setCopied(true);
                                setTimeout(() => setCopied(false), 1500);
                              } catch {
                                setCopied(false);
                              }
                            }}
                            className="shrink-0 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70 hover:bg-white/[0.06]"
                          >
                            {copied ? "Copied" : "Copy"}
                          </button>
                        </div>

                        <div className="mt-3 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-xs leading-5 text-amber-200/80">
                          Send only {invoice.currency} on the {invoice.network} network to this address. Sending another asset or
                          using another network may permanently lose the funds.
                        </div>

                        <div className="mt-3 text-xs text-white/50">
                          Required confirmations:{" "}
                          <span className="font-semibold text-white/80">
                            {invoice.minConfirmations}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-xs font-medium uppercase tracking-wide text-white/50">
                        Automatic Payment Status
                      </div>

                      <div className="mt-2 rounded-lg border border-white/10 bg-black/20 px-3 py-3 text-sm leading-5">
                        <div className="font-semibold text-white">
                          {paymentStatus === "completed"
                            ? "Payment Credited"
                            : paymentStatus === "confirming"
                              ? "Confirming Payment"
                              : paymentStatus === "detected"
                                ? "Payment Detected"
                                : paymentStatus === "underpaid"
                                  ? "Additional Payment Needed"
                                  : paymentStatus === "error"
                                    ? "Status Check Problem"
                                    : "Awaiting Payment"}
                        </div>

                        <div className="mt-1 text-xs text-white/60">
                          {paymentMessage ||
                            `Send ${invoice.cryptoAmount} ${invoice.currency}. Payment detection is automatic.`}
                        </div>
                      </div>
                    </div>
                  {paymentSuccess && (
                      <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4">
                        <div className="text-sm font-semibold text-emerald-200">
                          Payment Confirmed
                        </div>
                        <div className="mt-1 text-xs leading-5 text-emerald-200/70">
                          {successMessage}
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setInvoice(null);
setPaymentStatus("idle");
setPaymentMessage("");
paymentSuccessNotified.current = false;
                        
                        setPaymentStatus("idle");
                        setPaymentMessage("");
                        setCopied(false);
                        setPaymentSuccess(false);
                        setSuccessMessage("");
                      }}
                      className="w-full text-center text-xs text-white/50 hover:text-white/80"
                    >
                           &larr; Change Amount / Currency
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}


