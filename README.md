# Damodar

A clean, fast, documentation-and-notes Hugo theme featuring a sticky left sidebar, collapsible section tree, instant search modal, dual-theme syntax highlighting, reading progress, and typography tuned for long-form reading.

## Features

- 🔍 **Client-Side Search (Pagefind & Built-in)** — Keyboard-driven modal dialog (`⌘K` / `Ctrl+K` or `/`) with Pagefind integration (`data-pagefind-body`, metadata, filters) and zero-config built-in JSON search fallback. Indexed using `npx -y pagefind --site public`.
- 🏷️ **Tags & Taxonomy Pages** — Built-in tag cloud (`/tags/`), tag-specific listing pages (`/tags/<tag>/`), and clickable tag badges on posts.
- 🎨 **Dual-Theme Syntax Highlighting** — Seamless light and dark mode code highlighting powered by Chroma classes, complete with language badges and a one-click clipboard copy button.
- 💡 **Callouts & GitHub-Style Alerts** — Custom `{{< callout >}}` shortcode and automatic support for GitHub markdown alerts (`[!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]`).
- 🧭 **Breadcrumbs & Post Navigation** — Schema.org microdata breadcrumbs for SEO and previous/next article pager cards.
- 🌲 **Interactive Sidebar** — Collapsible section hierarchy, scroll-spy table of contents with live branch highlighting, and animated reading progress bar.
- 🌓 **Theme Switcher** — Smooth light and dark mode toggle with system preference detection and `localStorage` persistence.
- 📱 **Responsive Design** — Desktop multi-column grid, sticky navigation, and mobile drawer with accessible focus handling.
- 🚀 **SEO & Social Cards** — Open Graph, Twitter Cards, canonical URLs, and RSS autodiscovery out of the box.
- 🚫 **Custom 404 Page** — Clean error page with direct search access.

---

## Quick Start

### 1. Installation

In your Hugo site's root directory:

```bash
git submodule add https://github.com/kunalgautam/damodar.git themes/damodar
```

Or clone directly:

```bash
git clone https://github.com/kunalgautam/damodar.git themes/damodar
```

### 2. Configuration

Add `damodar` to your `hugo.toml` (or copy `hugo.example.toml`):

```toml
baseURL = "https://example.org/"
locale = "en"
title = "My Notes"
theme = "damodar"

[outputs]
  home = ["HTML", "RSS", "JSON"] # "JSON" enables client-side instant search

[params]
  logo = "/logo.svg"             # static/logo.svg; remove to display text only
  tagline = "Notes on building things."
  showRecent = true              # show recent posts on home page
  recentCount = 5
  footerText = "Notes on building things."
  # copyright = "© 2026 Custom Author"
  # twitter = "@yourusername"
  # ogImage = "/images/og-card.png"

[markup.tableOfContents]
  startLevel = 2
  endLevel = 3
  ordered = false

[markup.goldmark.renderer]
  unsafe = true                  # enables HTML elements like <kbd> and raw markup

[markup.highlight]
  noClasses = false              # required for dual-theme light/dark syntax highlighting
  guessSyntax = true
  lineNos = false
  tabWidth = 2

# Navigation links in sidebar and footer
[[menus.main]]
  name = "Home"
  url = "/"
  weight = 1

[[menus.main]]
  name = "Tags"
  url = "/tags/"
  weight = 2

[[menus.main]]
  name = "About"
  url = "/about/"
  weight = 3

[[menus.main]]
  name = "Contact"
  url = "/contact/"
  weight = 4
```

### 3. Run Site

```bash
hugo server
```

---

## Writing Content

### Frontmatter

```yaml
---
title: "Building Resilient APIs"
date: 2026-09-20
description: "A comprehensive guide to designing fault-tolerant backend architectures."
tags: ["engineering", "backend", "go"]
toc: true             # defaults to true; set to false to disable Table of Contents
searchhidden: false   # set to true to exclude this page from the search index
---
```

### Code Blocks

Code blocks automatically receive language labels, syntax highlighting in both light and dark mode, and a copy button:

````markdown
```python
def fibonacci(n: int) -> list[int]:
    """Generate Fibonacci sequence."""
    sequence = [0, 1]
    while len(sequence) < n:
        sequence.append(sequence[-1] + sequence[-2])
    return sequence[:n]
```
````

### Callouts & Admonitions

Use the `callout` shortcode:

```markdown
{{< callout type="tip" title="Pro Tip" >}}
You can quickly open search anywhere using <kbd>Ctrl</kbd>+<kbd>K</kbd> or <kbd>/</kbd>.
{{< /callout >}}
```

Supported types: `note`, `tip`, `important`, `warning`, `caution`.

GitHub-style markdown alerts are also automatically styled:

```markdown
> [!NOTE]
> This is a note alert box.

> [!WARNING]
> Please review production settings before deploying.
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| <kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd> | Open / Close Search Modal |
| <kbd>/</kbd> | Open Search Modal (when not in an input) |
| <kbd>Esc</kbd> | Close Search Modal or Mobile Sidebar |
| <kbd>↑</kbd> / <kbd>↓</kbd> | Navigate Search Results |
| <kbd>Enter</kbd> | Open Selected Search Result |

---

## License

MIT License. See [LICENSE](LICENSE) for details.
