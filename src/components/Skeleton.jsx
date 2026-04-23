const shimmer = `
  @keyframes sk-shimmer {
    0%   { background-position: -600px 0; }
    100% { background-position:  600px 0; }
  }
`;

function Bone({ width = "100%", height = 16, radius = 8, style = {} }) {
  return (
    <>
      <style>{shimmer}</style>
      <div
        style={{
          width,
          height,
          borderRadius: radius,
          background: "linear-gradient(90deg, var(--color-bg-alt) 25%, var(--color-surface-strong) 50%, var(--color-bg-alt) 75%)",
          backgroundSize: "600px 100%",
          animation: "sk-shimmer 1.4s ease-in-out infinite",
          flexShrink: 0,
          ...style,
        }}
      />
    </>
  );
}

function Row({ gap = 10, children, style = {} }) {
  return <div style={{ display: "flex", alignItems: "center", gap, ...style }}>{children}</div>;
}

function Col({ gap = 10, children, style = {} }) {
  return <div style={{ display: "flex", flexDirection: "column", gap, ...style }}>{children}</div>;
}

export function DashboardSkeleton() {
  return (
    <div className="dashboard">
      {/* header */}
      <div className="card" style={{ padding: "18px 22px" }}>
        <Row style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <Col gap={8}>
            <Bone width={90} height={11} />
            <Bone width={200} height={28} radius={6} />
          </Col>
          <Bone width={120} height={36} radius={999} />
        </Row>
        <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <Bone key={i} width={44} height={32} radius={999} />
          ))}
        </div>
      </div>

      {/* total card */}
      <div className="card total-card">
        <Bone width={80} height={11} style={{ marginBottom: 10 }} />
        <Bone width={180} height={22} radius={6} style={{ marginBottom: 8 }} />
        <Bone width={140} height={48} radius={6} style={{ marginBottom: 8 }} />
        <Bone width={160} height={13} />
      </div>

      {/* charts row */}
      <div className="dashboard-mid">
        <div className="card">
          <Bone width={120} height={13} style={{ marginBottom: 16 }} />
          <Bone width="100%" height={200} radius={12} />
        </div>
        <div className="card">
          <Bone width={100} height={13} style={{ marginBottom: 16 }} />
          <Bone width="100%" height={200} radius={12} />
        </div>
      </div>

      {/* budgets */}
      <div className="card">
        <Bone width={100} height={13} style={{ marginBottom: 18 }} />
        <Col gap={16}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <Row style={{ justifyContent: "space-between", marginBottom: 8 }}>
                <Bone width={120} height={13} />
                <Bone width={80} height={13} />
              </Row>
              <Bone width="100%" height={12} radius={999} />
            </div>
          ))}
        </Col>
      </div>

      {/* transactions */}
      <div className="card">
        <Bone width={130} height={13} style={{ marginBottom: 18 }} />
        <Col gap={14}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Row key={i} style={{ justifyContent: "space-between" }}>
              <Row gap={12}>
                <Bone width={36} height={36} radius={999} />
                <Col gap={6}>
                  <Bone width={130} height={13} />
                  <Bone width={80} height={11} />
                </Col>
              </Row>
              <Bone width={60} height={16} radius={6} />
            </Row>
          ))}
        </Col>
      </div>
    </div>
  );
}

export function GoalsSkeleton() {
  return (
    <div className="goals-page">
      <div className="card">
        <Bone width={100} height={13} style={{ marginBottom: 10 }} />
        <Bone width={220} height={28} radius={6} style={{ marginBottom: 20 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
          <Bone height={44} radius={14} />
          <Bone height={44} radius={14} />
          <Bone height={44} radius={14} />
          <Bone width={44} height={44} radius={14} />
        </div>
      </div>

      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="card">
          <Row style={{ justifyContent: "space-between", marginBottom: 16 }}>
            <Col gap={8}>
              <Bone width={150} height={16} />
              <Bone width={100} height={11} />
            </Col>
            <Bone width={70} height={24} radius={999} />
          </Row>
          <Bone width="100%" height={12} radius={999} style={{ marginBottom: 10 }} />
          <Row style={{ justifyContent: "space-between" }}>
            <Bone width={90} height={11} />
            <Bone width={70} height={11} />
          </Row>
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton({ rows = 5 }) {
  return (
    <div className="page-container">
      <div className="card" style={{ marginBottom: 0 }}>
        <Row style={{ justifyContent: "space-between", marginBottom: 20 }}>
          <Col gap={8}>
            <Bone width={80} height={11} />
            <Bone width={200} height={28} radius={6} />
          </Col>
          <Bone width={110} height={38} radius={999} />
        </Row>
        <Col gap={14}>
          {Array.from({ length: rows }).map((_, i) => (
            <Row key={i} style={{ justifyContent: "space-between" }}>
              <Row gap={12}>
                <Bone width={36} height={36} radius={999} />
                <Col gap={6}>
                  <Bone width={160} height={13} />
                  <Bone width={100} height={11} />
                </Col>
              </Row>
              <Bone width={70} height={16} radius={6} />
            </Row>
          ))}
        </Col>
      </div>
    </div>
  );
}

export function AuthSkeleton() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "calc(100vh - 82px)" }}>
      <div style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid var(--color-border-soft)", borderTopColor: "var(--color-accent)", animation: "sk-spin 0.8s linear infinite" }} />
      <style>{`@keyframes sk-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
