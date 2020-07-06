import * as userColletion from "@collections/users/users";
import * as postCollection from "@collections/posts/posts";
import { IRequest, IResponse } from "@interfaces/http/core";
import { GetRouter } from "nd5-mongodb-server/core";
import { ObjectID, ObjectId } from "mongodb";
import * as p from "fs";

const router = GetRouter();

router.get("/", async (req: IRequest, res: IResponse) => {
  try {
    const categories = await userColletion.getAllUsers([
      {
        $project: {
          interesses: { $ifNull: ["$interesses", ["Nenhum interesse"]] },
        },
      },
      { $unwind: "$interesses" },
      { $sortByCount: "$interesses" },
      {
        $project: {
          name: "$_id",
          userCount: "$count",
        },
      },
    ]);

    var posts = [];

    const _posts = await postCollection.getAllPosts([
      {
        $project: {
          _id: true,
          userId: true,
          likesCount: {
            $cond: {
              if: { $isArray: "$likes" },
              then: { $size: "$likes" },
              else: 0,
            },
          },
        },
      },
      {
        $set: {
          liked: {
            $cond: {
              if: { $in: [req.session.userId, { $ifNull: ["$likes", []] }] },
              then: true,
              else: false,
            },
          },
        },
      },
      { $limit: 10 },
      { $sort: { likesCount: -1 } },
    ]);

    var posts = [];

    for (let post of _posts) {
      let result = (
        await postCollection.getPosts({
          userId: post.user_id,
          filter: [
            {
              $match: {
                _id: post._id,
              },
            },
          ],
        })
      ).map((post) => {
        post.canEdit = new ObjectId(post.user._id).equals(req.session.userId);
        var files = [];
        const path =
          "./uploads/posts/" +
          req.session.userId.toHexString() +
          "/" +
          post._id;

        if (p.existsSync(path)) {
          files = p.readdirSync(path);
        }
        post.pdf = files.length > 0 ? files[0] : "";
        return post;
      });

      if (result.length > 0) posts.push(result[0]);
    }

    res.ok({ categories, posts });
  } catch (e) {
    res.error(e);
  }
});

module.exports = router;
