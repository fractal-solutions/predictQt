/*
  # Prediction Markets Schema

  1. New Tables
    - `markets`
      - `id` (uuid, primary key)
      - `title` (text) - The prediction question
      - `description` (text) - Detailed description
      - `category` (text) - Market category
      - `end_date` (timestamptz) - When market closes
      - `status` (text) - 'active', 'closed', 'resolved'
      - `outcome` (text) - Final outcome after resolution (nullable)
      - `created_at` (timestamptz)
      - `created_by` (uuid) - User who created the market
    
    - `stakes`
      - `id` (uuid, primary key)
      - `market_id` (uuid, foreign key to markets)
      - `user_id` (uuid) - User who placed the stake
      - `position` (text) - 'yes' or 'no'
      - `amount` (numeric) - Stake amount
      - `created_at` (timestamptz)
    
    - `market_stats`
      - `market_id` (uuid, primary key, foreign key to markets)
      - `total_yes_stake` (numeric) - Total amount staked on 'yes'
      - `total_no_stake` (numeric) - Total amount staked on 'no'
      - `total_volume` (numeric) - Total trading volume
      - `yes_odds` (numeric) - Calculated yes odds (0-100)
      - `no_odds` (numeric) - Calculated no odds (0-100)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Public read access for markets and stats
    - Authenticated users can create markets
    - Authenticated users can place stakes
    - Users cannot modify others' stakes
*/

-- Create markets table
CREATE TABLE IF NOT EXISTS markets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text DEFAULT 'general',
  end_date timestamptz NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'closed', 'resolved')),
  outcome text CHECK (outcome IN ('yes', 'no', 'cancelled') OR outcome IS NULL),
  created_at timestamptz DEFAULT now(),
  created_by uuid NOT NULL
);

-- Create stakes table
CREATE TABLE IF NOT EXISTS stakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id uuid NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  position text NOT NULL CHECK (position IN ('yes', 'no')),
  amount numeric NOT NULL CHECK (amount > 0),
  created_at timestamptz DEFAULT now()
);

-- Create market_stats table
CREATE TABLE IF NOT EXISTS market_stats (
  market_id uuid PRIMARY KEY REFERENCES markets(id) ON DELETE CASCADE,
  total_yes_stake numeric DEFAULT 0,
  total_no_stake numeric DEFAULT 0,
  total_volume numeric DEFAULT 0,
  yes_odds numeric DEFAULT 50,
  no_odds numeric DEFAULT 50,
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_markets_status ON markets(status);
CREATE INDEX IF NOT EXISTS idx_markets_end_date ON markets(end_date);
CREATE INDEX IF NOT EXISTS idx_stakes_market_id ON stakes(market_id);
CREATE INDEX IF NOT EXISTS idx_stakes_user_id ON stakes(user_id);

-- Enable RLS
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_stats ENABLE ROW LEVEL SECURITY;

-- Markets policies
CREATE POLICY "Anyone can view active markets"
  ON markets FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create markets"
  ON markets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Stakes policies
CREATE POLICY "Anyone can view stakes"
  ON stakes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create stakes"
  ON stakes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Market stats policies
CREATE POLICY "Anyone can view market stats"
  ON market_stats FOR SELECT
  USING (true);

-- Function to update market stats
CREATE OR REPLACE FUNCTION update_market_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO market_stats (market_id, total_yes_stake, total_no_stake, total_volume, yes_odds, no_odds, updated_at)
  SELECT 
    NEW.market_id,
    COALESCE(SUM(CASE WHEN position = 'yes' THEN amount ELSE 0 END), 0) as total_yes,
    COALESCE(SUM(CASE WHEN position = 'no' THEN amount ELSE 0 END), 0) as total_no,
    COALESCE(SUM(amount), 0) as total_vol,
    CASE 
      WHEN COALESCE(SUM(amount), 0) = 0 THEN 50
      ELSE ROUND((COALESCE(SUM(CASE WHEN position = 'yes' THEN amount ELSE 0 END), 0) / COALESCE(SUM(amount), 1)) * 100)
    END as yes_pct,
    CASE 
      WHEN COALESCE(SUM(amount), 0) = 0 THEN 50
      ELSE ROUND((COALESCE(SUM(CASE WHEN position = 'no' THEN amount ELSE 0 END), 0) / COALESCE(SUM(amount), 1)) * 100)
    END as no_pct,
    now()
  FROM stakes
  WHERE market_id = NEW.market_id
  ON CONFLICT (market_id) DO UPDATE
  SET 
    total_yes_stake = EXCLUDED.total_yes_stake,
    total_no_stake = EXCLUDED.total_no_stake,
    total_volume = EXCLUDED.total_volume,
    yes_odds = EXCLUDED.yes_odds,
    no_odds = EXCLUDED.no_odds,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_market_stats ON stakes;
CREATE TRIGGER trigger_update_market_stats
  AFTER INSERT ON stakes
  FOR EACH ROW
  EXECUTE FUNCTION update_market_stats();

-- Initialize stats for existing markets
INSERT INTO market_stats (market_id, updated_at)
SELECT id, now() FROM markets
ON CONFLICT (market_id) DO NOTHING;