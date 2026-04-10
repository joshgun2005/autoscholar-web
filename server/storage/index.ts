import { userMethods } from './user-storage';
import { messageMethods } from './message-storage';
import { sessionMethods } from './session-storage';
import { paperMethods } from './paper-storage';
import { analyticsMethods } from './analytics-storage';
import { adminMethods } from './admin-storage';
import type { IStorage } from './types';

export type { IStorage } from './types';

export const storage: IStorage = {
  ...userMethods,
  ...messageMethods,
  ...sessionMethods,
  ...paperMethods,
  ...analyticsMethods,
  ...adminMethods,
};
