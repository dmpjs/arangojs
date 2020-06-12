/**
 * Type representing a Node.js error-first callback.
 *
 * @param T - Type of the optional result value.
 */
export type Errback<T = never> = (err: Error | null, result?: T) => void;
