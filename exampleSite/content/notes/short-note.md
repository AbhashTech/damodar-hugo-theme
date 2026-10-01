---
title: "A short note"
date: 2026-09-25
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
