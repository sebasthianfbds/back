import { ObjectId } from "mongodb";

export interface IPostCollection {
  _id?: ObjectId;
  user_id: ObjectId;
  comments: IPostComment[];
  likes: ObjectId[];
  date?: Date;
  text: string;
  title: string;
  datep: string;
  locale: string;
  url: string;
  wordsKey: string;
}
export interface IPostComment {
  name: any;
  userImageUrl: string;
  text: string;
}
