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
 *
 * Modifications copyright (C) 2020 Daniel Bannert
 */

/**
 * TODO
 *
 * @packageDocumentation
 */
import { Connection } from "./connection.ts";
import { Database } from "./database.ts";
import { ERROR_BAD_PARAMETER } from "./error_codes.ts";

/**
 * Indicates whether the given value represents an {@link ArangoTransaction}.
 *
 * @param transaction - A value that might be a transaction.
 */
export function isArangoTransaction(
  transaction: any,
): transaction is Transaction {
  return Boolean(transaction && transaction.isArangoTransaction);
}

/**
 * TODO
 */
export type TransactionStatus = {
  id: string;
  status: "running" | "committed" | "aborted";
};

/**
 * TODO
 */
export class Transaction {
  protected _db: Database;
  protected _id: string;

  /**
   * @internal
   * @hidden
   */
  constructor(db: Database, id: string) {
    this._db = db;
    this._id = id;
  }

  /**
   * @internal
   *
   * Indicates that this object represents an ArangoDB transaction.
   */
  get isArangoTransaction(): true {
    return true;
  }

  /**
   * TODO
   */
  get id() {
    return this._id;
  }

  /**
   * TODO
   */
  async exists(): Promise<boolean> {
    try {
      await this.get();
      return true;
    } catch (err) {
      if (err.errorNum === ERROR_BAD_PARAMETER) {
        return false;
      }
      throw err;
    }
  }

  /**
   * TODO
   */
  get(): Promise<TransactionStatus> {
    return this._db.request(
      {
        path: `/_api/transaction/${this.id}`,
      },
      (res) => res.data.result,
    );
  }

  /**
   * TODO
   */
  commit(): Promise<TransactionStatus> {
    return this._db.request(
      {
        method: "PUT",
        path: `/_api/transaction/${this.id}`,
      },
      (res) => res.data.result,
    );
  }

  /**
   * TODO
   */
  abort(): Promise<TransactionStatus> {
    return this._db.request(
      {
        method: "DELETE",
        path: `/_api/transaction/${this.id}`,
      },
      (res) => res.data.result,
    );
  }

  /**
   * TODO
   */
  run<T>(fn: () => Promise<T>): Promise<T> {
    const conn = (this._db as any)._connection as Connection;

    conn.setTransactionId(this.id);

    try {
      return Promise.resolve(fn());
    } finally {
      conn.clearTransactionId();
    }
  }
}
