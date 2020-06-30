/*
 * Copyright (C) Copyright 2015 ArangoDB GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * The "cursor" module provides the {@link ArrayCursor} type for TypeScript.
 *
 * @packageDocumentation
 */
import { Database } from "./database.ts";
import { Dict } from "./types/dict.ts";

/**
 * Additional information about the cursor.
 */
export interface CursorExtras {
  warnings: {
    code: number;
    message: string;
  }[];
  plan?: any;
  profile?: any;
  stats?: Dict<any>;
}

/**
 * The `ArrayCursor` type represents a cursor returned from a
 * {@link Database.query}.
 *
 * When using TypeScript, cursors can be cast to a specific item type in order
 * to increase type safety.
 *
 * @param T - Type to use for each item. Defaults to `any`.
 *
 * @example
 * ```ts
 * const db = new Database();
 * const query = aql`FOR x IN 1..5 RETURN x`;
 * const result = await db.query(query) as ArrayCursor<number>;
 * ```
 */
export class ArrayCursor<T = any> {
  protected db: Database;
  protected result: Array<any>;
  protected _count?: number;
  protected _extra: CursorExtras;
  protected _hasMore: boolean;
  protected id: string | undefined;
  protected host?: number;
  protected allowDirtyRead?: boolean;

  /**
   * @internal
   * @hidden
   */
  constructor(
    db: Database,
    body: {
      extra: any;
      result: T[];
      hasMore: boolean;
      id: string;
      count: number;
    },
    host?: number,
    allowDirtyRead?: boolean,
  ) {
    this.db = db;
    this.result = body.result;
    this.id = body.id;
    this.host = host;
    this.allowDirtyRead = allowDirtyRead;

    this._hasMore = Boolean(body.id && body.hasMore);
    this._count = body.count;
    this._extra = body.extra;
  }

  protected async drain(): Promise<ArrayCursor<T>> {
    await this.more();

    if (!this._hasMore) {
      return this;
    }

    return this.drain();
  }

  protected async more(): Promise<void> {
    if (!this._hasMore) {
      return;
    }

    const res = await this.db.request({
      method: "PUT",
      path: `/_api/cursor/${this.id}`,
      host: this.host,
      allowDirtyRead: this.allowDirtyRead,
    });

    this.result.push(...res.data.result);
    this._hasMore = res.data.hasMore;
  }

  /**
   * Additional information about the cursor.
   */
  get extra(): CursorExtras {
    return this._extra;
  }

  /**
   * The total number of documents in the query result. Only available if the
   * `count` option was used.
   */
  get count(): number | undefined {
    return this._count;
  }

  /**
   * Whether the cursor has any remaining batches that haven't yet been
   * fetched. If set to `false`, all batches have been fetched and no
   * additional requests to the server will be made when consuming any
   * remaining items from this cursor.
   */
  get hasMore(): boolean {
    return this._hasMore;
  }

  /**
   * Whether the cursor has more values. If set to `false`, the cursor has
   * already been depleted and contains no more items.
   */
  get hasNext(): boolean {
    return this._hasMore || Boolean(this.result.length);
  }

  /**
   * Enables use with `for await` to deplete the cursor by asynchronously
   * yielding every value in the cursor's remaining result set.
   *
   * **Note**: If the result set spans multiple batches, any remaining batches
   * will only be fetched on demand. Depending on the cursor's TTL and the
   * processing speed, this may result in the server discarding the cursor
   * before it is fully depleted.
   *
   * @example
   * ```js
   * const cursor = await db.query(aql`
   *   FOR user IN users
   *   FILTER user.isActive
   *   RETURN user
   * `);
   * for await (const user of cursor) {
   *   console.log(user.email, user.isAdmin);
   * }
   * ```
   */
  async *[Symbol.asyncIterator](): AsyncGenerator<T, undefined, undefined> {
    while (this.hasNext) {
      yield this.next() as Promise<T>;
    }

    return undefined;
  }

