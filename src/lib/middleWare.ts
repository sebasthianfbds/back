import { getSession } from "./session";
import { IResponse, IRequest } from "@interfaces/http/core";

const whiteListPaths = {
  "/auth": "POST",
  "/auth/loggedIn": "GET",
  "/auth/exit": "POST",
  "/user": "POST",
  "/notification/sendNotification": "POST",
};

export function middleWare(req: IRequest, res: IResponse, next: () => void) {
  res.ok = (data?: any) => {
    if (data) return res.status(200).json(data);
    return res.status(200).json();
  };
  res.unauthorized = (e: any) => {
    return res.status(401).json(createErrorMessage(e || "Não autorizado."));
  };
  res.error = (e: any) => {
    return res.status(500).json(createErrorMessage(e));
  };
  res.badRequest = (e: any) => {
    return res.status(400).json(createErrorMessage(e));
  };

  const pathRequest = req.originalUrl;
  const method = req.method;
  const pathMethod = whiteListPaths[pathRequest];
  const passThrout = pathMethod && pathMethod === method;

  if (passThrout) return next();

  const message = "Token inválido.";
  const token = req.headers["app-token"];
  if (!token) return res.unauthorized(message);
  try {
    const session = getSession(token);
    if (!session) return res.unauthorized(message);
    req.session = session;

    return next();
  } catch {
    return res.unauthorized(message);
  }
}

function createErrorMessage(e) {
  return {
    message: typeof e === "string" ? e : e.message ? e.message : e.error,
  };
}
