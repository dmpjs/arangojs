/*
 * This file is part of the ArangoJs deno package.
 *
 * (c) Daniel Bannert <d.bannert@anolilab.de>
 *
 * For the full copyright and license information, please view the LICENSE_MIT.md
 * file that was distributed with this source code.
 */

import { Errback } from "../types/errback.ts";
import { ArangojsRequest, ArangojsResponse } from "../types/request.ts";
import { ArangojsError } from "../types/request.ts";
import { urlJoin } from "./url_join.ts";

const omit = <T>(obj: T, keys: (keyof T)[]): T => {
  const result = {} as T;

  for (const key of Object.keys(obj)) {
    if (keys.includes(key as keyof T)) {
      continue;
    }

    result[key as keyof T] = obj[key as keyof T];
  }

  return result;
};

export function createRequest(baseUrl: string, agentOptions: any) {
  const u = new URL(baseUrl);
  const { username, password, ...baseUrlParts } = u;

  if (!username) {
    u.username = "root";
  }

  if (!password) {
    u.password = "";
  }

  const options = omit(agentOptions, ["maxSockets"]);

  return (
    { method, url, headers, body, timeout, expectBinary }: {
      method: string;
      url: { pathname: string; search?: string };
      headers: { [key: string]: string };
      body: any;
      expectBinary: boolean;
      timeout?: number;
    },
    cb: Errback<ArangojsResponse>,
  ) => {
    u.pathname = url.pathname
      ? baseUrlParts.pathname
        ? urlJoin(baseUrlParts.pathname, url.pathname)
        : url.pathname
      : baseUrlParts.pathname;

    u.search = url.search
      ? baseUrlParts.search
        ? `${baseUrlParts.search}&${url.search.slice(1)}`
        : url.search
      : baseUrlParts.search || "";

    if (!headers["authorization"]) {
      headers["authorization"] = `Basic ${
        btoa(unescape(encodeURIComponent(`${u.username}:${u.password}`)))
      }`;
    }

    const payload = {
      ...options,
      url: u.href,
      data: body,
      method,
      headers,
      timeout,
    };

    makeFetch(payload)
      .then((res: ArangojsResponse) => {
        if (!res.data) {
          res.data = "";
        }

        cb(null, res);
      }).catch((err: ArangojsError) => {
        const error = err as ArangojsError;

        error.request = payload;

        cb(error);
      });
  };
}

const makeFetch = async ({
  url = "/",
  baseURL,
  method = "get",
  headers,
  data,
  keepAlive,
  timeout = 0,
}: ArangojsRequest): Promise<ArangojsResponse> => {
  // Url and Base url
  if (baseURL) {
    url = urlJoin(baseURL, url);
  }

  method = method.toLowerCase().trim();

  // Create fetch Request Config
  const fetchRequestObject: RequestInit = {
    credentials: "include",
    keepalive: keepAlive,
    mode: "cors",
  };

  // Add method to Request Config
  if (method !== "get") {
    fetchRequestObject.method = method.toUpperCase();
  }

  // Add body to Request Config
  if (data && method !== "get") {
    if (typeof data === "string" || data instanceof FormData) {
      fetchRequestObject.body = data;
    } else {
      try {
        fetchRequestObject.body = JSON.stringify(data);

        if (!headers) {
          headers = {};
        }

        headers["Accept"] = "application/json";
        headers["Content-Type"] = "application/json";
      } catch (ex) {}
    }
  }

  // Add headers to Request Config
  if (headers) {
    const _headers: Headers = new Headers();

    Object.keys(headers).forEach((header) => {
      if (headers && headers[header]) {
        _headers.set(header, headers[header]);
      }
    });

    fetchRequestObject.headers = _headers;
  }

  // Remove commented test when Abort is supported by Deno
  // https://github.com/denoland/deno/issues/5471
  // https://github.com/Code-Hex/deno-context/issues/8
  // Timeout
  // const controller = new AbortController();
  // fetchRequestObject.signal = controller.signal;

  // let timeoutVar: number = 0;
  //
  // if ((timeout || 0) > 0) {
  //   timeoutVar = setTimeout(() => {
  //     timeoutVar = 0;
  //     console.log("Cancecled controller.abort()");
  //     controller.abort();
  //   }, timeout);
  // }

  return fetch(url, fetchRequestObject)
    .then(async (x) => {
      // // Clear timeout
      // if (timeoutVar) {
      //   clearTimeout(timeoutVar);
      // }

      const _status: number = x.status;

      Object.assign(x, { data: null });

      if (_status >= 200 && _status < 300) {
        return Promise.resolve(x as ArangojsResponse);
      } else {
        return Promise.reject(await x.json());
      }
    });
};
