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

## 2026-02-28 - Reassuring Empty States and Descriptive Statuses
**Learning:** During long polling or data fetches (e.g., parsing .mat files), screen readers may repeatedly announce "Loading flight data." In addition to this context, dynamic `<title>` attributes on dropdowns (e.g., "Loading flight data..." when processing the data after selection) prevent the user from feeling the interaction is broken. Decorative UI elements (like Lucide icons) *must* be hidden with `aria-hidden="true"` to stop screen readers from interpreting random visual decorations as content. Finally, visual text such as "Processing Telemetry..." adds a human touch, reassuring sighted users that the system is working on their request.
**Action:** Explicitly set `aria-hidden="true"` on non-interactive graphical icons. Update dynamic `title` properties on `<select>` options to convey loading status when the application is awaiting data processing. Include contextual visual text alongside loading spinners to reassure users.

## 2024-05-24 - Unifying Chained Async Loading States & Keyboard Hinting
**Learning:** When dealing with chained asynchronous operations (e.g., fetching a list of files, then immediately fetching data for the first file), intermediate empty states or conflicting loading spinners can cause a confusing FOUC (Flash of Unstyled Content) or flickering experience for users. Additionally, global keyboard shortcuts are hidden interactions without visual affordances.
**Action:** Unify the boolean checks for related loading operations in the main content area (e.g., `isFetchingFiles || loading`) to maintain a single, consistent loading state until the initial render of data is complete. Supplement global keyboard shortcuts (like `/` to focus search or selectors) with inline `<kbd>` elements near their related inputs to improve discoverability without taking up too much space.

## 2026-03-08 - Accessible Microcopy Contrast and Semantic Keyboard Shortcuts
**Learning:** Very small text (e.g., `10px` or `xs`) combined with low-opacity colors (like `text-emerald-500/60` on black) often fails WCAG AA minimum contrast ratios, making essential microcopy (units, loading text) hard to read. Furthermore, relying only on visual `<kbd>` elements for global shortcut hints hides this interaction from screen reader users, and focusing a `<select>` via shortcut can lead to accidental value changes if the user tries to navigate away with arrow keys without an explicit escape mechanism.
**Action:** Always verify contrast ratios for tiny typography and bump up the contrast (e.g., to `text-emerald-400`) if necessary. When implementing global keyboard shortcuts, supplement visual `<kbd>` hints with `aria-keyshortcuts` on the target element itself. Crucially, bind the `Escape` key to `.blur()` the input so users can easily return to page navigation without accidentally changing the select value.

## 2026-03-09 - Accessible Screen Reader Loading Status & Dynamic Document Title
**Learning:** During dataset loading, screen readers don't always automatically announce completion states when the visual components change. Further, users who open multiple datasets across multiple tabs cannot distinguish which dataset belongs to which tab if the `document.title` remains static.
**Action:** Update the `document.title` dynamically to reflect the current active dataset. Also, introduce an `aria-live="polite"` hidden region that actively logs load successes, failures, and cache retrievals, communicating async state cleanly without visually cluttering the UI.

## 2026-03-10 - Accurate Loading Contexts & WebGL Landmarks
**Learning:** During chained async operations (e.g., initial fetch vs. data processing), generic loading text and `aria-label`s can be inaccurate or confusing (like announcing 'Loading data for [empty file]'). Furthermore, WebGL canvas elements (like those used by react-plotly.js) are completely opaque to screen readers, meaning users miss out entirely on the presence of data visualizations unless explicitly marked up.
**Action:** Conditionally render precise loading messages and `aria-label`s based on the specific async stage (e.g., `isFetchingFiles` vs. `loading`). Always wrap WebGL or opaque interactive elements with a semantic container using `role="figure"` and a descriptive `aria-label`.

## 2026-03-11 - Focus Management During Async Disablement
**Learning:** Disabling interactive elements (like `<select>`) when an asynchronous operation starts causes the element to lose focus, which resets the active element to `document.body`. This severely disrupts keyboard navigation and screen reader flow, leaving the user completely unmoored in the UI hierarchy.
**Action:** Always programmatically manage focus *before* an element becomes disabled. Shift focus (`.focus()`) to an appropriate adjacent semantic container (like `<main tabIndex={-1}>` or an `aria-live` region) to ensure the user's place is maintained and context flows logically.

## 2026-03-12 - Keyboard Accessibility for Abbreviation Tooltips
**Learning:** Using the native `<abbr>` tag provides a helpful tooltip via the `title` attribute on mouse hover, but this is completely inaccessible to keyboard-only users because `<abbr>` elements are not inherently focusable by browsers.
**Action:** Always add `tabIndex={0}` and standard `focus-visible` outline styles to `<abbr>` tags so that keyboard users can tab to them and reveal the title tooltip, ensuring domain-specific terminology (like units of measurement) is accessible to everyone.

## 2026-03-13 - Visual Feedback for Global Keyboard Shortcuts
**Learning:** When global keyboard shortcuts (e.g., `/` to focus an input) are implemented with a static visual `<kbd>` hint, users lack immediate visual confirmation when the shortcut is activated.
**Action:** Add visual feedback to shortcut hints when their target element is focused. Use `group` on a common parent container and `group-focus-within` styling on the `<kbd>` element so the hint "lights up" to reinforce the interaction.

## 2026-03-14 - Cognitive Accessibility of Text Alignment
**Learning:** Justified text (`text-justify`) creates uneven, unpredictable whitespace between words ('rivers of white'). This degrades readability for all users and specifically harms cognitive accessibility, making content significantly harder to read for users with dyslexia and violating WCAG guidelines.
**Action:** Avoid `text-justify` for paragraph text. Prefer standard left-aligned text (`text-left`) to maintain predictable letter and word spacing.

## 2026-03-15 - Visual Hierarchy in Empty States
**Learning:** Empty states that rely only on a simple, low-contrast text link can feel unfinished, uninviting, and lack the necessary visual weight to guide the user's next action. Additionally, embedding a global keyboard shortcut hint (`<kbd>`) inside an interactive CTA reinforces discoverability much better than standalone text instructions.
**Action:** Always enhance purely text-based empty states by implementing a clear visual hierarchy: include a muted thematic icon, a descriptive status title (e.g., "Ready for Telemetry"), high-contrast instructional microcopy, and a prominently styled Call-To-Action (CTA) button containing relevant `<kbd>` shortcut hints.
