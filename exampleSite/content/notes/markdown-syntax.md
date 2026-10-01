---
title: "Markdown Syntax & Typography"
date: 2026-09-29
author: "Damodar Team"
description: "A showcase of headings, quotes, lists, tables, and typographic formatting in Hugo."
categories: ["Notes", "Documentation"]
tags: ["markdown", "typography", "guide"]
---

This page demonstrates the typographic rhythm and standard markdown formatting supported by the Damodar theme.

## Typography & Hierarchy

Headings from H2 through H6 automatically receive clean hover anchors for permalinking directly to any section.

### Ordered and Unordered Lists

- Responsive grid layouts without JavaScript
- Native container queries for modern card components
- Fluid typography utilizing CSS clamp formulas
- Accessible contrast ratios meeting WCAG 2.1 AAA

Nested task list:

1. Initial repository structure setup
2. Styling system with CSS custom properties
   - Define color schemes for light and dark modes
   - Configure semantic typography scales
3. Automated validation and performance budgets

### Blockquotes

> "Simplicity is prerequisite for reliability."
> — Edsger W. Dijkstra

Nested multi-paragraph blockquote:

> Good software design emphasizes clarity and modularity.
>
> When code is straightforward and components are decoupled, testing and refactoring become significantly less prone to failure.

### Data Tables

| Component | Responsibility | Hydration Cost |
| :--- | :--- | :--- |
| **Sidebar Tree** | Collapsible section hierarchy | 0 KB (HTML/CSS + ~1KB vanilla JS) |
| **Search Modal** | Pagefind client-side search | On-demand WebAssembly load |
| **Code Enhancer** | Language badges & copy-to-clipboard | < 2 KB vanilla script |
| **Theme Switcher** | Light / dark mode toggle | < 1 KB inline script |

### Inline Elements

You can style text with **bold emphasis**, *italicized annotations*, ~~strikethrough text~~, and `inline code literals`. Keyboard shortcuts such as <kbd>Ctrl</kbd>+<kbd>K</kbd> or <kbd>⌘</kbd>+<kbd>K</kbd> are styled cleanly.
