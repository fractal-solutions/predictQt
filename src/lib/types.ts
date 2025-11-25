export type Market = {
  id: string;
  title: string;
  description: string;
  category: string;
  end_date: string;
  status: 'active' | 'closed' | 'resolved';
  outcome: 'yes' | 'no' | 'cancelled' | null;
  created_at: string;
  created_by: string;
  initial_liquidity_provider_id: string | null;
  initial_liquidity_amount: number;
};

export type Stake = {
  id: string;
  market_id: string;
  user_id: string;
  position: 'yes' | 'no';
  amount: number;
  created_at: string;
};

export type MarketStats = {
  market_id: string;
  total_yes_stake: number;
  total_no_stake: number;
  total_volume: number;
  yes_odds: number;
  no_odds: number;
  updated_at: string;
};

export type UserBet = {
  id: string;
  user_id: string;
  market_id: string;
  position: 'yes' | 'no';
  shares_owned: number;
  cost_basis: number;
  status: 'active' | 'exited' | 'resolved';
  created_at: string;
  updated_at: string;
};
