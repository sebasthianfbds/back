import { Validator, middlewareValidator } from "./core";

class Route1 extends Validator {
  execute(data: any) {
    console.log("Route1", data);
  }
}

export const validator1 = (req, res, next) => {
  middlewareValidator(req, res, next)(Route1);
};
