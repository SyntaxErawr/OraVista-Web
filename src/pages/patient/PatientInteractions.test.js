import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import RecordsPage from "./K_RecordsPage";
import DashboardPage from "./J_DashboardPage";
import BookingPage from "./H_BookingPage";
import SignupPage from "./C_SignupPage";
import BillingsPage from "./M_BillingsPage";
import AppointmentsPage from "./F_AppointmentsPage";
import ProfilePage from "./I_ProfilePage";

const mockNavigate = jest.fn();
let mockLocation;
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
}), { virtual: true });
jest.mock("jspdf", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("jspdf-autotable", () => ({ __esModule: true, default: jest.fn() }));

const originalFetch = global.fetch;
const reply = (data, ok = true) => ({ ok, json: async () => data });
const patient = { id: 7, firstName: "Preview", lastName: "Patient", selectedBranch: "Gil Puyat, Pasay", branch: "Gil Puyat, Pasay" };

beforeEach(() => {
  window.innerWidth = 1440;
  mockLocation = { pathname: "/dashboard" };
  localStorage.setItem("user", JSON.stringify(patient));
  global.fetch = jest.fn(async () => reply([]));
  mockNavigate.mockClear();
});
afterEach(() => { localStorage.clear(); global.fetch = originalFetch; });

test("records search filters only dentist-verified saved diagnoses", async () => {
  global.fetch.mockImplementation(async url => reply(url.includes("patient-final-diagnoses") ? [
    { id: 1, scan_date: "2026-09-10", clinical_notes: "Follow-up review", ai_findings: { human_verified: true, annotations: [{ name: "Saved finding alpha" }] } },
    { id: 2, scan_date: "2026-09-11", clinical_notes: "Routine cleaning", ai_findings: { human_verified: true, annotations: [] } },
    { id: 3, clinical_notes: "Unverified result", ai_findings: { human_verified: false } },
  ] : {}));
  render(<RecordsPage />);
  await screen.findByText("Final Diagnosis #1");
  expect(screen.queryByText("Unverified result")).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole("searchbox", { name: "Search saved diagnoses" }), { target: { value: "alpha" } });
  expect(screen.getByText("Final Diagnosis #1")).toBeInTheDocument();
  expect(screen.queryByText("Final Diagnosis #2")).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "unmatched" } });
  expect(screen.getByText(/No saved diagnoses match/)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Apply" })).not.toBeInTheDocument();
});

test("dashboard history search works on mobile without a placeholder inbox", async () => {
  window.innerWidth = 390;
  global.fetch.mockImplementation(async url => reply(url.includes("user-appointments") ? [
    { id: 1, service_type: "Cleaning", dentist_name: "Dr. Test", status: "Completed", appointment_date: "2026-01-01", appointment_time: "10:00 AM" },
    { id: 2, service_type: "Restoration", dentist_name: "Dr. Test", status: "Cancelled", appointment_date: "2026-01-02", appointment_time: "10:00 AM" },
  ] : []));
  render(<DashboardPage />);
  await screen.findByRole("cell", { name: "Cleaning" });
  fireEvent.change(screen.getByRole("searchbox", { name: "Search appointment history" }), { target: { value: "completed" } });
  expect(screen.getByRole("cell", { name: "Cleaning" })).toBeInTheDocument();
  expect(screen.queryByRole("cell", { name: "Restoration" })).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "unmatched" } });
  expect(screen.getByText(/No appointments match/)).toBeInTheDocument();
  expect(document.querySelector(".patient-mail-btn")).toBeNull();
  expect(document.querySelector('[inert]')).toHaveAttribute("aria-hidden", "true");
});

async function chooseBooking() {
  fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "General Dentistry" } });
  fireEvent.change(screen.getAllByRole("combobox")[1], { target: { value: "Dra. Theresa Madrid" } });
  fireEvent.click(screen.getByRole("button", { name: /^Oral Prophylaxis/ }));
  const date = [...document.querySelectorAll('button[aria-pressed]')].find(button => !button.disabled);
  expect(date).toBeTruthy();
  fireEvent.click(date);
  await waitFor(() => expect(screen.getByRole("button", { name: /Refresh/ })).not.toBeDisabled());
}

