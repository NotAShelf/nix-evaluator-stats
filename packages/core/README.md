# @ns/core

Core types, parsing logic for Nix evaluator statistics, and various bits from
the web component that the CLI may interact with in the future. The `@ns/core`
package contains the truly "generic" logic that can be used around the
workspace, or even outside it. This package is framework-agnostic and can be
used in any JavaScript/TypeScript environment. Which is to say that you can use
it to make your own statistics viewer without doing any heavy lifting.

## Usage

```typescript
import { calculateChange, parseStats, StatsData } from "@ns/core";

// Parse raw stats from Nix
const raw = JSON.parse(statsJson);
const stats: StatsData = parseStats(raw);

console.log(`CPU Time: ${stats.cpuTime}s`);
console.log(`Expressions: ${stats.nrExprs}`);

// Compare two values
const change = calculateChange(stats.nrThunks, previousStats.nrThunks);
console.log(`Thunks changed by ${change.percent.toFixed(2)}%`);
```

## Nix Version/Implementation Compatibility

There are currently 4 competing implementations of Nix, and only two of those
are considered first-class. The parser handles different implementations the
best it can by checking the field existence in the raw JSON, but it is not able
to handle new fields. It is unfortunate that not all implementations expose the
same statistics.

Worth noting that besides Lix and Nix, there are and will likely be more
implementations. If you want _yours_ to be supported as a first class citizen,
please submit a pull request.
