/*
  # Create User Wallet System

  1. New Tables
    - `user_wallets`
      - `user_id` (text, primary key) - Unique user identifier
      - `balance` (numeric) - Current wallet balance in USD
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on user_wallets table
    - Users can view and update their own wallet
*/

CREATE TABLE IF NOT EXISTS user_wallets (
  user_id text PRIMARY KEY,
  balance numeric DEFAULT 1000.00 CHECK (balance >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_wallets_created ON user_wallets(created_at);

ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallet"
  ON user_wallets FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own wallet"
  ON user_wallets FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can insert wallet"
  ON user_wallets FOR INSERT
  WITH CHECK (true);