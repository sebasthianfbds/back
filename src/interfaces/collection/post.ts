import { ObjectId } from "mongodb";

export interface IPostCollection {
  _id?: ObjectId;
  user_id: ObjectId;
  comments: IPostComment[];
  date?: Date;
  text: string;
}
export interface IPostComment {
  name: any;
  userImageUrl: string;
  text: string;
}
