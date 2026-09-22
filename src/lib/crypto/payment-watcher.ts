import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";

import { db } from "../../db";

type WatchCurrency =
  | "BTC"
  | "LTC"
  | "USDT";

type WatchNetwork =
  | "BTC"
  | "LTC"
  | "TRC20";

type DepositAddressRow = {
  id: string;
  currency: WatchCurrency;
  network: WatchNetwork;
  depositAddress: string;
};

type ExplorerTransaction = {
  txid: string;
  cryptoAmount: string;
  confirmations: number;
  confirmed: boolean;
  blockReference: string | null;
};

const BLOCKSTREAM_BASE =
  "https://blockstream.info/api";

const LITECOIN_BASE =
  "https://litecoinspace.org/api";

const TRON_BASE_URL =
  process.env.TRONGRID_BASE_URL ||
  "https://api.trongrid.io";

const TRON_API_KEY =
  process.env.TRONGRID_API_KEY || "";

const USDT_CONTRACT =
  process.env.CRYPTO_USDT_TRC20_CONTRACT ||
  "TR7NHqjeKQXGTCi8q8ZY4pL8otSzgjLj6t";

function buildHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/json",
  };

  if (TRON_API_KEY) {
    headers["TRON-PRO-API-KEY"] =
      TRON_API_KEY;
  }

  return headers;
}

