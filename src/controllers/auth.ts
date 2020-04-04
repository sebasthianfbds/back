import { getUser } from "@collections/users/users";
import { encrypt } from "@lib/crypto";
import {
  destroySession,
  destroySessionId,
  getSession,
  createSession
} from "@lib/session";
import { ILoginRequest } from "@interfaces/request/auth";
import { IRequest, IResponse } from "@interfaces/http/core";
import { GetRouter } from "nd5-mongodb-server/core";

const router = GetRouter();

router.post("/exit", async (req: IRequest, res: IResponse) => {
  try {
    destroySession(req.session);
    res.ok();
  } catch (e) {
    destroySession(req.session);
    res.unauthorized(e);
  }
});

router.post("/", async (req: IRequest, res: IResponse) => {
  try {
    let data = req.body as ILoginRequest;
    let user = await getUser([
      {
        $match: {
          email: { $in: [data.email] },
          password: { $in: [encrypt(data.password)] }
        }
      }
    ]);

    if (!user) return res.badRequest("Usuário e senha inválidos.");
    const sessionId = createSession(user._id);
    res.ok(sessionId);
  } catch (e) {
    destroySession(req.session);
    res.unauthorized(e);
  }
});

router.get("/loggedIn", async (req: IRequest, res: IResponse) => {
  const token = req.headers["app-token"];
  try {
    const session = getSession(token);
    if (session) res.ok(true);
    else res.ok(false);
  } catch (e) {
    destroySessionId(token);
    res.unauthorized(e);
  }
});

router.delete("/", async (req: IRequest, res: IResponse) => {
  try {
    destroySession(req.session);
    res.ok();
  } catch (e) {
    destroySession(req.session);
    res.unauthorized(e);
  }
});

module.exports = router;