  /**
   * Depletes the cursor, then returns an array containing all values in the
   * cursor's remaining result list.
   *
   * @example
   * ```js
   * const cursor = await db.query(aql`FOR x IN 1..5 RETURN x`);
   * const result = await cursor.all(); // [1, 2, 3, 4, 5]
   * console.log(cursor.hasNext); // false
   */
  async all(): Promise<T[]> {
    await this.drain();

    const result = [...this.result.values()];

    this.result = new Array<any>();

    return result;
  }

  /**
   * Advances the cursor and returns the next value in the cursor's remaining
   * result list, or `undefined` if the cursor has been depleted.
   *
   * **Note**: If the result set spans multiple batches, any remaining batches
   * will only be fetched on demand. Depending on the cursor's TTL and the
   * processing speed, this may result in the server discarding the cursor
   * before it is fully depleted.
   *
   * @example
   * ```js
   * const cursor = await db.query(aql`FOR x IN 1..3 RETURN x`);
   * const one = await cursor.next(); // 1
   * const two = await cursor.next(); // 2
   * const three = await cursor.next(); // 3
   * const empty = await cursor.next(); // undefined
   * ```
   */
  async next(): Promise<T | undefined> {
    while (!this.result.length && this._hasMore) {
      await this.more();
    }

    if (!this.result.length) {
      return undefined;
    }

    return this.result.shift();
  }

  /**
   * Advances the cursor and returns all remaining values in the cursor's
   * current batch. If the current batch has already been exhausted, fetches
   * the next batch from the server and returns it, or `undefined` if the
   * cursor has been depleted.
   *
   * **Note**: If the result set spans multiple batches, any remaining batches
   * will only be fetched on demand. Depending on the cursor's TTL and the
   * processing speed, this may result in the server discarding the cursor
   * before it is fully depleted.
   *
   * @example
   * ```js
   * const cursor = await db.query(
   *   aql`FOR i IN 1..10 RETURN i`,
   *   { batchSize: 5 }
   * );
   * const firstBatch = await cursor.nextBatch(); // [1, 2, 3, 4, 5]
   * await cursor.next(); // 6
   * const lastBatch = await cursor.nextBatch(); // [7, 8, 9, 10]
   * console.log(cursor.hasNext); // false
   * ```
   */
  async nextBatch(): Promise<any[] | undefined> {
    while (!this.result.length && this._hasMore) {
      await this.more();
    }

    if (!this.result.length) {
      return undefined;
    }

    const result = [...this.result.values()];

    this.result = new Array<any>();

    return result;
  }

  /**
   * Advances the cursor by applying the `callback` function to each item in
   * the cursor's remaining result list until the cursor is depleted or
   * `callback` returns the exact value `false`. Returns a promise that
   * evalues to `true` unless the function returned `false`.
   *
   * **Note**: If the result set spans multiple batches, any remaining batches
   * will only be fetched on demand. Depending on the cursor's TTL and the
   * processing speed, this may result in the server discarding the cursor
   * before it is fully depleted.
   *
   * See also:
   * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach | `Array.prototype.forEach`}.
   *
   * @param callback - Function to execute on each element.
   *
   * @example
   * ```js
   * const cursor = await db.query(aql`FOR x IN 1..5 RETURN x`);
   * const result = await cursor.forEach((currentValue) => {
   *   console.log(currentValue);
   * });
   * console.log(result) // true
   * console.log(cursor.hasNext); // false
   * ```
   *
   * @example
   * ```js
   * const cursor = await db.query(aql`FOR x IN 1..5 RETURN x`);
   * const result = await cursor.forEach((currentValue) => {
   *   console.log(currentValue);
   *   return false; // stop after the first item
   * });
   * console.log(result); // false
   * console.log(cursor.hasNext); // true
   * ```
   */
  async forEach(
    callback: (currentValue: T, index: number, self: this) => false | void,
  ): Promise<boolean> {
    let index = 0;

    while (this.result.length || this._hasMore) {
      let result;

      while (this.result.length) {
        result = callback(this.result.shift()!, index, this);
        index++;

        if (result === false) {
          return result;
        }
      }

      if (this._hasMore) {
        await this.more();
      }
    }
    return true;
  }

