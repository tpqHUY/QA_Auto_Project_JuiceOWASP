/**
 * Minimal, dependency-free logger. Test frameworks already produce a lot of
 * output, so this stays intentionally quiet and prefixed for easy grepping.
 */
export const logger = {
  info: (msg: string, ...args: unknown[]): void => console.info(`[info] ${msg}`, ...args),
  warn: (msg: string, ...args: unknown[]): void => console.warn(`[warn] ${msg}`, ...args),
  error: (msg: string, ...args: unknown[]): void => console.error(`[error] ${msg}`, ...args),
};
