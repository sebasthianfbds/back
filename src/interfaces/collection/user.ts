export interface IUser {
  _id?: any;
  name?: string;
  email?: string;
  password?: string;
  imageUrl?: string;
  notificationSubscription?: any;
  following?: any[];
  followers?: any[];
  type?: string;
  details?: string;
  pdf?: string;
  instituicao: string;
  interesses: string[];
  data?: string;
  cpf: string;
  pais: string;
  estado: string;
  grau_escolaridade: string;
  link_curriculo: string;
  datai: string;
}

export enum userType {
  pesquisador = "PESQUISADOR",
  aluno = "ALUNO",
  adm = "ADM",
}
