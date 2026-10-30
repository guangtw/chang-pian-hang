export function Loading({ rows = 6 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-label="加载中" style={{ paddingTop: 8 }}>
      <div className="skeleton" style={{ height: 34, width: '40%', marginBottom: 22 }} />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton" style={{ height: 18, margin: '14px 0', width: `${90 - ((i * 13) % 35)}%` }} />
      ))}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div className="state">
      <h3>这一页没印出来</h3>
      <p>{error.message}</p>
      {onRetry && (
        <p style={{ marginTop: 18 }}>
          <button className="btn" onClick={onRetry}>
            重试
          </button>
        </p>
      )}
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="state">
      <h3>{title}</h3>
      {children}
    </div>
  );
}
