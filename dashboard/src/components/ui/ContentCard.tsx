import type { ReactNode } from 'react';
import { clsx } from 'clsx';

interface ContentCardProps {
  title: string;
  subtitle?: string;
  image?: string | null;
  badge?: ReactNode;
  actions?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function ContentCard({
  title,
  subtitle,
  image,
  badge,
  actions,
  onClick,
  className,
}: ContentCardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden',
        onClick && 'cursor-pointer hover:shadow-md transition-shadow',
        className,
      )}
    >
      {image && (
        <div className="h-40 bg-gray-100">
          <img src={image} alt={title} className="h-full w-full object-cover" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-medium text-gray-900">{title}</h3>
            {subtitle && <p className="mt-1 truncate text-xs text-gray-500">{subtitle}</p>}
          </div>
          {badge}
        </div>
        {actions && <div className="mt-3 flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
