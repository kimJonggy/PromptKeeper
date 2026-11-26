import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div style={{
          padding: '24px',
          margin: '24px auto',
          maxWidth: 600,
          background: '#161922',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: 12,
          color: '#fff',
          fontFamily: 'Geist, sans-serif'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ color: 'var(--danger, #ef4444)', fontSize: 18 }}>⚠️</span>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>An error occurred displaying this view</h3>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
            {this.state.error?.message || 'Unknown component error'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              if (this.props.onReset) this.props.onReset();
            }}
            style={{
              background: 'var(--accent, #E8FF1F)',
              color: '#0b0b0c',
              border: 'none',
              borderRadius: 6,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Reset View
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

