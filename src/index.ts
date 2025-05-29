import { PromiseRingBuffer } from './ringbuffer.js';

export async function* processAsyncIterator<T, R>(iterator: AsyncIterable<T>, concurrency: number, workerFn: (processItem: T) => Promise<R>): AsyncGenerator<R, void, unknown> {
  // In case concurrency is 1, we actually don't need a ringbuffer at all
  if (concurrency <= 1) {
    for await (const item of iterator) {
      yield await workerFn(item);
    }
  }
  else {
    const buffer = new PromiseRingBuffer<R>(concurrency - 1);
    for await (const item of iterator) {
      const promise = workerFn(item);
      const result = await buffer.add(promise);
      if (result) {
        yield result;
      }
    }
    yield* buffer.flush();
  }
}

export async function* processIterator<T, R>(iterator: Iterable<T>, concurrency: number, workerFn: (processItem: T) => Promise<R>): AsyncGenerator<R, void, unknown> {
  // In case concurrency is 1, we actually don't need a ringbuffer at all
  if (concurrency <= 1) {
    for (const item of iterator) {
      yield await workerFn(item);
    }
  }
  else {
    const buffer = new PromiseRingBuffer<R>(concurrency - 1);
    for (const item of iterator) {
      const promise = workerFn(item);
      const result = await buffer.add(promise);
      if (result) {
        yield result;
      }
    }
    yield* buffer.flush();
  }
}
