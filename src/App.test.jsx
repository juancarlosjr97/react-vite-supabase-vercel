import { expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { MemoryRouter } from "react-router-dom";
import Home from "./pages/Home";
import { AuthContext } from "./hooks/useAuth";

test("renders the signed-out home page", async () => {
  const { getByText } = render(
    <MemoryRouter>
      <AuthContext.Provider value={{ user: null, session: null, loading: false }}>
        <Home />
      </AuthContext.Provider>
    </MemoryRouter>
  );

  const heading = getByText("Personal");
  const description = getByText("Track spending, create goals and understand your money.");

  await expect.element(heading).toBeInTheDocument();
  await expect.element(description).toBeInTheDocument();
});
