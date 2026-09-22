import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

import * as bip32 from "@scure/bip32";
import * as base from "@scure/base";
import { sha256 } from "@noble/hashes/sha2.js";
import { ripemd160 } from "@noble/hashes/legacy.js";
import { keccak_256 } from "@noble/hashes/sha3.js";
import * as curves from "@noble/curves/secp256k1.js";

import { and, eq, sql } from "drizzle-orm";

import { db } from "../../db";
import {
  cryptoDepositAddresses,
  cryptoPaymentIntents,
} from "../../db/schema";

export type CryptoCurrency = "BTC" | "LTC" | "USDT";

export type CryptoNetwork = "BTC" | "LTC" | "TRC20";

export type PaymentIntentStatus =
  | "pending"
  | "detected"
  | "confirming"
  | "underpaid"
  | "completed"
  | "expired"
  | "cancelled";

export interface CreatePaymentIntentInput {
  userId: number;
  currency: CryptoCurrency;
  network: CryptoNetwork;
  requestedUsdAmount: number;
  quotedCryptoAmount: number;
  quotedUsdRate: number;
  requiredConfirmations: number;
  expiresAt?: Date | null;
}

export interface AllocatedDepositAddress {
  id: string;
  currency: CryptoCurrency;
  network: CryptoNetwork;
  addressIndex: number;
  depositAddress: string;
  status: string;
}

export interface CreatedPaymentIntent {
  id: string;
  userId: number;
  currency: CryptoCurrency;
  network: CryptoNetwork;
  depositAddress: string;
  addressId: string;
  requestedUsdAmount: number;
  quotedCryptoAmount: number;
  quotedUsdRate: number;
  requiredConfirmations: number;
  status: PaymentIntentStatus;
  expiresAt: Date | null;
}

const INVENTORY_SIZE = 20;

function getPublicConfigPath(): string {
  return (
    process.env.DEPOSIT_WALLET_PUBLIC_PATH ||
    path.join(
      process.cwd(),
      "data",
      "DEPOSIT_WALLET_PUBLIC.json"
    )
  );
}

function loadPublicWalletConfig(): any {
  const configPath = getPublicConfigPath();

  if (!fs.existsSync(/*turbopackIgnore: true*/ configPath)) {
    throw new Error(
      `Public deposit wallet configuration not found: ${configPath}`
    );
  }

  return JSON.parse(
    fs.readFileSync(/*turbopackIgnore: true*/ configPath, "utf8")
  );
}

function hash160(bytes: Uint8Array): Uint8Array {
  return ripemd160(sha256(bytes));
}

function derivePublicChild(
  publicExtendedKey: string,
  index: number
): Uint8Array {
  const account =
    bip32.HDKey.fromExtendedKey(
      publicExtendedKey
    );

  const child =
    account.deriveChild(index);

  if (!child.publicKey) {
    throw new Error(
      `Missing public key at address index ${index}.`
    );
  }

  return child.publicKey;
}

function deriveSegwitAddress(
  hrp: "bc" | "ltc",
  publicKey: Uint8Array
): string {
  const witnessProgram =
    hash160(publicKey);

  return base.bech32.encode(
    hrp,
    [
      0,
      ...base.bech32.toWords(
        witnessProgram
      ),
    ],
    90
  );
}

function deriveTronAddress(
  publicKey: Uint8Array
): string {
  const secp256k1 =
    curves.secp256k1;

  if (
    !secp256k1?.Point ||
    typeof secp256k1.Point.fromHex !== "function"
  ) {
    throw new Error(
      "secp256k1 Point.fromHex API unavailable."
    );
  }

  const compressedHex =
    Buffer.from(publicKey).toString("hex");

  const point =
    secp256k1.Point.fromHex(
      compressedHex
    );

  const uncompressed =
    point.toBytes(false);

  if (
    !uncompressed ||
    uncompressed.length !== 65
  ) {
    throw new Error(
      "Invalid TRON uncompressed public key."
    );
  }

  const hash =
    keccak_256(
      uncompressed.slice(1)
    );

  const payload =
    new Uint8Array(21);

  payload[0] = 0x41;

  payload.set(
    hash.slice(-20),
    1
  );

  const codec =
    base.base58check(sha256);

  return codec.encode(payload);
}

