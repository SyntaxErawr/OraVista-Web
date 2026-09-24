import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import AppointmentsPage from "./F_AppointmentsPage";

// CRA's Jest resolver predates React Router 7's package exports.
jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: "/appointments" }),
}), { virtual: true });

const originalFetch = global.fetch;
let appointments;
let rejectSave;

beforeEach(() => {
  localStorage.setItem("user", JSON.stringify({ id: 7, firstName: "Preview" }));
  rejectSave = false;
  appointments = ["Pending", "Confirmed", "Completed", "Approved", "Cancelled"].map((status, index) => ({
    id: index + 1,
    status,
    service_type: "Cleaning",
    dentist_name: "Dr. Preview",
    appointment_date: "2026-10-10",
    appointment_time: "09:00:00",
  }));
  global.fetch = jest.fn(async (url, options) => {
    if (options?.method === "PUT") {
      if (rejectSave) return { ok: false, json: async () => ({ message: "Cancellation could not be saved." }) };
      const id = Number(url.match(/appointments\/(\d+)\/cancel/)[1]);
      appointments = appointments.map(appt => appt.id === id ? { ...appt, status: "Cancelled" } : appt);
      return { ok: true, json: async () => ({ message: "Saved" }) };
    }
    return { ok: true, json: async () => appointments.map(appt => ({ ...appt })) };
  });
});

afterEach(() => {
  localStorage.clear();
  global.fetch = originalFetch;
});

const writes = () => global.fetch.mock.calls.filter(([, options]) => options?.method === "PUT");
const status = value => screen.getByLabelText(`Appointment status: ${value}`);
const cancelButton = value => within(status(value).parentElement).getByRole("button", { name: /^Cancel / });

async function openEditor(width = 1440) {
  window.innerWidth = width;
  render(<AppointmentsPage />);
  await screen.findByLabelText("Appointment status: Pending");
  expect(screen.queryByRole("button", { name: /^Cancel / })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Edit Appointments" }));
}

test.each([1440, 390])("explicit cancellation stages, then saves the existing request at width %s", async width => {
  await openEditor(width);
  expect(screen.getAllByRole("button", { name: /^Cancel / })).toHaveLength(3);
  expect(within(status("Completed").parentElement).queryByRole("button")).toBeNull();
  expect(within(status("Cancelled").parentElement).queryByRole("button")).toBeNull();
  fireEvent.click(status("Pending"));
  expect(screen.queryByText("Mark for Cancellation?")).toBeNull();

  fireEvent.click(cancelButton("Pending"));
  expect(screen.getByText("Mark for Cancellation?")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Keep appointment" }));
  expect(status("Pending")).toBeTruthy();
  fireEvent.click(cancelButton("Pending"));
  fireEvent.click(screen.getByRole("button", { name: "Yes, cancel" }));
  expect(screen.queryByLabelText("Appointment status: Pending")).toBeNull();
  expect(writes()).toHaveLength(0);

  fireEvent.click(screen.getByRole("button", { name: "Apply" }));
  fireEvent.click(screen.getByRole("button", { name: "Yes" }));
  await screen.findByRole("button", { name: "Okay" });
  expect(writes()).toHaveLength(1);
  expect(writes()[0][0]).toMatch(/\/api\/appointments\/1\/cancel$/);
  expect(JSON.parse(writes()[0][1].body)).toEqual({ user_id: 7, expected_status: "Pending" });
  expect(screen.getByRole("button", { name: "Edit Appointments" })).toBeTruthy();
});

test.each(["Confirmed", "Approved"])("%s cancellation retains the policy warning and discard behavior", async value => {
  await openEditor();
  fireEvent.click(cancelButton(value));
  expect(screen.getByText("Cancel Policy Warning")).toBeTruthy();
  expect(screen.queryByText("Mark for Cancellation?")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Go Back" }));
  expect(status(value)).toBeTruthy();
  fireEvent.click(cancelButton(value));
  fireEvent.click(screen.getByRole("button", { name: "Proceed" }));
  fireEvent.click(screen.getByRole("button", { name: "Yes, cancel" }));
  fireEvent.click(screen.getByRole("button", { name: "Apply" }));
  fireEvent.click(screen.getByRole("button", { name: "No" }));
  expect(status(value)).toBeTruthy();
  expect(writes()).toHaveLength(0);
});

test("a failed save restores the appointment and shows the existing failure feedback", async () => {
  rejectSave = true;
  await openEditor();
  fireEvent.click(cancelButton("Pending"));
  fireEvent.click(screen.getByRole("button", { name: "Yes, cancel" }));
  fireEvent.click(screen.getByRole("button", { name: "Apply" }));
  fireEvent.click(screen.getByRole("button", { name: "Yes" }));
  await screen.findByText(/Cancellation could not be saved/);
  await waitFor(() => expect(status("Pending")).toBeTruthy());
  expect(writes()).toHaveLength(1);
});
