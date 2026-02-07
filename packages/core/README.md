# @ns/core

Core types and parsing logic for Nix evaluator statistics. This package is
framework-agnostic and can be used in any JavaScript/TypeScript environment.

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

## Version Compatibility

The parser handles different Nix implementations (Nix, Lix, Snix, etc.) by
checking for field existence in the raw JSON, since not all implementations
expose the same statistics.
