import { NextResponse } from "next/server";
import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";
import { cryptoDeposits, transactions, users } from "@/db/schema";
import { createCryptoPaymentIntent } from "@/lib/crypto/payment-intents";
import { and, eq, ne, sql } from "drizzle-orm";

type SupportedCurrency = "BTC" | "LTC" | "USDT";

type VerificationResult = {
  exists: boolean;
  confirmed: boolean;
  confirmations: number;
  cryptoAmount: string;
  depositAddress: string;
  network: string;
  reason?: string;
};

const BTC_ADDRESS = process.env.CRYPTO_BTC_ADDRESS || "";
const LTC_ADDRESS = process.env.CRYPTO_LTC_ADDRESS || "";
const USDT_ADDRESS = process.env.CRYPTO_USDT_TRC20_ADDRESS || "";

const TRON_BASE_URL =
  process.env.TRONGRID_BASE_URL || "https://api.trongrid.io";

const TRON_API_KEY = process.env.TRONGRID_API_KEY || "";

const USDT_TRC20_CONTRACT =
  process.env.CRYPTO_USDT_TRC20_CONTRACT ||
  "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

const BTC_MIN_CONFIRMATIONS = Number(
  process.env.CRYPTO_BTC_MIN_CONFIRMATIONS || "2"
);

const LTC_MIN_CONFIRMATIONS = Number(
  process.env.CRYPTO_LTC_MIN_CONFIRMATIONS || "6"
);

const TRON_MIN_CONFIRMATIONS = Number(
  process.env.CRYPTO_TRON_MIN_CONFIRMATIONS || "20"
);

function getAddress(currency: SupportedCurrency) {
  if (currency === "BTC") return BTC_ADDRESS;
  if (currency === "LTC") return LTC_ADDRESS;
  return USDT_ADDRESS;
}

function getNetwork(currency: SupportedCurrency) {
  if (currency === "BTC") return "Bitcoin";
  if (currency === "LTC") return "Litecoin";
  return "TRON-TRC20";
}

function getMinimumConfirmations(currency: SupportedCurrency) {
  if (currency === "BTC") return BTC_MIN_CONFIRMATIONS;
  if (currency === "LTC") return LTC_MIN_CONFIRMATIONS;
  return TRON_MIN_CONFIRMATIONS;
}

function isSupportedCurrency(value: unknown): value is SupportedCurrency {
  return value === "BTC" || value === "LTC" || value === "USDT";
}

