import { getColletion } from "nd5-mongodb-server/mongo";
import { environment } from "@env/environment.prod";
import { getUser } from "@collections/users/users";
import { ObjectId } from "mongodb";
import { IPostResponse, IPostCommentRequest } from "@interfaces/request/post";
import { IPostPublishRequest } from "@interfaces/request/post";
import { IPostCollection } from "@interfaces/collection/post";
import { IUser } from "@interfaces/collection/user";
import { webPushNotify } from "@lib/webPushNotification";
import { ioEmit } from "@lib/socket";

const { collection } = getColletion({
  collection: "posts",
  db: environment.db,
});

export async function remove(postId: string) {
  return await collection.deleteOne({ _id: new ObjectId(postId) });
}

export async function getPost(postId: string) {
  return await collection.findOne({ _id: new ObjectId(postId) });
}

export async function comment(payload: IPostCommentRequest) {
  const post = await getPost(payload.post_id);
  if (!post) throw "Publicação não encontrada.";
  const userOwner = await getUser([
    { $match: { _id: { $in: [post.user_id] } } },
  ]);
  if (!userOwner) throw "Usuário responsável pela publicação não encontrado.";

  await collection.updateOne(
    { _id: new ObjectId(payload.post_id) },
    {
      $push: {
        comments: {
          user_id: payload.user_id,
          text: payload.text,
        },
      },
    }
  );

  const user = await getUser([
    { $match: { _id: { $in: [new ObjectId(payload.user_id)] } } },
  ]);

  ioEmit("on_new_comment", payload.post_id, {
    text: payload.text,
    user: {
      _id: user._id,
      name: user.name,
      notificationSubscription: user.notificationSubscription,
      imageUrl: user.imageUrl,
    },
  });

  if (!(user._id as ObjectId).equals(userOwner._id))
    webPushNotify(userOwner.notificationSubscription, {
      message: "Novo comentário no seu post!",
    });
}

export async function getPostComments(postId: string) {
  return (
    await collection
      .aggregate([
        {
          $match: {
            _id: {
              $in: [new ObjectId(postId)],
            },
          },
        },
        {
          $unwind: "$comments",
        },
        {
          $lookup: {
            from: "users",
            localField: "comments.user_id",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $set: {
            text: "$comments.text",
          },
        },
        {
          $unwind: "$user",
        },
        {
          $project: {
            text: 1,
            user: {
              _id: 1,
              name: 1,
              notificationSubscription: 1,
              imageUrl: 1,
            },
          },
        },
      ])
      .toArray()
  ).reverse();
}

// interface IPostCommentsResponse {}

export async function getPosts(filter?: any[]): Promise<IPostResponse[]> {
  try {
    let aggregate: any[] = [
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $set: {
          commentLength: { $size: "$comments" },
        },
      },
      {
        $project: {
          "user.password": 0,
          "user.email": 0,
          comments: 0,
        },
      },
    ];

    if (filter) aggregate = aggregate.concat(filter);

    return (await collection.aggregate(aggregate).toArray()).reverse();
  } catch (e) {
    throw "Erro buscando posts: " + e;
  }
}
export async function publish(payload: IPostPublishRequest): Promise<any> {
  try {
    if (!payload.text) throw "Preencha um comentário.";
    let user: IUser = await getUser([
      {
        $match: {
          _id: { $in: [payload.user_id] },
        },
      },
    ]);
    if (!user) throw "Usuário não encontrado.";
    let post: IPostCollection = {
      user_id: new ObjectId(payload.user_id),
      comments: [],
      date: new Date(),
      text: payload.text,
    };

    return (await collection.insertOne(post)).insertedId;
  } catch (e) {
    throw "Erro publicando post: " + e;
  }
}