  /**
   * Depletes the cursor by applying the `callback` function to each item in
   * the cursor's remaining result list. Returns an array containing the
   * return values of `callback` for each item.
   *
   * **Note**: This creates an array of all return values, which may impact
   * memory use when working with very large query result sets. Consider using
   * {@link ArrayCursor.forEach}, {@link ArrayCursor.reduce} or
   * {@link ArrayCursor.flatMap} instead.
   *
   * See also:
   * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map | `Array.prototype.map`}.
   *
   * @param R - Return type of the `callback` function.
   * @param callback - Function to execute on each element.
   *
   * @example
   * ```js
   * const cursor = await db.query(aql`FOR x IN 1..5 RETURN x`);
   * const squares = await cursor.map((currentValue) => {
   *   return currentValue ** 2;
   * });
   * console.log(squares); // [1, 4, 9, 16, 25]
   * console.log(cursor.hasNext); // false
   * ```
   */
  async map<R>(
    callback: (currentValue: T, index: number, self: this) => R,
  ): Promise<R[]> {
    let index = 0;
    let result: any[] = [];

    while (this.result.length || this._hasMore) {
      while (this.result.length) {
        result.push(callback(this.result.shift()!, index, this));
        index++;
      }

      if (this._hasMore) {
        await this.more();
      }
    }
    return result;
  }

  /**
   * Depletes the cursor by applying the `callback` function to each item in
   * the cursor's remaining result list. Returns an array containing the
   * return values of `callback` for each item, flattened to a depth of 1.
   *
   * **Note**: If the result set spans multiple batches, any remaining batches
   * will only be fetched on demand. Depending on the cursor's TTL and the
   * processing speed, this may result in the server discarding the cursor
   * before it is fully depleted.
   *
   * See also:
   * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flatMap | `Array.prototype.flatMap`}.
   *
   * @param R - Return type of the `callback` function.
   * @param callback - Function to execute on each element.
   *
   * @example
   * ```js
   * const cursor = await db.query(aql`FOR x IN 1..5 RETURN x`);
   * const squares = await cursor.flatMap((currentValue) => {
   *   return [currentValue, currentValue ** 2];
   * });
   * console.log(squares); // [1, 1, 2, 4, 3, 9, 4, 16, 5, 25]
   * console.log(cursor.hasNext); // false
   * ```
   *
   * @example
   * ```js
   * const cursor = await db.query(aql`FOR x IN 1..5 RETURN x`);
   * const odds = await cursor.flatMap((currentValue) => {
   *   if (currentValue % 2 === 0) {
   *     return []; // empty array flattens into nothing
   *   }
   *   return currentValue; // or [currentValue]
   * });
   * console.logs(odds); // [1, 3, 5]
   * ```
   */
  async flatMap<R>(
    callback: (currentValue: T, index: number, self: this) => R | R[],
  ): Promise<R[]> {
    let index = 0;
    let result: any[] = [];

    while (this.result.length || this._hasMore) {
      while (this.result.length) {
        const value = callback(this.result.shift()!, index, this);

        if (Array.isArray(value)) {
          result.push(...value);
        } else {
          result.push(value);
        }

        index++;
      }

      if (this._hasMore) {
        await this.more();
      }
    }

    return result;
  }

