import { useState } from 'react';
import { QtPanel } from './QtPanel';
import { QtButton } from './QtButton';
import { QtInput } from './QtInput';
import { X } from 'lucide-react';

interface CreateMarketModalProps {
  onConfirm: (data: {
    title: string;
    description: string;
    category: string;
    endDate: string;
  }) => void;
  onClose: () => void;
}

export function CreateMarketModal({ onConfirm, onClose }: CreateMarketModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onConfirm({ title, description, category, endDate });
    setIsSubmitting(false);
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateString = minDate.toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="w-full max-w-2xl my-8">
        <QtPanel title="Create New Prediction Market">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <form onSubmit={handleSubmit} className="space-y-4">
            <QtInput
              type="text"
              label="Market Question"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Will Bitcoin reach $100k by end of 2025?"
              required
            />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-300">
                Description
              </label>
              <textarea
                className="w-full px-3 py-2 bg-slate-800 border-2 border-slate-600 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 rounded-sm transition-colors min-h-24"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide details about the market resolution criteria..."
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-300">
                Category
              </label>
              <select
                className="w-full px-3 py-2 bg-slate-800 border-2 border-slate-600 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 rounded-sm transition-colors"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="general">General</option>
                <option value="crypto">Crypto</option>
                <option value="sports">Sports</option>
                <option value="politics">Politics</option>
                <option value="finance">Finance</option>
                <option value="technology">Technology</option>
              </select>
            </div>

            <QtInput
              type="date"
              label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={minDateString}
              required
            />

            <div className="flex gap-2 pt-2">
              <QtButton
                type="submit"
                variant="primary"
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Market'}
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
