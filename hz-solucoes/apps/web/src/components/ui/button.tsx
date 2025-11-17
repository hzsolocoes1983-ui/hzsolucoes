import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline';
  size?: 'sm' | 'md' | 'lg';
};

export function Button({ className = '', variant = 'default', size = 'md', children, ...rest }: ButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none touch-manipulation active:scale-95';
  const styles = variant === 'outline'
    ? 'border border-neutral-300 bg-transparent text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200'
    : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800';
  
  const sizeStyles = {
    sm: 'text-xs px-2 py-1 min-h-[32px]',
    md: 'text-sm px-4 py-2 min-h-[44px]',
    lg: 'text-base px-6 py-3 min-h-[48px]',
  };
  
  return (
    <button 
      className={`${base} ${styles} ${sizeStyles[size]} ${className}`} 
      style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
      {...rest}
    >
      {children}
    </button>
  );
}

