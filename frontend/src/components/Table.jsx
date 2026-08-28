export function Table({ children }) {
  return <table className="w-full text-sm border-collapse">{children}</table>;
}

export function THead({ children }) {
  return (
    <thead>
      <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-ink-muted">
        {children}
      </tr>
    </thead>
  );
}

export function TH({ children }) {
  return <th className="py-2 pr-4 font-medium">{children}</th>;
}

export function TBody({ children }) {
  return <tbody className="divide-y divide-border">{children}</tbody>;
}

export function TD({ children, className = '' }) {
  return <td className={`py-3 pr-4 text-ink align-top ${className}`}>{children}</td>;
}