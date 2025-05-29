import { describe, expect, it } from 'vitest';

import { incrementRotatingIndex, PromiseRingBuffer } from '../src/ringbuffer.js';

async function asyncIteratorToArray<T>(it: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = [];
  for await (const item of it) {
    result.push(item);
  }
  return result;
}

describe('incrementRotatingIndex', () => {
  describe('given a buffer of 5', () => {
    const cases: [number, number][] = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 0],
      [0, 1],
    ];
    it.each(cases)('advances from %d to %d', (a, b) => {
      expect(incrementRotatingIndex(a, 5)).toBe(b);
    });
  });
});

describe('PromiseRingBuffer', () => {
  it('allows to add items until buffer is full', async () => {
    const rb = new PromiseRingBuffer<string>(4);
    expect(await rb.add(Promise.resolve('item 1'))).toBeNull();
    expect(await rb.add(Promise.resolve('item 2'))).toBeNull();
    expect(await rb.add(Promise.resolve('item 3'))).toBeNull();
    expect(await rb.add(Promise.resolve('item 4'))).toBeNull();
  });

  it('allows read items on flush', async () => {
    const rb = new PromiseRingBuffer<string>(4);
    expect(await rb.add(Promise.resolve('item 1'))).toBeNull();
    expect(await rb.add(Promise.resolve('item 2'))).toBeNull();
    expect(await rb.add(Promise.resolve('item 3'))).toBeNull();
    expect(await rb.add(Promise.resolve('item 4'))).toBeNull();

    const result = await asyncIteratorToArray(rb.flush());
    expect(result).toStrictEqual(['item 1', 'item 2', 'item 3', 'item 4']);
  });

  it('returns item on buffer overflow', async () => {
    const rb = new PromiseRingBuffer<string>(3);
    expect(await rb.add(Promise.resolve('item 1'))).toBeNull();
    expect(await rb.add(Promise.resolve('item 2'))).toBeNull();
    expect(await rb.add(Promise.resolve('item 3'))).toBeNull();
    expect(await rb.add(Promise.resolve('item 4'))).toBe('item 1');
    expect(await rb.add(Promise.resolve('item 5'))).toBe('item 2');
    expect(await rb.add(Promise.resolve('item 6'))).toBe('item 3');

    const result = await asyncIteratorToArray(rb.flush());
    expect(result).toStrictEqual(['item 4', 'item 5', 'item 6']);
  });
});
