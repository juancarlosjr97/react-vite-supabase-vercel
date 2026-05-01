import { memo } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";

import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";

import AccountForm from "../../containers/AccountForm";
import supabase from "../../utils/supabase";

const SignUp = () => {
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) toast.error(error.message);
  };

  const signUp = async (name, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) {
      if (error.status === 429) {
        toast.error("Too many signup attempts. Please wait a few minutes and try again.");
      } else if (error.message?.toLowerCase().includes("already registered") || error.message?.toLowerCase().includes("already exists")) {
        toast.error("An account with this email already exists. Please sign in instead.");
      } else {
        toast.error(error.message);
      }
      return;
    }

    // When email confirmation is enabled, Supabase silently "succeeds" for existing emails
    // but returns an empty identities array instead of an error.
    if (data.user?.identities?.length === 0) {
      toast.error("An account with this email already exists. Please sign in instead.");
      return;
    }

    toast.success("Account created! You can now sign in.");
    navigate("/auth/sign-in");
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="auth-kicker">New Subscription</p>
        <h1>Sign Up</h1>
        <p className="auth-intro">Open a fresh ledger and start building a clearer picture of where your money goes.</p>
        <AccountForm onSubmit={signUp} />
        <Divider sx={{ my: 2 }}>or</Divider>
        <Button
          variant="outlined"
          fullWidth
          onClick={handleGoogleLogin}
          startIcon={<img src="https://www.google.com/favicon.ico" width={16} alt="" />}
        >
          Continue with Google
        </Button>
      </div>
    </div>
  );
};

export default memo(SignUp);
