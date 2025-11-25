import { db } from '../db';
import {
  getMarkets,
  getMarketById,
  getMarketStats,
  getMarketStatsById,
  createMarket,
  createMarketStats,
  createStake,
  getWallet,
  createWallet,
  updateWallet,
  getMarketStakes,
  updateMarketStats as updateMarketStatsQuery,
  getUserBet,
  getBetById,
  insertUserBet,
  updateUserBetAmount,
  updateUserBetStatus,
  getUserBets,
  getUserTotalActiveStakeForMarket,
} from '../db/queries';

const MAX_BET_THRESHOLD_PERCENTAGE = 0.10; // 10%

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
            const { title, description, category, endDate, userId, initialLiquidityAmount } = await req.json();
            const id = Bun.randomUUIDv7();
            const end_date = new Date(endDate).toISOString();

            // Check if user has enough balance for initial liquidity
            const wallet = getWallet.get({ $user_id: userId });
            if (!wallet || wallet.balance < initialLiquidityAmount) {
                return new Response('Insufficient balance for initial liquidity', { status: 400 });
            }

            const newBalance = wallet.balance - initialLiquidityAmount;

            try {
                db.transaction(() => {
                createMarket.run({
                    $id: id,
                    $title: title,
                    $description: description,
                    $category: category,
                    $end_date: end_date,
                    $created_by: userId,
                    $initial_liquidity_provider_id: userId,
                    $initial_liquidity_amount: initialLiquidityAmount,
                });
                // Initialize market stats with initial liquidity
                createMarketStats.run({
                    $market_id: id,
                    $total_yes_stake: initialLiquidityAmount,
                    $total_no_stake: initialLiquidityAmount,
                    $total_volume: initialLiquidityAmount * 2,
                    $yes_odds: 50,
                    $no_odds: 50,
                });
                updateWallet.run({ $balance: newBalance, $user_id: userId }); // Deduct liquidity from creator's wallet
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

                const market = getMarketById.get({ $id: marketId });
                if (!market) {
                    return new Response('Market not found', { status: 404 });
                }

                // Enforce maximum bet threshold
                const marketStats = getMarketStatsById.get({ $market_id: marketId });
                if (!marketStats) {
                    return new Response('Market stats not found', { status: 404 });
                }
                const totalLiquidity = market.initial_liquidity_amount + marketStats.total_volume;
                const maxAllowedStake = totalLiquidity * MAX_BET_THRESHOLD_PERCENTAGE;

                const userTotalStake = getUserTotalActiveStakeForMarket.get({ $user_id: userId, $market_id: marketId });
                const currentUserStake = userTotalStake?.total_cost_basis || 0;

                if (currentUserStake + amount > maxAllowedStake) {
                    return new Response(`Stake exceeds maximum allowed threshold of ${maxAllowedStake.toFixed(2)}`, { status: 400 });
                }


                const newBalance = wallet.balance - amount;

                console.log('handleCreateStake: userId', userId, 'marketId', marketId, 'position', position, 'amount', amount);

                // Get current market stats to calculate shares
                const currentOdds = position === 'yes' ? marketStats.yes_odds : marketStats.no_odds;
                const sharesBought = amount / (currentOdds / 100);

                db.transaction(() => {
                    createStake.run({ $id: id, $market_id: marketId, $user_id: userId, $position: position, $amount: amount });
                    updateWallet.run({ $balance: newBalance, $user_id: userId });

                    // Update or insert into user_bets
                    const existingBet = getUserBet.get({ $user_id: userId, $market_id: marketId, $position: position });
                    console.log('handleCreateStake: existingBet for position', position, ':', existingBet);

                    if (existingBet) {
                        const newSharesOwned = existingBet.shares_owned + sharesBought;
                        const newCostBasis = existingBet.cost_basis + amount;
                        updateUserBetAmount.run({ $id: existingBet.id, $shares_owned: newSharesOwned, $cost_basis: newCostBasis });
                        console.log('handleCreateStake: Updated existing bet', existingBet.id, 'new shares', newSharesOwned, 'new cost basis', newCostBasis);
                    } else {
                        insertUserBet.run({ $id: Bun.randomUUIDv7(), $user_id: userId, $market_id: marketId, $position: position, $shares_owned: sharesBought, $cost_basis: amount });
                        console.log('handleCreateStake: Inserted new bet for position', position, 'shares', sharesBought, 'cost basis', amount);
                    }

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
    '/api/user/bets/:userId': {
        GET: async (req) => {
            const userId = req.params.userId;
            const userBets = getUserBets.all({ $user_id: userId });
            return Response.json(userBets);
        }
    },
    '/api/bets/:betId/exit': {
        POST: async (req) => {
            const betId = req.params.betId;
            const { userId } = await req.json(); // Assuming userId is sent in the body for verification

            const bet = getBetById.get({ $id: betId });
            if (!bet || bet.user_id !== userId || bet.status !== 'active') {
                return new Response('Bet not found or not active for this user', { status: 404 });
            }

            const marketStats = getMarketStatsById.get({ $market_id: bet.market_id });
            if (!marketStats) {
                return new Response('Market stats not found', { status: 404 });
            }

            const currentOdds = bet.position === 'yes' ? marketStats.yes_odds : marketStats.no_odds;
            const feePercentage = 0.02; // 2% fee for early exit

            let payout = 0;
            if (currentOdds > 0) {
                // Payout based on shares owned and current odds, minus fee
                payout = bet.shares_owned * (currentOdds / 100) * (1 - feePercentage);
            }

            try {
                db.transaction(() => {
                    // Update user's wallet
                    const wallet = getWallet.get({ $user_id: userId });
                    if (wallet) {
                        updateWallet.run({ $balance: wallet.balance + payout, $user_id: userId });
                    }

                    // Update bet status and set shares to 0
                    updateUserBetAmount.run({ $id: betId, $shares_owned: 0, $cost_basis: 0 }); // Set shares and cost basis to 0
                    updateUserBetStatus.run({ $id: betId, $status: 'exited' });

                    // Recalculate market stats (as if the stake was removed)
                    // This is a simplified approach; a more robust solution might involve re-processing stakes
                    updateMarketStats(bet.market_id);
                })();

                broadcastMarketUpdate();
                return Response.json({ success: true, payout: payout }, { status: 200 });
            } catch (error) {
                console.error('Error exiting bet:', error);
                return new Response('Failed to exit bet', { status: 500 });
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
      console.log('WebSocket connection opened:', ws.remoteAddress);
    },
    close(ws, code, reason) {
      ws.unsubscribe('market-updates');
      console.log('WebSocket connection closed:', ws.remoteAddress, 'Code:', code, 'Reason:', reason);
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
  const market = getMarketById.get({ $id: marketId });
  if (!market) {
    console.error(`Market with ID ${marketId} not found for stats update.`);
    return;
  }

  const stakes = getMarketStakes.all({ $market_id: marketId });
  const total_yes_stake = stakes.filter(s => s.position === 'yes').reduce((acc, s) => acc + s.amount, 0);
  const total_no_stake = stakes.filter(s => s.position === 'no').reduce((acc, s) => acc + s.amount, 0);

  // Incorporate initial liquidity provided by the market creator
  const initialLiquidity = market.initial_liquidity_amount;
  const adjusted_yes_stake = total_yes_stake + initialLiquidity;
  const adjusted_no_stake = total_no_stake + initialLiquidity;
  const adjusted_total_volume = adjusted_yes_stake + adjusted_no_stake;

  const yes_odds = adjusted_total_volume > 0 ? Math.round((adjusted_yes_stake / adjusted_total_volume) * 100) : 50;
  const no_odds = adjusted_total_volume > 0 ? 100 - yes_odds : 50;

  // Ensure odds are never 0 or 100 to prevent division by zero and represent extreme probabilities
  const safe_yes_odds = Math.max(1, Math.min(99, yes_odds));
  const safe_no_odds = Math.max(1, Math.min(99, no_odds));

  updateMarketStatsQuery.run({
    $market_id: marketId,
    $total_yes_stake: total_yes_stake, // Store actual stakes
    $total_no_stake: total_no_stake,   // Store actual stakes
    $total_volume: total_yes_stake + total_no_stake, // Store actual volume
    $yes_odds: safe_yes_odds,
    $no_odds: safe_no_odds,
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
