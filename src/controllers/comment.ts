import * as postCollection from "@collections/posts/posts";
import { IPostCommentRequest } from "@interfaces/request/post";
import { IRequest, IResponse } from "@interfaces/http/core";
import { GetRouter } from "nd5-mongodb-server/core";

const router = GetRouter();

router.get("/", async (req: IRequest, res: IResponse) => {
  try {
    let post_id = req.query.post_id;
    let result = await postCollection.getPostComments(post_id);
    res.ok(result);
  } catch (e) {
    res.error(e);
  }
});

router.post("/", async (req: IRequest, res: IResponse) => {
  try {
    const session = req.session;
    const post = req.body as IPostCommentRequest;
    post.user_id = session.userId;
    await postCollection.comment(post);
    res.ok();
  } catch (e) {
    res.error(e);
  }
});
module.exports = router;
