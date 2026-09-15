import { pgTable, serial, text, timestamp, boolean, numeric, integer } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").default("user").notNull(),
  twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
  twoFactorSecret: text("two_factor_secret"),
  balance: numeric("balance", { precision: 12, scale: 2 }).default("0.00").notNull(),
  status: text("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  provider: text("provider"),
  transportHost: text("transport_host"),
  transportPort: integer("transport_port"),
  providerCredentialRef: text("provider_credential_ref"),
  accessUsername: text("access_username"),
  accessPasswordEncrypted: text("access_password_encrypted"),
  accessHost: text("access_host"),
  accessPort: integer("access_port"),
  publicAccessHost: text("public_access_host"),
  publicAccessPort: integer("public_access_port"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const proxyPlans = pgTable("proxy_plans", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  pricePerGb: numeric("price_per_gb", { precision: 10, scale: 2 }).notNull(),
  poolSize: text("pool_size").notNull(),
  protocol: text("protocol").notNull(),
  concurrency: text("concurrency").notNull(),
  features: text("features").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  description: text("description").notNull(),
});

export const userSubscriptions = pgTable("user_subscriptions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  planId: text("plan_id").references(() => proxyPlans.id).notNull(),
  allocatedGb: numeric("allocated_gb", { precision: 10, scale: 2 }).notNull(),
  usedGb: numeric("used_gb", { precision: 10, scale: 2 }).default("0.00").notNull(),
  status: text("status").default("active").notNull(),
  proxyUsername: text("proxy_username").notNull(),
  proxyPassword: text("proxy_password").notNull(),
  ipWhitelist: text("ip_whitelist").default("").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  provider: text("provider"),
  transportHost: text("transport_host"),
  transportPort: integer("transport_port"),
  providerCredentialRef: text("provider_credential_ref"),
  accessUsername: text("access_username"),
  accessPasswordEncrypted: text("access_password_encrypted"),
  accessHost: text("access_host"),
  accessPort: integer("access_port"),
  publicAccessHost: text("public_access_host"),
  publicAccessPort: integer("public_access_port"),
});


