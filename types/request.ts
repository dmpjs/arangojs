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
  params?: {
    [key: string]: string | number | boolean;
  };
  timeout?: number;
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
