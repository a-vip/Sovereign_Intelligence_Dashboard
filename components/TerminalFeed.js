'use client';
import { useState, useEffect, useRef } from 'react';

const TAG_COLORS = {
  INFO: '#38bdf8',
  NEW: '#22c55e',
  ALERT: '#facc15',
  CRITICAL: '#ff2d55',
  VAULT: '#a855f7',
};

function formatTimeOnly(dateString) {
  if (!dateString) return '';
  let d;
  
  // Handle GDELT format YYYYMMDDHHMMSS
  if (typeof dateString === 'string' && /^\d{14}$/.test(dateString)) {
    d = new Date(dateString.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6Z'));
  } else {
    d = new Date(dateString);
  }
  
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

export default function TerminalFeed() {
  const [eventQueue, setEventQueue] = useState([]);
  const [displayedEvents, setDisplayedEvents] = useState([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const containerRef = useRef(null);

  // Initial fetch
  useEffect(() => {
    async function fetchFeed() {
      try {
        const res = await fetch('/api/events');
        const data = await res.json();
        
        if (data.events && data.events.length > 0) {
          // data.events is already sorted newest first in the API
          const events = [...data.events];
          
          // Show the newest 8 events immediately
          const initialDisplay = events.slice(0, 8);
          // Put the rest in the queue for the ticker
          const remainingQueue = events.slice(8);
          
          setDisplayedEvents(initialDisplay);
          setEventQueue(remainingQueue);
          setIsInitializing(false);
        }
      } catch (err) {
        console.error("Failed to fetch terminal feed", err);
      }
    }
    
    fetchFeed();
  }, []);

  // 10-second tick to rotate the feed
  useEffect(() => {
    if (isInitializing || eventQueue.length === 0) return;

    const interval = setInterval(() => {
      setEventQueue((prevQueue) => {
        if (prevQueue.length === 0) return prevQueue;
        
        // Take the next event from the queue
        const nextEvent = prevQueue[0];
        const newQueue = prevQueue.slice(1);
        
        // Loop it back to the end
        newQueue.push(nextEvent);

        setDisplayedEvents((prevDisplay) => {
          // Newest items are at the top
          const updated = [nextEvent, ...prevDisplay];
          if (updated.length > 25) return updated.slice(0, 25);
          return updated;
        });

        return newQueue;
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [isInitializing, eventQueue.length]);

  return (
    <div className="terminal-feed-container">
      <div className="terminal-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
           <div className="terminal-live-dot"></div>
           <span className="terminal-title">OSINT COMMAND FEED</span>
        </div>
        <span className="terminal-live-badge">REAL-TIME</span>
      </div>
      
      <div className="terminal-content" ref={containerRef}>
        {displayedEvents.map((ev, i) => {
          const isVault = ev.source?.includes('Vault') || ev.source?.includes('OCHA') || ev.source?.includes('HRW');
          
          let tag = ev.tag || (isVault ? 'VAULT' : 'INFO');
          if (!ev.tag && !isVault) {
             if (ev.severity >= 5) tag = 'CRITICAL';
             else if (ev.severity === 4) tag = 'ALERT';
             else if (i === 0) tag = 'NEW';
          }

          const tagColor = TAG_COLORS[tag] || TAG_COLORS.INFO;

          return (
            <div key={`${ev.id}-${i}`} className="terminal-entry" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="terminal-meta">
                <span className="terminal-time">[{formatTimeOnly(ev.timestamp)}]</span>
                <span className="terminal-tag" style={{ color: tagColor, borderColor: `${tagColor}40`, backgroundColor: `${tagColor}10` }}>
                  {tag}
                </span>
                <span className="terminal-source" style={{ color: '#475569', fontSize: '0.65rem', marginLeft: 'auto', fontFamily: 'monospace' }}>
                  SRC://{ev.source?.split('.')[0].toUpperCase() || 'UNKNOWN'}
                </span>
              </div>
              <div className="terminal-text" style={{ color: isVault ? '#f8fafc' : '#94a3b8' }}>
                {isVault && <span style={{ color: '#a855f7', marginRight: '6px' }}>▶</span>}
                {ev.title}
              </div>
            </div>
          );
        })}
        {displayedEvents.length === 0 && <div className="terminal-text">ESTABLISHING UPLINK...</div>}
      </div>
      
      <style jsx>{`
        .terminal-live-dot {
          width: 6px;
          height: 6px;
          background: #22c55e;
          border-radius: 50%;
          box-shadow: 0 0 8px #22c55e;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.3; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