export const cryptoDeposits = pgTable("crypto_deposits", {
  id: text("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  txid: text("txid").notNull().unique(),
  currency: text("currency").notNull(),
  network: text("network").notNull(),
  depositAddress: text("deposit_address").notNull(),
  cryptoAmount: numeric("crypto_amount", { precision: 30, scale: 12 }).notNull(),
  usdAmount: numeric("usd_amount", { precision: 12, scale: 2 }).notNull(),
  confirmations: integer("confirmations").default(0).notNull(),
  status: text("status").default("pending").notNull(),
  verifiedAt: timestamp("verified_at"),
  creditedAt: timestamp("credited_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/*
 * STAGE5C_PAYMENT_INTENT_SCHEMA
 *
 * New crypto architecture:
 * - crypto_payment_intents = one customer top-up/invoice
 * - crypto_deposit_addresses = reusable HD-derived address inventory
 * - crypto_payment_transactions = every detected blockchain transfer
 *
 * Existing crypto_deposits remains untouched for rollback/legacy compatibility.
 */

export const cryptoDepositAddresses = pgTable("crypto_deposit_addresses", {
  id: text("id").primaryKey(),
  currency: text("currency").notNull(),
  network: text("network").notNull(),
  addressIndex: integer("address_index").notNull(),
  depositAddress: text("deposit_address").notNull(),
  status: text("status").default("available").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const cryptoPaymentIntents = pgTable("crypto_payment_intents", {
  id: text("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  addressId: text("address_id").references(() => cryptoDepositAddresses.id).notNull(),
  currency: text("currency").notNull(),
  network: text("network").notNull(),
  depositAddress: text("deposit_address").notNull(),
  requestedUsdAmount: numeric("requested_usd_amount", { precision: 12, scale: 2 }).notNull(),
  quotedCryptoAmount: numeric("quoted_crypto_amount", { precision: 30, scale: 12 }).notNull(),
  quotedUsdRate: numeric("quoted_usd_rate", { precision: 30, scale: 12 }).notNull(),
  receivedCryptoAmount: numeric("received_crypto_amount", { precision: 30, scale: 12 }).default("0").notNull(),
  receivedUsdAmount: numeric("received_usd_amount", { precision: 12, scale: 2 }).default("0").notNull(),
  confirmations: integer("confirmations").default(0).notNull(),
  requiredConfirmations: integer("required_confirmations").notNull(),
  status: text("status").default("pending").notNull(),
  expiresAt: timestamp("expires_at"),
  firstDetectedAt: timestamp("first_detected_at"),
  creditedAt: timestamp("credited_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const cryptoPaymentTransactions = pgTable("crypto_payment_transactions", {
  id: text("id").primaryKey(),
  paymentIntentId: text("payment_intent_id").references(() => cryptoPaymentIntents.id, { onDelete: "cascade" }).notNull(),
  addressId: text("address_id").references(() => cryptoDepositAddresses.id).notNull(),
  currency: text("currency").notNull(),
  network: text("network").notNull(),
  txid: text("txid").notNull(),
  cryptoAmount: numeric("crypto_amount", { precision: 30, scale: 12 }).notNull(),
  confirmations: integer("confirmations").default(0).notNull(),
  status: text("status").default("detected").notNull(),
  blockReference: text("block_reference"),
  detectedAt: timestamp("detected_at").defaultNow().notNull(),
  confirmedAt: timestamp("confirmed_at"),
  creditedAt: timestamp("credited_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const transactions = pgTable("transactions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull(),
  paymentMethod: text("payment_method").notNull(),
  paymentAddress: text("payment_address"),
  txHash: text("tx_hash"),
  status: text("status").default("completed").notNull(),
  planId: text("plan_id"),
  gbPurchased: numeric("gb_purchased", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  provider: text("provider"),
  transportHost: text("transport_host"),
  transportPort: integer("transport_port"),
  providerCredentialRef: text("provider_credential_ref"),
  accessUsername: text("access_username"),
  accessPasswordEncrypted: text("access_password_encrypted"),
  accessHost: text("access_host"),
  accessPort: integer("access_port"),
  publicAccessHost: text("public_access_host"),
  publicAccessPort: integer("public_access_port"),
});

export const proxyNodes = pgTable("proxy_nodes", {
  id: serial("id").primaryKey(),
  nodeId: text("node_id").notNull().unique(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  ipAddress: text("ip_address").notNull(),
  country: text("country").notNull(),
  city: text("city").notNull(),
  countryCode: text("country_code").notNull(),
  status: text("status").default("online").notNull(),
  latencyMs: integer("latency_ms").default(25).notNull(),
  currentConnections: integer("current_connections").default(0).notNull(),
  bandwidthMbps: numeric("bandwidth_mbps", { precision: 8, scale: 2 }).default("120.5").notNull(),
  totalRequests: integer("total_requests").default(1000).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  keyName: text("key_name").notNull(),
  apiKey: text("api_key").notNull().unique(),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  provider: text("provider"),
  transportHost: text("transport_host"),
  transportPort: integer("transport_port"),
  providerCredentialRef: text("provider_credential_ref"),
  accessUsername: text("access_username"),
  accessPasswordEncrypted: text("access_password_encrypted"),
  accessHost: text("access_host"),
  accessPort: integer("access_port"),
  publicAccessHost: text("public_access_host"),
  publicAccessPort: integer("public_access_port"),
});

export const bandwidthLogs = pgTable("bandwidth_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  subscriptionId: text("subscription_id"),
  megabytesUsed: numeric("megabytes_used", { precision: 10, scale: 2 }).notNull(),
  protocol: text("protocol").notNull(),
  targetHost: text("target_host").notNull(),
  countryCode: text("country_code").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const proxyListings = pgTable("proxy_listings", {
  id: serial("id").primaryKey(),
  ipMasked: text("ip_masked").notNull(),
  ipFull: text("ip_full").notNull(),
  port: integer("port").notNull(),
  domain: text("domain").notNull(),
  country: text("country").notNull(),
  countryCode: text("country_code").notNull(),
  region: text("region").notNull(),
  state: text("state").notNull(),
  city: text("city").notNull(),
  isp: text("isp").notNull(),
  zip: text("zip").notNull(),
  speedLabel: text("speed_label").notNull(),
  speedKbps: integer("speed_kbps").notNull(),
  ping: integer("ping").notNull(),
  proxyType: text("proxy_type").notNull(),
  addedDays: integer("added_days").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  status: text("status").default("available").notNull(),
  ownerUserId: integer("owner_user_id"),
  provider: text("provider"),
  transportHost: text("transport_host"),
  transportPort: integer("transport_port"),
  providerCredentialRef: text("provider_credential_ref"),
});

export const ownedProxies = pgTable("owned_proxies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  listingId: integer("listing_id"),
  ip: text("ip").notNull(),
  port: integer("port").notNull(),
  countryCode: text("country_code").notNull(),
  city: text("city").notNull(),
  isp: text("isp").notNull(),
  locked: boolean("locked").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  provider: text("provider"),
  transportHost: text("transport_host"),
  transportPort: integer("transport_port"),
  providerCredentialRef: text("provider_credential_ref"),
  accessUsername: text("access_username"),
  accessPasswordEncrypted: text("access_password_encrypted"),
  accessHost: text("access_host"),
  accessPort: integer("access_port"),
  publicAccessHost: text("public_access_host"),
  publicAccessPort: integer("public_access_port"),
});

