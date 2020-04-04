import { saveUserPushSubscription, getAll } from "@collections/users/users";
import { webPushNotify } from "@lib/webPushNotification";
import { IRequest, IResponse } from "@interfaces/http/core";
import { GetRouter } from "nd5-mongodb-server/core";

const router = GetRouter();

router.post("/subscription", async (req: IRequest, res: IResponse) => {
  try {
    const subscription = req.body;
    const session = req.session;
    await saveUserPushSubscription({
      _id: session.userId,
      subscription
    });
    res.ok();
  } catch (e) {
    res.error(e);
  }
});

router.post("/sendNotification", async (req: IRequest, res: IResponse) => {
  const body = req.body as { title?: string; message: string; icon?: string };

  (await getAll()).map(user => {
    if (user.notificationSubscription) {
      webPushNotify(user.notificationSubscription, {
        title: body.title,
        message: body.message,
        icon: body.icon
      });
    }
  });
  res.ok(200);
});

module.exports = router;
