import { IRequest, IResponse } from "@interfaces/http/core";

type Constructable<T> = new () => T;

export class Validator {
  execute(data: any) {}
}

export const middlewareValidator = (req: IRequest, res: IResponse, next) => <
  T extends Validator
>(
  validatorClass: Constructable<T>
) => {
  const validator = new validatorClass();
  try {
    validator.execute(req.body);
    return next();
  } catch (e) {
    return res.badRequest(e);
  }
};
