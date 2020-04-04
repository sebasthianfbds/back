import { getColletion } from "nd5-mongodb-server/mongo";
import { environment } from "@env/environment.prod";
import {
  IRequestUpdateUser,
  IRequestSubscriptionUser,
  IRegisterRequest,
} from "@interfaces/request/user";

import { IUser } from "@interfaces/collection/user";

import { encrypt } from "@lib/crypto";
import { ObjectId } from "mongodb";

const { collection } = getColletion({
  collection: "users",
  db: environment.db,
});

export async function getAll(filter?: any[]) {
  try {
    return await collection.aggregate<IUser>(filter).toArray();
  } catch (e) {
    throw "Erro criando usuário: " + e;
  }
}

export async function getUser(filter?: any[]): Promise<IUser> {
  try {
    let users = await getAll(filter);
    return users[0];
  } catch (e) {
    throw "Erro criando usuário: " + e;
  }
}

export async function createUser(user: IRegisterRequest) {
  try {
    const hasUser = await getUser([
      { $match: { email: { $in: [user.email] } } },
    ]);
    if (hasUser) throw "Usuário ja cadastrado.";
    user.password = encrypt(user.password);
    await collection.insertOne(user);
  } catch (e) {
    throw "Erro criando usuário: " + e;
  }
}

export async function saveUserPushSubscription(
  payload: IRequestSubscriptionUser
) {
  try {
    await collection.findOneAndUpdate(
      { _id: payload._id },
      { $set: { notificationSubscription: payload.subscription } }
    );
  } catch (e) {
    throw "Erro salvando inscrição de notificação do usuário: " + e;
  }
}

export async function updateUser(payload: IRequestUpdateUser) {
  try {
    if (payload.password) payload.password = encrypt(payload.password);
    else delete payload.password;
    const build = (payload) => {
      delete payload._id;
      return payload;
    };
    await collection.findOneAndUpdate(
      { _id: new ObjectId(payload._id) },
      { $set: build(payload) }
    );
  } catch (e) {
    throw "Erro atualizando usuário: " + e;
  }
}

export async function follow(payload: {
  followerUserId: ObjectId;
  followingUserId: ObjectId;
}) {
  try {
    const result = await collection.findOne({
      "following.user_id": payload.followingUserId,
    });
    if (!result) {
      await collection.updateOne(
        { _id: payload.followerUserId },
        {
          $push: {
            following: {
              user_id: payload.followingUserId,
            },
          },
        }
      );
    }
  } catch (e) {
    throw "Erro ao seguir usuário: " + e;
  }
}

export async function unfollow(payload: {
  followerUserId: ObjectId;
  followingUserId: ObjectId;
}) {
  try {
    await collection.updateOne(
      { _id: payload.followerUserId },
      { $pull: { following: { user_id: payload.followingUserId } } }
    );
  } catch (e) {
    throw "Erro ao seguir usuário: " + e;
  }
}

export async function following(payload: {
  followerUserId: ObjectId;
  followingUserId: ObjectId;
}): Promise<boolean> {
  try {
    const result = await collection.findOne({
      "following.user_id": payload.followingUserId,
    });
    if (result) return true;
    else return false;
  } catch (e) {
    throw "Erro ao seguir usuário: " + e;
  }
}