function cleanTxid(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

type CryptoQuotePayload = {
  userId: number;
  currency: SupportedCurrency;
  network: string;
  address: string;
  usdAmount: number;
  cryptoAmount: string;
  priceUsd: number;
  exp: number;
};

const CRYPTO_QUOTE_SECRET = process.env.PROXY_ACCESS_SECRET || "";
const CRYPTO_QUOTE_TTL_MS = 15 * 60 * 1000;

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signCryptoQuote(payload: CryptoQuotePayload) {
  if (!CRYPTO_QUOTE_SECRET) {
    throw new Error("CRYPTO_QUOTE_NOT_CONFIGURED");
  }

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  const signature = createHmac("sha256", CRYPTO_QUOTE_SECRET)
    .update(encodedPayload)
    .digest("base64url");

  return encodedPayload + "." + signature;
}

function verifyCryptoQuote(
  token: unknown,
  sessionUserId: number,
  currency: SupportedCurrency
): CryptoQuotePayload {
  if (!CRYPTO_QUOTE_SECRET) {
    throw new Error("CRYPTO_QUOTE_NOT_CONFIGURED");
  }

  if (typeof token !== "string" || !token.trim()) {
    throw new Error("CRYPTO_QUOTE_REQUIRED");
  }

  const parts = token.split(".");

  if (parts.length !== 2) {
    throw new Error("CRYPTO_QUOTE_INVALID");
  }

  const encodedPayload = parts[0];
  const providedSignature = parts[1];

  const expectedSignature = createHmac("sha256", CRYPTO_QUOTE_SECRET)
    .update(encodedPayload)
    .digest("base64url");

  const providedBuffer = Buffer.from(providedSignature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    throw new Error("CRYPTO_QUOTE_INVALID");
  }

  let payload: CryptoQuotePayload;

  try {
    payload = JSON.parse(base64UrlDecode(encodedPayload));
  } catch {
    throw new Error("CRYPTO_QUOTE_INVALID");
  }

  if (payload.userId !== sessionUserId) {
    throw new Error("CRYPTO_QUOTE_USER_MISMATCH");
  }

  if (payload.currency !== currency) {
    throw new Error("CRYPTO_QUOTE_CURRENCY_MISMATCH");
  }

  if (payload.network !== getNetwork(currency)) {
    throw new Error("CRYPTO_QUOTE_NETWORK_MISMATCH");
  }

  if (
    typeof payload.address !== "string" ||
    payload.address.toLowerCase() !== getAddress(currency).toLowerCase()
  ) {
    throw new Error("CRYPTO_QUOTE_ADDRESS_MISMATCH");
  }

  if (!Number.isFinite(payload.usdAmount) || payload.usdAmount <= 0) {
    throw new Error("CRYPTO_QUOTE_INVALID_AMOUNT");
  }

  if (
    typeof payload.cryptoAmount !== "string" ||
    !Number.isFinite(Number(payload.cryptoAmount)) ||
    Number(payload.cryptoAmount) <= 0
  ) {
    throw new Error("CRYPTO_QUOTE_INVALID_AMOUNT");
  }

  if (!Number.isFinite(payload.priceUsd) || payload.priceUsd <= 0) {
    throw new Error("CRYPTO_QUOTE_INVALID_PRICE");
  }

  if (!Number.isFinite(payload.exp) || payload.exp <= Date.now()) {
    throw new Error("CRYPTO_QUOTE_EXPIRED");
  }

  return payload;
}

async function fetchJson(
  url: string,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; data: any }> {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
  });

  let data: any = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

async function getCryptoPrices() {
  const response = await fetchJson(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,litecoin&vs_currencies=usd"
  );

  if (!response.ok) {
    throw new Error("Unable to retrieve current crypto prices");
  }

  const btcPrice = Number(response.data?.bitcoin?.usd);
  const ltcPrice = Number(response.data?.litecoin?.usd);

  if (!Number.isFinite(btcPrice) || btcPrice <= 0) {
    throw new Error("Invalid BTC price returned by price provider");
  }

  if (!Number.isFinite(ltcPrice) || ltcPrice <= 0) {
    throw new Error("Invalid LTC price returned by price provider");
  }

  return {
    BTC: btcPrice,
    LTC: ltcPrice,
    USDT: 1,
  };
}

