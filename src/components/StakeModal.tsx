import { useState } from 'react';
import { QtPanel } from './QtPanel';
import { QtButton } from './QtButton';
import { QtInput } from './QtInput';
import { X } from 'lucide-react';

interface StakeModalProps {
  marketTitle: string;
  position: 'yes' | 'no';
  onConfirm: (amount: number) => void;
  onClose: () => void;
}

export function StakeModal({ marketTitle, position, onConfirm, onClose }: StakeModalProps) {
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
                {position.toUpperCase()}
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

            <div className="flex gap-2 pt-2">
              <QtButton
                type="submit"
                variant={position}
                className="flex-1"
                disabled={isSubmitting || !amount}
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
