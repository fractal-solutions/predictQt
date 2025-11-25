import { db } from './index';
import { Market, MarketStats, Stake } from '../lib/types';

// Market Queries
export const getMarkets = db.query<Market[], null>('SELECT * FROM markets ORDER BY created_at DESC');
export const getMarketStats = db.query<MarketStats[], null>('SELECT * FROM market_stats');
export const getMarketStatsById = db.query<MarketStats, { $market_id: string }>('SELECT * FROM market_stats WHERE market_id = $market_id');
export const createMarket = db.prepare<Market, { $id: string; $title: string; $description: string; $category: string; $end_date: string; $created_by: string; }>('INSERT INTO markets (id, title, description, category, end_date, created_by) VALUES ($id, $title, $description, $category, $end_date, $created_by) RETURNING *');
export const createMarketStats = db.prepare('INSERT INTO market_stats (market_id) VALUES ($market_id)');


// Stake Queries
export const createStake = db.prepare<Stake, { $id: string; $market_id: string; $user_id: string; $position: 'yes' | 'no'; $amount: number; }>('INSERT INTO stakes (id, market_id, user_id, position, amount) VALUES ($id, $market_id, $user_id, $position, $amount) RETURNING *');

// Wallet Queries
export const getWallet = db.query<{ balance: number }, { $user_id: string; }>('SELECT balance FROM user_wallets WHERE user_id = $user_id');
export const createWallet = db.prepare('INSERT INTO user_wallets (user_id, balance) VALUES ($user_id, $balance)');
export const updateWallet = db.prepare('UPDATE user_wallets SET balance = $balance WHERE user_id = $user_id');

// User Bets Queries
export const getUserBet = db.query<UserBet, { $user_id: string; $market_id: string; $position: 'yes' | 'no'; }>('SELECT * FROM user_bets WHERE user_id = $user_id AND market_id = $market_id AND position = $position');
export const getBetById = db.query<UserBet, { $id: string }>('SELECT * FROM user_bets WHERE id = $id');
export const insertUserBet = db.prepare('INSERT INTO user_bets (id, user_id, market_id, position, amount_staked) VALUES ($id, $user_id, $market_id, $position, $amount_staked)');
export const updateUserBetAmount = db.prepare('UPDATE user_bets SET amount_staked = $amount_staked, updated_at = datetime(\'now\') WHERE id = $id');
export const updateUserBetStatus = db.prepare('UPDATE user_bets SET status = $status, updated_at = datetime(\'now\') WHERE id = $id');
export const getUserBets = db.query<UserBet[], { $user_id: string }>('SELECT * FROM user_bets WHERE user_id = $user_id AND status = \'active\'');

// Stats Update
export const getMarketStakes = db.query<{ position: 'yes' | 'no', amount: number }, { $market_id: string }>('SELECT position, amount FROM stakes WHERE market_id = $market_id');
export const updateMarketStats = db.prepare('UPDATE market_stats SET total_yes_stake = $total_yes_stake, total_no_stake = $total_no_stake, total_volume = $total_volume, yes_odds = $yes_odds, no_odds = $no_odds, updated_at = datetime(\'now\') WHERE market_id = $market_id');
