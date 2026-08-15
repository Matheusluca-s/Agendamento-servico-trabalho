export type ServicoDoDia = {
  id: string;
  local: string;
  horario: string;
  tipoServico: string;
  status: string;
  data: Date;
  responsavel: { nome: string };
};