test("booking failures are visible and submission cannot repeat while waiting", async () => {
  let finish;
  global.fetch.mockImplementation(async (url, options) => options?.method === "POST"
    ? new Promise(resolve => { finish = resolve; }) : reply([]));
  render(<BookingPage />);
  await chooseBooking();
  const slot = screen.getAllByRole("button").find(button => /10:00 AM/.test(button.textContent) && !button.disabled);
  expect(slot).toBeTruthy();
  fireEvent.click(slot);
  fireEvent.click(screen.getByRole("button", { name: "Confirm Appointment" }));
  const dialog = screen.getByRole("dialog", { name: "Confirm Appointment?" });
  fireEvent.click(within(dialog).getByRole("button", { name: "Confirm" }));
  expect(within(dialog).getByRole("button", { name: "Submitting..." })).toBeDisabled();
  finish(reply({ message: "That slot is no longer available." }, false));
  await screen.findByRole("alert");
  expect(within(dialog).getByRole("alert")).toHaveTextContent("That slot is no longer available.");
  expect(global.fetch.mock.calls.filter(([, options]) => options?.method === "POST")).toHaveLength(1);
});

test("failed availability checks show recovery instructions and prevent selecting unchecked slots", async () => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  global.fetch.mockResolvedValue(reply({ message: "Offline" }, false));
  render(<BookingPage />);
  await chooseBooking();
  expect(screen.getByRole("alert")).toHaveTextContent(/could not check available times/);
  expect(screen.getByRole("button", { name: "Confirm Appointment" })).toBeDisabled();
  console.error.mockRestore();
});

test("successful booking keeps the existing endpoint and appointment payload", async () => {
  render(<BookingPage />);
  await chooseBooking();
  fireEvent.click(screen.getAllByRole("button").find(button => /10:00 AM/.test(button.textContent) && !button.disabled));
  fireEvent.click(screen.getByRole("button", { name: "Confirm Appointment" }));
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Confirm" }));
  await screen.findByRole("dialog", { name: "Appointment Booked!" });
  const request = global.fetch.mock.calls.find(([, options]) => options?.method === "POST");
  expect(request[0]).toMatch(/\/api\/book-appointment$/);
  expect(JSON.parse(request[1].body)).toEqual({
    user_id: 7, service_type: "Oral Prophylaxis", dentist_name: "Dra. Theresa Madrid",
    appointment_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/), appointment_time: "10:00 AM", amount: 1500, branch: "Gil Puyat, Pasay",
  });
});

test("booking requires a treatment and changing it clears the selected time", async () => {
  render(<BookingPage />);
  fireEvent.change(screen.getByRole("combobox", { name: "Select Service" }), { target: { value: "General Dentistry" } });
  fireEvent.change(screen.getByRole("combobox", { name: "Select Dentist" }), { target: { value: "Dra. Theresa Madrid" } });
  fireEvent.click([...document.querySelectorAll('button[aria-pressed]')].find(button => !button.disabled));
  await waitFor(() => expect(screen.getByRole("button", { name: /Refresh/ })).not.toBeDisabled());
  fireEvent.click(screen.getAllByRole("button").find(button => /10:00 AM/.test(button.textContent) && !button.disabled));
  expect(screen.getByRole("button", { name: "Confirm Appointment" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: /^Oral Prophylaxis/ }));
  expect(screen.getByRole("button", { name: "Confirm Appointment" })).toBeDisabled();
  fireEvent.click(screen.getAllByRole("button").find(button => /10:00 AM/.test(button.textContent) && !button.disabled));
  expect(screen.getByRole("button", { name: "Confirm Appointment" })).not.toBeDisabled();
  expect(global.fetch.mock.calls.every(([, options]) => !options?.method)).toBe(true);
});

