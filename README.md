# opsly-mask

`opsly-mask` adds support for **` ```secure `** fenced blocks in [`react-markdown`](https://github.com/remarkjs/react-markdown), allowing sensitive values inside Markdown docs to stay masked by default with optional reveal behavior.

Internally, `opsly-mask` integrates with the remark/rehype pipeline so secure fences reuse your existing `pre` / `code` rendering setup and behave like native fenced code blocks.

## Preview

![opsly-mask preview](./assets/preview.png)

## Why

Docs and internal notes often hold API keys, tokens, internal URLs, and config fragments. The package helps **reduce accidental exposure** during:

- demos
- screenshots
- screen sharing
- documentation workflows where Markdown is previewed in-app

Masking is **presentation only**. It does not encrypt data, store secrets, or replace secret management or access control.

## Install

```bash
pnpm add opsly-mask
```

Peer dependencies: `react`, `react-dom` (see `package.json`).

## Markdown syntax

Use a `secure` code fence (syntax unchanged):

````markdown
```secure
API_KEY=sk-live-example
multi
line
```
````

## Basic usage

```tsx
import { OpslyMarkdown } from 'opsly-mask'

export function Note({ md }: { md: string }) {
  return <OpslyMarkdown>{md}</OpslyMarkdown>
}
```

## Advanced / custom integration

For a custom `react-markdown` setup, reuse the same plugins and `components`:

```tsx
import Markdown from 'react-markdown'
import {
  createOpslyMarkdownComponents,
  opslyMaskRemarkPlugins,
  opslyMaskRemarkRehypeOptions,
} from 'opsly-mask'

const components = createOpslyMarkdownComponents({
  /* your overrides */
})

export function Doc({ children }: { children: string }) {
  return (
    <Markdown
      remarkPlugins={[...opslyMaskRemarkPlugins]}
      remarkRehypeOptions={opslyMaskRemarkRehypeOptions()}
      components={components}
    >
      {children}
    </Markdown>
  )
}
```

## API surface

| Export | Role |
|--------|------|
| `OpslyMarkdown` | Pre-wired `Markdown` + GFM + secure fences |
| `createOpslyMarkdownComponents` | Merges your `components` with the secure-fence `div` mapping |
| `opslyMaskRemarkPlugins` | `[remarkGfm, remarkSecureFence]` |
| `opslyMaskRemarkRehypeOptions` | `remark-rehype` handlers for `secureFence` → host `div` |
| `createSafeCodeComponent`, `toSpreadSafeCodeProps` | Optional: safe `inline` / `node` handling for custom `code` renderers |
| `SecureBlock` | Standalone block; pass optional `pre` / `code` to match your MD pipeline |

## Code-block integration

`SecureBlock` is built to feel like a **fenced code block**, not a separate widget.

**Reuse your pipeline**

- It renders with the **same `components.pre` and `components.code`** you pass into `createOpslyMarkdownComponents`.
- Padding, radius, background, scroll, and monospace stacks should match your other fences with **no duplicate rules** for a second container type.

**Hidden vs revealed**

- **Hidden:** a **fixed-length** mask (`•` × 16) inside the same `<code class="language-secure">` as normal fences—inline on the code surface, not a separate widget.
- **Revealed:** **literal text** inside that `<code>` (whitespace and newlines preserved, same as a native code fence).
- Revealed content is **not** parsed as Markdown prose, so typography and foreground colors follow your existing `pre code` rules exactly (no “document black” on a themed code background).

**Toggle UI**

- The eye control is **`position: absolute`** in the top-right of the `pre` (minimal inline positioning).
- Keep it visually secondary in your CSS (e.g. lower opacity until hover).

**Safe `code` props (`createOpslyMarkdownComponents`)**

`createOpslyMarkdownComponents` wraps your `components.code` with **`createSafeCodeComponent`**:

- Fence and inline `code` follow the usual `<pre><code>` / `<code>` split.
- Custom renderers receive **`toSpreadSafeCodeProps`** so `inline` and `node` stay off DOM nodes when consumers use `{...props}` on `<code>` (**React 19–safe**).

You can import **`createSafeCodeComponent`** or **`toSpreadSafeCodeProps`** if you build your own `components` map.

**Custom `pre` implementations**

If your custom `pre` assumes `children` is only a single `code` node (e.g. for clipboard helpers), it may need to:

- tolerate a fragment (screen-reader text, toggle, and a positioning wrapper) for secure fences, or
- inspect `pre[data-opsly-mask]` separately.

**Semantic data attributes** (still no package theme):

| Hook | Element | Purpose |
|------|---------|---------|
| `data-opsly-mask` | `pre` from your `components.pre` | Scope mask-specific rules |
| `data-revealed` | Same `pre` | `"true"` \| `"false"` |
| `data-opsly-mask-content` | `code.language-secure` | The mask / literal secret surface |
| `data-opsly-mask-toggle` | Button | Icon control |

The AST emits a host `div` with `data-opsly-mask` for the hand-off. `createOpslyMarkdownComponents` swaps that for `SecureBlock`, which moves the hook onto **`pre`** via your `pre` implementation.

**Example** (illustrative—keep one set of rules for `pre` / `code` in your design system, then layer only what’s unique):

```css
/* Your normal markdown code blocks (shared with ```secure```) */
.prose pre {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  overflow: auto;
  background: var(--code-bg);
  color: var(--code-fg);
  font-family: var(--font-mono);
  font-size: 0.875rem;
  line-height: 1.5;
}

/* Secondary toggle — does not compete with the code surface */
pre[data-opsly-mask] [data-opsly-mask-toggle] {
  border: none;
  background: transparent;
  padding: 0.25rem;
  cursor: pointer;
  opacity: 0.45;
  color: inherit;
}

pre[data-opsly-mask] [data-opsly-mask-toggle]:hover,
pre[data-opsly-mask] [data-opsly-mask-toggle]:focus-visible {
  opacity: 1;
}

pre[data-opsly-mask] [data-opsly-mask-toggle]:focus-visible {
  outline: 2px solid var(--ring, currentColor);
  outline-offset: 2px;
}
```

See [`examples/consumer-styles.example.css`](./examples/consumer-styles.example.css) and [`examples/secure-blocks.md`](./examples/secure-blocks.md).

### Inline layout in the package

`SecureBlock` only inlines what the fence needs:

- `position: relative` on `pre`
- **visually hidden** labelling
- **absolute** toggle placement / transparent chrome
- **`0.75em` icons** with a lighter stroke

Mask/reveal swap by changing **`code` text** only—no overlay layers or inner markdown renderer.

## Scope & non-goals

- **Presentation only:** no encryption, persistence, session security, or execution/runtime behavior.
- **No** Tailwind dependency in this package; use Tailwind (or anything else) in your app if you like.

## License

MIT © Akash Patel
