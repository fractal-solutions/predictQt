import { ButtonHTMLAttributes } from 'react';

interface QtButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'yes' | 'no';
}

export function QtButton({
  children,
  variant = 'primary',
  className = '',
  ...props
}: QtButtonProps) {
  const baseClasses = "px-4 py-2 font-medium transition-all duration-200 border-2 rounded-sm qt-shadow hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-px";

  const variantClasses = {
    primary: "bg-gradient-to-b from-slate-700 to-slate-800 border-cyan-500/50 hover:border-cyan-400 text-slate-100 hover:from-slate-600 hover:to-slate-700",
    secondary: "bg-gradient-to-b from-slate-800 to-slate-900 border-slate-600 hover:border-slate-500 text-slate-300 hover:from-slate-700 hover:to-slate-800",
    yes: "bg-gradient-to-b from-emerald-600 to-emerald-700 border-emerald-400 hover:border-emerald-300 text-white hover:from-emerald-500 hover:to-emerald-600",
    no: "bg-gradient-to-b from-red-600 to-red-700 border-red-400 hover:border-red-300 text-white hover:from-red-500 hover:to-red-600"
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
