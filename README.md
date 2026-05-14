# opsly-mask

`opsly-mask` adds **` ```secure `** fenced blocks to [`react-markdown`](https://github.com/remarkjs/react-markdown). Fenced secrets render **masked by default**; the **literal body** remains in the tree for reveal via React state.

**Behavior-first / UI-agnostic:** the package provides **semantics, fixed-length masking, reveal state, stable `data-*` hooks, and minimal accessible grouping**. **Reveal controls, copy buttons, toolbars, icons, spacing, layout, and mobile behavior are entirely in your app.**

Secure fences flow through the same remark/rehype integration as ordinary code blocks so they reuse your **`pre` / `code`** implementations.

## How it works

- **` ```secure `** blocks are rewritten in **remark**, bridged through **rehype** (`opslyMaskRemarkRehypeOptions`), and rendered as **`SecureBlock`**: masked content lives in **`code`** inside your **`pre`**.
- Output is **masked by default** (fixed-length placeholder; length of the secret is not leaked).
- The **fence body string** is kept as **literal text**—your UI toggles **`revealed`** via **`useSecureFenceBehavior`** (`toggle` / `setRevealed`).
- **Stable DOM hooks** on **`pre` / `code`** expose state to CSS and app logic; **`data-opsly-mask-toggle`** is a **convention for your controls**—the package does not render it.

**Literal rendering:** when revealed, secure content appears as **plain characters inside `<code>`**. It is **not** interpreted again as Markdown or embedded HTML—the fence body is shown as-is (newlines and special characters preserved). While hidden, **`code`** shows a fixed-length mask instead of those characters.

The package runs in normal **`react-markdown`** setups, including **SSR**: the usual server HTML is masked; reveal depends on client-side state once your toggle and **`useSecureFenceBehavior`** run in the browser.

## Why

Internal docs often hold API keys, tokens, URLs, and config snippets. This library **reduces accidental exposure** during:

- demos
- screenshots
- screen sharing
- in-app Markdown previews

Masking is **presentation only**. It does not encrypt data or replace secret management.

## Install

```bash
pnpm add opsly-mask
```

Peer dependencies: `react`, `react-dom` (see `package.json`).

## Markdown syntax

Use a `secure` code fence (syntax unchanged). Info-string metadata (e.g. `id="prod"`) is **not** used to detect secure fences—the opening language token must be `secure`.

````markdown
```secure
SECRET=value
```
````

````markdown
```secure id="prod"
SECRET=value
```
````

## Minimal integration

Smallest useful pattern: **`OpslyMarkdown`**, a custom **`pre`**, the hook, one button, and **`props.children`** (label + `code` from the library).

```tsx
import type { ComponentProps } from 'react'
import {
  OpslyMarkdown,
  OPSLY_MASK_TOGGLE_ATTR,
  useSecureFenceBehavior,
} from 'opsly-mask'

function Pre(props: ComponentProps<'pre'>) {
  const ctx = useSecureFenceBehavior()
  if (!props['data-opsly-mask'] || ctx == null) return <pre {...props} />
  return (
    <pre {...props}>
      <button
        type="button"
        {...{ [OPSLY_MASK_TOGGLE_ATTR]: true }}
        aria-pressed={ctx.revealed}
        aria-controls={ctx.contentId}
        onClick={ctx.toggle}
      >
        Reveal
      </button>
      {props.children}
    </pre>
  )
}

<OpslyMarkdown components={{ pre: Pre }}>{md}</OpslyMarkdown>
```

## Basic usage (`OpslyMarkdown`)

With only the default components, **no reveal control is rendered**—you get masked **`pre` / `code`**, stable attributes, an **accessible group label** (visually hidden text tied to **`aria-labelledby`**), and context from **`useSecureFenceBehavior`**. Wire your own UI in **`components.pre`** (or descendants):

