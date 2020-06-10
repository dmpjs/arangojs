export function greeting(str?: string): string {
  if (str) {
    return `Hello ${str}`;
  } else {
    throw new Error("Please provide an input");
  }
}