test("successful rescheduling keeps the existing request contract", async () => {
  mockLocation = { pathname: "/booking", state: { mode: "reschedule", appointmentId: 42, currentService: "Oral Prophylaxis", currentDentist: "Dra. Theresa Madrid", currentDate: "2026-10-10", currentTime: "10:00 AM" } };
  render(<BookingPage />);
  await waitFor(() => expect(screen.getByRole("button", { name: "Submit Reschedule Request" })).not.toBeDisabled());
  fireEvent.click(screen.getByRole("button", { name: "Submit Reschedule Request" }));
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Submit Request" }));
  await screen.findByRole("dialog", { name: "Reschedule Request Submitted!" });
  const request = global.fetch.mock.calls.find(([, options]) => options?.method === "POST");
  expect(request[0]).toMatch(/\/api\/request-reschedule$/);
  expect(JSON.parse(request[1].body)).toEqual({ appointment_id: 42, user_id: 7, requested_date: "2026-10-10", requested_time: "10:00 AM" });
});

test("leaving rescheduling returns to appointments instead of clearing locked fields", async () => {
  mockLocation = { pathname: "/booking", state: { mode: "reschedule", appointmentId: 1, currentService: "Oral Prophylaxis", currentDentist: "Dra. Theresa Madrid", currentDate: "2026-10-10", currentTime: "10:00 AM" } };
  render(<BookingPage />);
  await waitFor(() => expect(screen.getByRole("button", { name: /Refresh/ })).not.toBeDisabled());
  fireEvent.click(screen.getByRole("button", { name: "Back to Appointments" }));
  expect(mockNavigate).toHaveBeenCalledWith("/appointments");
  expect(global.fetch.mock.calls.every(([, options]) => !options?.method)).toBe(true);
});

test("signup reports a non-email server failure", async () => {
  global.fetch.mockResolvedValue(reply({ message: "Registration is temporarily unavailable." }, false));
  render(<SignupPage />);
  for (const [name, value] of Object.entries({ firstName: "Test", lastName: "Patient", email: "test@gmail.com", password: "Preview1!", confirmPassword: "Preview1!" })) {
    fireEvent.change(document.querySelector(`input[name="${name}"]`), { target: { value } });
  }
  fireEvent.click(screen.getByRole("button", { name: "CREATE ACCOUNT" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Registration is temporarily unavailable.");
});

test("a rejected profile upload restores the saved photo and offers visible feedback", async () => {
  const create = URL.createObjectURL;
  const revoke = URL.revokeObjectURL;
  URL.createObjectURL = jest.fn(() => "blob:temporary-photo");
  URL.revokeObjectURL = jest.fn();
  localStorage.setItem("user", JSON.stringify({ ...patient, profile_picture: "oldphoto.png" }));
  global.fetch.mockResolvedValue(reply({ message: "Photo upload was rejected." }, false));
  render(<ProfilePage />);
  fireEvent.click(screen.getByRole("button", { name: "Edit Information" }));
  fireEvent.change(document.querySelector('input[type="file"]'), { target: { files: [new File(["image"], "photo.png", { type: "image/png" })] } });
  expect(await screen.findByRole("alert")).toHaveTextContent("Photo upload was rejected.");
  expect(screen.getByRole("img", { name: "Profile photo" }).style.backgroundImage).toContain("oldphoto.png");
  expect(JSON.parse(localStorage.getItem("user")).profile_picture).toBe("oldphoto.png");
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:temporary-photo");
  URL.createObjectURL = create;
  URL.revokeObjectURL = revoke;
});

test.each([[BillingsPage, /billing information/], [AppointmentsPage, /load your appointments/]])("read failures offer Retry instead of silently showing empty data", async (Page, message) => {
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  global.fetch.mockResolvedValue(reply({}, false));
  render(<Page />);
  expect(await screen.findByRole("alert")).toHaveTextContent(message);
  global.fetch.mockResolvedValue(reply([]));
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  log.mockRestore();
});
