import { InputHTMLAttributes } from 'react';

interface QtInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function QtInput({ label, className = '', ...props }: QtInputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <input
        className={`w-full px-3 py-2 bg-slate-800 border-2 border-slate-600 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 rounded-sm transition-colors ${className}`}
        {...props}
      />
    </div>
  );
}
