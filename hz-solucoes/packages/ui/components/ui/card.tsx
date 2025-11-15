import React from 'react';

type BaseProps = React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode };

export function Card({ className = '', children, ...rest }: BaseProps) {
  return (
    <div
      className={`rounded-xl border bg-white shadow-sm dark:bg-neutral-900 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children, ...rest }: BaseProps) {
  return (
    <div className={`p-4 border-b ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardContent({ className = '', children, ...rest }: BaseProps) {
  return (
    <div className={`p-4 ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardTitle({ className = '', children, ...rest }: BaseProps) {
  return (
    <h3 className={`text-lg font-semibold ${className}`} {...rest}>
      {children}
    </h3>
  );
}