import { useEffect, useState } from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useAuth } from "../hooks/useAuth";
import supabase from "../utils/supabase";
import { GoalsSkeleton } from "../components/Skeleton";

export default function Goals() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState([]);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [addAmounts, setAddAmounts] = useState({});

  useEffect(() => {
    if (user) fetchGoals();
  }, [user]);

  const fetchGoals = async () => {
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
    } else {
      setGoals(data || []);
    }
    setLoading(false);
  };

  const addGoal = async () => {
    if (!name || !target || Number(target) <= 0) {
      alert("Please enter a goal name and a valid target amount.");
      return;
    }

    const { error } = await supabase.from("goals").insert([
      {
        user_id: user.id,
        name,
        target_amount: Number(target),
        current_amount: 0,
        deadline: deadline || null,
      },
    ]);

    if (error) {
      console.error(error);
      alert("Error creating goal");
    } else {
      setName("");
      setTarget("");
      setDeadline("");
      fetchGoals();
    }
  };

  const addToGoal = async (goalId, current) => {
    const amount = Number(addAmounts[goalId]);
    if (!amount || amount <= 0) {
      alert("Enter a valid amount to add.");
      return;
    }

    const { error } = await supabase.from("goals").update({ current_amount: current + amount }).eq("id", goalId);

    if (error) {
      console.error(error);
      alert("Error updating goal");
    } else {
      setAddAmounts((prev) => ({ ...prev, [goalId]: "" }));
      fetchGoals();
    }
  };

  const deleteGoal = async (goalId) => {
    if (!confirm("Delete this goal?")) return;

    const { error } = await supabase.from("goals").delete().eq("id", goalId);

    if (error) {
      alert("Error deleting goal");
    } else {
      fetchGoals();
    }
  };

  const totalSaved = goals.reduce((sum, goal) => sum + Number(goal.current_amount), 0);
  const totalTarget = goals.reduce((sum, goal) => sum + Number(goal.target_amount), 0);

  if (loading) return <GoalsSkeleton />;

  return (
    <div className="goals-page">
      <div className="goals-header">
        <h2>Financial Goals</h2>
        {goals.length > 0 && <p className="goals-summary">£{totalSaved.toFixed(2)} saved of £{totalTarget.toFixed(2)} total target</p>}
      </div>

      <div className="card goals-form-card">
        <h3>New Goal</h3>
        <div className="goals-form">
          <input type="text" placeholder="Goal name (e.g. Emergency fund)" value={name} onChange={(event) => setName(event.target.value)} />
          <input type="number" placeholder="Target amount (£)" value={target} onChange={(event) => setTarget(event.target.value)} />
          <input type="date" placeholder="Deadline (optional)" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
          <button className="btn" onClick={addGoal}>
            Add Goal
          </button>
        </div>
      </div>

      {goals.length === 0 ? (
        <div className="glass stat-card" style={{ textAlign: "center", padding: 40 }}>
          <p style={{ color: "var(--color-secondary)", fontSize: 16 }}>No goals yet. Add your first financial goal above.</p>
        </div>
      ) : (
        <div className="goals-list">
          {goals.map((goal) => {
            const current = Number(goal.current_amount);
            const targetAmount = Number(goal.target_amount);
            const percent = Math.min((current / targetAmount) * 100, 100);
            const remaining = Math.max(targetAmount - current, 0);
            const achieved = current >= targetAmount;

            let barColor = "#b25539";
            if (percent >= 75) barColor = "#2d5b53";
            if (percent >= 100) barColor = "#48694f";

            const daysLeft = goal.deadline
              ? Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24))
              : null;

            return (
              <div key={goal.id} className={`card goal-card ${achieved ? "goal-achieved" : ""}`}>
                <div className="goal-top">
                  <div>
                    <h4 className="goal-name">
                      {achieved && <span className="goal-badge">Achieved</span>}
                      {goal.name}
                    </h4>
                    {goal.deadline && (
                      <p className="goal-deadline">
                        {achieved ? "Goal complete!" : daysLeft > 0 ? `${daysLeft} days left` : "Deadline passed"}
                      </p>
                    )}
                  </div>

                  <button className="delete-btn" onClick={() => deleteGoal(goal.id)} title="Delete goal" aria-label="Delete goal">
                    <CloseRoundedIcon fontSize="small" />
                  </button>
                </div>

                <div className="goal-amounts">
                  <span style={{ color: barColor, fontWeight: 600 }}>£{current.toFixed(2)}</span>
                  <span style={{ color: "var(--color-secondary)" }}>of £{targetAmount.toFixed(2)}</span>
                </div>

                <div className="bar" style={{ margin: "10px 0" }}>
                  <div className="fill" style={{ width: `${percent}%`, background: barColor }} />
                </div>

                <div className="goal-footer">
                  <span style={{ color: "var(--color-secondary)", fontSize: 13 }}>{percent.toFixed(0)}% — £{remaining.toFixed(2)} remaining</span>
                </div>

                {!achieved && (
                  <div className="goal-add-row">
                    <input
                      type="number"
                      placeholder="Add £"
                      value={addAmounts[goal.id] || ""}
                      onChange={(event) =>
                        setAddAmounts((prev) => ({
                          ...prev,
                          [goal.id]: event.target.value,
                        }))
                      }
                    />
                    <button className="btn" style={{ padding: "8px 14px", fontSize: 13 }} onClick={() => addToGoal(goal.id, current)}>
                      Add savings
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
