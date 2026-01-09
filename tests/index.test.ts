import { setTimeout } from 'node:timers/promises';
import { describe, expect, it } from 'vitest';

import { map, processAsyncIterator, processIterator } from '../src/index.js';

async function* demoAsyncIterator(count: number) {
  for (let i = 1; i <= count; i++) {
    yield await Promise.resolve(`item-${i.toString()}`);
  }
}

function* demoIterator(count: number) {
  for (let i = 1; i <= count; i++) {
    yield `item-${i.toString()}`;
  }
}

describe('processIterator', () => {
  it('returns all results', async () => {
    const iterator = demoIterator(7);
    const worker = async (item: string) => {
      await setTimeout(40 + Math.floor(20 * Math.random()));
      return `${item}-done`;
    };

    const results = [];
    for await (const result of processIterator(iterator, 3, worker)) {
      results.push(result);
    }

    expect(results).toStrictEqual([
      'item-1-done',
      'item-2-done',
      'item-3-done',
      'item-4-done',
      'item-5-done',
      'item-6-done',
      'item-7-done',
    ]);
  });

  it('allows a concurrency of 1', async () => {
    const iterator = demoIterator(7);
    const worker = async (item: string) => {
      await setTimeout(40 + Math.floor(20 * Math.random()));
      return `${item}-done`;
    };

    const results = [];
    for await (const result of processIterator(iterator, 1, worker)) {
      results.push(result);
    }

    expect(results).toStrictEqual([
      'item-1-done',
      'item-2-done',
      'item-3-done',
      'item-4-done',
      'item-5-done',
      'item-6-done',
      'item-7-done',
    ]);
  });
});

describe('processAsyncIterator', () => {
  it('returns all results', async () => {
    const iterator = demoAsyncIterator(7);
    const worker = async (item: string) => {
      await setTimeout(40 + Math.floor(20 * Math.random()));
      return `${item}-done`;
    };

    const results = [];
    for await (const result of processAsyncIterator(iterator, 3, worker)) {
      results.push(result);
    }

    expect(results).toStrictEqual([
      'item-1-done',
      'item-2-done',
      'item-3-done',
      'item-4-done',
      'item-5-done',
      'item-6-done',
      'item-7-done',
    ]);
  });

  it('allows a concurrency of 1', async () => {
    const iterator = demoAsyncIterator(7);
    const worker = async (item: string) => {
      await setTimeout(40 + Math.floor(20 * Math.random()));
      return `${item}-done`;
    };

    const results = [];
    for await (const result of processAsyncIterator(iterator, 1, worker)) {
      results.push(result);
    }

    expect(results).toStrictEqual([
      'item-1-done',
      'item-2-done',
      'item-3-done',
      'item-4-done',
      'item-5-done',
      'item-6-done',
      'item-7-done',
    ]);
  });
});

describe('map', () => {
  it('works like map', async () => {
    const iterator = [1, 2, 3, 4, 5];

    const result = await map(iterator, 3, async (item) => {
      await setTimeout(40 + Math.floor(20 * Math.random()));
      return item * 2;
    });

    expect(result).toStrictEqual([2, 4, 6, 8, 10]);
  });
});
