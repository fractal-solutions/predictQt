import { db } from '../db';
import {
  getMarkets,
  getMarketStats,
  createMarket,
  createMarketStats,
  createStake,
  getWallet,
  createWallet,
  updateWallet,
  getMarketStakes,
  updateMarketStats as updateMarketStatsQuery,
} from '../db/queries';

const server = Bun.serve({
  port: 3001,
  routes: {
    '/api/markets': {
        GET: () => {
            const markets = getMarkets.all();
            const stats = getMarketStats.all();
            const statsMap = new Map();
            stats.forEach(stat => {
                statsMap.set(stat.market_id, stat);
            });
            return Response.json({ markets, stats: Object.fromEntries(statsMap) });
        },
        POST: async (req) => {
            const { title, description, category, endDate, userId } = await req.json();
            const id = Bun.randomUUIDv7();
            const end_date = new Date(endDate).toISOString();

            try {
                db.transaction(() => {
                createMarket.run({ $id: id, $title: title, $description: description, $category: category, $end_date: end_date, $created_by: userId });
                createMarketStats.run({ $market_id: id });
                })();
                broadcastMarketUpdate();
                return Response.json({ success: true }, { status: 201 });
            } catch (error) {
                console.error('Error creating market:', error);
                return new Response('Failed to create market', { status: 500 });
            }
        }
    },
    '/api/stakes': {
        POST: async (req) => {
            const { marketId, userId, position, amount } = await req.json();
            const id = Bun.randomUUIDv7();

            try {
                const wallet = getWallet.get({ $user_id: userId });
                if (!wallet || wallet.balance < amount) {
                    return new Response('Insufficient balance', { status: 400 });
                }

                const newBalance = wallet.balance - amount;

                db.transaction(() => {
                    createStake.run({ $id: id, $market_id: marketId, $user_id: userId, $position: position, $amount: amount });
                    updateWallet.run({ $balance: newBalance, $user_id: userId });
                    updateMarketStats(marketId);
                })();

                broadcastMarketUpdate();
                return Response.json({ success: true, newBalance }, { status: 201 });
            } catch (error) {
                console.error('Error creating stake:', error);
                return new Response('Failed to create stake', { status: 500 });
            }
        }
    },
    '/api/wallets': {
        POST: async (req) => {
            const { userId } = await req.json();
            try {
                let wallet = getWallet.get({ $user_id: userId });
                if (!wallet) {
                    createWallet.run({ $user_id: userId, $balance: 1000 });
                    wallet = { balance: 1000 };
                }
                return Response.json(wallet);
            } catch (error) {
                console.error('Error initializing wallet:', error);
                return new Response('Failed to initialize wallet', { status: 500 });
            }
        }
    },
    '/ws': (req, server) => {
        const upgraded = server.upgrade(req);
        if (!upgraded) {
            return new Response('WebSocket upgrade failed', { status: 400 });
        }
    }
  },
  websocket: {
    open(ws) {
      ws.subscribe('market-updates');
      console.log('WebSocket connection opened');
    },
    close(ws) {
      ws.unsubscribe('market-updates');
      console.log('WebSocket connection closed');
    },
    message(ws, message) {
      // Not expecting messages from client in this implementation
    },
  },
  error(error) {
    console.error(error);
    return new Response('Internal Server Error', { status: 500 });
  },
});

console.log(`Server running at ${server.url}`);


// Business Logic

function updateMarketStats(marketId: string) {
  const stakes = getMarketStakes.all({ $market_id: marketId });
  const total_yes_stake = stakes.filter(s => s.position === 'yes').reduce((acc, s) => acc + s.amount, 0);
  const total_no_stake = stakes.filter(s => s.position === 'no').reduce((acc, s) => acc + s.amount, 0);
  const total_volume = total_yes_stake + total_no_stake;

  const yes_odds = total_volume > 0 ? Math.round((total_yes_stake / total_volume) * 100) : 50;
  const no_odds = total_volume > 0 ? 100 - yes_odds : 50;

  updateMarketStatsQuery.run({
    $market_id: marketId,
    $total_yes_stake: total_yes_stake,
    $total_no_stake: total_no_stake,
    $total_volume: total_volume,
    $yes_odds: yes_odds,
    $no_odds: no_odds,
  });
}

// WebSocket Broadcasting

function broadcastMarketUpdate() {
  const markets = getMarkets.all();
  const stats = getMarketStats.all();
  const statsMap = new Map();
  stats.forEach(stat => {
    statsMap.set(stat.market_id, stat);
  });
  const payload = JSON.stringify({ markets, stats: Object.fromEntries(statsMap) });
  server.publish('market-updates', payload);
}
