import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  active?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="flex items-center text-sm text-slate-500 py-3 overflow-x-auto whitespace-nowrap scrollbar-none" aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5">
        <li>
          <button
            onClick={items[0]?.onClick}
            className="flex items-center gap-1 hover:text-blue-600 transition-colors cursor-pointer text-slate-600"
          >
            <Home className="w-4 h-4 text-blue-500" />
            <span>หน้าแรก</span>
          </button>
        </li>
        {items.slice(1).map((item, idx) => (
          <li key={idx} className="flex items-center gap-1.5">
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {item.active ? (
              <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md" aria-current="page">
                {item.label}
              </span>
            ) : (
              <button
                onClick={item.onClick}
                className="hover:text-blue-600 transition-colors cursor-pointer max-w-[200px] truncate"
              >
                {item.label}
              </button>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