```tsx
import type { ComponentProps } from 'react'
import Markdown from 'react-markdown'
import {
  createOpslyMarkdownComponents,
  opslyMaskRemarkPlugins,
  opslyMaskRemarkRehypeOptions,
  OPSLY_MASK_TOGGLE_ATTR,
  useSecureFenceBehavior,
} from 'opsly-mask'

/** Example: toolbar row + semantic toggle (icons/labels/copy are yours). */
function Pre(props: ComponentProps<'pre'>) {
  const ctx = useSecureFenceBehavior()

  if (!props['data-opsly-mask'] || ctx == null) {
    return <pre {...props} />
  }

  return (
    <pre {...props} className="code-block-shell">
      <div className="code-toolbar">
        <button
          type="button"
          {...{ [OPSLY_MASK_TOGGLE_ATTR]: true }}
          aria-pressed={ctx.revealed}
          aria-controls={ctx.contentId}
          onClick={ctx.toggle}
        >
          {ctx.revealed ? 'Hide' : 'Reveal'}
        </button>
      </div>
      {props.children}
    </pre>
  )
}

const mdComponents = createOpslyMarkdownComponents({ pre: Pre })

export function Doc({ md }: { md: string }) {
  return (
    <Markdown
      remarkPlugins={[...opslyMaskRemarkPlugins]}
      remarkRehypeOptions={opslyMaskRemarkRehypeOptions()}
      components={mdComponents}
    >
      {md}
    </Markdown>
  )
}
```

Same **`Pre`** with **`OpslyMarkdown`**:

```tsx
import { OpslyMarkdown } from 'opsly-mask'

<OpslyMarkdown components={{ pre: Pre }}>{md}</OpslyMarkdown>
```

Always forward **`props.children`** from `pre`. Children include (1) the **accessible group label** (visually hidden `span`), (2) the **`code`** surface (mask or literal text).

Optional **`secureBlockProps`** forwards **`SecureBlock`** options such as **`groupLabel`** (text for that label / i18n).

**`OPSLY_MASK_TOGGLE_ATTR`** is the string **`'data-opsly-mask-toggle'`**—use it on your focusable control so selectors stay consistent.

## Advanced / minimal `react-markdown` wiring

```tsx
import Markdown from 'react-markdown'
import {
  createOpslyMarkdownComponents,
  opslyMaskRemarkPlugins,
  opslyMaskRemarkRehypeOptions,
} from 'opsly-mask'

const components = createOpslyMarkdownComponents(
  {
    /* your overrides, including `components.pre` for reveal/copy */
  },
  {
    /* optional: SecureBlock extras, e.g. `groupLabel` for i18n */
  },
)
```

## Hook: `useSecureFenceBehavior`

Returns **`null`** outside **`SecureBlock`**. For **`pre[data-opsly-mask]`** (when your `components.pre` runs under **`SecureBlock`**), it returns:

| Field | Purpose |
|--------|---------|
| **`revealed`** | Whether literal secret vs fixed mask is shown in `code` |
| **`toggle()`** | Flip hidden ↔ revealed |
| **`setRevealed`** | Set state explicitly |
| **`contentId`** | `id` on the fenced `code`; pair with **`aria-controls`** on your toggle |
| **`groupLabelId`** | `id` on the span that supplies the **accessible group label** referenced by **`pre`’s `aria-labelledby`** |

**Accessibility expectations**

- Prefer a **`button`** (or an equivalent focusable control from your design system) with **`aria-pressed`** and **`aria-controls={contentId}`** so assistive tech can relate the control to the masked region.
- Keep **`role="group"`** and **`aria-labelledby`** on **`pre`** unless you deliberately replace the accessible name another way.
- While masked, **`code`** carries **`aria-hidden`**: the **group** and **your toggle** provide the primary announcement; adjust only if your product needs a different pattern.

Keyboard: native **`button`** elements handle **Enter** and **Space** by default.

## Stable DOM hooks (package contract)

