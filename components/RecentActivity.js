'use client';
import { Clock, ArrowUpRight } from 'lucide-react';

export default function RecentActivity({ recentFiles }) {
  if (!recentFiles?.length) return null;

  const formatTime = (iso) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now - d;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="glass-card">
      <div className="card-header">
        <span className="card-title"><Clock size={16} /> Recent Intel Activity</span>
        <span className="card-badge" style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8' }}>
          {recentFiles.length} latest
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {recentFiles.map((file, i) => (
          <div key={file.id} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
            borderRadius: 8, transition: 'background 150ms',
            background: i === 0 ? 'rgba(0,240,255,0.04)' : 'transparent',
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: file.color, boxShadow: i === 0 ? `0 0 8px ${file.color}` : 'none',
              flexShrink: 0,
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {file.title}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{file.category}</div>
            </div>
            <span className={`threat-badge ${file.threatLevel}`}>{file.threatLevel}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "var(--font-jetbrains-fallback)", flexShrink: 0 }}>
              {formatTime(file.lastModified)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
