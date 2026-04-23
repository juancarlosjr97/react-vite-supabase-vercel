import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { AuthSkeleton } from "../components/Skeleton";

function HeroLogo() {
  return (
    <div style={{ position: "relative", width: "clamp(180px, 45vw, 320px)", height: "clamp(180px, 45vw, 320px)" }}>
      <svg width="100%" height="100%" viewBox="0 0 320 320" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>{`
          @keyframes spin-slow   { to { transform: rotate(360deg);  transform-origin: 160px 160px; } }
          @keyframes spin-rev    { to { transform: rotate(-360deg); transform-origin: 160px 160px; } }
          @keyframes ring-draw   { from { stroke-dashoffset: 895; } to { stroke-dashoffset: 0; } }
          @keyframes ring-draw2  { from { stroke-dashoffset: 720; } to { stroke-dashoffset: 0; } }
          @keyframes disc-pop    { from { opacity:0; transform: scale(0.7); transform-origin:160px 160px; }
                                   to   { opacity:1; transform: scale(1);   transform-origin:160px 160px; } }
          @keyframes pound-in    { from { stroke-dashoffset:540; opacity:0; }
                                   to   { stroke-dashoffset:0;   opacity:1; } }
          @keyframes orbit-in    { from { opacity:0; } to { opacity:1; } }
          @keyframes pulse-ring  { 0%,100% { opacity:0.18; } 50% { opacity:0.45; } }
          @keyframes home-in     { from { opacity:0; transform:translateX(-24px); }
                                   to   { opacity:1; transform:translateX(0); } }

          .h-disc   { animation: disc-pop  0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s both; }
          .h-ring1  { stroke-dasharray:895; stroke-dashoffset:895;
                      animation: ring-draw 1.4s cubic-bezier(0.4,0,0.2,1) 0.2s forwards; }
          .h-ring2  { stroke-dasharray:720; stroke-dashoffset:720;
                      animation: ring-draw2 1.2s cubic-bezier(0.4,0,0.2,1) 0.5s forwards; }
          .h-ring3  { animation: pulse-ring 3s ease-in-out 1.6s infinite; opacity:0.18; }
          .h-pound  { stroke-dasharray:540; stroke-dashoffset:540; opacity:0;
                      animation: pound-in 1s cubic-bezier(0.4,0,0.2,1) 1.3s forwards; }
          .h-orbit  { opacity:0; animation: orbit-in 0.4s ease 1.8s forwards; }
          .h-spin   { animation: spin-slow 18s linear infinite; }
          .h-spinrev{ animation: spin-rev  12s linear infinite; }

          .home-in-1 { opacity:0; animation: home-in 0.6s ease 0.3s forwards; }
          .home-in-2 { opacity:0; animation: home-in 0.6s ease 0.5s forwards; }
          .home-in-3 { opacity:0; animation: home-in 0.6s ease 0.7s forwards; }
          .home-in-4 { opacity:0; animation: home-in 0.6s ease 0.9s forwards; }
          .home-in-5 { opacity:0; animation: home-in 0.6s ease 1.1s forwards; }

          .home-chip {
            display: inline-flex; align-items: center; gap: 6px;
            padding: 7px 14px; border-radius: 999px;
            border: 1px solid var(--color-border-soft);
            background: color-mix(in srgb, var(--color-surface) 90%, white 10%);
            box-shadow: 3px 3px 0 var(--color-border-soft);
            font-family: "IBM Plex Mono", monospace;
            font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase;
            color: var(--color-secondary); white-space: nowrap;
          }
          .home-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
        `}</style>

        {/* pulse bg ring */}
        <circle className="h-ring3" cx="160" cy="160" r="154" stroke="#b25539" strokeWidth="1" fill="none" />

        {/* warm disc */}
        <circle className="h-disc" cx="160" cy="160" r="130" fill="#fbf5ea" />

        {/* main ring draws in */}
        <circle className="h-ring1" cx="160" cy="160" r="142" stroke="#b25539" strokeWidth="3" strokeLinecap="round" />

        {/* inner dashed ring spins */}
        <g className="h-spinrev">
          <circle className="h-ring2" cx="160" cy="160" r="115" stroke="#b25539" strokeWidth="1"
            strokeDasharray="8 6" strokeOpacity="0.4" />
        </g>

        {/* outer dotted ring spins other way */}
        <g className="h-orbit h-spin">
          <circle cx="160" cy="160" r="142" stroke="#b25539" strokeWidth="0"
            strokeDasharray="1 28" strokeOpacity="0" fill="none" />
          {/* orbiting dots */}
          <circle cx="160" cy="18"  r="5" fill="#b25539" opacity="0.7" />
          <circle cx="302" cy="160" r="4" fill="#b25539" opacity="0.45" />
          <circle cx="160" cy="302" r="3" fill="#b25539" opacity="0.3" />
          <circle cx="18"  cy="160" r="4" fill="#b25539" opacity="0.45" />
        </g>

        {/* large £ glyph */}
        <path
          className="h-pound"
          d="
            M192 106
            c-8-14-20-22-32-22
            c-24 0-40 20-40 46
            v10 H104 v16 h16 v12 H104 v18 h16
            c0 0 0 8 0 12 H104 v16 H216 v-16
            H136 c0-4 0-12 0-12 H176 v-12 H136
            v-12 H176 v-16 H136 v-10
            c0-18 10-30 24-30
            c8 0 16 4 22 12 l10-12 z
          "
          stroke="#181512" strokeWidth="2" fill="#181512"
          strokeLinecap="round" strokeLinejoin="round"
        />

        {/* small accent mark top-right */}
        <circle className="h-orbit" cx="232" cy="88" r="8" fill="#b25539" opacity="0.25" />
        <circle className="h-orbit" cx="88"  cy="232" r="6" fill="#48694f" opacity="0.2" />
      </svg>
    </div>
  );
}

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) return <AuthSkeleton />;
  if (user) return <Navigate to="/dashboard" />;

  return (
    <div style={{
      minHeight: "calc(100vh - 82px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 32px",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "clamp(32px, 6vw, 80px)",
        maxWidth: 1100,
        width: "100%",
        flexWrap: "wrap",
        justifyContent: "center",
      }}>

        {/* LEFT — text */}
        <div style={{ flex: "1 1 340px", minWidth: 280 }}>
          <p className="home-kicker home-in-1" style={{ marginBottom: 14 }}>
            Editorial Ledger Edition
          </p>

          <h1 className="home-in-2" style={{
            fontSize: "clamp(2.8rem, 5.5vw, 4.8rem)",
            lineHeight: 0.95,
            marginBottom: 20,
          }}>
            Personal<br />Finance<br />Manager
          </h1>

          <p className="home-in-3" style={{
            color: "var(--color-secondary)",
            fontSize: 16,
            lineHeight: 1.65,
            maxWidth: 420,
            marginBottom: 32,
          }}>
            Track spending, frame goals, and read your money like a well-kept household column.
          </p>

          <div className="home-actions home-in-4" style={{ marginBottom: 32 }}>
            <Link to="/auth/sign-in">Sign In</Link>
            <Link to="/auth/sign-up">Sign Up</Link>
          </div>

          <div className="home-in-5" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className="home-chip"><span className="home-dot" style={{ background: "#b25539" }} />Expenses</span>
            <span className="home-chip"><span className="home-dot" style={{ background: "#48694f" }} />Budgets</span>
            <span className="home-chip"><span className="home-dot" style={{ background: "#2d5b53" }} />Reports</span>
            <span className="home-chip"><span className="home-dot" style={{ background: "#c48a3a" }} />Goals</span>
          </div>
        </div>

        {/* RIGHT — big logo */}
        <div>
          <HeroLogo />
        </div>

      </div>
    </div>
  );
}
