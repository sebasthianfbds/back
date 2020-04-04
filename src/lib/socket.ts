var serverSocket: SocketIO.Server;
var listenComments: { socketClient: SocketIO.Socket; post_id: string }[] = [];
var listenPosts: { socketClient: SocketIO.Socket; sessionId?: string }[] = [];

export function socketServer(io: SocketIO.Server) {
  serverSocket = Object.assign({}, io);
  io.on("connection", client => {
    listenPosts.push({ socketClient: client });
    client.on("on_send_session_id", data => {
      const idx = listenPosts.findIndex(item => item.socketClient === client);
      listenPosts[idx].sessionId = data;
    });
    client.on("on_post_id", data => {
      listenComments.push({
        socketClient: client,
        post_id: data
      });
    });

    client.on("disconnect", () => {
      listenComments = listenComments.filter(
        item => item.socketClient !== client
      );
      listenPosts = listenPosts.filter(item => item.socketClient !== client);
    });
  });
}

export function ioEmit(event: string, filter: any, data: any) {
  if (serverSocket) {
    if (event === "on_new_comment") {
      listenComments
        .filter(
          item =>
            item.post_id === filter &&
            item.socketClient &&
            item.socketClient.connected
        )
        .map(item => item.socketClient.emit(event, data));
    } else if (event === "on_new_post") {
      listenPosts
        .filter(item => item.sessionId && item.sessionId !== filter)
        .map(item => item.socketClient.emit(event, data));
    }
  }
}
