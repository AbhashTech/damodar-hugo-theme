---
title: "A short note"
date: 2026-09-25
author: "Thariq Shihipar"
description: "A quick note exploring syntax highlighting, callouts, and code copy in Damodar."
tags: ["notes", "quicktips", "python"]
---
Nothing to scroll here, so no percentage shows.

Here is a quick Python sample:

```python
def fibonacci(n: int) -> list[int]:
    """Generate Fibonacci sequence up to n numbers."""
    if n <= 0:
        return []
    sequence = [0, 1]
    while len(sequence) < n:
        sequence.append(sequence[-1] + sequence[-2])
    return sequence[:n]

if __name__ == "__main__":
    print(fibonacci(8))
```

And JavaScript:

```javascript
const greet = (name) => {
  console.log(`Hello, ${name}! Welcome to Damodar.`);
};
greet("World");
```

{{< callout type="tip" title="Pro Tip" >}}
You can quickly open search anywhere using <kbd>Ctrl</kbd>+<kbd>K</kbd> or <kbd>/</kbd>.
{{< /callout >}}

> [!NOTE]
> GitHub-style blockquote alerts are automatically converted into styled callout components!

> [!WARNING]
> Remember to run `hugo --minify` before deploying to production.

