import mongoose from 'mongoose';

/**
 * Runs `fn` inside a real MongoDB multi-document transaction.
 *
 * Requires the server to be connected to a replica set (see docker-compose: mongod
 * is started with `--replSet rs0` and initiated via healthcheck). `session.withTransaction`
 * commits on success, aborts on any thrown error, and automatically retries on
 * TransientTransactionError / UnknownTransactionCommitResult — so a write conflict
 * (two cashiers racing the last unit) is retried against fresh data, and a guarded
 * `$inc` that no longer matches aborts the whole order, leaving the DB unchanged.
 */
export async function runInTransaction<T>(
  fn: (session: mongoose.ClientSession) => Promise<T>,
): Promise<T> {
  const session = await mongoose.startSession();
  try {
    let result: T;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result!;
  } finally {
    await session.endSession();
  }
}
