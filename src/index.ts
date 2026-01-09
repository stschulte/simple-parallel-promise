import { PromiseRingBuffer } from './ringbuffer.js';

/**
 * Calls a defined callback function on each element of an array concurrently, and returns an array that contains the results.
 *
 + This function works similar to `map` on an array, but it runs up to `concurrency` async callback functions in parallel
 * The result array will preserve the order of the input
 *
 * @param iterator - An iterable of items (e.g. an array)
 * @param concurrency - Number of concurrent items that should be processed
 * @param workerFn - An async function to run on each item
 * @returns - The processed array after running workerFn on each item
 *
 */
export async function map<T, R>(iterator: Iterable<T>, concurrency: number, workerFn: (item: T) => Promise<R>): Promise<R[]> {
  const result: R[] = [];
  for await (const item of processIterator(iterator, concurrency, workerFn)) {
    result.push(item);
  }
  return result;
}

/**
 * Processes an async iterator concurrently, yielding results in original order
 *
 * The function processes an async iterator (representing some form of job)
 * and runs the provided `workerFn` function on each item. It will run up
 * to `concurrency` promises. If the limit is hit, we await the first promise
 * and yield its result.
 *
 * This allows you to iterate over results from the worker in the original job
 * order.
 *
 * @param iterator - An async iterable of items
 * @param concurrency - The number of `workerFn` functions to run concurrently
 * on each item
 * @param workerFn - A function consuming items from `iterator`. The workerFn
 * must be an async function returning promises. `processAsyncIterator` provides
 * an async iterator over these results
 * @yields results from `workerFn` in order
 */
export async function* processAsyncIterator<T, R>(iterator: AsyncIterable<T>, concurrency: number, workerFn: (processItem: T) => Promise<R>): AsyncGenerator<R, void, unknown> {
  // In case concurrency is 1, we actually don't need a ringbuffer at all
  if (concurrency <= 1) {
    for await (const item of iterator) {
      yield workerFn(item);
    }
  }
  else {
    const buffer = new PromiseRingBuffer<R>(concurrency - 1);
    for await (const item of iterator) {
      const promise = buffer.add(workerFn(item));
      if (promise) {
        yield promise;
      }
    }
    yield* buffer.flush();
  }
}

/**
 * Processes an iterator concurrently, yielding results in original order
 *
 * The function processes an iterator (representing some form of job)
 * and runs the provided `workerFn` function on each item. It will run up
 * to `concurrency` promises. If the limit is hit, we await the first promise
 * and yield its result.
 *
 * This allows you to iterate over results from the worker in the original job
 * order.
 *
 * @param iterator - An async iterable of items
 * @param concurrency - The number of `workerFn` functions to run concurrently
 * on each item
 * @param workerFn - A function consuming items from `iterator`. The workerFn
 * must be an async function returning promises. `processAsyncIterator` provides
 * an async iterator over these results
 * @yields results from `workerFn` in order
 */
export async function* processIterator<T, R>(iterator: Iterable<T>, concurrency: number, workerFn: (processItem: T) => Promise<R>): AsyncGenerator<R, void, unknown> {
  // In case concurrency is 1, we actually don't need a ringbuffer at all
  if (concurrency <= 1) {
    for (const item of iterator) {
      yield workerFn(item);
    }
  }
  else {
    const buffer = new PromiseRingBuffer<R>(concurrency - 1);
    for (const item of iterator) {
      const promise = buffer.add(workerFn(item));
      if (promise) {
        yield promise;
      }
    }
    yield* buffer.flush();
  }
}
