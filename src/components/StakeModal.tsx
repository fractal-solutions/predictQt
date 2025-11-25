import { useState, useEffect } from 'react';
import { QtPanel } from './QtPanel';
import { QtButton } from './QtButton';
import { QtInput } from './QtInput';
import { X } from 'lucide-react';
import { MarketStats } from '../lib/types';

interface StakeModalProps {
  marketTitle: string;
  position: 'yes' | 'no';
  marketStats: MarketStats | null;
  onConfirm: (amount: number) => void;
  onClose: () => void;
}

export function StakeModal({ marketTitle, position, marketStats, onConfirm, onClose }: StakeModalProps) {
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectedPayout, setProjectedPayout] = useState(0);

  const currentOdds = position === 'yes' ? (marketStats?.yes_odds || 50) : (marketStats?.no_odds || 50);

  useEffect(() => {
    const numAmount = parseFloat(amount);
    if (numAmount > 0 && currentOdds > 0) {
      // Simple odds calculation: if odds are 75%, payout is (100/75) * amount
      // This is a simplified model, real prediction markets have more complex payout structures
      const payoutMultiplier = 100 / currentOdds;
      setProjectedPayout(numAmount * payoutMultiplier);
    } else {
      setProjectedPayout(0);
    }
  }, [amount, currentOdds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (numAmount > 0) {
      setIsSubmitting(true);
      await onConfirm(numAmount);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md">
        <QtPanel title={`Stake ${position.toUpperCase()}`}>
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-slate-800 border-2 border-slate-700 rounded-sm p-3">
              <p className="text-sm font-medium text-slate-300 mb-1">Market:</p>
              <p className="text-sm text-slate-400">{marketTitle}</p>
            </div>

            <div className="bg-slate-800 border-2 border-slate-700 rounded-sm p-3">
              <p className="text-sm font-medium text-slate-300 mb-1">Position:</p>
              <p className={`text-lg font-bold ${
                position === 'yes' ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {position.toUpperCase()} ({currentOdds.toFixed(0)}%)
              </p>
            </div>

            <QtInput
              type="number"
              label="Stake Amount ($)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0.01"
              step="0.01"
              placeholder="Enter amount"
              required
            />

            {parseFloat(amount) > 0 && (
              <div className="bg-slate-800 border-2 border-slate-700 rounded-sm p-3 text-sm text-slate-300">
                <p>Current Odds for {position.toUpperCase()}: <span className="font-bold">{currentOdds.toFixed(0)}%</span></p>
                <p>Projected Payout: <span className="font-bold text-green-400">${projectedPayout.toFixed(2)}</span></p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <QtButton
                type="submit"
                variant={position}
                className="flex-1"
                disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
              >
                {isSubmitting ? 'Placing...' : 'Place Stake'}
              </QtButton>
              <QtButton
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </QtButton>
            </div>
          </form>
        </QtPanel>
      </div>
    </div>
  );
}
