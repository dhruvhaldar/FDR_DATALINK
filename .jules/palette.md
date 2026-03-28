## 2026-03-22 - Custom Scrollbars in Dark Mode Themes
**Learning:** Default OS scrollbars (especially on Windows/Linux) are often bright white or light gray, which completely breaks immersion in dark-themed, "hardware terminal" or "glassmorphism" UIs.
**Action:** Always implement custom webkit scrollbars that inherit the app's primary accent color and dark background to maintain visual consistency and polish.

## 2026-03-26 - Ensure Equitable Interactive Feedback
**Learning:** When using `group-hover` on interactive containers to trigger visual feedback on child elements (like animating a KPI icon), it's easy to forget keyboard navigators. They don't hover; they focus.
**Action:** Always pair `group-hover` utility classes with corresponding `group-focus-within` or `group-focus-visible` utility classes to ensure equitable visual interaction feedback for keyboard users.

## 2024-05-19 - Differentiate Unselected vs Truly Empty States
**Learning:** Generic "Select an item to begin" empty states with actionable buttons create dead-end experiences if there is actually zero underlying data (e.g., an empty directory).
**Action:** Always conditionally render a distinct, non-actionable "No Data Available" state when data lists are genuinely empty to prevent impossible calls-to-action.
