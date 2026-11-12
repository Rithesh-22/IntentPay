import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store database in a persistent local directory
const dataDir = path.resolve(__dirname, '../../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'intentpay.db');
export const db = new Database(dbPath);

// Enable WAL mode for high concurrency & performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      price_minor INTEGER NOT NULL,
      currency TEXT NOT NULL,
      stock INTEGER NOT NULL DEFAULT 10,
      specs_json TEXT NOT NULL,
      image_url TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_policies (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      max_transaction_amount_minor INTEGER NOT NULL,
      monthly_spending_limit_minor INTEGER NOT NULL,
      allowed_categories_json TEXT NOT NULL,
      restricted_categories_json TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      require_human_approval BOOLEAN NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS purchase_intents (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      raw_prompt TEXT NOT NULL,
      parsed_category TEXT,
      requirements_json TEXT,
      max_budget_minor INTEGER,
      currency TEXT NOT NULL DEFAULT 'USD',
      clarification_needed TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS recommendations (
      id TEXT PRIMARY KEY,
      intent_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      match_score INTEGER NOT NULL,
      match_explanation TEXT NOT NULL,
      budget_compatible BOOLEAN NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (intent_id) REFERENCES purchase_intents(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      intent_id TEXT,
      product_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      amount_minor INTEGER NOT NULL,
      currency TEXT NOT NULL,
      state TEXT NOT NULL,
      paypal_order_id TEXT,
      paypal_capture_id TEXT,
      idempotency_key TEXT UNIQUE NOT NULL,
      approved_at DATETIME,
      captured_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS policy_decisions (
      id TEXT PRIMARY KEY,
      transaction_id TEXT NOT NULL,
      allowed BOOLEAN NOT NULL,
      decision TEXT NOT NULL,
      reasons_json TEXT NOT NULL,
      checked_rules_json TEXT NOT NULL,
      requires_human_approval BOOLEAN NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      transaction_id TEXT,
      intent_id TEXT,
      event_type TEXT NOT NULL,
      actor TEXT NOT NULL,
      details_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_state ON transactions(state);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_events(created_at DESC);
  `);

  // Seed default user if not exists
  const userStmt = db.prepare('SELECT id FROM users WHERE id = ?');
  const existingUser = userStmt.get('user_demo_01');
  if (!existingUser) {
    db.prepare(`
      INSERT INTO users (id, email, name)
      VALUES (?, ?, ?)
    `).run('user_demo_01', 'demo.architect@intentpay.io', 'Alex Rivera');
  }

  // Seed default spending policy
  const policyStmt = db.prepare('SELECT id FROM user_policies WHERE user_id = ?');
  const existingPolicy = policyStmt.get('user_demo_01');
  if (!existingPolicy) {
    db.prepare(`
      INSERT INTO user_policies (
        id, user_id, max_transaction_amount_minor, monthly_spending_limit_minor,
        allowed_categories_json, restricted_categories_json, currency, require_human_approval
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'policy_user_01',
      'user_demo_01',
      25000, // $250.00 max per transaction
      100000, // $1,000.00 monthly spending limit
      JSON.stringify(['keyboards', 'electronics', 'audio', 'monitors', 'workspace', 'accessories']),
      JSON.stringify(['crypto_hardware', 'gambling', 'weapons', 'luxury_jewelry', 'restricted_asset']),
      'USD',
      1
    );
  }

  // Seed product catalog
  seedProductCatalog();
}

function seedProductCatalog() {
  const count = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  if (count.count > 0) return;

  const catalog = [
    {
      id: 'prod_kb_01',
      title: 'Syntax Pro Wireless Mechanical Keyboard',
      description: 'Compact 68-key wireless mechanical keyboard engineered for programmers. Custom pre-lubed tactile switches, PBT keycaps, Bluetooth 5.2 and 2.4GHz low-latency dongle.',
      category: 'keyboards',
      priceMinor: 6900, // $69.00
      currency: 'USD',
      stock: 45,
      specs: {
        connectivity: 'Wireless (Bluetooth 5.2 / 2.4GHz) & USB-C',
        switches: 'Custom Tactile (Pre-lubed)',
        layout: '68% Compact',
        batteryLife: '200 hours backlight-off',
        programmable: true,
        hotSwappable: true
      },
      imageUrl: '/src/assets/images/keyboard_wireless_1794363685443.jpg'
    },
    {
      id: 'prod_kb_02',
      title: 'Keychron K2 Compact Wireless Keyboard',
      description: 'Versatile 75% mechanical keyboard with seamless Mac and Windows dual layout support, hot-swappable optical switches, and multi-device pairing.',
      category: 'keyboards',
      priceMinor: 8900, // $89.00
      currency: 'USD',
      stock: 28,
      specs: {
        connectivity: 'Wireless Bluetooth 5.1 & Type-C',
        switches: 'Gateron G Pro Brown',
        layout: '75% Layout',
        batteryLife: '72 hours',
        programmable: false,
        hotSwappable: true
      },
      imageUrl: '/src/assets/images/keyboard_wireless_1794363685443.jpg'
    },
    {
      id: 'prod_kb_03',
      title: 'Logi QuietTouch Membrane Keyboard',
      description: 'Ultra-affordable low-profile wired membrane keyboard designed for casual office and standard desktop productivity.',
      category: 'keyboards',
      priceMinor: 2400, // $24.00
      currency: 'USD',
      stock: 80,
      specs: {
        connectivity: 'Wired USB-A',
        switches: 'Membrane Scissor',
        layout: 'Full 104-key',
        batteryLife: 'N/A (Bus Powered)',
        programmable: false,
        hotSwappable: false
      },
      imageUrl: '/src/assets/images/keyboard_wireless_1794363685443.jpg'
    },
    {
      id: 'prod_audio_01',
      title: 'Aurum Acoustic Pro Wireless ANC Headphones',
      description: 'Studio-grade hybrid active noise-cancelling wireless headphones with custom 40mm titanium drivers, ambient sound bypass, and 45-hour battery.',
      category: 'audio',
      priceMinor: 18900, // $189.00
      currency: 'USD',
      stock: 22,
      specs: {
        anc: 'Hybrid Active Noise Cancellation (-42dB)',
        battery: '45 hours with ANC',
        drivers: '40mm Custom Titanium Dome',
        codecs: 'LDAC, AAC, SBC',
        microphone: 'Quad-mic beamforming with AI de-noise'
      },
      imageUrl: '/src/assets/images/headphones_pro_1794363685703.jpg'
    },
    {
      id: 'prod_audio_02',
      title: 'SoundPulse Nomad Wireless Sport Earbuds',
      description: 'Compact IPX7 waterproof wireless earbuds featuring punchy bass, wireless fast-charging case, and ultra-secure ergonomic ear wings.',
      category: 'audio',
      priceMinor: 4900, // $49.00
      currency: 'USD',
      stock: 60,
      specs: {
        waterproof: 'IPX7 certified',
        battery: '8 hours (32 hours with case)',
        charging: 'Qi Wireless & USB-C',
        bluetooth: '5.3 True Wireless'
      },
      imageUrl: '/src/assets/images/headphones_pro_1794363685703.jpg'
    },
    {
      id: 'prod_display_01',
      title: 'UltraView 27-inch 4K Ergonomic IPS Monitor',
      description: 'Factory-calibrated 4K UHD 3840x2160 IPS display with 99% sRGB color gamut, 90W USB-C single cable laptop charging, and fully articulating ergonomic arm stand.',
      category: 'monitors',
      priceMinor: 34900, // $349.00 (Exceeds default $250 policy limit to demonstrate policy violation)
      currency: 'USD',
      stock: 14,
      specs: {
        resolution: '3840 x 2160 UHD (4K)',
        panel: 'IPS Anti-Glare',
        refreshRate: '60Hz',
        ports: '1x USB-C (90W PD), 2x HDMI 2.0, 1x DP 1.4, 3x USB 3.0',
        stand: 'Heavy-duty articulated monitor arm included'
      },
      imageUrl: '/src/assets/images/monitor_4k_1794363687136.jpg'
    },
    {
      id: 'prod_display_02',
      title: 'AeroView 24-inch 1080p Borderless Display',
      description: 'Crisp Full HD 1080p 75Hz display with razor-thin three-sided borderless design, eye-care low blue light mode, and VESA mount capability.',
      category: 'monitors',
      priceMinor: 12900, // $129.00
      currency: 'USD',
      stock: 35,
      specs: {
        resolution: '1920 x 1080 FHD',
        panel: 'IPS Wide-Angle',
        refreshRate: '75Hz',
        ports: '1x HDMI, 1x VGA',
        eyeCare: 'TUV Rheinland Low Blue Light'
      },
      imageUrl: '/src/assets/images/monitor_4k_1794363687136.jpg'
    },
    {
      id: 'prod_desk_01',
      title: 'Apex Walnut Motorized Standing Desk',
      description: 'Solid dark walnut hardwood desktop with dual electric lifting motors, 4-preset digital memory handset, anti-collision sensor, and integrated cable duct.',
      category: 'workspace',
      priceMinor: 48000, // $480.00
      currency: 'USD',
      stock: 9,
      specs: {
        heightRange: '25.6 in to 51.2 in (65cm - 130cm)',
        motors: 'Dual Heavy-Duty Synchronized Motors',
        maxLoad: '330 lbs (150 kg)',
        warranty: '10 Years on Frame & Motor'
      },
      imageUrl: '/src/assets/images/desk_standing_1794363686558.jpg'
    },
    {
      id: 'prod_acc_01',
      title: 'Precision MX Ergonomic Wireless Mouse',
      description: 'Sculpted wireless mouse with precision laser sensor, frictionless metal thumb wheel, silent acoustic dampeners, and seamless multi-device flow.',
      category: 'accessories',
      priceMinor: 5900, // $59.00
      currency: 'USD',
      stock: 55,
      specs: {
        dpi: 'Up to 8000 DPI Darkfield',
        battery: '70 days on full charge',
        connectivity: 'Bluetooth & Logi Bolt',
        buttons: '7 customizable buttons'
      },
      imageUrl: '/src/assets/images/keyboard_wireless_1794363685443.jpg'
    },
    {
      id: 'prod_crypto_vault_01',
      title: 'ColdVault Titan Hardware Crypto Wallet',
      description: 'Air-gapped biometric hardware security key with EAL6+ certified secure element for cryptographic asset management.',
      category: 'crypto_hardware', // Restrictive category to demonstrate policy blocker
      priceMinor: 11900, // $119.00
      currency: 'USD',
      stock: 12,
      specs: {
        securityLevel: 'EAL6+ Secure Microcontroller',
        screen: '2.8-inch Color Touchscreen',
        connectivity: 'Strictly Air-gapped (QR Code & MicroSD only)'
      },
      imageUrl: '/src/assets/images/keyboard_wireless_1794363685443.jpg'
    }
  ];

  const insert = db.prepare(`
    INSERT INTO products (
      id, title, description, category, price_minor, currency, stock, specs_json, image_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    for (const item of catalog) {
      insert.run(
        item.id,
        item.title,
        item.description,
        item.category,
        item.priceMinor,
        item.currency,
        item.stock,
        JSON.stringify(item.specs),
        item.imageUrl
      );
    }
  });

  tx();
}
