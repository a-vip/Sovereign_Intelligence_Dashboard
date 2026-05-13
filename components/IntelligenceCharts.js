'use client';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Treemap
} from 'recharts';

const COLORS = ['#00f0ff', '#ff2d55', '#a855f7', '#facc15', '#22c55e', '#ff6b35', '#38bdf8', '#f472b6', '#6ee7b7', '#fbbf24'];

const THREAT_COLORS = { critical: '#ff2d55', high: '#ff6b35', medium: '#facc15', low: '#4a5568' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#0f1520', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8, padding: '10px 14px', fontSize: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    }}>
      <div style={{ color: '#e8edf5', fontWeight: 600, marginBottom: 4 }}>{label || payload[0]?.name}</div>
      <div style={{ color: payload[0]?.color || '#00f0ff', fontFamily: "'JetBrains Mono', monospace" }}>
        {payload[0]?.value} {payload[0]?.value === 1 ? 'document' : 'documents'}
      </div>
    </div>
  );
};

export function CategoryChart({ data }) {
  if (!data?.length) return null;
  return (
    <div className="glass-card">
      <div className="card-header">
        <span className="card-title">Intelligence Distribution</span>
        <span className="card-badge" style={{ background: 'rgba(0,240,255,0.1)', color: '#00f0ff' }}>{data.length} categories</span>
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
            <XAxis dataKey="name" tick={{ fill: '#8892a4', fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
            <YAxis tick={{ fill: '#8892a4', fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.8} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ThreatChart({ data }) {
  if (!data?.length) return null;
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="glass-card">
      <div className="card-header">
        <span className="card-title">Threat Level Distribution</span>
        <span className="card-badge" style={{ background: 'rgba(255,45,85,0.1)', color: '#ff2d55' }}>{total} total</span>
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={110} paddingAngle={3} dataKey="value" stroke="none"
              label={({ name, value }) => `${name}: ${value}`}>
              {data.map((entry) => <Cell key={entry.name} fill={THREAT_COLORS[entry.name] || '#4a5568'} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function CountryChart({ data }) {
  if (!data?.length) return null;
  return (
    <div className="glass-card">
      <div className="card-header">
        <span className="card-title">State Actor Coverage</span>
        <span className="card-badge" style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7' }}>{data.length} states</span>
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.slice(0, 12)} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
            <XAxis type="number" tick={{ fill: '#8892a4', fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fill: '#8892a4', fontSize: 11 }} width={75} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.slice(0, 12).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.8} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function SystemTypeChart({ data }) {
  if (!data?.length) return null;
  return (
    <div className="glass-card">
      <div className="card-header">
        <span className="card-title">Weapons System Classification</span>
        <span className="card-badge" style={{ background: 'rgba(255,107,53,0.1)', color: '#ff6b35' }}>{data.length} types</span>
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" outerRadius={110} paddingAngle={2} dataKey="value" stroke="none"
              label={({ name, value }) => `${name}: ${value}`}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ProducerChart({ data }) {
  if (!data?.length) return null;
  return (
    <div className="glass-card">
      <div className="card-header">
        <span className="card-title">Weapons Producers</span>
        <span className="card-badge" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>{data.length} entities</span>
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.slice(0, 15)} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
            <XAxis dataKey="name" tick={{ fill: '#8892a4', fontSize: 9 }} angle={-40} textAnchor="end" interval={0} />
            <YAxis tick={{ fill: '#8892a4', fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#22c55e" fillOpacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function TagCloud({ data, onTagClick, activeTag }) {
  if (!data?.length) return null;
  const maxCount = Math.max(...data.map(d => d.value));
  return (
    <div className="glass-card">
      <div className="card-header">
        <span className="card-title">Intelligence Tag Frequency</span>
        <span className="card-badge" style={{ background: 'rgba(250,204,21,0.1)', color: '#facc15' }}>{data.length} tags</span>
      </div>
      <div className="tag-cloud">
        {data.map(({ name, value }) => {
          const intensity = value / maxCount;
          const size = 11 + intensity * 4;
          return (
            <button key={name}
              className={`tag-pill${activeTag === name ? ' active' : ''}`}
              style={{ fontSize: size }}
              onClick={() => onTagClick?.(name)}
            >
              {name}<span className="tag-count">×{value}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
