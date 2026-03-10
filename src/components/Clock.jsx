import React, { useState, useEffect } from 'react';

function getGreeting(hour) {
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Good night';
}

function formatTime(date, { hour12 = true, showSeconds = false } = {}) {
  if (hour12) {
    const hours = date.getHours() % 12 || 12;
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const secs = showSeconds ? `:${String(date.getSeconds()).padStart(2, '0')}` : '';
    return { display: `${hours}:${minutes}${secs}`, ampm: date.getHours() >= 12 ? 'PM' : 'AM' };
  } else {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const secs = showSeconds ? `:${String(date.getSeconds()).padStart(2, '0')}` : '';
    return { display: `${hours}:${minutes}${secs}`, ampm: null };
  }
}

function formatDate(date, format = 'full') {
  if (format === 'short')
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  if (format === 'numeric')
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function Clock({ clockSettings = {} }) {
  const {
    hour12 = true,
    showSeconds = false,
    dateFormat = 'full',
    showGreeting = true,
    timeSize = 72,
    dateSize = 14,
  } = clockSettings;

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const { display, ampm } = formatTime(now, { hour12, showSeconds });
  const greeting = getGreeting(now.getHours());
  const dateStr = formatDate(now, dateFormat);

  return (
    <div className="flex flex-col items-center select-none">
      {showGreeting && (
        <p className="text-white/40 font-light tracking-widest uppercase mb-3"
          style={{ fontSize: '11px', fontFamily: 'var(--font-greeting, inherit)' }}>
          {greeting}
        </p>
      )}
      <div className="flex items-end gap-1">
        <span
          className="font-thin tracking-tight text-white leading-none"
          style={{ fontSize: `${timeSize}px`, fontFamily: 'var(--font-time, inherit)' }}
        >
          {display}
        </span>
        {ampm && (
          <span
            className="font-light text-white/50 mb-1 ml-1"
            style={{ fontSize: `${Math.round(timeSize * 0.33)}px`, fontFamily: 'var(--font-time, inherit)' }}
          >
            {ampm}
          </span>
        )}
      </div>
      <p
        className="text-white/50 mt-2 tracking-wide"
        style={{ fontSize: `${dateSize}px`, fontFamily: 'var(--font-date, inherit)' }}
      >
        {dateStr}
      </p>
    </div>
  );
}
