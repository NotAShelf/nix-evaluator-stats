# @ns/ui-utils

Display formatting utilities for Nix evaluator statistics. Framework-agnostic
number, byte, and time formatters.

## Usage

```typescript
import {
  formatBytes,
  formatNumber,
  formatPercent,
  formatTime,
} from "@ns/ui-utils";

// Format bytes
console.log(formatBytes(1024)); // "1.00 KB"
console.log(formatBytes(1048576)); // "1.00 MB"

// Format large numbers
console.log(formatNumber(1234)); // "1.23K"
console.log(formatNumber(1234567)); // "1.23M"

// Format time
console.log(formatTime(0.0001)); // "100.00μs"
console.log(formatTime(0.5)); // "500.00ms"
console.log(formatTime(5.234)); // "5.234s"

// Format percentage
console.log(formatPercent(0.123)); // "12.30%"
```

## Design

All formatters are pure functions with no dependencies, making them easy to use
in any UI framework (React, SolidJS, Vue, etc.) or in CLI [^1] applications.

[^1]: Could you have guessed that this is the main goal?
