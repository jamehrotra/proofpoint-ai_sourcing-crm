interface PageShellProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageShell({ children, title, description, action }: PageShellProps) {
  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      {(title || action) && (
        <div className="flex items-start justify-between mb-6">
          <div>
            {title && <h1 className="text-xl font-semibold text-gray-900">{title}</h1>}
            {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </main>
  );
}
