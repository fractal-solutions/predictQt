import { ReactNode } from 'react';

interface QtPanelProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

export function QtPanel({ children, className = '', title }: QtPanelProps) {
  return (
    <div className={`bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-cyan-500/30 rounded-sm qt-shadow ${className}`}>
      {title && (
        <div className="bg-gradient-to-b from-cyan-900/40 to-slate-900/40 border-b-2 border-cyan-500/30 px-4 py-2">
          <h3 className="text-cyan-300 font-semibold text-sm">{title}</h3>
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}
