import * as userCollection from "@collections/users/users";
import * as postColletion from "@collections/posts/posts";
import { IRequestUpdateUser, IRegisterRequest } from "@interfaces/request/user";
import { IRequest, IResponse } from "@interfaces/http/core";
import { GetRouter } from "nd5-mongodb-server/core";
import { IUser } from "@interfaces/collection/user";
import { IPostResponse } from "@interfaces/request/post";
import { ObjectId } from "mongodb";

const router = GetRouter();

router.get("/search", async (req: IRequest, res: IResponse) => {
  try {
    const name = req.query.name as any;
    const filter = [];
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
    let result = await userCollection.getAll(filter);
    res.ok(result);
  } catch (e) {
    res.error(e);
  }
});

router.get("/search", async (req: IRequest, res: IResponse) => {
  try {
    let result = await userCollection.getAll();
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
      return post;
    });
    userData.myProfile = session.userId.equals(new ObjectId(userData.data._id));
    if (!userData.myProfile) {
      userData.following = await userCollection.following({
        followerUserId: session.userId,
        followingUserId: userData.data._id,
      });
    }
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
    res.ok(user);
  } catch (e) {
    res.error(e);
  }
});

module.exports = router;