  /**
   * Depletes the cursor by applying the `reducer` function to each item in
   * the cursor's remaining result list. Returns the return value of `reducer`
   * for the last item.
   *
   * **Note**: Most complex uses of the `reduce` method can be replaced with
   * simpler code using {@link ArrayCursor.forEach} or the `for await` syntax.
   *
   * **Note**: If the result set spans multiple batches, any remaining batches
   * will only be fetched on demand. Depending on the cursor's TTL and the
   * processing speed, this may result in the server discarding the cursor
   * before it is fully depleted.
   *
   * See also:
   * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce | `Array.prototype.reduce`}.
   *
   * @param R - Return type of the `reducer` function.
   * @param reducer - Function to execute on each element.
   * @param initialValue - Initial value of the `accumulator` value passed to
   * the `reducer` function.
   *
   * @example
   * ```js
   * function largestOfTwo(one, two) {
   *   return Math.max(one, two);
   * }
   * const cursor = await db.query(aql`FOR x IN 1..5 RETURN x`);
   * const result = await cursor.reduce(largestOfTwo, 0);
   * console.log(result); // 5
   * console.log(cursor.hasNext); // false
   * const emptyResult = await cursor.reduce(largestOfTwo, 0);
   * console.log(emptyResult); // 0
   * ```
   *
   * @example
   * ```js
   * // BAD! NEEDLESSLY COMPLEX!
   * const cursor = await db.query(aql`FOR x IN 1..5 RETURN x`);
   * const result = await cursor.reduce((accumulator, currentValue) => {
   *   accumulator[currentValue % 2 === 0 ? "even" : "odd"].push(currentValue);
   *   return accumulator;
   * }, { odd: [], even: [] });
   * console.log(result); // { odd: [1, 3, 5], even: [2, 4] }
   *
   * // GOOD! MUCH SIMPLER!
   * const cursor = await db.query(aql`FOR x IN 1..5 RETURN x`);
   * const odd = [];
   * const even = [];
   * for await (const item of cursor) {
   *   if (currentValue % 2 === 0) {
   *     even.push(currentValue);
   *   } else {
   *     odd.push(currentValue);
   *   }
   * }
   * console.log({ odd, even }); // { odd: [1, 3, 5], even: [2, 4] }
   * ```
   */
  async reduce<R>(
    reducer: (accumulator: R, currentValue: T, index: number, self: this) => R,
    initialValue: R,
  ): Promise<R>;
  /**
   * Depletes the cursor by applying the `reducer` function to each item in
   * the cursor's remaining result list. Returns the return value of `reducer`
   * for the last item.
   *
   * **Note**: If the result set spans multiple batches, any remaining batches
   * will only be fetched on demand. Depending on the cursor's TTL and the
   * processing speed, this may result in the server discarding the cursor
   * before it is fully depleted.
   *
   * See also:
   * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce | `Array.prototype.reduce`}.
   *
   * @param R - Return type of the `reducer` function.
   * @param reducer - Function to execute on each element.
   *
   * @example
   * ```js
   * function largestOfTwo(one, two) {
   *   return Math.max(one, two);
   * }
   * const cursor = await db.query(aql`FOR x IN 1..5 RETURN x`);
   * const result = await cursor.reduce(largestOfTwo);
   * console.log(result); // 5
   * console.log(cursor.hasNext); // false
   * const emptyResult = await cursor.reduce(largestOfTwo);
   * console.log(emptyResult); // undefined
   * ```
   */
  async reduce<R>(
    reducer: (
      accumulator: T | R,
      currentValue: T,
      index: number,
      self: this,
    ) => R,
  ): Promise<R | undefined>;
  async reduce<R>(
    reducer: (accumulator: R, currentValue: T, index: number, self: this) => R,
    initialValue?: R,
  ): Promise<R | undefined> {
    let index = 0;

    if (!this.result.length) {
      return initialValue;
    }

    if (initialValue === undefined) {
      if (!this.result.length && !this._hasMore) {
        await this.more();
      }

      initialValue = this.result.shift() as any;

      index += 1;
    }

    while (this.result.length || this._hasMore) {
      while (this.result.length) {
        initialValue = reducer(
          initialValue!,
          this.result.shift()!,
          index,
          this,
        );
        index++;
      }

      if (this._hasMore) {
        await this.more();
      }
    }

    return initialValue;
  }

  /**
   * Kills the cursor and frees up associated database resources.
   *
   * This method has no effect if all batches have already been fetched.
   *
   * @example
   * ```js
   * const cursor1 = await db.query(aql`FOR x IN 1..5 RETURN x`);
   * console.log(cursor1.hasMore); // false
   * await cursor1.kill(); // no effect
   *
   * const cursor2 = await db.query(
   *   aql`FOR x IN 1..5 RETURN x`,
   *   { batchSize: 2 }
   * );
   * console.log(cursor2.hasMore); // true
   * await cursor2.kill(); // cursor is depleted
   * ```
   */
  async kill(): Promise<void> {
    if (!this._hasMore) {
      return undefined;
    }

    return this.db.request(
      {
        method: "DELETE",
        path: `/_api/cursor/${this.id}`,
      },
      () => {
        this._hasMore = false;
        return undefined;
      },
    );
  }
}
