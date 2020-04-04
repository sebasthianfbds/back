import * as postCollection from "@collections/posts/posts";
import { IPostPublishRequest } from "@interfaces/request/post";
import { webPushNotify } from "@lib/webPushNotification";
import { getAll, getUser } from "@collections/users/users";
import { IRequest, IResponse } from "@interfaces/http/core";
import { ioEmit } from "@lib/socket";
import { ObjectId } from "mongodb";
import { GetRouter } from "nd5-mongodb-server/core";

const router = GetRouter();

router.delete("/", async (req: IRequest, res: IResponse) => {
  try {
    const id = req.query.id;
    const post = await postCollection.getPost(id);
    if (!post) throw "Id do post inválido.";
    if (!req.session.userId.equals(new ObjectId(post.user_id)))
      res.unauthorized();
    else {
      await postCollection.remove(id);
      res.ok();
    }
  } catch (e) {
    res.error(e);
  }
});

router.get("/", async (req: IRequest, res: IResponse) => {
  try {
    const user = await getUser([
      { $match: { _id: { $in: [req.session.userId] } } },
    ]);

    const filter = [...user.following.map((item) => item.user_id), user._id];

    let result = (
      await postCollection.getPosts([
        {
          $match: {
            user_id: {
              $in: filter,
            },
          },
        },
      ])
    ).map((post) => {
      post.canEdit = new ObjectId(post.user._id).equals(req.session.userId);
      return post;
    });
    res.ok(result);
  } catch (e) {
    res.error(e);
  }
});

router.get("/user", async (req: IRequest, res: IResponse) => {
  try {
    const session = req.session;
    let result = await postCollection.getPosts([
      { $match: { "user._id": { $in: [session.userId] } } },
    ]);
    res.ok(result);
  } catch (e) {
    res.error(e);
  }
});

router.post("/", async (req: IRequest, res: IResponse) => {
  try {
    const session = req.session;
    const post = req.body as IPostPublishRequest;
    post.user_id = session.userId;
    const insertedId = await postCollection.publish(post);

    const newPost = await postCollection.getPosts([
      { $match: { _id: { $in: [new ObjectId(insertedId)] } } },
    ]);

    ioEmit("on_new_post", session.sessionId, newPost);

    (await getAll()).map((user) => {
      if (!post.user_id.equals(user._id) && user.notificationSubscription) {
        webPushNotify(
          user.notificationSubscription,
          {
            message: "Nova postagem disponivel =)",
          },
          `post/${insertedId}`
        );
      }
    });
    res.ok();
  } catch (e) {
    res.error(e);
  }
});

router.post("/like", async (req: IRequest, res: IResponse) => {
  try {
    const session = req.session;
    const post = req.body as { post_id };

    res.json();
  } catch (e) {
    res.error(e);
  }
});

module.exports = router;
