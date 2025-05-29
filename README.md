# Simple Parallel Promise

[![CI Status](https://github.com/stschulte/simple-parallel-promise/workflows/CI/badge.svg)](https://github.com/stschulte/simple-parallel-promise/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/stschulte/simple-parallel-promise/graph/badge.svg?token=VO6C4ZG7YD)](https://codecov.io/gh/stschulte/simple-parallel-promise)
[![npm version](https://badge.fury.io/js/simple-parallel-promise.svg)](https://badge.fury.io/js/simple-parallel-promise)

This library helps processing huge number of items in parallel while limiting
the concurrency.

It is intended to run a worker on a huge list (e.g. a stream) and you
can iterator over the results in order.

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

const rl = createInterface({
  crlfDelay: Infinity,
  input: createReadStream(hugefile.txt),
});

for await (const result of processAsyncIterator(rl, 20, processLine)) {
  console.log(result) // results will come in original order
}
```

This allows you to loop over the results. The `processAsyncIterator` will
run 20 `processLine` concurrently and then stop consuming from your iterator
(`rl in this case) until the first promise resolves. After the first promise
resolves, the result is yielded and the another `processLine` is started.

As a result we can start processing result immediatly, we don't have to fit
all lines into memory and you can still consume results in order

## Running test

In order to run tests locally, execute the following

```console
npm ci
npm run test:coverage
```

If you get an `ERR_INSPECTOR_NOT_AVAILABLE` error, make sure your nodejs is compiled with
`inspector` support. Otherwise run `npm run test` to skip code coverage
