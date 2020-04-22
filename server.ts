import "module-alias/register";
import "@lib/webPushNotification";
import { join } from "path";
import { StartServer } from "nd5-mongodb-server";
import { environment } from "@env/environment.prod";
import { middleWare } from "@lib/middleWare";
import { socketServer } from "@lib/socket";

const dbs = [{ name: "test", collections: ["cars", "posts", "users"] }];

StartServer({
  middleWare,
  socketServer,
  controllersPath: join(__dirname, "src", "controllers"),
  mongoDB: {
    url: environment.mongodb,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbs,
  },
});

// heroku logs --tail --app nederapp
