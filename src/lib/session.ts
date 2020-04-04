import { ISession } from "@interfaces/http/core";
import { ObjectId } from "mongodb";

export var SESSIONS: ISession[] = [
  { sessionId: "MASTER", userId: new ObjectId("5e78205ad56e3c3297c6eff4") }
];

export function getSession(sessionId: any) {
  //console.log(SESSIONS);
  const session = SESSIONS.find(s => s.sessionId === sessionId);
  return session;
}

export function destroySessionId(sessionId: any) {
  const session = SESSIONS.find(s => s.sessionId === sessionId);
  destroySession(session);
}

export function destroySession(session: any) {
  SESSIONS = SESSIONS.filter(s => s !== session);
}
export function createSession(userId?: any) {
  // const curSession = SESSIONS.find(s => s.userId.equals(userId));
  // if (curSession) destroySession(curSession);
  let guid = generateUUID();
  let session = {
    userId: userId,
    sessionId: guid
  };

  SESSIONS.push(session);
  return guid;
}
function generateUUID() {
  // Public Domain/MIT
  var d = new Date().getTime(); //Timestamp
  var d2 = (new Date().getTime() * 10000) / 5;
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    var r = Math.random() * 16; //random number between 0 and 16
    if (d > 0) {
      //Use timestamp until depleted
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else {
      //Use microseconds since page-load if supported
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
