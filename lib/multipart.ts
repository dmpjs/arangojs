const DEFAULT_PREFIX = "MultipartBoundary";

/**
 * Generates boundary by a prefix
 * @param {String|Number} prefix
 * @returns {String}
 */
const genBoundary = (prefix = DEFAULT_PREFIX) => {
  let boundary = `--${prefix}`;

  for (let i = 0; i < 12; i++) {
    boundary += Math.floor(Math.random() * 10).toString(16);
  }

  return boundary;
};

export type Fields = {
  [key: string]: any;
};

export type MultipartRequest = {
  headers?: { [key: string]: string };
  body: FormData;
};

export function toForm(fields: Fields): Promise<MultipartRequest> {
  return new Promise((resolve, reject) => {
    try {
      let formData = new FormData();

      for (const key of Object.keys(fields)) {
        let value = fields[key];

        if (value === undefined) {
          continue;
        }

        if (
          !(value instanceof ReadableStream) &&
          !(value instanceof ArrayBuffer) &&
          (typeof value === "object" || typeof value === "function")
        ) {
          value = JSON.stringify(value);
        }

        formData.append(key, value);
      }

      const boundary = genBoundary();
      const headers = {
        "content-type": `multipart/form-data; boundary=${boundary}`,
        "content-length": String(JSON.stringify(formData).length),
      };

      resolve({ body: formData, headers });
    } catch (e) {
      reject(e);
    }
  });
}
