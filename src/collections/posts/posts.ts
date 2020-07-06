import { getColletion } from "nd5-mongodb-server/mongo";
import { environment } from "@env/environment.prod";
import { getUser, getAllUsers } from "@collections/users/users";
import { ObjectId } from "mongodb";
import { IPostResponse, IPostCommentRequest } from "@interfaces/request/post";
import { IPostPublishRequest } from "@interfaces/request/post";
import { IPostCollection } from "@interfaces/collection/post";
import { IUser, userType } from "@interfaces/collection/user";
import { webPushNotify } from "@lib/webPushNotification";
import { ioEmit } from "@lib/socket";
import { ISession } from "@interfaces/http/core";

const { collection } = getColletion({
  collection: "posts",
  db: environment.db,
});

export async function getAllPosts(filter?: any[]) {
  try {
    return await collection.aggregate<IPostCollection>(filter).toArray();
  } catch (e) {
    throw "Erro buscando posts: " + e;
  }
}

export async function remove(postId: string) {
  return await collection.deleteOne({ _id: new ObjectId(postId) });
}

export async function getPost(postId: string) {
  return await collection.findOne({ _id: new ObjectId(postId) });
}

export async function comment(payload: IPostCommentRequest) {
  const post = await getPost(payload.post_id);
  if (!post) throw "Publicação não encontrada.";
  const userOwner = await getUser([{ $match: { _id: post.user_id } }]);
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
    { $match: { _id: new ObjectId(payload.user_id) } },
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
    webPushNotify(
      userOwner.notificationSubscription,
      {
        message: "Novo comentário no seu post!",
      },
      `post/${payload.post_id}`
    );
}

export async function getPostComments(postId: string) {
  return (
    await collection
      .aggregate([
        {
          $match: {
            _id: new ObjectId(postId),
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

export async function editPost(post: IPostPublishRequest) {
  try {
    await collection.updateOne(
      { _id: new ObjectId(post._id) },
      {
        $set: {
          text: post.text,
          title: post.title,
          locale: post.locale,
          url: post.url,
          wordsKey: post.wordsKey,
          datep: post.datep,
        },
      }
    );
  } catch (e) {
    throw "Erro alterando post: " + e;
  }
}

export async function getPosts(opts: {
  userId: ObjectId;
  filter?: any[];
}): Promise<IPostResponse[]> {
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
          commentLength: { $size: { $ifNull: ["$comments", []] } },
          likesLength: { $size: { $ifNull: ["$likes", []] } },
          liked: {
            $cond: {
              if: { $in: [opts.userId, { $ifNull: ["$likes", []] }] },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          "user.password": 0,
          "user.email": 0,
          comments: 0,
          likes: 0,
        },
      },
    ];

    if (opts.filter) aggregate = aggregate.concat(opts.filter);

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
          _id: payload.user_id,
          type: userType.pesquisador,
        },
      },
    ]);
    if (!user) throw "Usuário não encontrado.";
    let post: IPostCollection = {
      user_id: new ObjectId(payload.user_id),
      comments: [],
      likes: [],
      date: new Date(),
      text: payload.text,
      title: payload.title,
      datep: payload.datep,
      locale: payload.locale,
      url: payload.url,
      wordsKey: payload.wordsKey,
    };

    return (await collection.insertOne(post)).insertedId;
  } catch (e) {
    throw "Erro publicando post: " + e;
  }
}

export async function emitNewPost(s: {
  session: ISession;
  insertedId: string;
}) {
  const newPost = await getPosts({
    userId: s.session.userId,
    filter: [{ $match: { _id: new ObjectId(s.insertedId) } }],
  });

  (
    await getAllUsers([
      {
        $match: {
          following: s.session.userId,
        },
      },
    ])
  ).map((item) => {
    ioEmit(
      "on_new_post",
      {
        session: s.session,
        userId: item._id,
      },
      newPost
    );
  });

  // (await getAll()).map((user) => {
  //   if (!post.user_id.equals(user._id) && user.notificationSubscription) {
  //     webPushNotify(
  //       user.notificationSubscription,
  //       {
  //         message: "Nova postagem disponivel =)",
  //       },
  //       `post/${s.insertedId}`
  //     );
  //   }
  // });
}

export async function like(payload: { userId: ObjectId; postId: ObjectId }) {
  try {
    const result = await collection.findOne({
      _id: payload.postId,
      likes: payload.userId,
    });
    if (!result) {
      await collection.findOneAndUpdate(
        { _id: payload.postId },
        {
          $push: {
            likes: payload.userId,
          },
        }
      );
    } else {
      await collection.findOneAndUpdate(
        { _id: payload.postId },
        {
          $pull: {
            likes: payload.userId,
          },
        }
      );
    }
  } catch (e) {
    throw "Erro ao curtir publicação " + e;
  }
}
