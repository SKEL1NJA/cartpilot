import { NavLink } from 'react-router-dom';

const linkClass = ({ isActive }) =>
  `text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
    isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white'
  }`;

export default function Navbar() {
  return (
    <nav className="bg-nav border-b border-black/20">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <span className="text-white font-semibold tracking-tight">CartPilot</span>
          <div className="flex items-center gap-1">
            <NavLink to="/" end className={linkClass}>Storefront</NavLink>
            <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-2.5 py-1 text-xs text-white/70">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Test Mode
        </span>
      </div>
    </nav>
  );
}