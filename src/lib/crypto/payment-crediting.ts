import { sql } from "drizzle-orm";
import { db } from "../../db";

export type PaymentCreditResult = {
  scanned: number;
  credited: number;
  underpaid: number;
  skipped: number;
};

type IntentRow = {
  id: string;
  user_id: number;
  requested_usd_amount: string;
  quoted_crypto_amount: string;
  quoted_usd_rate: string;
  required_confirmations: number;
  status: string;
};

type AggregateRow = {
  received_crypto: string;
  received_usd: string;
  is_underpaid: boolean;
};

export async function processConfirmedPaymentIntents(): Promise<PaymentCreditResult> {
  const result: PaymentCreditResult = {
    scanned: 0,
    credited: 0,
    underpaid: 0,
    skipped: 0,
  };

  const intentsResult = await db.execute(
    sql`
      SELECT
        id,
        user_id,
        requested_usd_amount,
        quoted_crypto_amount,
        quoted_usd_rate,
        required_confirmations,
        status
      FROM crypto_payment_intents
      WHERE status IN (
        'pending',
        'detected',
        'confirming',
        'underpaid'
      )
        AND credited_at IS NULL
      ORDER BY created_at ASC
      FOR UPDATE SKIP LOCKED
    `,
  );

  for (const rawRow of intentsResult.rows) {
    result.scanned += 1;

    const intent = rawRow as unknown as IntentRow;

    try {
      await db.transaction(async (tx) => {
        const lockedResult = await tx.execute(
          sql`
            SELECT
              id,
              user_id,
              requested_usd_amount,
              quoted_crypto_amount,
              quoted_usd_rate,
              required_confirmations,
              status
            FROM crypto_payment_intents
            WHERE id = ${intent.id}
              AND credited_at IS NULL
            FOR UPDATE
          `,
        );

        const locked = lockedResult.rows?.[0];

        if (!locked) {
          result.skipped += 1;
          return;
        }

        const requiredConfirmations = Number(
          (locked as { required_confirmations: number }).required_confirmations,
        );

        if (!Number.isInteger(requiredConfirmations) || requiredConfirmations <= 0) {
          throw new Error(
            `Invalid required confirmation count for payment intent ${intent.id}.`,
          );
        }

        const transactionResult = await tx.execute(
          sql`
            SELECT
              COALESCE(SUM(crypto_amount), 0)::numeric(30,12) AS received_crypto,
              (
                COALESCE(SUM(crypto_amount), 0)::numeric
                * CAST(${(locked as { quoted_usd_rate: string }).quoted_usd_rate} AS numeric)
              ) AS received_usd,
              (
                COALESCE(SUM(crypto_amount), 0)::numeric
                < CAST(${(locked as { quoted_crypto_amount: string }).quoted_crypto_amount} AS numeric)
              ) AS is_underpaid
            FROM crypto_payment_transactions
            WHERE payment_intent_id = ${intent.id}
              AND confirmations >= ${requiredConfirmations}
              AND status IN (
                'confirmed',
                'confirming'
              )
          `,
        );

        const aggregate = transactionResult.rows?.[0] as
          | AggregateRow
          | undefined;

        if (!aggregate) {
          result.skipped += 1;
          return;
        }

        const receivedCrypto = String(aggregate.received_crypto ?? "0");
        const receivedUsd = String(aggregate.received_usd ?? "0");

        if (aggregate.is_underpaid) {
          await tx.execute(
            sql`
              UPDATE crypto_payment_intents
              SET
                received_crypto_amount = ${receivedCrypto},
                received_usd_amount = ${receivedUsd},
                status = 'underpaid',
                updated_at = NOW()
              WHERE id = ${intent.id}
            `,
          );

          result.underpaid += 1;
          return;
        }

        const updateIntent = await tx.execute(
          sql`
            UPDATE crypto_payment_intents
            SET
              received_crypto_amount = ${receivedCrypto},
              received_usd_amount = ${receivedUsd},
              status = 'completed',
              credited_at = NOW(),
              updated_at = NOW()
            WHERE id = ${intent.id}
              AND credited_at IS NULL
              AND status <> 'completed'
            RETURNING
              id,
              user_id,
              received_usd_amount
          `,
        );

        const creditedIntent = updateIntent.rows?.[0];

        if (!creditedIntent) {
          result.skipped += 1;
          return;
        }

        const creditedUserId = Number(
          (creditedIntent as { user_id: number }).user_id,
        );

        if (!Number.isInteger(creditedUserId) || creditedUserId <= 0) {
          throw new Error(
            `Invalid user ID for payment intent ${intent.id}.`,
          );
        }

        await tx.execute(
          sql`
            UPDATE users
            SET
              balance = balance + CAST(
                ${(creditedIntent as { received_usd_amount: string }).received_usd_amount}
                AS numeric
              ),
              updated_at = NOW()
            WHERE id = ${creditedUserId}
          `,
        );

        await tx.execute(
          sql`
            UPDATE crypto_payment_transactions
            SET
              status = 'credited',
              credited_at = COALESCE(
                credited_at,
                NOW()
              ),
              updated_at = NOW()
            WHERE payment_intent_id = ${intent.id}
              AND confirmations >= ${requiredConfirmations}
          `,
        );

        result.credited += 1;
      });
    } catch (error) {
      console.error(
        `Payment intent ${intent.id} crediting failed:`,
        error,
      );

      result.skipped += 1;
    }
  }

  return result;
}
