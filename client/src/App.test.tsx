import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders without crashing", () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });

  it("renders the home page by default", () => {
    render(<App />);
    // The home page has a data-testid="page-home"
    expect(screen.getByTestId("page-home")).toBeInTheDocument();
  });

  it("renders the search bar", () => {
    render(<App />);
    expect(
      screen.getByPlaceholderText(/question.*march/i),
    ).toBeInTheDocument();
  });
});
