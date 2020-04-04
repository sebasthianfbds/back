import { ObjectId } from "mongodb";

export interface IRequestUpdateUser {
  _id: ObjectId;
  name: string;
  email: string;
  password?: string;
  imageUrl: string;
}

export interface IRequestSubscriptionUser {
  _id: ObjectId;
  subscription: any;
}

export interface IRegisterRequest {
  name: string;
  email: string;
  password: string;
}
