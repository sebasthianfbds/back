import { Request, Response } from "express";
import { ObjectId } from "mongodb";

export interface ISession {
  sessionId: string;
  userId: ObjectId;
}

export interface IRequest extends Request {
  data: any;
  session: ISession;
}

export interface IResponse extends Response {
  ok: (data?: any) => void;
  error: (e: any) => void;
  unauthorized: (e?: any) => void;
  badRequest: (e?: any) => void;
}
