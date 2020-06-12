/**
 * @internal
 * @hidden
 */
import {IndexSelector} from './types/indexes.ts';

export function _indexHandle(
  selector: IndexSelector,
  collectionName: string,
): string {
  if (typeof selector !== "string") {
    if (selector.id) {
      return _indexHandle(selector.id, collectionName);
    }

    throw new Error(
      "Index handle must be a string or an object with an id attribute",
    );
  }

  if (selector.includes("/")) {
    if (!selector.startsWith(`${collectionName}/`)) {
      throw new Error(
        `Index ID "${selector}" does not match collection name "${collectionName}"`,
      );
    }

    return selector;
  }

  return `${collectionName}/${selector}`;
}
