import { expect, test } from "vitest";
import { render } from "vitest-browser-react";

import App from "./App";

test("renders name", async () => {
  const { getByText } = render(<App />);

  const headingTitle = "React + Vite + Supabase + Vercel";

  const headingElement = getByText(headingTitle);

  await expect.element(headingElement).toBeInTheDocument();

  expect(headingElement.element().innerHTML).toBe(headingTitle);
});
