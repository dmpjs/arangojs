/*
 * This file is part of the ArangoJs deno package.
 *
 * (c) Daniel Bannert <d.bannert@anolilab.de>
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

const stringifyPrimitive = function (v: any) {
  switch (typeof v) {
    case "string":
      return v;

    case "boolean":
      return v ? "true" : "false";

    case "number":
      return isFinite(v) ? v : "";

    default:
      return "";
  }
};

export class Querystring {
  public static stringify(
    obj: { [key: string]: string },
    sep?: string,
    eq?: string,
    name?: string,
  ): string;

  public static stringify(
    obj: null,
    sep?: string,
    eq?: string,
    name?: string,
  ): string;

  public static stringify(
    obj: { [key: string]: string[] } | { [key: string]: string } | null,
    sep?: string,
    eq?: string,
    name?: string,
  ): string {
    sep = sep || "&";
    eq = eq || "=";

    if (obj !== null && typeof obj === "object") {
      return Object.keys(obj).map(function (k) {
        const ks = encodeURIComponent(stringifyPrimitive(k)) + eq;

        if (Array.isArray(obj[k])) {
          // @ts-ignore
          return obj[k].map(function (v) {
            return ks + encodeURIComponent(stringifyPrimitive(v));
          }).join(sep);
        } else {
          return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
        }
      }).filter(Boolean).join(sep);
    }

    if (!name) {
      return "";
    }

    return encodeURIComponent(stringifyPrimitive(name)) + eq +
      encodeURIComponent(stringifyPrimitive(obj));
  }
}
