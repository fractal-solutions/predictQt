import { useEffect, useState } from 'react';
import { Market, MarketStats } from './lib/types';
import { MarketCard } from './components/MarketCard';
import { StakeModal } from './components/StakeModal';
import { CreateMarketModal } from './components/CreateMarketModal';
import { QtPanel } from './components/QtPanel';
import { QtButton } from './components/QtButton';
import { TrendingUp, Plus, RefreshCw, Wallet } from 'lucide-react';

type StakeModalState = {
  marketId: string;
  marketTitle: string;
  position: 'yes' | 'no';
} | null;

function App() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [stats, setStats] = useState<Map<string, MarketStats>>(new Map());
  const [loading, setLoading] = useState(true);
  const [stakeModal, setStakeModal] = useState<StakeModalState>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userId] = useState(() => `user-${Math.random().toString(36).substr(2, 9)}`);
  const [filter, setFilter] = useState<string>('all');
  const [balance, setBalance] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(true);

  const initializeWallet = async () => {
    const response = await fetch('/api/wallets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    const data = await response.json();
    setBalance(data.balance);
    setBalanceLoading(false);
  };

  const fetchMarkets = async () => {
    const response = await fetch('/api/markets');
    const { markets, stats } = await response.json();
    setMarkets(markets || []);
    const statsMap = new Map();
    Object.keys(stats).forEach(marketId => {
        statsMap.set(marketId, stats[marketId]);
    });
    setStats(statsMap);
    setLoading(false);
  };

  useEffect(() => {
    initializeWallet();
    fetchMarkets();

    const ws = new WebSocket('ws://localhost:3001/ws');

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const { markets, stats } = JSON.parse(event.data);
      setMarkets(markets || []);
      const statsMap = new Map();
      Object.keys(stats).forEach(marketId => {
          statsMap.set(marketId, stats[marketId]);
      });
      setStats(statsMap);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [userId]);

  const handleStake = (marketId: string, position: 'yes' | 'no') => {
    const market = markets.find(m => m.id === marketId);
    if (market) {
      setStakeModal({
        marketId,
        marketTitle: market.title,
        position
      });
    }
  };

  const handleConfirmStake = async (amount: number) => {
    if (!stakeModal) return;

    if (balance < amount) {
      alert('Insufficient balance. You need more fake money!');
      return;
    }

    const response = await fetch('/api/stakes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            marketId: stakeModal.marketId,
            userId,
            position: stakeModal.position,
            amount
        })
    });

    if (response.ok) {
        const { newBalance } = await response.json();
        setBalance(newBalance);
        setStakeModal(null);
    } else {
        const errorText = await response.text();
        console.error('Error placing stake:', errorText);
        alert(`Failed to place stake. ${errorText}`);
    }
  };

  const handleCreateMarket = async (data: {
    title: string;
    description: string;
    category: string;
    endDate: string;
  }) => {
    const response = await fetch('/api/markets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, userId })
    });


    if (response.ok) {
      setShowCreateModal(false);
    } else {
        const errorText = await response.text();
        console.error('Error creating market:', errorText);
        alert('Failed to create market. Please try again.');
    }
  };

  const filteredMarkets = filter === 'all'
    ? markets
    : markets.filter(m => m.category === filter);

  const categories = ['all', 'general', 'crypto', 'sports', 'politics', 'finance', 'technology'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-slate-900 to-slate-950 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <QtPanel className="border-4 border-cyan-500/40">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-cyan-400" />
              <div>
                <h1 className="text-3xl font-bold text-slate-100">PredictQt</h1>
                <p className="text-sm text-slate-400">Decentralized Prediction Markets</p>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap items-center">
              {!balanceLoading && (
                <div className="bg-slate-800/50 border-2 border-cyan-500/30 rounded-sm px-4 py-2 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-cyan-400" />
                  <div>
                    <p className="text-xs text-slate-400">Balance</p>
                    <p className="text-lg font-bold text-cyan-300">${balance.toFixed(2)}</p>
                  </div>
                </div>
              )}
              <QtButton
                variant="primary"
                onClick={() => fetchMarkets()}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </QtButton>
              <QtButton
                variant="primary"
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Market
              </QtButton>
            </div>
          </div>
        </QtPanel>

        <QtPanel>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <QtButton
                key={cat}
                variant={filter === cat ? 'primary' : 'secondary'}
                onClick={() => setFilter(cat)}
                className="capitalize text-sm"
              >
                {cat}
              </QtButton>
            ))}
          </div>
        </QtPanel>

        {loading ? (
          <QtPanel>
            <div className="text-center py-8 text-slate-400">
              Loading markets...
            </div>
          </QtPanel>
        ) : filteredMarkets.length === 0 ? (
          <QtPanel>
            <div className="text-center py-8 text-slate-400">
              No markets found. Create one to get started!
            </div>
          </QtPanel>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMarkets.map(market => (
              <MarketCard
                key={market.id}
                market={market}
                stats={stats.get(market.id) || null}
                onStake={handleStake}
              />
            ))}
          </div>
        )}
      </div>

      {stakeModal && (
        <StakeModal
          marketTitle={stakeModal.marketTitle}
          position={stakeModal.position}
          onConfirm={handleConfirmStake}
          onClose={() => setStakeModal(null)}
        />
      )}

      {showCreateModal && (
        <CreateMarketModal
          onConfirm={handleCreateMarket}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}

export default App;
