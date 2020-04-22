import { ISession } from "@interfaces/http/core";
import { getSession } from "@lib/session";

var serverSocket: SocketIO.Server;
var listenComments: { socketClient: SocketIO.Socket; post_id: string }[] = [];
var listenPosts: { socketClient: SocketIO.Socket; session?: ISession }[] = [];

export function socketServer(io: SocketIO.Server) {
  serverSocket = Object.assign({}, io);
  io.on("connection", (client) => {
    listenPosts.push({ socketClient: client });

    // conectando socket feed
    client.on("on_send_session_id", (data) => {
      // console.log("sending session id", data);
      const idx = listenPosts.findIndex((item) => item.socketClient === client);
      listenPosts[idx].session = getSession(data);
    });

    // conectando socket mensagem
    client.on("on_post_id", (data) => {
      listenComments.push({
        socketClient: client,
        post_id: data,
      });
    });

    client.on("disconnect", () => {
      const idx1 = listenComments.findIndex(
        (item) => item.socketClient === client
      );
      listenComments.splice(idx1, 1);

      const idx2 = listenPosts.findIndex(
        (item) => item.socketClient === client
      );
      listenPosts.splice(idx2, 1);
    });
  });
}

export function ioEmit(event: string, filter: any, data: any) {
  if (serverSocket) {
    if (event === "on_new_comment") {
      listenComments
        .filter(
          (item) =>
            item.post_id === filter &&
            item.socketClient &&
            item.socketClient.connected
        )
        .map((item) => item.socketClient.emit(event, data));
    } else if (event === "on_new_post") {
      //console.log("listen count ", listenPosts.length);
      const result = listenPosts.find(
        (item) => item.session && item.session.userId.equals(filter.userId)
      );
      if (result) result.socketClient.emit(event, data);
    }
  }
}
