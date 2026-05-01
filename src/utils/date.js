const pad = (value) => String(value).padStart(2, "0");

export const formatLocalMonthInput = (date = new Date()) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;

export const formatLocalDateInput = (date = new Date()) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const parseLocalDateInput = (value) => {
  if (!value) return null;

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
};

export const parseLocalMonthInput = (value) => {
  const fallback = formatLocalMonthInput();
  const [year, month] = (value || fallback).split("-").map(Number);

  return new Date(year, month - 1, 1);
};

export const parseStoredDate = (value) => {
  if (!value) return new Date(Number.NaN);
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return parseLocalDateInput(value);
  }

  return new Date(value);
};

export const startOfLocalDay = (date = new Date()) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

export const formatDeviceDate = (date, options) =>
  date.toLocaleDateString(undefined, options);
