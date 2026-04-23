import supabase from "../utils/supabase";

// ─── CATEGORIES ───────────────────────────────────────────────────────────────

export const getCategories = async () => {
  const { data, error } = await supabase.from("categories").select("*");
  if (error) throw error;
  return data ?? [];
};

export const addCategory = async (name) => {
  const { error } = await supabase.from("categories").insert([{ name }]);
  if (error) throw error;
};

export const deleteCategory = async (id) => {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
};

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────

export const getTransactions = async () => {
  const { data, error } = await supabase
    .from("transactions")
    .select("id, amount, description, transaction_date, category_id, categories(name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
};

export const addTransaction = async ({ userId, amount, description, categoryId, date }) => {
  const { error } = await supabase.from("transactions").insert([
    {
      user_id: userId,
      amount: Number(amount),
      description,
      category_id: categoryId,
      transaction_date: new Date(date).toISOString(),
    },
  ]);
  if (error) throw error;
};

export const updateTransaction = async (id, { amount, description, categoryId }) => {
  const { error } = await supabase
    .from("transactions")
    .update({
      amount: Number(amount),
      description,
      category_id: categoryId || null,
    })
    .eq("id", id);
  if (error) throw error;
};

export const deleteTransaction = async (id) => {
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw error;
};

// ─── BUDGETS ──────────────────────────────────────────────────────────────────

export const getBudgets = async () => {
  const { data, error } = await supabase
    .from("budgets")
    .select("id, limit_amount, categories(id, name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
};

export const upsertBudget = async (categoryId, amount) => {
  const { data: existing, error: fetchError } = await supabase
    .from("budgets")
    .select("id")
    .eq("category_id", categoryId)
    .maybeSingle();

  if (fetchError) throw fetchError;

  if (existing) {
    const { error } = await supabase
      .from("budgets")
      .update({ limit_amount: amount })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("budgets")
      .insert([{ category_id: categoryId, limit_amount: amount }]);
    if (error) throw error;
  }
};
