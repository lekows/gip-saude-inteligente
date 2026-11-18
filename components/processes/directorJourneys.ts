type Stage = {
  activity: string;
  label: string;
  role: string;
  attention?: string;
  improvement?: string;
};

type Journey = {
  id: string;
  label: string;
  description: string;
  stages: Stage[];
};

export const journeys: Journey[] = [
  {
    id: "contato",
    label: "Entrada e comunicação",
    description: "Pontos de contato entre a UBS, a regulação e o hospital durante o encaminhamento e o retorno.",
    stages: [
      { activity: "M03.A01", label: "Receber encaminhamento", role: "UBS e regulação" },
      { activity: "M02.A01", label: "Conferir contato", role: "Cadastro", attention: "O telefone do cadastro permite falar com o paciente?", improvement: "Conferir o contato na UBS e verificar se o número atualizado aparece no ponto que faz a convocação." },
      { activity: "M01.A01", label: "Contatar e orientar", role: "Equipe que agenda" },
      { activity: "M08.A02", label: "Acolher na chegada", role: "Recepção" },
      { activity: "M03.A03", label: "Solicitar retorno", role: "Regulação do hospital" },
    ],
  },
  {
    id: "cirurgias",
    label: "Marcação cirúrgica",
    description: "Do encaminhamento à baixa, com conferência do registro e do preparo antes da programação.",
    stages: [
      { activity: "M04.A02", label: "Indicar e incluir na fila", role: "Consultório e Secretaria" },
      { activity: "M04.A03", label: "Conferir registro", role: "Regulação e marcação", attention: "O pedido aparece para quem vai agendar?", improvement: "Registrar a pendência, definir quem a resolve na origem e confirmar a visibilidade antes de avançar." },
      { activity: "M04.A04", label: "Conferir exames e preparo", role: "Marcação cirúrgica" },
      { activity: "M04.A05", label: "Programar e avisar", role: "Marcação cirúrgica" },
      { activity: "M04.A06", label: "Conciliar desfecho", role: "Hospital e Secretaria" },
    ],
  },
  {
    id: "arquivo",
    label: "Prontuários e arquivo",
    description: "Da chegada do documento à guarda e à recuperação quando alguém autorizado pede o prontuário.",
    stages: [
      { activity: "M05.A01", label: "Receber prontuário", role: "Atendimento e arquivo" },
      { activity: "M05.A02", label: "Capturar e anexar", role: "Equipe responsável pelo registro" },
      { activity: "M05.A03", label: "Organizar e guardar", role: "Arquivo" },
      { activity: "M05.A04", label: "Localizar e recuperar", role: "Arquivo", attention: "Outra pessoa autorizada consegue localizar o registro?", improvement: "Experimentar um índice físico e digital com controle de retirada e devolução." },
    ],
  },
  {
    id: "assistencia",
    label: "Passagens assistenciais",
    description: "Pontos de passagem do centro cirúrgico e da clínica médica para confirmar com as equipes de cada área.",
    stages: [
      { activity: "M06.A01", label: "Receber no centro cirúrgico", role: "Centro cirúrgico" },
      { activity: "M06.A02", label: "Registrar destino pós-cirurgia", role: "Centro cirúrgico", attention: "Quem registra e recebe a passagem após a cirurgia?" },
      { activity: "M07.A01", label: "Registrar admissão clínica", role: "Clínica médica" },
      { activity: "M07.A02", label: "Registrar alta ou transferência", role: "Clínica médica" },
    ],
  },
];

export const opportunities = [
  { journey: "contato", title: "Atualizar e testar o contato", summary: "Começar com uma UBS e a marcação. Testar se o telefone corrigido chega a quem convoca.", label: "Piloto de 30 dias" },
  { journey: "cirurgias", title: "Dar destino ao pedido pendente", summary: "Registrar onde o pedido parou e quem deve confirmar sua inclusão antes da programação.", label: "Acordo com a Secretaria" },
  { journey: "arquivo", title: "Localizar o prontuário com rastreio", summary: "Testar um índice de guarda com controle de retirada, devolução e acesso.", label: "Teste no arquivo" },
];
