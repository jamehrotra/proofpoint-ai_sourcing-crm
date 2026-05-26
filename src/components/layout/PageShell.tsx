interface PageShellProps {
  children: React.ReactNode;
  eyebrow?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  masthead?: React.ReactNode;
}

export function PageShell({ children, eyebrow, title, description, action, masthead }: PageShellProps) {
  const hasHeader = eyebrow || title || description || action || masthead;

  return (
    <main className="mx-auto max-w-7xl px-8 py-12">
      {hasHeader && (
        <header className="flex items-end justify-between gap-8 pb-8 mb-12 border-b-2 border-[#1a1816]">
          <div>
            {eyebrow && <div className="text-eyebrow text-[#6b1f2a] mb-2">{eyebrow}</div>}
            {title && (
              <h1 className="font-serif text-[42px] font-normal leading-[1.05] tracking-[-0.02em] text-[#1a1816]">
                {title}
              </h1>
            )}
            {description && !masthead && (
              <p className="mt-4 text-[15px] text-[#6b6358] max-w-2xl leading-relaxed">{description}</p>
            )}
          </div>
          {(action || masthead) && (
            <div className="flex flex-col items-end gap-3 shrink-0">
              {masthead}
              {action}
            </div>
          )}
        </header>
      )}
      {children}
    </main>
  );
}
