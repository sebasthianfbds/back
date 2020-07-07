import * as postCollection from "@collections/posts/posts";
import { IPostPublishRequest } from "@interfaces/request/post";
import { getUser } from "@collections/users/users";
import { IRequest, IResponse } from "@interfaces/http/core";
import { ObjectId } from "mongodb";
import { GetRouter } from "nd5-mongodb-server/core";
import * as p from "fs";
import { join } from "path";

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
      try {
        if (
          p.existsSync(
            "./uploads/posts/" + req.session.userId.toHexString() + "/" + id
          )
        ) {
          p.rmdirSync(
            "./uploads/posts/" + req.session.userId.toHexString() + "/" + id,
            { recursive: true }
          );
        }
      } catch {}
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
      var files = [];
      const path =
        "./uploads/posts/" +
        new ObjectId(post.user._id).toHexString() +
        "/" +
        post._id;

      if (p.existsSync(path)) {
        files = p.readdirSync(path);
      }
      post.pdf = files.length > 0 ? files[0] : "";
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

    res.ok(insertedId);
  } catch (e) {
    res.error(e);
  }
});

router.put("/", async (req: IRequest, res: IResponse) => {
  try {
    const session = req.session;
    const post = req.body as IPostPublishRequest;
    post.user_id = session.userId;

    let result = await postCollection.getPosts({
      userId: req.session.userId,
      filter: [
        {
          $match: {
            _id: new ObjectId(post._id),
            user_id: session.userId,
          },
        },
      ],
    });

    if (!result) res.badRequest("post nao encontrado.");

    await postCollection.editPost(post);

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

const multer = require("multer");

var storage = multer.diskStorage({
  destination: function (req: IRequest, file, cb) {
    var path = "./uploads";
    if (!p.existsSync(path)) p.mkdirSync(path);
    path = path + "/posts";
    if (!p.existsSync(path)) p.mkdirSync(path);
    path = path + "/" + req.session.userId.toHexString();
    if (!p.existsSync(path)) p.mkdirSync(path);
    path = path + "/" + req.headers["post_id"];
    if (!p.existsSync(path)) p.mkdirSync(path);
    cb(null, "./" + path);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const fs = require("fs-extra");

var upload = multer({
  storage: storage,
}).single("file");

router.post("/file", upload, async (req: IRequest, res: IResponse) => {
  res.ok();
});

router.get("/download", async (req: IRequest, res: IResponse) => {
  const path =
    "./uploads/" +
    req.session.userId.toHexString() +
    "/" +
    req.headers["post_id"];
  if (p.existsSync(path)) {
    const files = p.readdirSync(path);
    if (files.length > 0)
      res.sendFile(
        join(
          __dirname,
          "..",
          "..",
          "..",
          "uploads",
          req.session.userId.toHexString(),
          req.headers["post_id"] as string,
          files[0]
        )
      );
    else res.ok();
  } else res.ok();
});

module.exports = router;
