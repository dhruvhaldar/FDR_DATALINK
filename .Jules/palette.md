## 2026-02-24 - Accessibility in Data Dashboards
**Learning:** Adding ARIA labels to file selectors and role="status" to loading indicators significantly improves the screen reader experience for data-heavy applications.
**Action:** Always check for unlabeled form controls and status indicators in dashboard interfaces.

## 2026-02-25 - Async Error Recovery
**Learning:** Disabling inputs during data fetching prevents race conditions and user frustration. Providing a clear retry mechanism is essential for resilience.
**Action:** Implement `disabled={loading}` on all interactive elements that depend on async data. (Verified via deployment preview)

## 2024-05-22 - External Link Accessibility
**Learning:** Links that open in a new tab (`target="_blank"`) without visual or screen reader indication can cause disorientation, as users may not realize they have left the original context. The FDR Datalink application uses several of these to link to NASA Dashlink and Github.
**Action:** Always add an `sr-only` span with text like "(opens in a new tab)" to external links. For prominent UI external links, also include a visual indicator like an `ExternalLink` icon to set proper expectations before clicking.

## 2026-02-26 - Actionable Empty States
**Learning:** When empty states instruct users to perform an action (like "use the selector"), making the instruction text itself an interactive button that uses `focus()` to guide the user's focus to the required input creates a much smoother experience, especially for keyboard/screen reader users. Hiding decorative characters (like `>`, `•`, `---`) with `aria-hidden="true"` is also crucial to avoid annoying or confusing screen reader announcements.
**Action:** Always make instructional empty states actionable where possible, using programmatic `focus()` to guide the user's focus. Ensure purely decorative characters are hidden from screen readers.

## 2026-02-27 - Contextual Empty States in Selectors
**Learning:** Empty `<select>` dropdowns during an initial data fetch cause confusion, appearing broken or empty without explanation. Simply adding `disabled={true}` is insufficient.
**Action:** Always provide explicit disabled `<option>` elements for loading ("Loading datasets...") and empty ("No datasets available") states. Complement this with `title` attributes explaining the disabled reason and `aria-busy={true}` during fetching to provide critical context for all users.