function getWalletDefinition(
  currency: CryptoCurrency,
  network: CryptoNetwork,
  config: any
): {
  wallet: "BTC" | "LTC" | "TRON";
  publicExtendedKey: string;
} {
  if (
    currency === "BTC" &&
    network === "BTC"
  ) {
    return {
      wallet: "BTC",
      publicExtendedKey:
        config.wallets?.BTC?.publicExtendedKey,
    };
  }

  if (
    currency === "LTC" &&
    network === "LTC"
  ) {
    return {
      wallet: "LTC",
      publicExtendedKey:
        config.wallets?.LTC?.publicExtendedKey,
    };
  }

  if (
    currency === "USDT" &&
    network === "TRC20"
  ) {
    return {
      wallet: "TRON",
      publicExtendedKey:
        config.wallets?.TRON?.publicExtendedKey,
    };
  }

  throw new Error(
    `Unsupported crypto/network combination: ${currency}/${network}`
  );
}

function deriveAddress(
  currency: CryptoCurrency,
  network: CryptoNetwork,
  publicExtendedKey: string,
  index: number
): string {
  const publicKey =
    derivePublicChild(
      publicExtendedKey,
      index
    );

  if (
    currency === "BTC" &&
    network === "BTC"
  ) {
    return deriveSegwitAddress(
      "bc",
      publicKey
    );
  }

  if (
    currency === "LTC" &&
    network === "LTC"
  ) {
    return deriveSegwitAddress(
      "ltc",
      publicKey
    );
  }

  if (
    currency === "USDT" &&
    network === "TRC20"
  ) {
    return deriveTronAddress(
      publicKey
    );
  }

  throw new Error(
    `Unsupported crypto/network combination: ${currency}/${network}`
  );
}

async function ensureAddressInventory(
  currency: CryptoCurrency,
  network: CryptoNetwork
): Promise<void> {
  const config =
    loadPublicWalletConfig();

  const wallet =
    getWalletDefinition(
      currency,
      network,
      config
    );

  if (!wallet.publicExtendedKey) {
    throw new Error(
      `Public extended key missing for ${wallet.wallet}.`
    );
  }

  const rows = [];

  for (
    let index = 0;
    index < INVENTORY_SIZE;
    index++
  ) {
    const depositAddress =
      deriveAddress(
        currency,
        network,
        wallet.publicExtendedKey,
        index
      );

    rows.push({
      id:
        `${currency.toLowerCase()}_${network.toLowerCase()}_${index}`,
      currency,
      network,
      addressIndex: index,
      depositAddress,
      status: "available",
    });
  }

  await db
    .insert(cryptoDepositAddresses)
    .values(rows)
    .onConflictDoNothing()
    .execute();
}

export async function allocateDepositAddress(
  currency: CryptoCurrency,
  network: CryptoNetwork
): Promise<AllocatedDepositAddress> {
  await ensureAddressInventory(
    currency,
    network
  );

  return db.transaction(
    async (tx) => {
      const result =
        await tx.execute(sql`
          WITH candidate AS (
            SELECT id
            FROM crypto_deposit_addresses
            WHERE currency = ${currency}
              AND network = ${network}
              AND status = 'available'
            ORDER BY address_index ASC
            FOR UPDATE SKIP LOCKED
            LIMIT 1
          )
          UPDATE crypto_deposit_addresses AS a
          SET
            status = 'assigned',
            updated_at = NOW()
          FROM candidate
          WHERE a.id = candidate.id
          RETURNING
            a.id,
            a.currency,
            a.network,
            a.address_index,
            a.deposit_address,
            a.status
        `);

      const row =
        result.rows?.[0] as
          | {
              id: string;
              currency: CryptoCurrency;
              network: CryptoNetwork;
              address_index: number;
              deposit_address: string;
              status: string;
            }
          | undefined;

      if (!row) {
        throw new Error(
          `No available ${currency}/${network} deposit address remains.`
        );
      }

      return {
        id: row.id,
        currency: row.currency,
        network: row.network,
        addressIndex:
          Number(row.address_index),
        depositAddress:
          row.deposit_address,
        status:
          row.status,
      };
    }
  );
}

