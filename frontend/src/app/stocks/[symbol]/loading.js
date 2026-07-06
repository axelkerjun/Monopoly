export default function Loading() {
  const shimmerStyle = {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  };

  const blockStyle = {
    backgroundColor: '#f1f5f9',
    borderRadius: '6px',
    animation: 'pulse 1.5s infinite ease-in-out'
  };

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#f8fafc', padding: '32px 16px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Injecting a micro pulse keyframe for the skeleton effect */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .4; }
        }
      `}</style>

      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* HEADER SKELETON */}
        <div style={{ ...shimmerStyle, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ ...blockStyle, width: '140px', height: '36px' }} />
            <div style={{ ...blockStyle, width: '220px', height: '18px', marginTop: '8px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ ...blockStyle, width: '120px', height: '36px' }} />
            <div style={{ ...blockStyle, width: '80px', height: '18px', marginTop: '8px' }} />
          </div>
        </div>

        {/* TWO-COLUMN DASHBOARD GRID SKELETON */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          
          {/* LEFT MAIN AREA (2 COLS) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', gridColumn: 'span 2' }}>
            
            {/* PROFILE SECTION */}
            <div style={shimmerStyle}>
              <div style={{ ...blockStyle, width: '160px', height: '22px', marginBottom: '16px' }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                <div style={{ ...blockStyle, height: '60px', borderRadius: '8px' }} />
                <div style={{ ...blockStyle, height: '60px', borderRadius: '8px' }} />
                <div style={{ ...blockStyle, height: '60px', borderRadius: '8px' }} />
              </div>
              <div style={{ ...blockStyle, height: '100px', borderRadius: '8px' }} />
            </div>

            {/* RATIOS SECTION */}
            <div style={shimmerStyle}>
              <div style={{ ...blockStyle, width: '180px', height: '22px', marginBottom: '16px' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ ...blockStyle, height: '32px' }} />
                <div style={{ ...blockStyle, height: '32px' }} />
                <div style={{ ...blockStyle, height: '32px' }} />
                <div style={{ ...blockStyle, height: '32px' }} />
              </div>
            </div>
          </div>

          {/* SIDEBAR NEWS (1 COL) */}
          <div style={{ gridColumn: 'span 1' }}>
            <div style={shimmerStyle}>
              <div style={{ ...blockStyle, width: '120px', height: '22px', marginBottom: '16px' }} />
              <div style={{ ...blockStyle, height: '80px', borderRadius: '8px' }} />
              <div style={{ ...blockStyle, height: '80px', borderRadius: '8px', marginTop: '12px' }} />
              <div style={{ ...blockStyle, height: '80px', borderRadius: '8px', marginTop: '12px' }} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