async function fetchJson(
  url: string,
  init?: RequestInit
): Promise<any> {
  const MAX_ATTEMPTS = 3;
  const REQUEST_TIMEOUT_MS = 15_000;
  const BASE_BACKOFF_MS = 750;

  let lastError: unknown = null;

  for (
    let attempt = 1;
    attempt <= MAX_ATTEMPTS;
    attempt += 1
  ) {
    const controller = new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT_MS
    );

    try {
      const response =
        await fetch(
          url,
          {
            ...init,
            signal: controller.signal,
            headers: {
              ...buildHeaders(),
              ...(init?.headers || {}),
            },
            cache: "no-store",
          }
        );

      if (response.ok) {
        return response.json();
      }

      const retryable =
        response.status === 429 ||
        response.status === 502 ||
        response.status === 503 ||
        response.status === 504;

      if (!retryable || attempt === MAX_ATTEMPTS) {
        throw new Error(
          `Explorer request failed: ${response.status} ${url}`
        );
      }

      const retryAfterHeader =
        response.headers.get("retry-after");

      let delayMs = BASE_BACKOFF_MS * (2 ** (attempt - 1));

      if (retryAfterHeader) {
        const retryAfterSeconds =
          Number(retryAfterHeader);

        if (
          Number.isFinite(retryAfterSeconds) &&
          retryAfterSeconds >= 0
        ) {
          delayMs = Math.min(
            Math.max(
              retryAfterSeconds * 1000,
              BASE_BACKOFF_MS
            ),
            10_000
          );
        }
      }

      await new Promise((resolve) =>
        setTimeout(resolve, delayMs)
      );
    } catch (error) {
      lastError = error;

      if (attempt === MAX_ATTEMPTS) {
        if (
          error instanceof Error &&
          error.name === "AbortError"
        ) {
          throw new Error(
            `Explorer request timed out after ${REQUEST_TIMEOUT_MS}ms: ${url}`
          );
        }

        throw error;
      }

      const isTimeout =
        error instanceof Error &&
        error.name === "AbortError";

      const isNetworkError =
        error instanceof TypeError;

      if (!isTimeout && !isNetworkError) {
        throw error;
      }

      const delayMs =
        BASE_BACKOFF_MS * (2 ** (attempt - 1));

      await new Promise((resolve) =>
        setTimeout(resolve, delayMs)
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(
        `Explorer request failed: ${url}`
      );
}

function decimalFromInteger(
  value: string | number,
  decimals: number
): string {

  const raw =
    String(value);

  const negative =
    raw.startsWith("-");

  const digits =
    negative
      ? raw.slice(1)
      : raw;

  if (!/^\d+$/.test(digits)) {
    throw new Error(
      `Invalid integer amount: ${raw}`
    );
  }

  const padded =
    digits.padStart(
      decimals + 1,
      "0"
    );

  const whole =
    padded.slice(
      0,
      -decimals
    );

  const fraction =
    padded.slice(
      -decimals
    );

  return `${negative ? "-" : ""}${whole}.${fraction}`;
}

function addDecimalStrings(
  left: string,
  right: string
): string {

  const leftNumber =
    Number(left);

  const rightNumber =
    Number(right);

  const total =
    leftNumber +
    rightNumber;

  if (
    !Number.isFinite(total)
  ) {
    throw new Error(
      `Unable to add decimal values: ${left} + ${right}`
    );
  }

  return total.toFixed(12);
}

async function getBitcoinTip(): Promise<number> {

  const value =
    await fetchJson(
      `${BLOCKSTREAM_BASE}/blocks/tip/height`
    );

  const height =
    Number(value);

  if (
    !Number.isInteger(height) ||
    height < 0
  ) {
    throw new Error(
      "Invalid Bitcoin chain tip."
    );
  }

  return height;
}

async function getLitecoinTip(): Promise<number> {

  const value =
    await fetchJson(
      `${LITECOIN_BASE}/blocks/tip/height`
    );

  const height =
    Number(value);

  if (
    !Number.isInteger(height) ||
    height < 0
  ) {
    throw new Error(
      "Invalid Litecoin chain tip."
    );
  }

  return height;
}

function confirmationsFromStatus(
  blockHeight: unknown,
  tipHeight: number
): number {

  const height =
    Number(blockHeight);

  if (
    !Number.isInteger(height) ||
    height < 0
  ) {
    return 0;
  }

  return Math.max(
    0,
    tipHeight - height + 1
  );
}

async function scanUtxoAddress(
  address: DepositAddressRow,
  tipHeight: number,
  baseUrl: string,
  decimals: number
): Promise<ExplorerTransaction[]> {

  const txs =
    await fetchJson(
      `${baseUrl}/address/${encodeURIComponent(address.depositAddress)}/txs`
    );

  if (!Array.isArray(txs)) {
    return [];
  }

  const results: ExplorerTransaction[] = [];

  for (const tx of txs) {

    const txid =
      String(tx?.txid || "");

    if (!/^[a-f0-9]{64}$/i.test(txid)) {
      continue;
    }

    let receivedAtomic = 0;

    for (
      const output of
      Array.isArray(tx?.vout)
        ? tx.vout
        : []
    ) {

      const outputAddress =
        String(
          output?.scriptpubkey_address ||
          ""
        ).toLowerCase();

      if (
        outputAddress !==
        address.depositAddress.toLowerCase()
      ) {
        continue;
      }

      const value =
        Number(
          output?.value ?? 0
        );

      if (
        Number.isFinite(value) &&
        value > 0
      ) {
        receivedAtomic += value;
      }
    }

    if (
      receivedAtomic <= 0
    ) {
      continue;
    }

    const confirmed =
      Boolean(
        tx?.status?.confirmed
      );

    const confirmations =
      confirmed
        ? confirmationsFromStatus(
            tx?.status?.block_height,
            tipHeight
          )
        : 0;

    results.push({
      txid,
      cryptoAmount:
        decimalFromInteger(
          receivedAtomic,
          decimals
        ),
      confirmations,
      confirmed,
      blockReference:
        tx?.status?.block_hash
          ? String(
              tx.status.block_hash
            )
          : null,
    });
  }

  return results;
}

async function getTronTip(): Promise<number> {

  const response =
    await fetchJson(
      `${TRON_BASE_URL}/wallet/getnowblock`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: "{}",
      }
    );

  const height =
    Number(
      response
        ?.block_header
        ?.raw_data
        ?.number
    );

  if (
    !Number.isInteger(height) ||
    height < 0
  ) {
    throw new Error(
      "Invalid TRON chain tip."
    );
  }

  return height;
}

async function getTronTransactionInfo(
  txid: string
): Promise<{
  blockNumber: number;
  blockId: string | null;
}> {

  const response =
    await fetchJson(
      `${TRON_BASE_URL}/wallet/gettransactioninfobyid`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          value: txid,
        }),
      }
    );

  return {
    blockNumber:
      Number(
        response?.blockNumber
      ),
    blockId:
      response?.id
        ? String(response.id)
        : null,
  };
}

