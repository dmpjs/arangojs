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
 * TODO
 *
 * @packageDocumentation
 */
import { Database } from "./database.ts";
import { isArangoError } from "./error.ts";
import { ERROR_ARANGO_DOCUMENT_NOT_FOUND } from "./error_codes.ts";

/**
 * Indicates whether the given value represents an {@link Analyzer}.
 *
 * @param analyzer - A value that might be an Analyzer.
 */
export function isArangoAnalyzer(analyzer: any): analyzer is Analyzer {
  return Boolean(analyzer && analyzer.isArangoAnalyzer);
}

/**
 * Name of a feature enabled for an Analyzer.
 */
export type AnalyzerFeature = "frequency" | "norm" | "position";

/**
 * TODO
 */
export type AnalyzerDescription = AnalyzerInfo & {
  name: string;
  features: AnalyzerFeature[];
};

/**
 * Options for creating an Analyzer.
 */
export type CreateAnalyzerOptions = AnalyzerInfo & {
  /**
   * Features to enable for this Analyzer.
   */
  features?: AnalyzerFeature[];
};

/**
 * Analyzer type and its type-specific properties.
 */
export type AnalyzerInfo =
  | IdentityAnalyzerInfo
  | DelimiterAnalyzerInfo
  | StemAnalyzerInfo
  | NormAnalyzerInfo
  | NgramAnalyzerInfo
  | TextAnalyzerInfo;

/**
 * TODO
 */
export type IdentityAnalyzerInfo = {
  /**
   * The type of the Analyzer.
   */
  type: "identity";
  /**
   * Additional properties for the Analyzer.
   *
   * The `identity` Analyzer does not take additional properties.
   */
  properties?: null;
};

/**
 * TODO
 */
export type DelimiterAnalyzerInfo = {
  /**
   * The type of the Analyzer.
   */
  type: "delimiter";
  /**
   * Additional properties for the Analyzer.
   *
   * The value will be used as delimiter to split text into tokens as specified
   * in RFC 4180, without starting new records on newlines.
   */
  properties: string | { delimiter: string };
};

/**
 * TODO
 */
export type StemAnalyzerInfo = {
  /**
   * The type of the Analyzer.
   */
  type: "stem";
  /**
   * Additional properties for the Analyzer.
   *
   * The value defines the text locale.
   *
   * Format: `language[_COUNTRY][.encoding][@variant]`
   */
  properties: { locale: string };
};

/**
 * TODO
 */
export type NormAnalyzerProperties = {
  /**
   * The text locale.
   *
   * Format: `language[_COUNTRY][.encoding][@variant]`
   */
  locale: string;
  /**
   * Case conversion.
   *
   * Default: `"lower"`
   */
  case?: "lower" | "none" | "upper";
  /**
   * Preserve accents in returned words.
   *
   * Default: `false`
   */
  accent?: boolean;
};

/**
 * TODO
 */
export type NormAnalyzerInfo = {
  /**
   * The type of the Analyzer.
   */
  type: "norm";
  /**
   * Additional properties for the Analyzer.
   */
  properties: NormAnalyzerProperties;
};

/**
 * TODO
 */
export type NgramAnalyzerProperties = {
  /**
   * Maximum n-gram length.
   */
  max: number;
  /**
   * Minimum n-gram length.
   */
  min: number;
  /**
   * Output the original value as well.
   */
  preserveOriginal: boolean;
};

/**
 * TODO
 */
export type NgramAnalyzerInfo = {
  /**
   * The type of the Analyzer.
   */
  type: "ngram";
  /**
   * Additional properties for the Analyzer.
   */
  properties: NgramAnalyzerProperties;
};

/**
 * TODO
 */
export type TextAnalyzerProperties = {
  /**
   * The text locale.
   *
   * Format: `language[_COUNTRY][.encoding][@variant]`
   */
  locale: string;
  /**
   * Case conversion.
   *
   * Default: `"lower"`
   */
  case?: "lower" | "none" | "upper";
  /**
   * Words to omit from result.
   *
   * Defaults to the words loaded from the file at `stopwordsPath`.
   */
  stopwords?: string[];
  /**
   * Path with a `language` sub-directory containing files with words to omit.
   *
   * Defaults to the path specified in the server-side environment variable
   * `IRESEARCH_TEXT_STOPWORD_PATH` or the current working directory of the
   * ArangoDB process.
   */
  stopwordsPath?: string;
  /**
   * Preserve accents in returned words.
   *
   * Default: `false`
   */
  accent?: boolean;
  /**
   * Apply stemming on returned words.
   *
   * Default: `true`
   */
  stemming?: boolean;
};

/**
 * TODO
 */
export type TextAnalyzerInfo = {
  /**
   * The type of the Analyzer.
   */
  type: "text";
  /**
   * Additional properties for the Analyzer.
   */
  properties: TextAnalyzerProperties;
};

/**
 * TODO
 */
export class Analyzer {
  protected _name: string;
  protected _db: Database;

  /**
   * @internal
   * @hidden
   */
  constructor(db: Database, name: string) {
    this._db = db;
    this._name = name;
  }

  /**
   * @internal
   *
   * Indicates that this object represents an ArangoDB Analyzer.
   */
  get isArangoAnalyzer(): true {
    return true;
  }

  /**
   * TODO
   */
  get name() {
    return this._name;
  }

  /**
   * TODO
   */
  get(): Promise<AnalyzerDescription> {
    return this._db.request(
      { path: `/_api/analyzer/${this.name}` },
      (res) => res.data,
    );
  }

  /**
   * TODO
   */
  async exists() {
    try {
      await this.get();
      return true;
    } catch (err) {
      if (
        isArangoError(err) && err.errorNum === ERROR_ARANGO_DOCUMENT_NOT_FOUND
      ) {
        return false;
      }
      throw err;
    }
  }

  /**
   * TODO
   */
  create(options: CreateAnalyzerOptions): Promise<AnalyzerDescription> {
    return this._db.request(
      {
        method: "POST",
        path: "/_api/analyzer",
        body: { name: this.name, ...options },
      },
      (res) => res.data,
    );
  }

  /**
   * TODO
   */
  drop(force?: boolean): Promise<{ name: string }> {
    return this._db.request(
      {
        method: "DELETE",
        path: `/_api/analyzer/${this.name}`,
        qs: { force },
      },
      (res) => res.data,
    );
  }
}
