import { useEffect, useState } from 'react';
import { QtPanel } from './QtPanel';
import { QtButton } from './QtButton';
import { UserBet, MarketStats } from '../lib/types';
import { TrendingUp, XCircle } from 'lucide-react';

interface UserBetsPanelProps {
  userId: string;
  markets: any[]; // This should be Market[] but to avoid circular dependency, using any for now
  marketStats: Map<string, MarketStats>;
  onBetExit: () => void; // Callback to refresh bets after exit
}

export function UserBetsPanel({ userId, markets, marketStats, onBetExit }: UserBetsPanelProps) {
  const [userBets, setUserBets] = useState<UserBet[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserBets = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/user/bets/${userId}`);
      if (response.ok) {
        const bets: UserBet[] = await response.json();
        setUserBets(bets);
      } else {
        console.error('Failed to fetch user bets:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching user bets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserBets();
  }, [userId, onBetExit]); // onBetExit as dependency to refetch after an exit

  const handleExitBet = async (betId: string) => {
    if (!confirm('Are you sure you want to exit this bet? A small fee will be applied.')) {
      return;
    }

    try {
      const response = await fetch(`/api/bets/${betId}/exit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        const { payout } = await response.json();
        alert(`Bet exited successfully! You received ${payout.toFixed(2)}`);
        onBetExit(); // Trigger refresh in App.tsx
      } else {
        const errorText = await response.text();
        alert(`Failed to exit bet: ${errorText}`);
      }
    } catch (error) {
      console.error('Error exiting bet:', error);
      alert('An unexpected error occurred while trying to exit the bet.');
    }
  };

  if (loading) {
    return (
      <QtPanel>
        <div className="text-center py-4 text-slate-400">Loading your bets...</div>
      </QtPanel>
    );
  }

  if (userBets.length === 0) {
    return (
      <QtPanel>
        <div className="text-center py-4 text-slate-400">You have no active bets.</div>
      </QtPanel>
    );
  }

  return (
    <QtPanel title="Your Active Bets">
      <div className="space-y-4">
        {userBets.map(bet => {
          const market = markets.find(m => m.id === bet.market_id);
          const stats = marketStats.get(bet.market_id);
          const currentOdds = bet.position === 'yes' ? (stats?.yes_odds || 50) : (stats?.no_odds || 50);
          const currentMarketValue = bet.shares_owned * (currentOdds / 100);
          const profitLoss = currentMarketValue - bet.cost_basis;

          if (!market) return null;

          return (
            <div key={bet.id} className="bg-slate-800/50 border-2 border-slate-700 rounded-sm p-3 space-y-2">
              <p className="text-sm font-medium text-slate-300">{market.title}</p>
              <div className="flex justify-between items-center text-sm">
                <span className={`font-bold ${bet.position === 'yes' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {bet.position.toUpperCase()} Shares: {bet.shares_owned.toFixed(2)}
                </span>
                <span className="text-slate-400">Cost Basis: ${bet.cost_basis.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Current Odds: {currentOdds.toFixed(0)}%</span>
                <span className={`font-bold ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  P/L: ${profitLoss.toFixed(2)}
                </span>
              </div>
              <QtButton
                variant="secondary"
                className="w-full flex items-center justify-center gap-2 mt-2"
                onClick={() => handleExitBet(bet.id)}
              >
                <XCircle className="w-4 h-4" />
                Exit Bet
              </QtButton>
            </div>
          );
        })}
      </div>
    </QtPanel>
  );
}