async function scanUsdtAddress(
  address: DepositAddressRow,
  tipHeight: number
): Promise<ExplorerTransaction[]> {

  const params =
    new URLSearchParams({
      limit: "200",
      contract_address:
        USDT_CONTRACT,
      only_to: "true",
      order_by:
        "block_timestamp,desc",
    });

  const url =
    `${TRON_BASE_URL}/v1/accounts/${encodeURIComponent(
      address.depositAddress
    )}/transactions/trc20?${params.toString()}`;

  const response =
    await fetchJson(url);

  const rows =
    Array.isArray(response?.data)
      ? response.data
      : [];

  const results: ExplorerTransaction[] = [];

  for (const item of rows) {

    const to =
      String(
        item?.to || ""
      ).toLowerCase();

    if (
      to !==
      address.depositAddress.toLowerCase()
    ) {
      continue;
    }

    const txid =
      String(
        item?.transaction_id ||
        ""
      );

    if (!txid) {
      continue;
    }

    if (
      String(
        item?.token_info?.address ||
        ""
      ).toLowerCase() !==
      USDT_CONTRACT.toLowerCase()
    ) {
      continue;
    }

    const decimals =
      Number(
        item?.token_info?.decimals ?? 6
      );

    const safeDecimals =
      Number.isInteger(decimals) &&
      decimals >= 0 &&
      decimals <= 18
        ? decimals
        : 6;

    const cryptoAmount =
      decimalFromInteger(
        String(
          item?.value ?? "0"
        ),
        safeDecimals
      );

    if (
      Number(cryptoAmount) <= 0
    ) {
      continue;
    }

    const txInfo =
      await getTronTransactionInfo(
        txid
      );

    const hasBlock =
      Number.isInteger(
        txInfo.blockNumber
      ) &&
      txInfo.blockNumber >= 0;

    const confirmations =
      hasBlock
        ? Math.max(
            0,
            tipHeight -
              txInfo.blockNumber +
              1
          )
        : 0;

    results.push({
      txid,
      cryptoAmount,
      confirmations,
      confirmed: hasBlock,
      blockReference:
        txInfo.blockId,
    });
  }

  return results;
}

async function getDepositAddresses(): Promise<
  DepositAddressRow[]
> {

  const result =
    await db.execute(
      sql`
        SELECT
          id,
          currency,
          network,
          deposit_address
        FROM crypto_deposit_addresses
        WHERE status = 'assigned'
        ORDER BY created_at ASC
      `
    );

  return result.rows.map(
    row => ({
      id:
        String(row.id),
      currency:
        String(
          row.currency
        ) as WatchCurrency,
      network:
        String(
          row.network
        ) as WatchNetwork,
      depositAddress:
        String(
          row.deposit_address
        ),
    })
  );
}