async function verifyBitcoin(txid: string): Promise<VerificationResult> {
  const txResponse = await fetchJson(
    `https://blockstream.info/api/tx/${encodeURIComponent(txid)}`
  );

  if (!txResponse.ok || !txResponse.data) {
    return {
      exists: false,
      confirmed: false,
      confirmations: 0,
      cryptoAmount: "0",
      depositAddress: BTC_ADDRESS,
      network: "Bitcoin",
      reason: "Bitcoin transaction was not found",
    };
  }

  const tx = txResponse.data;

  const statusResponse = await fetchJson(
    `https://blockstream.info/api/tx/${encodeURIComponent(txid)}/status`
  );

  if (!statusResponse.ok) {
    throw new Error("Unable to retrieve Bitcoin confirmation status");
  }

  const status = statusResponse.data;
  const matchingOutputs = Array.isArray(tx.vout)
    ? tx.vout.filter(
        (output: any) =>
          output?.scriptpubkey_address?.toLowerCase() ===
          BTC_ADDRESS.toLowerCase()
      )
    : [];

  const sats = matchingOutputs.reduce(
    (sum: number, output: any) => sum + Number(output?.value || 0),
    0
  );

  if (sats <= 0) {
    return {
      exists: true,
      confirmed: Boolean(status?.confirmed),
      confirmations: 0,
      cryptoAmount: "0",
      depositAddress: BTC_ADDRESS,
      network: "Bitcoin",
      reason: "Transaction does not pay the configured BTC deposit address",
    };
  }

  let confirmations = 0;

  if (status?.confirmed && Number.isFinite(Number(status?.block_height))) {
    const tipResponse = await fetchJson(
      "https://blockstream.info/api/blocks/tip/height"
    );

    if (!tipResponse.ok) {
      throw new Error("Unable to retrieve Bitcoin chain height");
    }

    const tipHeight = Number(tipResponse.data);
    const blockHeight = Number(status.block_height);

    if (tipHeight >= blockHeight) {
      confirmations = tipHeight - blockHeight + 1;
    }
  }

  return {
    exists: true,
    confirmed: Boolean(status?.confirmed),
    confirmations,
    cryptoAmount: (sats / 100000000).toFixed(8),
    depositAddress: BTC_ADDRESS,
    network: "Bitcoin",
  };
}

async function verifyLitecoin(txid: string): Promise<VerificationResult> {
  const txResponse = await fetchJson(
    `https://litecoinspace.org/api/tx/${encodeURIComponent(txid)}`
  );

  if (!txResponse.ok || !txResponse.data) {
    return {
      exists: false,
      confirmed: false,
      confirmations: 0,
      cryptoAmount: "0",
      depositAddress: LTC_ADDRESS,
      network: "Litecoin",
      reason: "Litecoin transaction was not found",
    };
  }

  const tx = txResponse.data;
  const status = tx.status || {};

  const matchingOutputs = Array.isArray(tx.vout)
    ? tx.vout.filter(
        (output: any) =>
          output?.scriptpubkey_address?.toLowerCase() ===
          LTC_ADDRESS.toLowerCase()
      )
    : [];

  const litoshis = matchingOutputs.reduce(
    (sum: number, output: any) => sum + Number(output?.value || 0),
    0
  );

  if (litoshis <= 0) {
    return {
      exists: true,
      confirmed: Boolean(status?.confirmed),
      confirmations: 0,
      cryptoAmount: "0",
      depositAddress: LTC_ADDRESS,
      network: "Litecoin",
      reason: "Transaction does not pay the configured LTC deposit address",
    };
  }

  let confirmations = 0;

  if (status?.confirmed && Number.isFinite(Number(status?.block_height))) {
    const tipResponse = await fetchJson(
      "https://litecoinspace.org/api/blocks/tip/height"
    );

    if (!tipResponse.ok) {
      throw new Error("Unable to retrieve Litecoin chain height");
    }

    const tipHeight = Number(tipResponse.data);
    const blockHeight = Number(status.block_height);

    if (tipHeight >= blockHeight) {
      confirmations = tipHeight - blockHeight + 1;
    }
  }

  return {
    exists: true,
    confirmed: Boolean(status?.confirmed),
    confirmations,
    cryptoAmount: (litoshis / 100000000).toFixed(8),
    depositAddress: LTC_ADDRESS,
    network: "Litecoin",
  };
}

