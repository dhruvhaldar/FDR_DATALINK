[Output truncated for brevity]

a human touch, reassuring sighted users that the system is working on their request.
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

## 2026-03-16 - Conditional Focus Management for Cached Data
**Learning:** Unconditionally shifting focus (e.g., to a main content area) when an input changes works well for preventing focus loss during asynchronous data fetching that disables the input. However, if the data is fetched synchronously from a client-side cache, the input is never disabled, and the focus shift unexpectedly hijacks the user's keyboard navigation.
**Action:** When implementing programmatic focus shifts to handle async state disablement, always add conditional logic to verify that an actual network request is occurring (e.g., `if (!dataCache[val])`). If the data loads instantly from a cache, do not disrupt the user's focus.

## 2026-03-17 - Keyboard Focus Equity for Nested Interactive Elements
**Learning:** Interactive elements that use `group` and `group-hover` utility classes to trigger rich visual feedback on child elements (such as an animated icon or a highlighted keyboard shortcut hint) often inadvertently neglect keyboard-only users. Because standard `focus-visible` only styles the parent container, the helpful child micro-interactions are completely lost when the element receives keyboard focus, creating an inequitable UX.
**Action:** When implementing `group-hover` on child elements within an interactive component (like a button or link), always pair it with corresponding `group-focus-visible` utility classes (e.g., `group-focus-visible:rotate-180` or `group-focus-visible:text-emerald-300`) to ensure keyboard navigators receive the same delightful visual affordance as mouse users.

## 2026-03-18 - Animated Affordance for External Links
**Learning:** External links (`target="_blank"`) that only indicate their behavior via a static icon can feel flat. Adding a subtle directional micro-interaction (e.g., sliding the icon up and to the right) reinforces the concept of "opening in a new window/context." Crucially, relying only on `group-hover` for this animation creates an inequitable experience for keyboard users who navigate via `tab`.
**Action:** When implementing animated icons for external links using Tailwind's `group` utility, always pair `group-hover` transitions (e.g., `group-hover:-translate-y-0.5 group-hover:translate-x-0.5`) with corresponding `group-focus-visible` utility classes (e.g., `group-focus-visible:-translate-y-0.5 group-focus-visible:translate-x-0.5`) to ensure both mouse and keyboard users receive the same delightful visual affordance.

## 2026-03-19 - Semantic Landmark Upgrades for Custom Containers
**Learning:** Custom UI container components (like visual panels or cards) often rely on generic `<div>` elements. When these containers have explicit visual titles, failing to associate the title with the container structurally means screen reader users miss out on document outline navigation (landmarks). Manually ensuring every usage is accessible is error-prone.
**Action:** Automatically upgrade generic custom containers to semantic landmarks (e.g., `<section>`) when an explicit `title` prop is provided. Use `React.useId()` to generate a unique ID for the title element, and apply `aria-labelledby` to the wrapper. This enhances document structure and accessibility automatically without requiring manual changes from consumers of the component.

## 2026-03-20 - Unifying Chained Async Loading Visuals
**Learning:** When dealing with chained asynchronous operations (e.g., `isFetchingFiles` -> `loading` data), separate loading DOM nodes can cause a Flash of Unstyled Content (FOUC), which visually jars users and disrupts the continuous `aria-live` context for screen readers.
**Action:** Unify multiple consecutive loading boolean checks (e.g., `isFetchingFiles || loading`) into a single persistent DOM container that conditionally updates its visual text and `aria-label` properties based on the current stage of the chained operation. This ensures a seamless visual transition and consistent semantic state.

## 2026-03-21 - Visual Consistency in Disabled Form Controls
**Learning:** When an interactive input (like a `<select>`) becomes disabled, native browsers only apply disabled styling to the input element itself. The associated `<label>` remains visually active, which causes a disconnect and can confuse users about whether the entire component block is disabled or just the input.
**Action:** Always dynamically link the visual styling (e.g., `opacity-50`, `cursor-not-allowed`) of a `<label>` to match the `disabled` state of its corresponding input. Additionally, ensure inputs explicitly handle edge-case disabled states (e.g., `<select>` disabled when options array `length === 0`).

## 2026-03-21 - Cognitive Accessibility of Large Numbers
**Learning:** Displaying large numbers without thousand separators (e.g., `35000.0` instead of `35,000.0`) significantly reduces cognitive accessibility and scannability, especially in rapid-update data dashboards where users need to process metrics at a glance.
**Action:** Avoid using `Number.prototype.toFixed()` for large UI numbers. Instead, use `Number.prototype.toLocaleString('en-US', { minimumFractionDigits: X, maximumFractionDigits: X })` to automatically introduce culturally appropriate digit grouping (thousand separators) while maintaining precise decimal formatting.
