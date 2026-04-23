import { memo } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";

import AccountForm from "../../containers/AccountForm";
import supabase from "../../utils/supabase";

const SignUp = () => {
  const navigate = useNavigate();

  const signUp = async (name, email, password) => {
    const result = await supabase.auth.signUp({
      email,
      password,
    });

    console.log("SIGNUP RESULT:", result);

    if (result.error) {
      toast.error(result.error.message);
      return;
    }

    const user = result.data.user;

    const { error } = await supabase.from("profiles").upsert([
      {
        id: user.id,
        email: user.email,
        name: name,
      },
    ]);

    if (error) {
      console.error(error);
      toast.error("Error saving profile");
      return;
    }

    toast.success("Account created!");
    navigate("/");
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="auth-kicker">New Subscription</p>
        <h1>Sign Up</h1>
        <p className="auth-intro">Open a fresh ledger and start building a clearer picture of where your money goes.</p>
        <AccountForm onSubmit={signUp} />
      </div>
    </div>
  );
};

export default memo(SignUp);
