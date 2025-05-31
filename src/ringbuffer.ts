import assert from 'node:assert';

export class PromiseRingBuffer<T> {
  #buffer: Array<null | Promise<T>>;
  #bufferSize: number;
  #currentIdx: number;
  #flushIdx: number;

  constructor(size: number) {
    this.#buffer = new Array<null | Promise<T>>(size);
    void this.#buffer.fill(null);
    void Object.seal(this.#buffer);
    this.#bufferSize = size;
    this.#currentIdx = 0;
    this.#flushIdx = 0;
  }

  /**
   * Add a new item into the ringbuffer
   *
   * If the ringbuffer is currently full, this will return
   * the replaced promise. Otherwise null is returned.
   *
   * @param item: A new promise to add
   * @returns - either `null` when the ringbuffer is not full yet or a previously
   * inserted promise
   */
  add(item: Promise<T>): null | Promise<T> {
    const promise = this.#buffer[this.#currentIdx];
    assert(promise !== undefined);

    this.#buffer[this.#currentIdx] = item;
    this.#currentIdx = incrementRotatingIndex(this.#currentIdx, this.#bufferSize);

    /* as long as we are filling the buffer, flushing begins at
     * idx 0. Otherwise flushing begins at the next item
     */
    if (promise !== null) {
      this.#flushIdx = this.#currentIdx;
    }
    return promise;
  }

  * flush(): Generator<Promise<T>, void, unknown> {
    let flushed = false;
    while (!flushed) {
      const promise = this.#buffer[this.#flushIdx];
      if (promise) {
        yield promise;
        this.#buffer[this.#flushIdx] = null;
        this.#flushIdx = incrementRotatingIndex(this.#flushIdx, this.#bufferSize);
      }
      else {
        flushed = true;
      }
    }
  }
}

export function incrementRotatingIndex(currentIndex: number, size: number): number {
  assert(currentIndex >= 0 && currentIndex < size, 'Current index seem to be out of bounds already');

  const lastValidIndex = size - 1;
  if (currentIndex >= lastValidIndex) {
    return 0;
  }
  return currentIndex + 1;
}