| Hook | Where | Purpose |
|------|---------|---------|
| `data-opsly-mask` | `pre` | Secure fence boundary |
| `data-revealed` | `pre` | `"true"` \| `"false"` |
| `data-opsly-mask-content` | `code.language-secure` | Mask vs literal payload |
| `data-opsly-mask-toggle` | **your** control(s) | Conventional reveal target—not emitted by package |

The AST emits a host `div` with `data-opsly-mask`; `createOpslyMarkdownComponents` swaps it for **`SecureBlock`**, which moves attributes onto **`pre`**.

### Example: external toolbar component

Compose the behavior hook with your existing toolbar primitives:

```tsx
import type { ComponentProps } from 'react'
import { type SecureFenceBehavior, useSecureFenceBehavior } from 'opsly-mask'

function Toolbar({ ctx }: { ctx: SecureFenceBehavior }) {
  return (
    <span className="tools">
      <CopyButton /> {/* your clipboard logic */}
      <button
        type="button"
        data-opsly-mask-toggle=""
        aria-pressed={ctx.revealed}
        aria-controls={ctx.contentId}
        onClick={ctx.toggle}
      >
        {ctx.revealed ? 'Mask' : 'Reveal'}
      </button>
    </span>
  )
}

function Pre(props: ComponentProps<'pre'>) {
  const ctx = useSecureFenceBehavior()
  const isFence = !!props['data-opsly-mask']

  return (
    <pre {...props} style={{ position: isFence ? 'relative' : undefined }}>
      {isFence && ctx ? <Toolbar ctx={ctx} /> : null}
      {props.children}
    </pre>
  )
}
```

Use **`position: relative`** and absolute placement only when **your** layout needs it—the package does not choose positions.

## API surface

| Export | Role |
|--------|------|
| `OpslyMarkdown` | Pre-wired `Markdown` + GFM + fences; **`components.pre`** wires reveal UX |
| `createOpslyMarkdownComponents` | Merged `components` + secure div → **`SecureBlock`**; optional **`secureBlockOptions`** |
| `createSafeCodeComponent` | Safe `inline`/`node` handling + fallback **`language-secure`** fences |
| `SecureBlock` | Standalone block; **`useSecureFenceBehavior` + `components.pre`** for controls |
| `useSecureFenceBehavior` | Context hook for **`revealed`** / **`toggle`** / **`contentId`** |
| `OPSLY_MASK_TOGGLE_ATTR` | Stable string for the **`data-opsly-mask-toggle`** attribute |
| `SecureFenceBehavior`, `SecureBlockProps`, `SecureBlockOptions` | Types |
| `opslyMaskRemarkPlugins`, `opslyMaskRemarkRehypeOptions` | Pipeline glue |

## Scope & non-goals

- **Behavior only:** no bundled reveal UI, copy UI, icons, or theme.
- **No** Tailwind/design-system coupling in dependencies.

---

## Migration: v0.8 → v0.9

**Breaking**

- All **built-in reveal UI removed** (`renderToggle`, **`renderDefaultSecureToggle`**, default text buttons, **`toggleTexts`**, **`SecureToggle*`** types).
- Default SSR/HTML **does not** include **`data-opsly-mask-toggle`** until your app renders a toggle.

**What to do**

1. Implement **`components.pre`** (or a wrapper around it) that calls **`useSecureFenceBehavior()`** when **`data-opsly-mask`** is present.
2. Render your **`button`/toolbar**, set **`aria-pressed`**, **`aria-controls={ctx.contentId}`**, **`onClick={ctx.toggle}`**, and **`data-opsly-mask-toggle`** via **`OPSLY_MASK_TOGGLE_ATTR`** or the literal attribute.
3. Drop **`secureBlockProps.renderToggle`** usage.

**Additive**

- **`useSecureFenceBehavior`**, **`SecureFenceBehavior`**, **`OPSLY_MASK_TOGGLE_ATTR`**, stable **`contentId`** on **`code`** for **`aria-controls`**.

See [`examples/consumer-styles.example.css`](./examples/consumer-styles.example.css).

## License

MIT © Akash Patel
