'use client';
import { FileText, AlertTriangle, Building2, Scale, Network, Tags, Crosshair, Shield } from 'lucide-react';

const METRIC_CONFIG = [
  { key: 'totalDocuments', label: 'Intel Briefs', icon: FileText, color: '#00f0ff' },
  { key: 'criticalThreats', label: 'Critical Threats', icon: AlertTriangle, color: '#ff2d55' },
  { key: 'highThreats', label: 'High Priority', icon: Crosshair, color: '#ff6b35' },
  { key: 'uniqueEntities', label: 'Tracked Entities', icon: Building2, color: '#a855f7' },
  { key: 'categoriesTracked', label: 'Intel Categories', icon: Shield, color: '#22c55e' },
  { key: 'totalTags', label: 'Active Tags', icon: Tags, color: '#facc15' },
  { key: 'totalConnections', label: 'Graph Links', icon: Network, color: '#38bdf8' },
  { key: 'evidenceCount', label: 'Verified Sources', icon: Scale, color: '#f472b6' },
];

export default function MetricsOverview({ metrics }) {
  if (!metrics) return null;

  return (
    <div className="metrics-grid">
      {METRIC_CONFIG.map(({ key, label, icon: Icon, color }) => (
        <div key={key} className="metric-card" style={{ '--metric-accent': color }}>
          <div className="metric-icon" style={{ background: `${color}15`, color }}>
            <Icon size={18} />
          </div>
          <div className="metric-value" style={{ color }}>{metrics[key] ?? 0}</div>
          <div className="metric-label">{label}</div>
        </div>
      ))}
    </div>
  );
}
