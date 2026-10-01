import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  GitCompare,
  Search,
  FlaskConical,
  Database,
  Crown,
  Activity,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
} from 'lucide-react';
import { TooltipProvider } from './ui/tooltip';
import { Tip } from './kit';

export const NAV = [
  {
    to: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
    hint: 'Overview & KPIs',
  },
  {
    to: '/players',
    label: 'Players',
    icon: Users,
    hint: 'Explore every cap',
  },
  {
    to: '/compare',
    label: 'Compare',
    icon: GitCompare,
    hint: 'Head-to-head',
  },
  {
    to: '/search',
    label: 'Smart Search',
    icon: Search,
    hint: 'DSA-powered lookup',
  },
  {
    to: '/lab',
    label: 'Algorithm Lab',
    icon: FlaskConical,
    hint: 'Live visualizations',
  },
  {
    to: '/dataset',
    label: 'Dataset',
    icon: Database,
    hint: 'Raw CSV records',
  },
  {
    to: '/captains',
    label: 'Captains',
    icon: Crown,
    hint: 'Leadership analytics',
  },
];

const isActive = (to, path) =>
  to === '/' ? path === '/' : path.startsWith(to);

function Brand({ collapsed }) {
  return (
    <Link
      to="/"
      className="flex items-center gap-3 px-4 h-[72px] border-b border-[#23312A] overflow-hidden"
      data-testid="brand-home"
    >
      <div className="relative h-9 w-9 shrink-0 rounded-md bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center">
        <Activity className="h-5 w-5 text-emerald-400" />

        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 pulse-dot" />
      </div>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="whitespace-nowrap"
          >
            <div
              className="font-black tracking-tight text-[15px] leading-none"
              style={{ fontFamily: 'Outfit' }}
            >
              SPORTS
              <span className="text-emerald-400">PULSE</span>
            </div>

            <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mt-1">
              Performance Intel
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Link>
  );
}

function NavItem({
  item,
  active,
  collapsed,
  onClick,
  prefix = 'nav',
}) {
  const { to, label, icon: Icon } = item;

  const link = (
    <Link
      to={to}
      onClick={onClick}
      data-testid={`${prefix}-${label
        .toLowerCase()
        .replace(/\s+/g, '-')}`}
      className={[
        'relative flex items-center gap-3 rounded-md text-sm',
        'transition-colors duration-200',
        collapsed
          ? 'justify-center px-0 py-2.5'
          : 'px-3 py-2.5',
        active
          ? 'text-emerald-300'
          : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#141B18]',
      ].join(' ')}
    >
      {active && (
        <motion.span
          layoutId={`nav-active-${prefix}`}
          className="absolute inset-0 rounded-md bg-emerald-500/10 border border-emerald-500/25"
          transition={{
            type: 'spring',
            stiffness: 380,
            damping: 32,
          }}
        />
      )}

      {active && (
        <motion.span
          layoutId={`nav-bar-${prefix}`}
          className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,.8)]"
          transition={{
            type: 'spring',
            stiffness: 380,
            damping: 32,
          }}
        />
      )}

      <Icon
        className={[
          'relative z-10 h-4 w-4 shrink-0',
          active ? 'text-emerald-400' : '',
        ].join(' ')}
      />

      {!collapsed && (
        <span className="relative z-10 flex-1 truncate">
          {label}
        </span>
      )}
    </Link>
  );

  return collapsed ? (
    <Tip label={label} side="right">
      {link}
    </Tip>
  ) : (
    link
  );
}

export default function Layout({ children }) {
  const loc = useLocation();

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sp-sidebar') === '1';
    } catch {
      return false;
    }
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(
        'sp-sidebar',
        collapsed ? '1' : '0'
      );
    } catch {
      // Ignore localStorage errors
    }
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);

    window.scrollTo({
      top: 0,
      behavior: 'auto',
    });
  }, [loc.pathname]);

  return (
    <TooltipProvider delayDuration={150}>
      <div
        className="min-h-screen flex"
        style={{ background: '#090D0B' }}
      >
        {/* DESKTOP SIDEBAR */}
        <motion.aside
          animate={{
            width: collapsed ? 72 : 256,
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
          }}
          className="hidden lg:flex flex-col border-r border-[#23312A] bg-[#0B110E] sticky top-0 h-screen shrink-0 overflow-hidden z-40"
          data-testid="sidebar"
        >
          <Brand collapsed={collapsed} />

          <nav
            className={`flex-1 space-y-1 ${
              collapsed ? 'p-2' : 'p-3'
            }`}
          >
            {NAV.map((item) => (
              <NavItem
                key={item.to}
                item={item}
                active={isActive(item.to, loc.pathname)}
                collapsed={collapsed}
              />
            ))}
          </nav>

          <div className="border-t border-[#23312A] p-3">
            <button
              data-testid="sidebar-toggle"
              onClick={() => setCollapsed((current) => !current)}
              className="w-full flex items-center justify-center gap-2 rounded-md py-2 text-xs text-zinc-500 hover:text-emerald-300 hover:bg-[#141B18] transition-colors"
              type="button"
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <>
                  <PanelLeftClose className="h-4 w-4" />
                  <span>Collapse</span>
                </>
              )}
            </button>

            {!collapsed && (
              <div className="px-1 pt-2 text-[10px] text-zinc-600 tracking-wider uppercase whitespace-nowrap">
                v2.0 · Real data · 7 algorithms
              </div>
            )}
          </div>
        </motion.aside>

        {/* MAIN AREA */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* MOBILE HEADER */}
          <header className="lg:hidden sticky top-0 z-40 glass border-b border-[#23312A] px-4 h-14 flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-2"
              data-testid="mobile-brand"
            >
              <Activity className="h-5 w-5 text-emerald-400" />

              <span
                className="font-black tracking-tight"
                style={{ fontFamily: 'Outfit' }}
              >
                SPORTS
                <span className="text-emerald-400">PULSE</span>
              </span>
            </Link>

            <button
              data-testid="mobile-menu-btn"
              onClick={() => setMobileOpen((open) => !open)}
              className="p-2 rounded-md text-zinc-300 hover:bg-[#141B18] transition-colors"
              type="button"
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </header>

          {/* MOBILE NAV */}
          <AnimatePresence>
            {mobileOpen && (
              <motion.nav
                initial={{
                  opacity: 0,
                  y: -8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: -8,
                }}
                transition={{
                  duration: 0.16,
                  ease: 'easeOut',
                }}
                className="lg:hidden fixed top-14 inset-x-0 z-30 bg-[#0B110E]/95 backdrop-blur-xl border-b border-[#23312A] p-3 space-y-1"
                data-testid="mobile-nav"
              >
                {NAV.map((item) => (
                  <NavItem
                    key={item.to}
                    item={item}
                    prefix="mnav"
                    active={isActive(
                      item.to,
                      loc.pathname
                    )}
                    collapsed={false}
                    onClick={() => setMobileOpen(false)}
                  />
                ))}
              </motion.nav>
            )}
          </AnimatePresence>

          {/* PAGE CONTENT */}
          <main className="flex-1 min-w-0 relative">
            {/*
              IMPORTANT:
              No AnimatePresence mode="wait" here.
              The previous implementation waited for the old
              route animation to finish before mounting the new
              page, which can make navigation feel slow/blank.

              Using a keyed motion element gives us a lightweight
              entrance animation while allowing the new route to
              mount immediately.
            */}
            <motion.div
              key={loc.pathname}
              initial={{
                opacity: 0,
                y: 6,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.14,
                ease: 'easeOut',
              }}
              className="min-h-full"
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}