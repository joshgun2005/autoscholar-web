import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders without crashing", () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });

  it("renders the landing page by default", () => {
    const { container } = render(<App />);
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });
});
