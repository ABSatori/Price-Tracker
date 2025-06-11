
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-card dark:bg-slate-700 rounded-xl shadow-lg border border-contentBorder dark:border-slate-600 ${className}`}>
      {children}
    </div>
  );
};

export default Card;