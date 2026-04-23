const WEEKLY_BUDGETS_KEY = "weekly-budgets";

export async function fetchMonthlyBudgets(supabase) {
  const result = await supabase.from("budgets").select("id, limit_amount, category_id, categories(name)");

  return {
    ...result,
    data: (result.data || []).map((budget) => ({
      ...budget,
      period: "monthly",
    })),
  };
}

export function getWeeklyBudgets() {
  if (typeof window === "undefined") return [];

  try {
    const storedValue = window.localStorage.getItem(WEEKLY_BUDGETS_KEY);
    const parsed = storedValue ? JSON.parse(storedValue) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveWeeklyBudget({ categoryId, categoryName, limitAmount }) {
  if (typeof window === "undefined") return;

  const current = getWeeklyBudgets();
  const next = current.filter((budget) => budget.category_id !== categoryId);
  next.push({
    id: `weekly-${categoryId}`,
    category_id: categoryId,
    limit_amount: limitAmount,
    period: "weekly",
    categories: { name: categoryName },
  });

  window.localStorage.setItem(WEEKLY_BUDGETS_KEY, JSON.stringify(next));
}

export function deleteWeeklyBudget(categoryId) {
  if (typeof window === "undefined") return;

  const next = getWeeklyBudgets().filter((budget) => budget.category_id !== categoryId);
  window.localStorage.setItem(WEEKLY_BUDGETS_KEY, JSON.stringify(next));
}