async function verifyUsdtTrc20(txid: string): Promise<VerificationResult> {
  const headers: HeadersInit = {
    accept: "application/json",
  };

  if (TRON_API_KEY) {
    headers["TRON-PRO-API-KEY"] = TRON_API_KEY;
  }

  const historyUrl =
    `${TRON_BASE_URL}/v1/accounts/${encodeURIComponent(USDT_ADDRESS)}` +
    `/transactions/trc20` +
    `?limit=200` +
    `&only_confirmed=false` +
    `&contract_address=${encodeURIComponent(USDT_TRC20_CONTRACT)}` +
    `&only_to=true`;

  const historyResponse = await fetchJson(historyUrl, {
    headers,
  });

  if (!historyResponse.ok) {
    throw new Error(
      `TRON transfer lookup failed with HTTP ${historyResponse.status}`
    );
  }

  const transfers = Array.isArray(historyResponse.data?.data)
    ? historyResponse.data.data
    : [];

  const transfer = transfers.find(
    (item: any) =>
      String(item?.transaction_id || "").toLowerCase() === txid.toLowerCase()
  );

  if (!transfer) {
    return {
      exists: false,
      confirmed: false,
      confirmations: 0,
      cryptoAmount: "0",
      depositAddress: USDT_ADDRESS,
      network: "TRON-TRC20",
      reason: "USDT TRC-20 transaction was not found for the configured address",
    };
  }

  const transferTo = String(transfer?.to || "").toLowerCase();
  const configuredAddress = USDT_ADDRESS.toLowerCase();

  if (transferTo !== configuredAddress) {
    return {
      exists: true,
      confirmed: false,
      confirmations: 0,
      cryptoAmount: "0",
      depositAddress: USDT_ADDRESS,
      network: "TRON-TRC20",
      reason: "TRC-20 transfer destination does not match configured address",
    };
  }

  const tokenContract = String(
    transfer?.token_info?.address || transfer?.contract_address || ""
  ).toLowerCase();

  if (tokenContract && tokenContract !== USDT_TRC20_CONTRACT.toLowerCase()) {
    return {
      exists: true,
      confirmed: false,
      confirmations: 0,
      cryptoAmount: "0",
      depositAddress: USDT_ADDRESS,
      network: "TRON-TRC20",
      reason: "TRC-20 token contract does not match configured USDT contract",
    };
  }

  const decimals = Number(transfer?.token_info?.decimals ?? 6);
  const rawValue = String(transfer?.value ?? "0");
  const cryptoAmount = (
    Number(rawValue) /
    Math.pow(10, Number.isFinite(decimals) ? decimals : 6)
  ).toFixed(6);

  const txInfoResponse = await fetchJson(
    `${TRON_BASE_URL}/wallet/gettransactioninfobyid`,
    {
      method: "POST",
      headers: {
        ...headers,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        value: txid,
      }),
    }
  );

  if (!txInfoResponse.ok) {
    throw new Error("Unable to retrieve TRON transaction receipt");
  }

  const txInfo = txInfoResponse.data || {};

  const receiptResult = String(txInfo?.receipt?.result || "").toUpperCase();

  if (receiptResult && receiptResult !== "SUCCESS") {
    return {
      exists: true,
      confirmed: false,
      confirmations: 0,
      cryptoAmount,
      depositAddress: USDT_ADDRESS,
      network: "TRON-TRC20",
      reason: "TRON transaction execution was not successful",
    };
  }

  const blockNumber = Number(txInfo?.blockNumber);

  let confirmations = 0;

  if (Number.isFinite(blockNumber) && blockNumber > 0) {
    const latestBlockResponse = await fetchJson(
      `${TRON_BASE_URL}/wallet/getnowblock`,
      {
        headers: {
          ...headers,
          "content-type": "application/json",
        },
        method: "POST",
        body: "{}",
      }
    );

    if (latestBlockResponse.ok) {
      const latestBlock = Number(
        latestBlockResponse.data?.block_header?.raw_data?.number
      );

      if (Number.isFinite(latestBlock) && latestBlock >= blockNumber) {
        confirmations = latestBlock - blockNumber + 1;
      }
    }
  }

  const confirmed =
    Boolean(transfer?.block_timestamp) &&
    confirmations > 0;

  return {
    exists: true,
    confirmed,
    confirmations,
    cryptoAmount,
    depositAddress: USDT_ADDRESS,
    network: "TRON-TRC20",
  };
}

