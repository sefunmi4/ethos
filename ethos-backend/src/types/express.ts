import { Request, ParamsDictionary } from 'express'; //TODO: Module '"express"' has no exported member 'ParamsDictionary'.ts(2305)
import type { ParsedQs } from 'qs';
export interface AuthenticatedRequest<
  P = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = ParsedQs
> extends Request<P, ResBody, ReqBody, ReqQuery> {
  user?: {
    id: string;
    role?: string;
    username?: string;
  };
}
