import { Market, MarketStats } from '../lib/types';
import { QtPanel } from './QtPanel';
import { QtButton } from './QtButton';
import { TrendingUp, Calendar, Users } from 'lucide-react';

interface MarketCardProps {
  market: Market;
  stats: MarketStats | null;
  onStake: (marketId: string, position: 'yes' | 'no') => void;
}

export function MarketCard({ market, stats, onStake }: MarketCardProps) {
  const endDate = new Date(market.end_date);
  const isExpired = endDate < new Date();
  const yesOdds = stats?.yes_odds || 50;
  const noOdds = stats?.no_odds || 50;
  const totalVolume = stats?.total_volume || 0;

  return (
    <QtPanel className="hover:shadow-xl transition-shadow duration-200">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-slate-100 text-lg leading-tight flex-1">
            {market.title}
          </h3>
          <span className={`px-2 py-1 text-xs font-semibold border rounded-sm ${
            market.status === 'active' && !isExpired
              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
              : 'bg-slate-700/50 border-slate-600 text-slate-400'
          }`}>
            {isExpired ? 'CLOSED' : market.status.toUpperCase()}
          </span>
        </div>

        <p className="text-sm text-slate-400 line-clamp-2">{market.description}</p>

        <div className="bg-slate-800/50 border-2 border-slate-700 rounded-sm p-3 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Ends: {endDate.toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>Vol: ${totalVolume.toFixed(0)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>Liq: ${market.initial_liquidity_amount.toFixed(0)}</span>
            </div>
          </div>

          <div className="relative h-6 bg-slate-700 border border-slate-600 rounded-sm overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500"
              style={{ width: `${yesOdds}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-between px-2 text-xs font-bold">
              <span className="text-white drop-shadow-md">{yesOdds}% YES</span>
              <span className="text-slate-300 drop-shadow-md">{noOdds}% NO</span>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <QtButton
              variant="yes"
              onClick={() => onStake(market.id, 'yes')}
              disabled={isExpired || market.status !== 'active'}
              className="flex-1 text-sm"
            >
              <div className="flex items-center justify-center gap-1">
                <TrendingUp className="w-4 h-4" />
                <span>Stake YES</span>
              </div>
            </QtButton>
            <QtButton
              variant="no"
              onClick={() => onStake(market.id, 'no')}
              disabled={isExpired || market.status !== 'active'}
              className="flex-1 text-sm"
            >
              <div className="flex items-center justify-center gap-1">
                <TrendingUp className="w-4 h-4 rotate-180" />
                <span>Stake NO</span>
              </div>
            </QtButton>
          </div>
        </div>
      </div>
    </QtPanel>
  );
}
