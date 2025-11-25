/*
  # Seed Initial Prediction Markets

  Adds a collection of diverse prediction markets across different categories
  to provide a rich starting experience for users.
*/

INSERT INTO markets (title, description, category, end_date, status, created_by)
VALUES
  (
    'Will Bitcoin reach $100k by end of 2025?',
    'Resolves YES if Bitcoin (BTC) closes at or above $100,000 USD on any major exchange by December 31, 2025. Resolves NO if it fails to reach this price by the deadline.',
    'crypto',
    '2025-12-31 23:59:59+00',
    'active',
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'Will Ethereum reach $5,000 by Q4 2025?',
    'Resolves YES if Ethereum (ETH) reaches $5,000 USD or higher on any major exchange before end of Q4 2025. Resolves NO otherwise.',
    'crypto',
    '2025-12-31 23:59:59+00',
    'active',
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'Will AI create a superintelligence by 2026?',
    'Resolves YES if credible AI researchers consensus that an AGI or superintelligence has been created by December 31, 2026. Resolves NO if consensus is not reached.',
    'technology',
    '2026-12-31 23:59:59+00',
    'active',
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'Will SpaceX land humans on Mars by 2028?',
    'Resolves YES if SpaceX successfully lands humans on Mars before January 1, 2029. Resolves NO if this does not occur by the deadline.',
    'technology',
    '2028-12-31 23:59:59+00',
    'active',
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'Will the S&P 500 close above 7,000 by end of 2025?',
    'Resolves YES if the S&P 500 index closes at or above 7,000 on December 29, 2025 (last trading day). Resolves NO if it closes below 7,000.',
    'finance',
    '2025-12-31 23:59:59+00',
    'active',
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'Will the US unemployment rate be below 4% by Q4 2025?',
    'Resolves YES if the US unemployment rate reported by the Bureau of Labor Statistics is below 4.0% in any month of Q4 2025. Resolves NO otherwise.',
    'finance',
    '2025-12-31 23:59:59+00',
    'active',
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'Will Taylor Swift win a Grammy in 2026?',
    'Resolves YES if Taylor Swift wins at least one Grammy Award at the 2026 Grammy Awards ceremony. Resolves NO if she wins none.',
    'general',
    '2026-02-28 23:59:59+00',
    'active',
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'Will the world population exceed 8.2 billion by 2026?',
    'Resolves YES if UN estimates put world population at 8.2 billion or higher at any point in 2026. Resolves NO if it remains below 8.2 billion.',
    'general',
    '2026-12-31 23:59:59+00',
    'active',
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'Will a new cryptocurrency surpass $100B market cap in 2025?',
    'Resolves YES if any cryptocurrency (excluding top 10 by market cap as of Jan 1 2025) reaches a $100B market cap. Resolves NO otherwise.',
    'crypto',
    '2025-12-31 23:59:59+00',
    'active',
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'Will the US pass major AI regulation by 2026?',
    'Resolves YES if the US Congress passes and the President signs comprehensive AI regulation legislation by December 31, 2026. Resolves NO otherwise.',
    'technology',
    '2026-12-31 23:59:59+00',
    'active',
    '00000000-0000-0000-0000-000000000001'
  )
ON CONFLICT DO NOTHING;