async function recordTransaction(
  address: DepositAddressRow,
  transaction: ExplorerTransaction
): Promise<void> {

  await db.transaction(
    async (tx) => {

      const intentResult =
        await tx.execute(
          sql`
            SELECT
              id,
              required_confirmations,
              requested_usd_amount,
              received_crypto_amount
            FROM crypto_payment_intents
            WHERE address_id = ${address.id}
              AND deposit_address = ${address.depositAddress}
              AND status IN (
                'pending',
                'detected',
                'confirming',
                'underpaid'
              )
            ORDER BY created_at DESC
            LIMIT 1
            FOR UPDATE
          `
        );

      const intent =
        intentResult.rows?.[0];

      if (!intent) {
        return;
      }

      const paymentIntentId =
        String(
          intent.id
        );

      const requiredConfirmations =
        Number(
          intent.required_confirmations
        );

      const existing =
        await tx.execute(
          sql`
            SELECT
              id,
              crypto_amount
            FROM crypto_payment_transactions
            WHERE txid = ${transaction.txid}
            LIMIT 1
          `
        );

      const existingRow =
        existing.rows?.[0];

      if (!existingRow) {

        await tx.execute(
          sql`
            INSERT INTO crypto_payment_transactions (
              id,
              payment_intent_id,
              address_id,
              currency,
              network,
              txid,
              crypto_amount,
              confirmations,
              status,
              block_reference,
              detected_at,
              confirmed_at,
              updated_at
            )
            VALUES (
              ${randomUUID()},
              ${paymentIntentId},
              ${address.id},
              ${address.currency},
              ${address.network},
              ${transaction.txid},
              ${transaction.cryptoAmount},
              ${transaction.confirmations},
              ${
                transaction.confirmations >=
                requiredConfirmations
                  ? "confirmed"
                  : "confirming"
              },
              ${transaction.blockReference},
              NOW(),
              ${
                transaction.confirmations > 0
                  ? sql`NOW()`
                  : sql`NULL`
              },
              NOW()
            )
          `
        );

      } else {

        await tx.execute(
          sql`
            UPDATE crypto_payment_transactions
            SET
              confirmations =
                ${transaction.confirmations},
              status =
                ${
                  transaction.confirmations >=
                  requiredConfirmations
                    ? "confirmed"
                    : "confirming"
                },
              block_reference =
                ${transaction.blockReference},
              confirmed_at =
                CASE
                  WHEN ${transaction.confirmations} > 0
                    THEN COALESCE(confirmed_at, NOW())
                  ELSE confirmed_at
                END,
              updated_at = NOW()
            WHERE txid = ${transaction.txid}
              AND payment_intent_id = ${paymentIntentId}
          `
        );
      }

      const aggregateResult =
        await tx.execute(
          sql`
            SELECT
              COALESCE(
                SUM(crypto_amount),
                0
              ) AS received_crypto,
              MAX(
                confirmations
              ) AS confirmations
            FROM crypto_payment_transactions
            WHERE payment_intent_id =
              ${paymentIntentId}
          `
        );

      const aggregate =
        aggregateResult.rows?.[0];

      const receivedCrypto =
        String(
          aggregate?.received_crypto || "0"
        );

      const maxConfirmations =
        Number(
          aggregate?.confirmations || 0
        );

      const nextStatus =
        maxConfirmations >=
        requiredConfirmations
          ? "confirming"
          : "detected";

      await tx.execute(
        sql`
          UPDATE crypto_payment_intents
          SET
            received_crypto_amount =
              ${receivedCrypto},
            confirmations =
              ${maxConfirmations},
            status =
              ${nextStatus},
            first_detected_at =
              COALESCE(
                first_detected_at,
                NOW()
              ),
            updated_at =
              NOW()
          WHERE id =
            ${paymentIntentId}
        `
      );
    }
  );
}

export async function scanBlockchainPayments(): Promise<{
  addressesScanned: number;
  transactionsDetected: number;
}> {

  const addresses =
    await getDepositAddresses();

  if (addresses.length === 0) {
    return {
      addressesScanned: 0,
      transactionsDetected: 0,
    };
  }

  let btcTip: number | null = null;
  let ltcTip: number | null = null;
  let tronTip: number | null = null;

  for (const address of addresses) {

    let transactions: ExplorerTransaction[] =
      [];

    if (
      address.currency === "BTC" &&
      address.network === "BTC"
    ) {

      if (btcTip === null) {
        btcTip =
          await getBitcoinTip();
      }

      transactions =
        await scanUtxoAddress(
          address,
          btcTip,
          BLOCKSTREAM_BASE,
          8
        );

    } else if (
      address.currency === "LTC" &&
      address.network === "LTC"
    ) {

      if (ltcTip === null) {
        ltcTip =
          await getLitecoinTip();
      }

      transactions =
        await scanUtxoAddress(
          address,
          ltcTip,
          LITECOIN_BASE,
          8
        );

    } else if (
      address.currency === "USDT" &&
      address.network === "TRC20"
    ) {

      if (tronTip === null) {
        tronTip =
          await getTronTip();
      }

      transactions =
        await scanUsdtAddress(
          address,
          tronTip
        );
    }

    for (
      const transaction of transactions
    ) {
      await recordTransaction(
        address,
        transaction
      );
    }
  }

  const count =
    addresses.length;

  const transactionResult =
    await db.execute(
      sql`
        SELECT COUNT(*)::int AS count
        FROM crypto_payment_transactions
        WHERE detected_at >= NOW() - INTERVAL '10 minutes'
      `
    );

  return {
    addressesScanned: count,
    transactionsDetected:
      Number(
        transactionResult.rows?.[0]?.count ||
        0
      ),
  };
}


