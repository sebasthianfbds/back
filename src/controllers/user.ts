import * as userCollection from "@collections/users/users";
import * as postColletion from "@collections/posts/posts";
import { IRequestUpdateUser, IRegisterRequest } from "@interfaces/request/user";
import { IRequest, IResponse } from "@interfaces/http/core";
import { GetRouter } from "nd5-mongodb-server/core";
import { IUser } from "@interfaces/collection/user";
import { IPostResponse } from "@interfaces/request/post";
import { ObjectId } from "mongodb";
import { join } from "path";
import * as p from "fs";

const router = GetRouter();

router.get("/sugestion", async (req: IRequest, res: IResponse) => {
  try {
    const session = req.session;
    const user = await userCollection.getUser([
      { $match: { _id: session.userId } },
    ]);

    if (!user) return res.badRequest(`Usuário não encontrado.`);

    const sugestions = await userCollection.getAllUsers([
      {
        $match: {
          _id: { $nin: user?.following || [] },
          interesses: { $in: user.interesses },
        },
      },
      { $sample: { size: 5 } },
      { $limit: 5 },
    ]);
    res.ok(sugestions);
  } catch (e) {
    res.error(e);
  }
});

router.get("/search", async (req: IRequest, res: IResponse) => {
  try {
    const name = req.query.name as any;
    var filter = [];
    if (name) {
      filter.push({
        $match: {
          name: RegExp(name, "i"),
        },
      });
    }
    filter.push({
      $project: {
        notificationSubscription: 0,
      },
    });
    let result = await userCollection.getAllUsers(filter);

    filter = [];

    if (name) {
      filter.push({
        $match: {
          instituicao: RegExp(name, "i"),
        },
      });
    }
    filter.push({
      $project: {
        notificationSubscription: 0,
      },
    });
    let result2 = await userCollection.getAllUsers(filter);

    filter = [];

    if (name) {
      filter.push({
        $match: {
          interesses: { $in: [name] },
        },
      });
    }
    filter.push({
      $project: {
        notificationSubscription: 0,
      },
    });
    let result3 = await userCollection.getAllUsers(filter);

    const results = result.concat(result2).concat(result3);

    res.ok(results);
  } catch (e) {
    res.error(e);
  }
});

router.get("/search", async (req: IRequest, res: IResponse) => {
  try {
    let result = await userCollection.getAllUsers();
    res.ok(result);
  } catch (e) {
    res.error(e);
  }
});

router.get("/profile", async (req: IRequest, res: IResponse) => {
  try {
    const session = req.session;
    const name = decodeURI(req.query.name as any);

    if (!name || name === "undefined" || name === "null")
      return res.badRequest(`Usuário '${name}' não encontrado.`);

    var userData: {
      data: IUser;
      posts: IPostResponse[];
      myProfile: boolean;
      following: boolean;
    } = {
      data: undefined,
      posts: undefined,
      myProfile: undefined,
      following: false,
    };

    userData.data = await userCollection.getUser([
      {
        $match: {
          name: name,
        },
      },
      {
        $project: {
          password: 0,
          notificationSubscription: 0,
        },
      },
    ]);

    if (!userData.data)
      return res.badRequest(`Usuário '${name}' não encontrado.`);

    for (let i = 0; i < (userData.data.following || []).length; i++) {
      let user = await userCollection.getUser([
        { $match: { _id: new ObjectId(userData.data.following[i]) } },
        {
          $project: {
            email: 0,
            following: 0,
            instituicao: 0,
            interesses: 0,
            password: 0,
            type: 0,
          },
        },
      ]);
      if (user) userData.data.following[i] = user;
    }

    for (let i = 0; i < (userData.data.followers || []).length; i++) {
      let user = await userCollection.getUser([
        { $match: { _id: new ObjectId(userData.data.followers[i]) } },
        {
          $project: {
            email: 0,
            following: 0,
            instituicao: 0,
            interesses: 0,
            password: 0,
            type: 0,
          },
        },
      ]);
      if (user) userData.data.followers[i] = user;
    }

    userData.posts = await postColletion.getPosts({
      userId: session.userId,
      filter: [
        {
          $match: {
            user_id: userData.data._id,
          },
        },
      ],
    });
    userData.posts.map((post) => {
      post.canEdit = new ObjectId(post.user._id).equals(req.session.userId);

      var files = [];

      if (
        p.existsSync(
          "./uploads/posts/" +
            new ObjectId(post.user._id).toHexString() +
            "/" +
            post._id
        )
      ) {
        files = p.readdirSync(
          "./uploads/posts/" +
            new ObjectId(post.user._id).toHexString() +
            "/" +
            post._id
        );
      }
      post.pdf = files.length > 0 ? files[0] : "";

      return post;
    });
    userData.myProfile = session.userId.equals(new ObjectId(userData.data._id));
    if (!userData.myProfile) {
      userData.following = await userCollection.following({
        followerUserId: session.userId,
        followingUserId: userData.data._id,
      });
    }

    var files = [];

    if (
      p.existsSync("./uploads") &&
      p.existsSync("./uploads/" + userData.data._id.toHexString())
    ) {
      files = p.readdirSync("./uploads/" + userData.data._id.toHexString());
    }
    userData.data.pdf = files.length > 0 ? files[0] : "";

    res.ok(userData);
  } catch (e) {
    res.error(e);
  }
});

