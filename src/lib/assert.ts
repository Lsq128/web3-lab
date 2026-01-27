export function invariant(
  condition: unknown,
  message = "Invariant violation"
): asserts condition {
  if (!condition) throw new Error(message);
}

