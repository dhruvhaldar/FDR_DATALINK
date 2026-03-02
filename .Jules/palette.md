## 2026-02-24 - Accessibility in Data Dashboards
**Learning:** Adding ARIA labels to file selectors and role="status" to loading indicators significantly improves the screen reader experience for data-heavy applications.
**Action:** Always check for unlabeled form controls and status indicators in dashboard interfaces.

## 2026-02-25 - Async Error Recovery
**Learning:** Disabling inputs during data fetching prevents race conditions and user frustration. Providing a clear retry mechanism is essential for resilience.
**Action:** Implement `disabled={loading}` on all interactive elements that depend on async data. (Verified via deployment preview)

## 2024-05-22 - External Link Accessibility
**Learning:** Links that open in a new tab (`target="_blank"`) without visual or screen reader indication can cause disorientation, as users may not realize they have left the original context. The FDR Datalink application uses several of these to link to NASA Dashlink and Github.
**Action:** Always add an `sr-only` span with text like "(opens in a new tab)" to external links. For prominent UI external links, also include a visual indicator like an `ExternalLink` icon to set proper expectations before clicking.
