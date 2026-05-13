'use client';
import dynamic from 'next/dynamic';

const LiveMap = dynamic(() => import('./LiveMap'), {
  ssr: false,
  loading: () => (
    <div className="loading-screen" style={{ minHeight: '70vh' }}>
      <div className="loading-ring" />
      <div className="loading-text">Initializing SIGINT Map</div>
      <div className="loading-sub">Connecting to data feeds...</div>
    </div>
  ),
});

export default LiveMap;
