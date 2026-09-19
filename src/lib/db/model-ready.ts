/**
 * Per-process guard that makes Mongoose index builds deterministic on the
 * write paths whose correctness depends on unique indexes.
 *
 * Mongoose builds schema indexes in the background on first model use, so
 * on a fresh database a concurrent double write (two tabs, double click,
 * retry) could land before the unique index exists — duplicating the
 * document AND permanently breaking the later unique-index build. Awaiting
 * `model.init()` once per process closes that window; afterwards the call
 * is a no-op.
 */
const readyModels = new Set<string>();

export async function ensureModelReady(
  model: { init(): Promise<unknown> },
  key: string,
): Promise<void> {
  if (readyModels.has(key)) return;
  await model.init();
  readyModels.add(key);
}
