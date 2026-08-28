export default function Button({ variant = 'primary', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-accent text-white hover:bg-accent-hover',
    secondary: 'bg-white text-ink border border-border hover:bg-surface-muted',
    danger: 'bg-white text-danger border border-border hover:bg-danger-bg'
  };

  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}