import React from 'react';

function KqlSimulator({ onClose }) {
  return (
    <div className="kql-overlay" onClick={onClose}>
      <div className="kql-popup" onClick={e => e.stopPropagation()}>
        <div className="kql-popup-header">
          <span className="kql-popup-title">Kusto Query Language · SecurityEvent</span>
          <button className="kql-popup-close" onClick={onClose}>✕</button>
        </div>
        <iframe
          src="/kql.html"
          className="kql-popup-iframe"
          title="KQL Simulator"
        />
      </div>
    </div>
  );
}

export default KqlSimulator;
