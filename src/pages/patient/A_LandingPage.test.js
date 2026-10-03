import { fireEvent, render, screen } from "@testing-library/react";
import LandingPage from "./A_LandingPage";
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({ useNavigate: () => mockNavigate }), { virtual: true });
beforeEach(() => { localStorage.clear(); mockNavigate.mockClear(); });
test.each([["Sign in", "/login"], ["Create account", "/signup"]])("%s preserves the chosen clinic", (label, path) => {
  render(<LandingPage />);
  fireEvent.change(screen.getByLabelText("Preferred clinic"), { target: { value: "Sta. Ana, Manila" } });
  fireEvent.click(screen.getByRole("button", { name: label, exact: true }));
  expect(localStorage.getItem("tempBranch")).toBe("Sta. Ana, Manila");
  expect(mockNavigate).toHaveBeenCalledWith(path);
});
test("requires a branch before account navigation and retains clinic portal", () => {
  render(<LandingPage />);
  fireEvent.click(screen.getByRole("button", { name: "Sign in", exact: true }));
  expect(mockNavigate).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Clinic portal" }));
  expect(mockNavigate).toHaveBeenCalledWith("/management");
});
