## 2026-02-24 - Accessibility in Data Dashboards
**Learning:** Adding ARIA labels to file selectors and role="status" to loading indicators significantly improves the screen reader experience for data-heavy applications.
**Action:** Always check for unlabeled form controls and status indicators in dashboard interfaces.

## 2026-02-25 - Async Error Recovery
**Learning:** Disabling inputs during data fetching prevents race conditions and user frustration. Providing a clear retry mechanism is essential for resilience.
**Action:** Implement `disabled={loading}` on all interactive elements that depend on async data.
