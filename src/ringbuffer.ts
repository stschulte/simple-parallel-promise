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
   * If the ringbuffer is currently full, this will
   * resolve the current promise in the buffer and then
   * insert the new promise
   *
   * @param item: A new promise to add
   * @returns - the resolved promise if the buffer was full or null
   */
  async add(item: Promise<T>): Promise<null | T> {
    const promise = this.#buffer[this.#currentIdx];
    assert(promise !== undefined);

    const result = promise ? await promise : null;
    this.#buffer[this.#currentIdx] = item;

    this.#currentIdx = incrementRotatingIndex(this.#currentIdx, this.#bufferSize);

    /* as long as we are filling the buffer, flushing begins at
     * idx 0. Otherwise flushing begins at the next item
     */
    if (result) {
      this.#flushIdx = this.#currentIdx;
    }

    return result;
  }

  async* flush(): AsyncGenerator<T, void, unknown> {
    let flushed = false;
    while (!flushed) {
      const promise = this.#buffer[this.#flushIdx];
      if (!promise) {
        flushed = true;
      }
      else {
        const result = await promise;
        yield result;
        this.#buffer[this.#flushIdx] = null;
        this.#flushIdx = incrementRotatingIndex(this.#flushIdx, this.#bufferSize);
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
