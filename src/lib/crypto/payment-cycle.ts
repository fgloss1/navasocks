import { scanBlockchainPayments } from "./payment-watcher";
import { processConfirmedPaymentIntents } from "./payment-crediting";

export type PaymentCycleResult = {
  watcher: {
    addressesScanned: number;
    transactionsDetected: number;
  };
  crediting: {
    scanned: number;
    credited: number;
    underpaid: number;
    skipped: number;
  };
};

export async function runPaymentCycle(): Promise<PaymentCycleResult> {
  const watcher = await scanBlockchainPayments();
  const crediting = await processConfirmedPaymentIntents();

  return {
    watcher,
    crediting,
  };
}
