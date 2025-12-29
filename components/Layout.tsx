import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, className = "" }) => {
  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto shadow-2xl overflow-hidden relative ${className}`}>
      {children}
    </div>
  );
};

export const Header: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <header className="px-6 pt-12 pb-6 bg-white border-b border-gray-100 sticky top-0 z-10">
    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
    {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
  </header>
);
