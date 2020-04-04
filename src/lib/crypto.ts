const md5 = require("md5");

export function encrypt(text: string) {
  return md5(text);
}
