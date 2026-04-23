import { memo } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";

import AccountForm from "../../containers/AccountForm";
import supabase from "../../utils/supabase";

function AnimatedLogo() {
  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: "28px" }}>
      <svg
        width="72"
        height="72"
        viewBox="0 0 72 72"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ animation: "logo-float 3.6s ease-in-out infinite" }}
      >
        <style>{`
          @keyframes logo-float {
            0%, 100% { transform: translateY(0px); }
            50%       { transform: translateY(-6px); }
          }
          @keyframes logo-ring {
            from { stroke-dashoffset: 201; }
            to   { stroke-dashoffset: 0; }
          }
          @keyframes logo-stroke {
            from { stroke-dashoffset: 120; opacity: 0; }
            to   { stroke-dashoffset: 0;   opacity: 1; }
          }
          @keyframes logo-fade {
            from { opacity: 0; transform: scale(0.85); }
            to   { opacity: 1; transform: scale(1); }
          }
          .logo-ring {
            stroke-dasharray: 201;
            stroke-dashoffset: 201;
            animation: logo-ring 1s cubic-bezier(0.4,0,0.2,1) 0.1s forwards;
          }
          .logo-pound {
            stroke-dasharray: 120;
            stroke-dashoffset: 120;
            opacity: 0;
            animation: logo-stroke 0.7s cubic-bezier(0.4,0,0.2,1) 0.9s forwards;
          }
          .logo-disc {
            opacity: 0;
            animation: logo-fade 0.4s ease 0.05s forwards;
          }
        `}</style>

        {/* warm disc background */}
        <circle className="logo-disc" cx="36" cy="36" r="32" fill="#fbf5ea" />

        {/* outer ring draws itself */}
        <circle
          className="logo-ring"
          cx="36" cy="36" r="32"
          stroke="#b25539"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* inner decorative ring */}
        <circle
          className="logo-ring"
          cx="36" cy="36" r="27"
          stroke="#b25539"
          strokeWidth="0.8"
          strokeOpacity="0.35"
          style={{ animationDelay: "0.3s" }}
        />

        {/* £ glyph strokes in */}
        <path
          className="logo-pound"
          d="M41 26c-1.5-1.8-3.4-2.8-5.5-2.8-4.2 0-7 3.4-7 8v1.8H26v2.8h2.5v2H26V40.6h2.5c0 0 0 1.4 0 2h-2.5v2.8H46v-2.8H32.5c0-.6 0-2 0-2H40v-2H32.5v-2H40v-2.8h-7.5V31c0-3 1.6-5 4-5 1.4 0 2.7.7 3.8 2l.7-2z"
          stroke="#181512"
          strokeWidth="0.6"
          fill="#181512"
        />
      </svg>
    </div>
  );
}

const SignIn = () => {
  const navigate = useNavigate();

  const signIn = async (email, password) => {
    const result = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!result.error) {
      navigate("/");
      toast.success("Welcome!");
    } else if (result.error?.message) {
      toast.error(result.error.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <AnimatedLogo />
        <p className="auth-kicker">Member Access</p>
        <h1>Sign In</h1>
        <p className="auth-intro">Return to your ledger and pick up where your monthly story left off.</p>
        <AccountForm onSubmit={signIn} />
      </div>
    </div>
  );
};

export default memo(SignIn);
