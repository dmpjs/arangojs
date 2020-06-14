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

/**
 * TODO
 */
export type DocumentMetadata = {
  _key: string;
  _id: string;
  _rev: string;
};

/**
 * TODO
 */
export type EdgeMetadata = {
  _from: string;
  _to: string;
};

/**
 * TODO
 */
export type DocumentData<T extends object = any> =
  & T
  & Partial<DocumentMetadata>
  & Partial<EdgeMetadata>;

/**
 * TODO
 */
export type EdgeData<T extends object = any> =
  & T
  & Partial<DocumentMetadata>
  & EdgeMetadata;

/**
 * TODO
 */
export type Document<T extends object = any> =
  & T
  & DocumentMetadata
  & Partial<EdgeMetadata>;

/**
 * TODO
 */
export type Edge<T extends object = any> = T & DocumentMetadata & EdgeMetadata;

/**
 * TODO
 */
export type ObjectWithId = {
  [key: string]: any;
  _id: string;
};

/**
 * TODO
 */
export type ObjectWithKey = {
  [key: string]: any;
  _key: string;
};

/**
 * TODO
 */
export type DocumentSelector = ObjectWithId | ObjectWithKey | string;

/**
 * TODO
 *
 * @internal
 * @hidden
 */
export function _documentHandle(
  selector: DocumentSelector,
  collectionName: string,
): string {
  if (typeof selector !== "string") {
    if (selector._id) {
      return _documentHandle(selector._id, collectionName);
    }

    if (selector._key) {
      return _documentHandle(selector._key, collectionName);
    }

    throw new Error(
      "Document handle must be a string or an object with a _key or _id attribute",
    );
  }

  if (selector.includes("/")) {
    if (!selector.startsWith(`${collectionName}/`)) {
      throw new Error(
        `Document ID "${selector}" does not match collection name "${collectionName}"`,
      );
    }

    return selector;
  }

  return `${collectionName}/${selector}`;
}
