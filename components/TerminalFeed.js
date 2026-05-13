'use client';
import { useState, useEffect, useRef } from 'react';

const TAG_COLORS = {
  INFO: '#38bdf8',
  NEW: '#22c55e',
  ALERT: '#facc15',
  CRITICAL: '#ff2d55',
};

function formatTimeOnly(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d)) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) + ' UTC';
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
          // Shuffle or reverse so it's interesting
          const events = [...data.events].reverse();
          
          // Pre-fill the display with the first 5 events to make it look populated
          const initialDisplay = events.slice(0, 5);
          const remainingQueue = events.slice(5);
          
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

  // 8-second tick to pop from queue
  useEffect(() => {
    if (isInitializing || eventQueue.length === 0) return;

    const interval = setInterval(() => {
      setEventQueue((prevQueue) => {
        if (prevQueue.length === 0) return prevQueue;
        
        const nextEvent = prevQueue[0];
        const newQueue = prevQueue.slice(1);
        
        // Add back to the end of the queue to loop infinitely
        newQueue.push(nextEvent);

        setDisplayedEvents((prevDisplay) => {
          // Keep max 20 events in the visual feed
          const updated = [nextEvent, ...prevDisplay];
          if (updated.length > 20) return updated.slice(0, 20);
          return updated;
        });

        return newQueue;
      });
    }, 8000);

    return () => clearInterval(interval);
  }, [isInitializing, eventQueue.length]);

  return (
    <div className="terminal-feed-container">
      <div className="terminal-header">
        <span className="terminal-title">INTELLIGENCE FEED</span>
        <span className="terminal-live-badge">● LIVE</span>
      </div>
      
      <div className="terminal-content" ref={containerRef}>
        {displayedEvents.map((ev, i) => {
          // Determine tag based on severity or pre-assigned tag
          let tag = ev.tag || 'INFO';
          if (!ev.tag) {
             if (ev.severity >= 5) tag = 'CRITICAL';
             else if (ev.severity === 4) tag = 'ALERT';
             else if (i === 0) tag = 'NEW';
          }

          const tagColor = TAG_COLORS[tag] || TAG_COLORS.INFO;

          return (
            <div key={`${ev.id}-${i}`} className="terminal-entry" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="terminal-meta">
                <span className="terminal-time">● {formatTimeOnly(ev.timestamp || new Date().toISOString())}</span>
                <span className="terminal-tag" style={{ color: tagColor, borderColor: tagColor }}>
                  {tag}
                </span>
              </div>
              <div className="terminal-text">
                {ev.title}
              </div>
            </div>
          );
        })}
        {displayedEvents.length === 0 && <div className="terminal-text">WAITING FOR SIGNAL...</div>}
      </div>
    </div>
  );
}
