import { ObjectId } from "mongodb";

export interface IRequestUpdateUser {
  _id: ObjectId;
  name: string;
  email: string;
  password?: string;
  imageUrl: string;
  details?: string;
}

export interface IRequestSubscriptionUser {
  _id: ObjectId;
  subscription: any;
}

export interface IRegisterRequest {
  name: string;
  email: string;
  password: string;
  type: string;
  instituicao: string;
  interesses: string[];
  data: string;
  cpf: string;
  pais: string;
  estado: string;
  grau_escolaridade: string;
  link_curriculo: string;
  datai: string;
}
