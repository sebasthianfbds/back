export interface IUser {
  _id?: any;
  name?: string;
  email?: string;
  password?: string;
  imageUrl?: string;
  notificationSubscription?: any;
  following?: any[];
  type?: string;
  details?: string;
  pdf?: string;
  instituicao: string;
  interesses: string[];
}

export enum userType {
  pesquisador = "PESQUISADOR",
  aluno = "ALUNO",
  adm = "ADM",
}
