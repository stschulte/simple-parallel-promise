# Simple Parallel Promise

[![CI Status](https://github.com/stschulte/simple-parallel-promise/workflows/CI/badge.svg)](https://github.com/stschulte/simple-parallel-promise/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/stschulte/simple-parallel-promise/graph/badge.svg?token=VO6C4ZG7YD)](https://codecov.io/gh/stschulte/simple-parallel-promise)
[![npm version](https://badge.fury.io/js/simple-parallel-promise.svg)](https://badge.fury.io/js/simple-parallel-promise)

This library helps processing huge number of items in parallel while limiting
the concurrency.

It is intended to run concurrent workers on a huge list (e.g. a stream) and you
can iterator over the results in order.

It is inteded to make it very easy to bring concurrency to iterating over a
list and at the same time keep the implementation is easy as possible.

## Installation

To install this library simply run

```console
npm i simple-parallel-promise
```

## Map example

Let's imagine you want to run map on an array to perform some processing.
The callback is async and you want to limit the number of callbacks to run
at a time.

```typescript
import { map } from 'simple-parallel-promise';
const inputArray = [1,2,3,4,5]

// Run a function on each item. In this case we randomly wait
// and then simply double the item to immitiate some hard work
// We will run 3 callbacks at a time
const result = await map(inputArray, 3, async (item) => {
  await setTimeout(40 + Math.floor(20 * Math.random()));
  return item * 2
})

console.log(result)
# returns [2,4,6,8,10]
```

## Iterator example

Let's imagine you read a huge file line by line. For each line you
want to run a function `processLine`. You may end up with this:

```typescript
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

const rl = createInterface({
  crlfDelay: Infinity,
  input: createReadStream("hugefile.txt"),
});

for await (const line of rl) {
  const result = await processLine(line)
  console.log(result)
}
```

The code above iterates over all items (which may not fit into memory
completly) and then run your function on it. The problem here is you only
run one `processLine` at a time. But you cannot use something like `Promise.all`
if the number of lines is huge.

With this library you can now change your loop to this:

```typescript
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { processAsyncIterator } from 'simple-parallel-promise';

const rl = createInterface({
  crlfDelay: Infinity,
  input: createReadStream(hugefile.txt),
});

for await (const result of processAsyncIterator(rl, 3, processLine)) {
  console.log(result) // results will come in original order
}
```

This allows you to loop over the results. The `processAsyncIterator` will
run 3 `processLine` concurrently and then stop consuming from your iterator
(`rl` in this case) until the first promise resolves. After the first promise
resolves, the result is yielded and another `processLine` is started.

As a result we can start processing result immediatly, we don't have to fit
all lines into memory and you can still consume results in order.

In the example above the following will happen in detail:

- the first item from the iterator is consumed, the first line of the file
- `processLine` is started with the content of the first line
- the second item from the iterator is consumed, the second line of the file
- `processLine` is started with the content of the second line
- the third item from the iterator is consumed, the third line of the file
- `processLine` is started with the content of the third line
- we now reached the concurrency limit
- we wait for `processLine` of the first line and yield the result
- the content of the loop runs with the first result
- the fourth item from the iterator is consumed, the forth line of the file
- `processLine` is started for the forth line, hitting the concurrency
- we wait for `processLine` of the second line and yield the result
- the content of the loop runs with the second result
- ...

## How it works

In case concurrency is greater than 1 `processAsyncIterator` and
`processIterator` create a ringbuffer to store promises of your worker.
Ringbuffer means we first add items to it until we hit the upper bound. We
then start again at the beginning, replacing previously inserted items.

Whenever we replace a previously added promise, we wait until it is resolved
and then yield the result again so it can be processed by your loop.

This means we always run up to `concurrency` worker functions. Please be aware
that a long-running woker may prevent additional workers from being scheduled
since we always await the promises in the inserted order.

## Running test

In order to run tests locally, execute the following

```console
npm ci
npm run test:coverage
```

If you get an `ERR_INSPECTOR_NOT_AVAILABLE` error, make sure your nodejs is compiled with
`inspector` support. Otherwise run `npm run test` to skip code coverage
