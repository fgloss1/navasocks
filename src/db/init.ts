import { db } from "./index";
import { sql } from "drizzle-orm";


export async function initDb() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        two_factor_secret TEXT,
        balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;
      UPDATE users SET username = split_part(email, '@', 1) WHERE username IS NULL OR username = '';
      CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users (username);

      CREATE TABLE IF NOT EXISTS proxy_plans (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        price_per_gb NUMERIC(10, 2) NOT NULL,
        pool_size TEXT NOT NULL,
        protocol TEXT NOT NULL,
        concurrency TEXT NOT NULL,
        features TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        description TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS user_subscriptions (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan_id TEXT NOT NULL REFERENCES proxy_plans(id) ON DELETE CASCADE,
        allocated_gb NUMERIC(10, 2) NOT NULL,
        used_gb NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
        status TEXT NOT NULL DEFAULT 'active',
        proxy_username TEXT NOT NULL,
        proxy_password TEXT NOT NULL,
        ip_whitelist TEXT NOT NULL DEFAULT '',
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS crypto_deposits (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      txid TEXT NOT NULL UNIQUE,
      currency TEXT NOT NULL,
      network TEXT NOT NULL,
      deposit_address TEXT NOT NULL,
      crypto_amount NUMERIC(30, 12) NOT NULL,
      usd_amount NUMERIC(12, 2) NOT NULL,
      confirmations INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      verified_at TIMESTAMP,
      credited_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount NUMERIC(12, 2) NOT NULL,
        currency TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        payment_address TEXT,
        tx_hash TEXT,
        status TEXT NOT NULL DEFAULT 'completed',
        plan_id TEXT,
        gb_purchased NUMERIC(10, 2),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS proxy_nodes (
        id SERIAL PRIMARY KEY,
        node_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        ip_address TEXT NOT NULL,
        country TEXT NOT NULL,
        city TEXT NOT NULL,
        country_code TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'online',
        latency_ms INTEGER NOT NULL DEFAULT 25,
        current_connections INTEGER NOT NULL DEFAULT 0,
        bandwidth_mbps NUMERIC(8, 2) NOT NULL DEFAULT 120.50,
        total_requests INTEGER NOT NULL DEFAULT 1000,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS api_keys (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        key_name TEXT NOT NULL,
        api_key TEXT NOT NULL UNIQUE,
        last_used_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS bandwidth_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subscription_id TEXT,
        megabytes_used NUMERIC(10, 2) NOT NULL,
        protocol TEXT NOT NULL,
        target_host TEXT NOT NULL,
        country_code TEXT NOT NULL,
        timestamp TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS proxy_listings (
        id SERIAL PRIMARY KEY,
        ip_masked TEXT NOT NULL,
        ip_full TEXT NOT NULL,
        port INTEGER NOT NULL,
        domain TEXT NOT NULL,
        country TEXT NOT NULL,
        country_code TEXT NOT NULL,
        region TEXT NOT NULL,
        state TEXT NOT NULL,
        city TEXT NOT NULL,
        isp TEXT NOT NULL,
        zip TEXT NOT NULL,
        speed_label TEXT NOT NULL,
        speed_kbps INTEGER NOT NULL,
        ping INTEGER NOT NULL,
        proxy_type TEXT NOT NULL,
        added_days INTEGER NOT NULL,
        price NUMERIC(10, 2) NOT NULL,
        status TEXT NOT NULL DEFAULT 'available',
        owner_user_id INTEGER
      );

      CREATE TABLE IF NOT EXISTS owned_proxies (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        listing_id INTEGER,
        ip TEXT NOT NULL,
        port INTEGER NOT NULL,
        country_code TEXT NOT NULL,
        city TEXT NOT NULL,
        isp TEXT NOT NULL,
        locked BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS support_tickets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        owned_proxy_id INTEGER REFERENCES owned_proxies(id) ON DELETE CASCADE,
        transaction_id TEXT REFERENCES transactions(id) ON DELETE SET NULL,
        type TEXT NOT NULL DEFAULT 'refund_request',
        reason TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        refund_amount NUMERIC(12, 2),
        admin_notes TEXT,
        reviewed_at TIMESTAMP,
        refunded_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS support_tickets_user_idx
        ON support_tickets (user_id);

      CREATE INDEX IF NOT EXISTS support_tickets_owned_proxy_idx
        ON support_tickets (owned_proxy_id);

      CREATE INDEX IF NOT EXISTS support_tickets_status_idx
        ON support_tickets (status);
      -- STAGE5C_PAYMENT_INTENT_SCHEMA
      CREATE TABLE IF NOT EXISTS crypto_deposit_addresses (
        id TEXT PRIMARY KEY,
        currency TEXT NOT NULL,
        network TEXT NOT NULL,
        address_index INTEGER NOT NULL,
        deposit_address TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'available',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE UNIQUE INDEX IF NOT EXISTS crypto_deposit_addresses_network_index_unique
        ON crypto_deposit_addresses (currency, network, address_index);

      CREATE UNIQUE INDEX IF NOT EXISTS crypto_deposit_addresses_address_unique
        ON crypto_deposit_addresses (deposit_address);

      CREATE TABLE IF NOT EXISTS crypto_payment_intents (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        address_id TEXT NOT NULL REFERENCES crypto_deposit_addresses(id),
        currency TEXT NOT NULL,
        network TEXT NOT NULL,
        deposit_address TEXT NOT NULL,
        requested_usd_amount NUMERIC(12, 2) NOT NULL,
        quoted_crypto_amount NUMERIC(30, 12) NOT NULL,
        quoted_usd_rate NUMERIC(30, 12) NOT NULL,
        received_crypto_amount NUMERIC(30, 12) NOT NULL DEFAULT 0,
        received_usd_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
        confirmations INTEGER NOT NULL DEFAULT 0,
        required_confirmations INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        expires_at TIMESTAMP,
        first_detected_at TIMESTAMP,
        credited_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS crypto_payment_intents_user_idx
        ON crypto_payment_intents (user_id);

      CREATE INDEX IF NOT EXISTS crypto_payment_intents_address_idx
        ON crypto_payment_intents (address_id);

      CREATE INDEX IF NOT EXISTS crypto_payment_intents_status_idx
        ON crypto_payment_intents (status);

      CREATE TABLE IF NOT EXISTS crypto_payment_transactions (
        id TEXT PRIMARY KEY,
        payment_intent_id TEXT NOT NULL REFERENCES crypto_payment_intents(id) ON DELETE CASCADE,
        address_id TEXT NOT NULL REFERENCES crypto_deposit_addresses(id),
        currency TEXT NOT NULL,
        network TEXT NOT NULL,
        txid TEXT NOT NULL,
        crypto_amount NUMERIC(30, 12) NOT NULL,
        confirmations INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'detected',
        block_reference TEXT,
        detected_at TIMESTAMP NOT NULL DEFAULT NOW(),
        confirmed_at TIMESTAMP,
        credited_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE UNIQUE INDEX IF NOT EXISTS crypto_payment_transactions_txid_unique
        ON crypto_payment_transactions (txid);

      CREATE INDEX IF NOT EXISTS crypto_payment_transactions_intent_idx
        ON crypto_payment_transactions (payment_intent_id);

      CREATE INDEX IF NOT EXISTS crypto_payment_transactions_address_idx
        ON crypto_payment_transactions (address_id);

    `);

    // Development-only seed. Never execute demo seeding in production.
    if (process.env.NODE_ENV !== "production") {
      const { seedDatabase } = await import("./seed");
      await seedDatabase();
    }
    return true;
  } catch (err) {
    console.error("Database initialization error:", err);
    return false;
  }
}


