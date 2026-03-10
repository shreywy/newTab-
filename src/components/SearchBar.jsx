import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight, X } from 'lucide-react';

const MAX_SUGGESTIONS = 7;

async function fetchSuggestions(query) {
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=en&q=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    const data = await res.json();
    return (data[1] ?? []).slice(0, MAX_SUGGESTIONS);
  } catch { return []; }
}

// Deterministic widths for skeleton rows so they don't shift on re-render
const SKELETON_WIDTHS = ['62%', '78%', '55%', '71%', '83%', '59%', '68%'];

const iconButtonCls = 'flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full cursor-pointer transition-all duration-150';

export default function SearchBar({ showSuggestions = true, onHasQuery }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
  const fetchTimer = useRef(null);
  const containerRef = useRef(null);

  const hasText = query.trim().length > 0;
  const open = focused && showSuggestions && hasText;

  useEffect(() => { onHasQuery?.(focused && hasText); }, [focused, hasText, onHasQuery]);

  useEffect(() => {
    clearTimeout(fetchTimer.current);
    if (!hasText || !showSuggestions) { setSuggestions([]); setLoading(false); return; }
    setLoading(true);
    fetchTimer.current = setTimeout(async () => {
      const results = await fetchSuggestions(query);
      setSuggestions(results);
      setLoading(false);
      setActiveIdx(-1);
    }, 120);
    return () => clearTimeout(fetchTimer.current);
  }, [query, showSuggestions, hasText]);

  useEffect(() => {
    const handler = (e) => { if (!containerRef.current?.contains(e.target)) setFocused(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navigate = useCallback((q) => {
    const trimmed = (q ?? query).trim();
    if (!trimmed) return;
    window.location.href = `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
  }, [query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate(activeIdx >= 0 ? suggestions[activeIdx] : undefined);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown' && open) {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp' && open) {
      e.preventDefault();
      setActiveIdx(i => (i <= 0 ? -1 : i - 1));
    } else if (e.key === 'Escape') {
      setSuggestions([]); setFocused(false); inputRef.current?.blur();
    }
  };

  const clearQuery = () => {
    setQuery(''); setSuggestions([]); setLoading(false); setActiveIdx(-1);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Single glass card — expands to include results */}
      <div className="glass glass-hover rounded-2xl overflow-hidden">

        {/* ── Input row ── */}
        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-3 px-5 py-3.5">
            <Search className="w-5 h-5 text-white/40 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setActiveIdx(-1); }}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              placeholder="Search the web..."
              className="flex-1 bg-transparent text-white placeholder-white/30 outline-none text-sm font-light"
              style={{ fontFamily: 'var(--font-search, inherit)' }}
              autoComplete="off"
              spellCheck="false"
            />

            {/* Clear button */}
            <AnimatePresence>
              {query && (
                <motion.button
                  key="clear"
                  type="button"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.1 }}
                  onClick={clearQuery}
                  className={`${iconButtonCls} text-white/35 hover:text-white/70`}
                  style={{ background: 'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.10)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <X className="w-3.5 h-3.5" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Submit button */}
            {hasText && (
              <button
                type="submit"
                className={`${iconButtonCls} text-white/50 hover:text-white`}
                style={{ background: 'transparent' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.10)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

        {/* ── Results panel (extends the same glass card) ── */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              transition={{ type: 'spring', stiffness: 440, damping: 36 }}
              style={{ overflow: 'hidden' }}
            >
              {/* Separator */}
              <div className="mx-5" style={{ height: '1px', background: 'rgba(255,255,255,0.08)' }} />

              {/* Content: fade between skeleton and real results */}
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={loading ? 'skeleton' : 'results'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className="py-1.5"
                >
                  {loading ? (
                    /* Skeleton rows — same count and height as real rows */
                    SKELETON_WIDTHS.map((w, i) => (
                      <div key={i} className="flex items-center gap-3 px-5 py-2.5">
                        <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ opacity: 0.12 }} />
                        <div
                          className="h-2.5 rounded-full"
                          style={{ width: w, background: 'rgba(255,255,255,0.07)', animation: 'pulse 1.5s ease-in-out infinite' }}
                        />
                      </div>
                    ))
                  ) : (
                    suggestions.map((s, i) => (
                      <button
                        key={s}
                        onMouseDown={(e) => { e.preventDefault(); navigate(s); }}
                        onMouseEnter={() => setActiveIdx(i)}
                        onMouseLeave={() => setActiveIdx(-1)}
                        className="w-full flex items-center gap-3 px-5 py-2.5 text-left cursor-pointer transition-colors duration-75"
                        style={{
                          background: activeIdx === i ? 'rgba(255,255,255,0.07)' : 'transparent',
                          color: activeIdx === i ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.55)',
                          fontFamily: 'var(--font-search, inherit)',
                        }}
                      >
                        <Search className="w-3.5 h-3.5 flex-shrink-0 opacity-30" />
                        <span className="text-sm truncate">{s}</span>
                      </button>
                    ))
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
