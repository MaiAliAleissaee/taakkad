import { beforeEach, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
const state = vi.hoisted(() => ({ session: { ready: true, securityAccess: true, user: { id: "owner" } as { id: string } | null } }));
vi.mock("@/lib/security/session", () => ({ useStaffSession: () => state.session }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
vi.mock("@/lib/data/local-store", () => ({ useDemoState: () => ({ messages: [], organizations: [] }) }));
import { usePublicWorkspace } from "@/lib/data/hooks";
function Probe() { const workspace = usePublicWorkspace(); return <output data-testid="target">{workspace ?? "public"}</output>; }
beforeEach(() => { localStorage.clear(); state.session = { ready: true, securityAccess: true, user: { id: "owner" } }; });
it("clears stale references and falls back to public checks after logout", async () => {
  localStorage.setItem("trustzero.security.workspace", "00000000-0000-4000-8000-000000000001");
  state.session.user = { id: "00000000-0000-4000-8000-000000000001" };
  const view = render(<Probe />); await waitFor(() => expect(screen.getByTestId("target").textContent).toBe(state.session.user?.id));
  state.session = { ready: true, securityAccess: false, user: null }; view.rerender(<Probe />);
  await waitFor(() => expect(screen.getByTestId("target").textContent).toBe("public"));
  expect(localStorage.getItem("trustzero.security.workspace")).toBeNull();
});
it("clears the previous account's reference on account switching", async () => {
  localStorage.setItem("trustzero.security.workspace", "00000000-0000-4000-8000-000000000001");
  state.session.user = { id: "00000000-0000-4000-8000-000000000001" };
  const view = render(<Probe />);
  await waitFor(() => expect(screen.getByTestId("target").textContent).toBe(state.session.user?.id));
  state.session.user = { id: "00000000-0000-4000-8000-000000000002" }; view.rerender(<Probe />);
  await waitFor(() => expect(screen.getByTestId("target").textContent).toBe("public"));
  expect(localStorage.getItem("trustzero.security.workspace")).toBeNull();
});