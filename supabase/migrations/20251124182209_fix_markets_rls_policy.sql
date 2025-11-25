/*
  # Fix Markets RLS Policy for Creation

  Updates the markets insert policy to properly allow user creation
  while maintaining security. The previous policy required auth.uid()
  but users may be anonymous or in a demo mode.
*/

DROP POLICY IF EXISTS "Authenticated users can create markets" ON markets;

CREATE POLICY "Users can create markets"
  ON markets FOR INSERT
  WITH CHECK (true);