#!/usr/bin/env node

import { readFile } from 'fs/promises';
import { parseStats } from '@ns/core';

async function main() {
  const args = process.argv.slice(2);

  // FIXME: nuke all of this actually
  if (args.length === 0) {
    console.log('NS');
    console.log('\nUsage: ns-tui <stats.json>');
    process.exit(1);
  }

  const filePath = args[0];

  try {
    const content = await readFile(filePath, 'utf-8');
    const raw = JSON.parse(content);
    const stats = parseStats(raw);

    console.log('\n=== Nix Evaluator Statistics ===\n');
    console.log(`CPU Time:     ${stats.cpuTime.toFixed(3)}s`);
    console.log(`Expressions:  ${stats.nrExprs.toLocaleString()}`);
    console.log(`Thunks:       ${stats.nrThunks.toLocaleString()}`);
    console.log(`  - Avoided:  ${stats.nrAvoided.toLocaleString()}`);
    console.log(`  - Ratio:    ${((stats.nrAvoided / stats.nrThunks) * 100).toFixed(2)}%`);

    const totalMemory =
      stats.envs.bytes +
      stats.list.bytes +
      stats.values.bytes +
      stats.symbols.bytes +
      stats.sets.bytes;
    console.log(`Total Memory: ${(totalMemory / 1024 / 1024).toFixed(2)} MB`);

    console.log('\n=== Memory Breakdown ===\n');
    console.log(`Environments: ${(stats.envs.bytes / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Lists:        ${(stats.list.bytes / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Values:       ${(stats.values.bytes / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Symbols:      ${(stats.symbols.bytes / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Sets:         ${(stats.sets.bytes / 1024 / 1024).toFixed(2)} MB`);

    if (stats.gc) {
      console.log('\n=== Garbage Collection ===\n');
      console.log(`Heap Size:    ${(stats.gc.heapSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Total Alloc:  ${(stats.gc.totalBytes / 1024 / 1024).toFixed(2)} MB`);
      console.log(`GC Cycles:    ${stats.gc.cycles.toLocaleString()}`);
    }

    console.log('\n' + '='.repeat(40));
    console.log('='.repeat(40) + '\n');
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
