import { ObjectId } from "mongodb";
import { IUser } from "@interfaces/collection/user";
import { IPostComment } from "@interfaces/collection/post";

export interface IPostPublishRequest {
  _id?: ObjectId;
  user_id: ObjectId;
  text: string;
  title: string;
  datep: string;
  locale: string;
  url: string;
  wordsKey: string;
}

export interface IPostCommentRequest {
  user_id?: ObjectId;
  post_id: string;
  text: string;
}

export interface IPostResponse {
  _id: string;
  user: IUser;
  text: string;
  date: Date;
  comments: IPostComment[];
  commentLength: number;
  canEdit: boolean;
  pdf: string;
}