async function verifyTransaction(
  currency: SupportedCurrency,
  txid: string
): Promise<VerificationResult> {
  if (currency === "BTC") {
    return verifyBitcoin(txid);
  }

  if (currency === "LTC") {
    return verifyLitecoin(txid);
  }

  return verifyUsdtTrc20(txid);
}

export async function POST(req: Request) {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const action = String(body?.action || "");

    if (action === "create_deposit") {
      /*
       * STAGE5E_CREATE_DEPOSIT_UNIQUE_ADDRESS
       */

      const currencyValue =
        String(body?.currency || "USDT").toUpperCase();

      const rawUsdAmount =
        Number(body?.usdAmount);

      if (!isSupportedCurrency(currencyValue)) {
        return NextResponse.json(
          {
            error:
              "Unsupported cryptocurrency. Use BTC, LTC, or USDT TRC-20.",
          },
          { status: 400 }
        );
      }

      const currency: SupportedCurrency =
        currencyValue;

      if (
        !Number.isFinite(rawUsdAmount) ||
        rawUsdAmount < 1 ||
        rawUsdAmount > 10000
      ) {
        return NextResponse.json(
          {
            error:
              "Top-up amount must be between $1.00 and $10,000.00 USD.",
          },
          { status: 400 }
        );
      }

      const usdAmount =
        Math.round(rawUsdAmount * 100) / 100;

      const prices =
        await getCryptoPrices();

      const priceUsd =
        prices[currency];

      if (
        !Number.isFinite(priceUsd) ||
        priceUsd <= 0
      ) {
        return NextResponse.json(
          {
            error:
              "Unable to retrieve a valid crypto price.",
          },
          { status: 503 }
        );
      }

      const decimalPlaces =
        currency === "USDT"
          ? 6
          : 8;

      const factor =
        Math.pow(
          10,
          decimalPlaces
        );

      const calculatedCryptoAmount =
        Math.ceil(
          (usdAmount / priceUsd) * factor
        ) / factor;

      const cryptoAmount =
        calculatedCryptoAmount.toFixed(
          decimalPlaces
        );

      const expiresAt =
        new Date(
          Date.now() +
          CRYPTO_QUOTE_TTL_MS
        );

      const intentNetwork =
        currency === "USDT"
          ? "TRC20"
          : currency;

      const intent =
        await createCryptoPaymentIntent({
          userId:
            sessionUser.id,
          currency,
          network:
            intentNetwork,
          requestedUsdAmount:
            usdAmount,
          quotedCryptoAmount:
            calculatedCryptoAmount,
          quotedUsdRate:
            priceUsd,
          requiredConfirmations:
            getMinimumConfirmations(
              currency
            ),
          expiresAt,
        });

      const quoteExpiresAt =
        expiresAt.getTime();

      const quoteToken =
        signCryptoQuote({
          userId:
            sessionUser.id,
          currency,
          network:
            getNetwork(currency),
          address:
            intent.depositAddress,
          usdAmount,
          cryptoAmount,
          priceUsd,
          exp:
            quoteExpiresAt,
        });

      return NextResponse.json({
        success: true,
        deposit: {
          paymentIntentId:
            intent.id,
          addressId:
            intent.addressId,
          currency,
          network:
            getNetwork(currency),
          depositAddress:
            intent.depositAddress,
          minimumConfirmations:
            getMinimumConfirmations(
              currency
            ),
          usdAmount,
          cryptoAmount,
          priceUsd,
          quoteToken,
          quoteExpiresAt:
            expiresAt.toISOString(),
        },
      });
    }

    if (action === "verify_deposit") {
      const currency = String(body?.currency || "").toUpperCase();
      const txid = cleanTxid(body?.txid);
      const quoteToken = body?.quoteToken;

      if (!isSupportedCurrency(currency)) {
        return NextResponse.json(
          {
            error: "Unsupported cryptocurrency. Use BTC, LTC, or USDT TRC-20.",
          },
          { status: 400 }
        );
      }

      if (!/^[a-f0-9]{64}$/.test(txid)) {
        return NextResponse.json(
          {
            error: "Invalid transaction ID format.",
          },
          { status: 400 }
        );
      }

      const configuredAddress = getAddress(currency);

      if (!configuredAddress) {
        return NextResponse.json(
          {
            error: `The ${currency} deposit address is not configured on the server.`,
          },
          { status: 500 }
        );
      }

      const [existingDeposit] = await db
        .select()
        .from(cryptoDeposits)
        .where(eq(cryptoDeposits.txid, txid))
        .limit(1);

      if (existingDeposit) {
        if (existingDeposit.userId !== sessionUser.id) {
          return NextResponse.json(
            {
              error: "This transaction ID has already been submitted.",
            },
            { status: 409 }
          );
        }

        if (existingDeposit.currency !== currency) {
          return NextResponse.json(
            {
              error: "This transaction ID was previously submitted for another currency.",
            },
            { status: 409 }
          );
        }

        if (existingDeposit.status === "completed") {
          return NextResponse.json({
            success: true,
            status: "completed",
            credited: true,
            usdAmount: Number(existingDeposit.usdAmount),
            cryptoAmount: Number(existingDeposit.cryptoAmount),
            confirmations: existingDeposit.confirmations,
            currency,
            message: "This deposit has already been credited.",
          });
        }
      }

      let quotedCryptoAmount = 0;
      let quotedUsdAmount = 0;

      if (existingDeposit?.status === "pending") {
        quotedCryptoAmount = Number(existingDeposit.cryptoAmount);
        quotedUsdAmount = Number(existingDeposit.usdAmount);
      } else {
        const quote = verifyCryptoQuote(
          quoteToken,
          sessionUser.id,
          currency
        );

        quotedCryptoAmount = Number(quote.cryptoAmount);
        quotedUsdAmount = Number(quote.usdAmount);
      }

      if (
        !Number.isFinite(quotedCryptoAmount) ||
        quotedCryptoAmount <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            status: "rejected",
            credited: false,
            error: "The crypto quote amount is invalid.",
          },
          { status: 400 }
        );
      }

      if (
        !Number.isFinite(quotedUsdAmount) ||
        quotedUsdAmount <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            status: "rejected",
            credited: false,
            error: "The USD quote amount is invalid.",
          },
          { status: 400 }
        );
      }

      const verification = await verifyTransaction(currency, txid);

      if (!verification.exists) {
        return NextResponse.json(
          {
            success: false,
            status: "not_found",
            credited: false,
            confirmations: 0,
            error:
              verification.reason ||
              "Transaction was not found on the selected blockchain.",
          },
          { status: 404 }
        );
      }

      if (
        verification.depositAddress.toLowerCase() !==
        configuredAddress.toLowerCase()
      ) {
        return NextResponse.json(
          {
            success: false,
            status: "rejected",
            credited: false,
            error: "Transaction destination does not match the configured deposit address.",
          },
          { status: 400 }
        );
      }

      const cryptoAmount = Number(verification.cryptoAmount);

      if (!Number.isFinite(cryptoAmount) || cryptoAmount <= 0) {
        return NextResponse.json(
          {
            success: false,
            status: "rejected",
            credited: false,
            error: "No valid deposit amount was found for the configured receiving address.",
          },
          { status: 400 }
        );
      }

      const minimumConfirmations = getMinimumConfirmations(currency);

      if (cryptoAmount + 1e-12 < quotedCryptoAmount) {
        return NextResponse.json(
          {
            success: false,
            status: "rejected",
            credited: false,
            error: `Insufficient crypto received. Expected at least ${quotedCryptoAmount} ${currency}, but the verified transaction paid ${cryptoAmount} ${currency}.`,
          },
          { status: 400 }
        );
      }

      const usdAmount = Number(quotedUsdAmount.toFixed(2));

      if (!Number.isFinite(usdAmount) || usdAmount <= 0) {
        throw new Error("Unable to calculate a valid USD deposit amount");
      }

      if (verification.confirmations < minimumConfirmations) {
        if (existingDeposit) {
          await db
            .update(cryptoDeposits)
            .set({
              cryptoAmount: cryptoAmount.toFixed(12),
              usdAmount: usdAmount.toFixed(2),
              confirmations: verification.confirmations,
              status: "pending",
              updatedAt: new Date(),
            })
            .where(eq(cryptoDeposits.id, existingDeposit.id));
        } else {
          await db
            .insert(cryptoDeposits)
            .values({
              id: `cd_${randomUUID()}`,
              userId: sessionUser.id,
              txid,
              currency,
              network: verification.network,
              depositAddress: configuredAddress,
              cryptoAmount: cryptoAmount.toFixed(12),
              usdAmount: usdAmount.toFixed(2),
              confirmations: verification.confirmations,
              status: "pending",
            })
            .onConflictDoNothing({ target: cryptoDeposits.txid });

          const [pendingDeposit] = await db
            .select()
            .from(cryptoDeposits)
            .where(eq(cryptoDeposits.txid, txid))
            .limit(1);

          if (
            !pendingDeposit ||
            pendingDeposit.userId !== sessionUser.id
          ) {
            return NextResponse.json(
              {
                error: "This transaction ID has already been submitted.",
              },
              { status: 409 }
            );
          }
        }

        return NextResponse.json({
          success: true,
          status: "pending",
          credited: false,
          currency,
          network: verification.network,
          cryptoAmount,
          usdAmount,
          confirmations: verification.confirmations,
          requiredConfirmations: minimumConfirmations,
          message: `Transaction found. Waiting for confirmations (${verification.confirmations}/${minimumConfirmations}).`,
        });
      }

      const result = await db.transaction(async (tx) => {
        let depositId = existingDeposit?.id;

        if (!depositId) {
          depositId = `cd_${randomUUID()}`;

          const insertedDeposits = await tx
            .insert(cryptoDeposits)
            .values({
              id: depositId,
              userId: sessionUser.id,
              txid,
              currency,
              network: verification.network,
              depositAddress: configuredAddress,
              cryptoAmount: cryptoAmount.toFixed(12),
              usdAmount: usdAmount.toFixed(2),
              confirmations: verification.confirmations,
              status: "pending",
            })
            .onConflictDoNothing({ target: cryptoDeposits.txid })
            .returning({ id: cryptoDeposits.id });

          if (insertedDeposits.length > 0) {
            depositId = insertedDeposits[0].id;
          } else {
            const [duplicate] = await tx
              .select()
              .from(cryptoDeposits)
              .where(eq(cryptoDeposits.txid, txid))
              .limit(1);

            if (!duplicate || duplicate.userId !== sessionUser.id) {
              throw new Error("DUPLICATE_TXID");
            }

            depositId = duplicate.id;
          }
        }

        const [claimedDeposit] = await tx
          .update(cryptoDeposits)
          .set({
            cryptoAmount: cryptoAmount.toFixed(12),
            usdAmount: usdAmount.toFixed(2),
            confirmations: verification.confirmations,
            status: "completed",
            verifiedAt: new Date(),
            creditedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(cryptoDeposits.id, depositId),
              ne(cryptoDeposits.status, "completed")
            )
          )
          .returning();

        if (!claimedDeposit) {
          const [alreadyCompleted] = await tx
            .select()
            .from(cryptoDeposits)
            .where(eq(cryptoDeposits.txid, txid))
            .limit(1);

          if (alreadyCompleted?.status === "completed") {
            return {
              alreadyCredited: true,
              usdAmount: Number(alreadyCompleted.usdAmount),
              cryptoAmount: Number(alreadyCompleted.cryptoAmount),
              confirmations: alreadyCompleted.confirmations,
            };
          }

          throw new Error("DEPOSIT_CLAIM_FAILED");
        }

        await tx
          .update(users)
          .set({
            balance: sql`${users.balance} + ${usdAmount.toFixed(2)}`,
            updatedAt: new Date(),
          })
          .where(eq(users.id, sessionUser.id));

        await tx.insert(transactions).values({
          id: `tx_crypto_${randomUUID()}`,
          userId: sessionUser.id,
          amount: usdAmount.toFixed(2),
          currency,
          paymentMethod: `crypto_${currency.toLowerCase()}`,
          paymentAddress: configuredAddress,
          txHash: txid,
          status: "completed",
          planId: null,
          gbPurchased: null,
        });

        return {
          alreadyCredited: false,
          usdAmount,
          cryptoAmount,
          confirmations: verification.confirmations,
        };
      });

      return NextResponse.json({
        success: true,
        status: "completed",
        credited: true,
        alreadyCredited: result.alreadyCredited,
        currency,
        network: verification.network,
        cryptoAmount: result.cryptoAmount,
        usdAmount: result.usdAmount,
        confirmations: result.confirmations,
        message: result.alreadyCredited
          ? "This deposit was already credited."
          : "Blockchain deposit verified and Navasocks balance credited successfully.",
      });
    }

    return NextResponse.json(
      {
        error:
          "Invalid crypto action. Use create_deposit or verify_deposit.",
      },
      { status: 400 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    console.error("Crypto payment error:", error);

    if (message === "DUPLICATE_TXID") {
      return NextResponse.json(
        {
          error: "This transaction ID has already been submitted.",
        },
        { status: 409 }
      );
    }

    if (message === "DEPOSIT_CLAIM_FAILED") {
      return NextResponse.json(
        {
          error:
            "The deposit could not be claimed safely. Please retry the verification.",
        },
        { status: 409 }
      );
    }


    if (message.startsWith("CRYPTO_QUOTE_")) {
      const quoteErrors: Record<
        string,
        { status: number; error: string }
      > = {
        CRYPTO_QUOTE_REQUIRED: {
          status: 400,
          error: "A valid crypto payment quote is required.",
        },
        CRYPTO_QUOTE_INVALID: {
          status: 400,
          error: "The crypto payment quote is invalid.",
        },
        CRYPTO_QUOTE_EXPIRED: {
          status: 400,
          error: "The crypto payment quote has expired. Create a new quote.",
        },
        CRYPTO_QUOTE_USER_MISMATCH: {
          status: 403,
          error: "The crypto payment quote does not belong to this account.",
        },
        CRYPTO_QUOTE_CURRENCY_MISMATCH: {
          status: 400,
          error: "The crypto payment quote does not match the selected currency.",
        },
        CRYPTO_QUOTE_NETWORK_MISMATCH: {
          status: 400,
          error: "The crypto payment quote network is invalid.",
        },
        CRYPTO_QUOTE_ADDRESS_MISMATCH: {
          status: 400,
          error: "The crypto payment quote destination is invalid.",
        },
        CRYPTO_QUOTE_INVALID_AMOUNT: {
          status: 400,
          error: "The crypto payment quote amount is invalid.",
        },
        CRYPTO_QUOTE_INVALID_PRICE: {
          status: 400,
          error: "The crypto payment quote price is invalid.",
        },
        CRYPTO_QUOTE_NOT_CONFIGURED: {
          status: 500,
          error: "Crypto quote signing is not configured on the server.",
        },
      };

      const quoteError = quoteErrors[message] || {
        status: 400,
        error: "Unable to validate the crypto payment quote.",
      };

      return NextResponse.json(
        { error: quoteError.error },
        { status: quoteError.status }
      );
    }
    return NextResponse.json(
      {
        error: "Unable to verify the crypto deposit.",
      },
      { status: 500 }
    );
  }
}

