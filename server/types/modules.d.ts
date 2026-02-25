declare module 'better-sqlite3-session-store' {
  import session from 'express-session';
  function SqliteStore(session: typeof import('express-session')): {
    new (options: { client: unknown; expired?: { clear?: boolean; intervalMs?: number } }): session.Store;
  };
  export default SqliteStore;
}
