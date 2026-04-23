import { expect, test } from "vitest";
import { render } from "vitest-browser-react";
import App from "./App";

test("renders app title and description", async () => {
  const { getByText } = render(<App />);

  const heading = getByText("Personal Finance Manager");
  const description = getByText("Track your spending and manage your finances");

  await expect.element(heading).toBeInTheDocument();
  await expect.element(description).toBeInTheDocument();
});