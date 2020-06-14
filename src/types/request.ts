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

import { Errback } from "./errback.ts";

export type ArangojsRequest = {
  url?: string;
  baseURL?: string;
  method?:
    | string
    | "get"
    | "post"
    | "put"
    | "delete"
    | "options"
    | "head"
    | "connect"
    | "trace"
    | "patch";
  data?: string | {
    [key: string]: any;
  } | FormData;
  headers?: {
    [key: string]: any;
  };
  timeout?: number;
  keepAlive: boolean;
};

export type ArangojsResponse = Response & {
  arangojsHostId?: number;
  data: any;
};

export type ArangojsError = Error & {
  response: ArangojsResponse;
  request: Request;
};

export interface RequestOptions {
  method: string;
  url: { pathname: string; search?: string };
  headers: { [key: string]: string };
  body: any;
  expectBinary: boolean;
  timeout?: number;
}

/**
 * @internal
 * @hidden
 */
export type RequestFunction = {
  (options: RequestOptions, cb: Errback<ArangojsResponse>): void;
  close?: () => void;
};
