import * as postCollection from "@collections/posts/posts";
import { IPostPublishRequest } from "@interfaces/request/post";
import { getUser } from "@collections/users/users";
import { IRequest, IResponse } from "@interfaces/http/core";
import { ObjectId } from "mongodb";
import { GetRouter } from "nd5-mongodb-server/core";

const router = GetRouter();

router.delete("/", async (req: IRequest, res: IResponse) => {
  try {
    const id = req.query.id as any;
    const post = await postCollection.getPost(id);
    if (!post) return res.badRequest("Id do post inválido.");
    if (!req.session.userId.equals(new ObjectId(post.user_id)))
      return res.actionDenied();
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
    const user = await getUser([{ $match: { _id: req.session.userId } }]);

    const filter = [...(user.following || []), user._id];

    let result = (
      await postCollection.getPosts({
        userId: req.session.userId,
        filter: [
          {
            $match: {
              user_id: {
                $in: filter,
              },
            },
          },
        ],
      })
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
    let result = (
      await postCollection.getPosts({
        userId: session.userId,
        filter: [{ $match: { "user._id": session.userId } }],
      })
    ).map((post) => {
      post.canEdit = new ObjectId(post.user._id).equals(req.session.userId);
      return post;
    });
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

    await postCollection.emitNewPost({
      insertedId,
      session,
    });

    res.ok();
  } catch (e) {
    res.error(e);
  }
});

router.post("/like", async (req: IRequest, res: IResponse) => {
  try {
    const session = req.session;
    const id = req.body.id;

    await postCollection.like({
      userId: session.userId,
      postId: new ObjectId(id),
    });

    res.json();
  } catch (e) {
    res.error(e);
  }
});

module.exports = router;
