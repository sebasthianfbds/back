export interface IUser {
  _id?: any;
  name?: string;
  email?: string;
  password?: string;
  imageUrl?: string;
  notificationSubscription: any;
  following: { user_id: string }[];
}