export async function createCryptoPaymentIntent(
  input: CreatePaymentIntentInput
): Promise<CreatedPaymentIntent> {
  if (
    !Number.isInteger(input.userId) ||
    input.userId <= 0
  ) {
    throw new Error(
      "Invalid userId."
    );
  }

  if (
    !Number.isFinite(
      input.requestedUsdAmount
    ) ||
    input.requestedUsdAmount <= 0
  ) {
    throw new Error(
      "Invalid requestedUsdAmount."
    );
  }

  if (
    !Number.isFinite(
      input.quotedCryptoAmount
    ) ||
    input.quotedCryptoAmount <= 0
  ) {
    throw new Error(
      "Invalid quotedCryptoAmount."
    );
  }

  if (
    !Number.isFinite(
      input.quotedUsdRate
    ) ||
    input.quotedUsdRate <= 0
  ) {
    throw new Error(
      "Invalid quotedUsdRate."
    );
  }

  if (
    !Number.isInteger(
      input.requiredConfirmations
    ) ||
    input.requiredConfirmations < 1
  ) {
    throw new Error(
      "Invalid requiredConfirmations."
    );
  }

  const address =
    await allocateDepositAddress(
      input.currency,
      input.network
    );

  try {
    const id =
      randomUUID();

    const expiresAt =
      input.expiresAt ?? null;

    const [intent] =
      await db
        .insert(
          cryptoPaymentIntents
        )
        .values({
          id,
          userId:
            input.userId,
          addressId:
            address.id,
          currency:
            input.currency,
          network:
            input.network,
          depositAddress:
            address.depositAddress,
          requestedUsdAmount:
            input.requestedUsdAmount.toFixed(2),
          quotedCryptoAmount:
            input.quotedCryptoAmount.toString(),
          quotedUsdRate:
            input.quotedUsdRate.toString(),
          receivedCryptoAmount:
            "0",
          receivedUsdAmount:
            "0",
          confirmations:
            0,
          requiredConfirmations:
            input.requiredConfirmations,
          status:
            "pending",
          expiresAt,
        })
        .returning();

    if (!intent) {
      throw new Error(
        "Payment intent was not created."
      );
    }

    return {
      id:
        intent.id,
      userId:
        intent.userId,
      currency:
        intent.currency as CryptoCurrency,
      network:
        intent.network as CryptoNetwork,
      depositAddress:
        intent.depositAddress,
      addressId:
        intent.addressId,
      requestedUsdAmount:
        Number(
          intent.requestedUsdAmount
        ),
      quotedCryptoAmount:
        Number(
          intent.quotedCryptoAmount
        ),
      quotedUsdRate:
        Number(
          intent.quotedUsdRate
        ),
      requiredConfirmations:
        intent.requiredConfirmations,
      status:
        intent.status as PaymentIntentStatus,
      expiresAt:
        intent.expiresAt ?? null,
    };

  } catch (error) {

    await db
      .update(
        cryptoDepositAddresses
      )
      .set({
        status:
          "available",
        updatedAt:
          new Date(),
      })
      .where(
        eq(
          cryptoDepositAddresses.id,
          address.id
        )
      );

    throw error;
  }
}

export async function releasePaymentAddress(
  addressId: string
): Promise<void> {
  await db
    .update(
      cryptoDepositAddresses
    )
    .set({
      status:
        "available",
      updatedAt:
        new Date(),
    })
    .where(
      and(
        eq(
          cryptoDepositAddresses.id,
          addressId
        ),
        eq(
          cryptoDepositAddresses.status,
          "assigned"
        )
      )
    );
}