router.post("/", async (req: IRequest, res: IResponse) => {
  try {
    const user = req.body as IRegisterRequest;
    await userCollection.createUser(user);
    res.ok();
  } catch (e) {
    res.error(e);
  }
});

const multer = require("multer");

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    var path = "./uploads";
    if (!p.existsSync(path)) p.mkdirSync(path);
    path = path + "/" + req.session.userId.toHexString();
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

router.put("/", async (req: IRequest, res: IResponse) => {
  try {
    const session = req.session;
    const user = req.body as IRequestUpdateUser;
    user._id = session.userId;
    await userCollection.updateUser(user);
    res.ok();
  } catch (e) {
    res.error(e);
  }
});
router.post("/follow", async (req: IRequest, res: IResponse) => {
  try {
    const session = req.session;
    await userCollection.follow({
      followerUserId: session.userId,
      followingUserId: new ObjectId(req.body.userId),
    });
    res.ok();
  } catch (e) {
    res.error(e);
  }
});
router.post("/unfollow", async (req: IRequest, res: IResponse) => {
  try {
    const session = req.session;
    await userCollection.unfollow({
      followerUserId: session.userId,
      followingUserId: new ObjectId(req.body.userId),
    });
    res.ok();
  } catch (e) {
    res.error(e);
  }
});

router.get("/download", async (req: IRequest, res: IResponse) => {
  if (p.existsSync("./uploads/" + req.session.userId.toHexString())) {
    const files = p.readdirSync(
      "./uploads/" + req.session.userId.toHexString()
    );
    if (files.length > 0)
      res.sendFile(
        join(
          __dirname,
          "..",
          "..",
          "..",
          "uploads",
          req.session.userId.toHexString(),
          files[0]
        )
      );
    else res.ok();
  } else res.ok();
});

router.get("/settings", async (req: IRequest, res: IResponse) => {
  try {
    const session = req.session;
    let user = await userCollection.getUser([
      {
        $match: {
          _id: session.userId,
        },
      },
      {
        $project: {
          _id: 0,
          password: 0,
          notificationSubscription: 0,
        },
      },
    ]);

    var files = [];

    if (
      p.existsSync("./uploads") &&
      p.existsSync("./uploads/" + req.session.userId.toHexString())
    ) {
      files = p.readdirSync("./uploads/" + req.session.userId.toHexString());
    }
    res.ok({ ...user, ...{ pdf: files.length > 0 ? files[0] : "" } });
  } catch (e) {
    res.error(e);
  }
});

module.exports = router;
