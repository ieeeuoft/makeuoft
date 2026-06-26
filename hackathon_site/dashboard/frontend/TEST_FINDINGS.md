# Frontend Test Suite — Findings

Status of the HSS React dashboard (`hackathon_site/dashboard/frontend`) Jest suite after a triage + fix pass.

| | Test Suites | Tests |
|---|---|---|
| **Before** | 16 failed / 70 | 51 failed / 370 |
| **After** | 8 failed / 70 | 33 failed, **337 passed** / 370 |

`tsc --noEmit` is clean (0 errors). Run tests with `NODE_OPTIONS=--openssl-legacy-provider` (Node 20 + react-scripts 4).

**18 stale tests were fixed** (they had drifted from intentional code changes). The **33 that remain are intentionally left failing** — each one either signals a real bug or sits on top of an unfinished refactor, so "fixing" it by editing the test would hide the problem. They are grouped below with recommended fixes.

---

## ✅ Fixed (stale tests updated to match intentional changes)

- **Hardware "credits" feature** — `Hardware`/`CartItem`/`EnhancedAddToCartFormProps` gained a required `credits` field; test fixtures + expectations were updated (`cartSlice.test.ts`, `ProductOverview.test.tsx`, `Dashboard.test.tsx`, etc.). The add-to-cart button label became `Add to cart (N Credits)` → matchers relaxed to substring.
- **`OrderTables` "Pending status"** — `"Submitted"` chip label was renamed `"In progress"` → `"Submitted"` (commit d441f58); a new `"In Progress"` → `"Being Packed"` case was added.
- **`OrderFilter` clear-all** — `clearFilters` yields `{}`, not `{status: []}`.
- **`CartSummary` / `Cart` "0"** — an empty cart now shows three `0`s (quantity, credits subtotal, remaining credits); ambiguous `getByText("0")` → `getByTestId("cart-quantity-total")`.
- **`ItemTable` status chip / `Dashboard` constraints / `Acknowledgement` copy / `TeamPendingOrderTable` check-all** — updated to match current rendering (relabeled chips, commented-out constraint display, multi-node success message, status-gated bulk check).
- **Test isolation** — added `afterEach(() => window.localStorage.clear())` in `setupTests.ts` (admin order filters persist to localStorage and were leaking between tests).

---

## 🔴 Remaining — flagged (need code / feature work or a decision)

### A. The 3D-printing feature refactor is incomplete — 27 tests + 1 empty suite
`Inventory.test.tsx` (9), `Threedprinting.test.tsx` (9), `ProductOverview3D.test.tsx` (8), `hardware3dSlice.test.ts` (empty suite).

- **Inventory hardware-load gating — likely a real bug.** `pages/Inventory/Inventory.tsx` now fetches hardware only *after* categories load **and** a category named exactly `"3D Printing"` exists (`selectThreeDPrintingId` in `slices/hardware/categorySlice.ts` matches `c.name === "3D Printing"`). If that category is missing, slow, or the category fetch fails, the page dispatches **no hardware fetch at all** → the inventory shows no hardware. `mockCategories` has no `"3D Printing"` category, so every render-based Inventory test never loads hardware ("Arduino" never appears).
  - **Recommended fix:** fetch hardware on mount unconditionally and apply `exclude_category_ids` only *when* the 3D-printing category exists — don't gate the fetch itself on it. Then update `Inventory.test.tsx` to expect the `exclude_category_ids` filter and add a `"3D Printing"` category to mock data for the exclusion path.
- **`ProductOverview3D` reads a separate slice.** It uses `hardware3dInProductOverviewSelector` / `is3dUpdateDetailsLoading` from `slices/hardware/hardware3dSlice`, but `ProductOverview3D.test.tsx` seeds the *main* hardware slice (`makeStoreWithEntities` has no `hardware3d` support), so the component sees no hardware and renders nothing.
  - **Recommended fix:** add `hardware3d` support to `makeStoreWithEntities` (`testing/utils.tsx`) and update the test to seed it.
- **`hardware3dSlice.test.ts` is not a test.** It contains a full copy of hardware-slice *source code* (with an older `category_ids`-based `setFilters`) and **zero test cases** → "Your test suite must contain at least one test." Looks like a leftover from the refactor.
  - **Recommended fix:** delete it, or rename to a real `.ts` source file, or write actual tests — whichever matches the intent.
- **Overall:** finish the 3D-printing feature and its test infrastructure as one unit. These tests were deliberately not rewritten to match half-built code.

### B. Real production bugs — 2 tests
- **Cart crash — `src/api/helpers.ts:43`.** `order.request.forEach(...)` is unguarded. If the orders endpoint returns an order without `request`, it throws `Cannot read properties of undefined (reading 'forEach')`, crashing the order-serialization path. (`Cart.test.tsx` → "Fetches any missing hardware on load".)
  - **Fix:** `(order.request ?? []).forEach(...)` (sibling fields like `order.total_credits || 0` are already guarded).
- **`ItemTable` cancel-order modal stays open — `src/components/dashboard/ItemTable/ItemTable.tsx:248-271`.** `submitCancelOrderModal` calls `setShowCancelOrderModal(false)` only *after* `await dispatch(getTeamOrders())`, so the modal doesn't close promptly and can get stuck open if the refresh fails. (`ItemTable.test.tsx` → "cancel order modal disappears when modal is submitted".)
  - **Fix:** move `setShowCancelOrderModal(false)` to the top of the handler (close synchronously, before the await), matching the "Go Back" dismiss path.

### C. localStorage order-filter feature is incomplete — 4 tests
`OrdersSearch.test.tsx` (4).

- A recent *"Local Storage Solution for Order Filters"* feature (`slices/order/adminOrderSlice.ts`) persists/seeds admin order filters via localStorage. After adding test isolation (`localStorage.clear()`), the old leaked-`limit` symptom is gone, but now the **search filter never reaches the API** — every `get("/api/hardware/orders/", …)` call carries `{}` instead of `{search: "foobar"}`. The component's `onSubmit` looks correct (`setFilters({ search }); getOrdersWithFilters()`), so the filter is being lost somewhere in the persistence/rehydrate path (note the `// Filter Bux Fix` comment and commented-out code in `OrdersSearch.tsx`).
  - **Recommended:** finish/verify the localStorage filter feature so dispatched filters actually drive the request. I applied the safe test-isolation fix but did **not** rewrite the assertions to hide the lost-filter behavior.

### D. Brittle test — 1 test
`IncidentForm.test.tsx` (1).

- The test stubs `global.URLSearchParams` to fake a non-empty query string; that isn't intercepted in this CRA4/jsdom setup, so the component reads an empty `location.search` and renders nothing. **Production is fine** (`IncidentForm.tsx` reads `useLocation().search`). The test needs to drive a real route, but the shared `customRender` (`testing/utils.tsx`) hardcodes `BrowserRouter`, and route-seeding via `history.pushState` and a nested `MemoryRouter` both failed to propagate to `useLocation()` here.
  - **Recommended:** add a `MemoryRouter`/`initialEntries`-aware render helper to `testing/utils.tsx`, then seed the route. Left at its original state.

---

*Generated during a test-suite triage pass. Verified with `tsc --noEmit` (0 errors) and per-suite Jest runs.*
