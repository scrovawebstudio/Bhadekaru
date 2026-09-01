import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hoverable = false, ...props }) => {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs transition-all',
        hoverable && 'hover:shadow-md hover:border-slate-300/80 transition-shadow duration-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
