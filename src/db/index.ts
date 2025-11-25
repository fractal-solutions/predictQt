import { Database } from 'bun:sqlite';

const DB_PATH = './predictqt.db';

export const db = new Database(DB_PATH, { create: true });

// Enable WAL mode for better performance
db.exec('PRAGMA journal_mode = WAL;');

function createSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS markets (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      end_date TEXT NOT NULL,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'resolved')),
      outcome TEXT CHECK (outcome IN ('yes', 'no', 'cancelled') OR outcome IS NULL),
      created_at TEXT DEFAULT (datetime('now')),
      created_by TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS stakes (
      id TEXT PRIMARY KEY,
      market_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      position TEXT NOT NULL CHECK (position IN ('yes', 'no')),
      amount REAL NOT NULL CHECK (amount > 0),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (market_id) REFERENCES markets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS market_stats (
      market_id TEXT PRIMARY KEY,
      total_yes_stake REAL DEFAULT 0,
      total_no_stake REAL DEFAULT 0,
      total_volume REAL DEFAULT 0,
      yes_odds REAL DEFAULT 50,
      no_odds REAL DEFAULT 50,
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (market_id) REFERENCES markets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_wallets (
      user_id TEXT PRIMARY KEY,
      balance REAL DEFAULT 1000.00 CHECK (balance >= 0),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_markets_status ON markets(status);
    CREATE INDEX IF NOT EXISTS idx_markets_end_date ON markets(end_date);
    CREATE INDEX IF NOT EXISTS idx_stakes_market_id ON stakes(market_id);
    CREATE INDEX IF NOT EXISTS idx_stakes_user_id ON stakes(user_id);
  `);
}

function seedData() {
    const markets = [
        {
          id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
          title: 'Will Bitcoin reach $100k by end of 2025?',
          description: 'Resolves YES if Bitcoin (BTC) closes at or above $100,000 USD on any major exchange by December 31, 2025.',
          category: 'crypto',
          end_date: '2025-12-31T23:59:59Z',
          created_by: 'system',
        },
        {
            id: 'b2c3d4e5-f6a7-8901-2345-67890abcdef1',
            title: 'Will Ethereum reach $5,000 by Q4 2025?',
            description: 'Resolves YES if Ethereum (ETH) reaches $5,000 USD or higher on any major exchange before end of Q4 2025.',
            category: 'crypto',
            end_date: '2025-12-31T23:59:59Z',
            created_by: 'system',
        },
        {
            id: 'c3d4e5f6-a7b8-9012-3456-7890abcdef12',
            title: 'Will AI create a superintelligence by 2026?',
            description: 'Resolves YES if credible AI researchers consensus that an AGI or superintelligence has been created by December 31, 2026.',
            category: 'technology',
            end_date: '2026-12-31T23:59:59Z',
            created_by: 'system',
        }
      ];

      const insertMarket = db.prepare(
        'INSERT OR IGNORE INTO markets (id, title, description, category, end_date, created_by) VALUES ($id, $title, $description, $category, $end_date, $created_by)'
      );

      const insertMarketStats = db.prepare(
        'INSERT OR IGNORE INTO market_stats (market_id) VALUES ($market_id)'
      );

      const insertMarkets = db.transaction(markets => {
        for (const market of markets) {
          insertMarket.run({
            $id: market.id,
            $title: market.title,
            $description: market.description,
            $category: market.category,
            $end_date: market.end_date,
            $created_by: market.created_by,
          });
          insertMarketStats.run({ $market_id: market.id });
        }
      });

      insertMarkets(markets);
}

// Initialize the database
createSchema();
seedData();

console.log('Database initialized successfully.');
