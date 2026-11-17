// Camada de mapeamento entre os DTOs da API (backend Java) e o modelo usado pelas telas.
// Os nomes dos campos e os códigos de situação seguem exatamente os records do backend
// (ApoliceResponse, SeguroResponse, CotacaoResponse, etc.). Qualquer adaptação para exibição
// fica concentrada aqui, evitando que cada tela "adivinhe" o formato dos dados.
// Códigos de situação/status do backend -> rótulos exibidos (StatusBadge)
const SITUACAO_LABEL = {
  ATIVA: 'Ativa',
  VENCIDA: 'Vencida',
  EM_RENOVACAO: 'Em renovação',
  CANCELADA: 'Cancelada',
  SOLICITADA: 'Solicitada',
  EM_ANALISE: 'Em análise',
  APROVADA: 'Aprovada',
  PROPOSTA_GERADA: 'Proposta gerada',
  RECUSADA: 'Recusada',
  PENDENTE: 'Pendente',
  ACEITA: 'Aceita',
  PAGO: 'Paga',
  ATRASADO: 'Atrasada',
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
  FERIAS: 'Férias',
  LIDA: 'Lida'
};
export const labelSituacao = (codigo) => {
  if (!codigo) return '';
  return SITUACAO_LABEL[String(codigo).toUpperCase()] || codigo;
};
// Rótulo de exibição -> código esperado pelo backend
export const codigoSituacao = (label) => {
  if (!label) return label;
  const entry = Object.entries(SITUACAO_LABEL).find(([, l]) => l === label);
  return entry ? entry[0] : String(label).toUpperCase();
};

const isPessoaJuridica = (cpfCnpj = '') => cpfCnpj.replace(/\D/g, '').length > 11;
// ---------- Apólices e parcelas ----------
export const mapParcela = (p, index = 0) => ({
  ...p,
  numeroParcela: index + 1,
  situacao: labelSituacao(p.status)
});
export const mapApolice = (a) => {
  if (!a) return a;
  const parcelas = [...(a.parcelas || [])].sort(
    (x, y) => new Date(x.dataVencimento) - new Date(y.dataVencimento)
  );
  return {
    ...a,
    premio: Number(a.valorPremio) || 0,
    situacaoCodigo: a.situacao,
    situacao: labelSituacao(a.situacao),
    parcelas: parcelas.map(mapParcela)
  };
};
export const mapParcelas = (lista = []) =>
  [...lista]
    .sort((x, y) => new Date(x.dataVencimento) - new Date(y.dataVencimento))
    .map(mapParcela);
// ---------- Seguros e coberturas ----------
export const mapCobertura = (c) => ({
  ...c,
  nome: c.descricao,
  valorLimite: c.valor != null ? Number(c.valor) : null
});
export const mapSeguro = (s) => ({
  ...s,
  premioBase: Number(s.valorBase) || 0,
  percentualComissao: Number(s.percentualComissao) || 0,
  coberturas: (s.coberturas || []).map(mapCobertura)
});
// ---------- Cotações e propostas ----------
export const mapProposta = (p) => ({
  ...p,
  premio: Number(p.valorCotacao) || 0,
  situacao: labelSituacao(p.situacao)
});
export const mapCotacao = (c, propostas = []) => ({
  ...c,
  dataCotacao: c.dataSolicitacao ? c.dataSolicitacao.replace('T', ' ').substring(0, 16) : '',
  valor: Number(c.valor) || 0,
  situacao: labelSituacao(c.situacao),
  propostas: propostas.filter((p) => p.cotacaoId === c.id).map(mapProposta)
});
// ---------- Clientes ----------
export const mapCliente = (c, apolices = []) => {
  const doCliente = apolices.filter((a) => a.clienteId === c.id);
  const ultima = doCliente[doCliente.length - 1];
  return {
    ...c,
    tipo: isPessoaJuridica(c.cpfCnpj) ? 'PJ' : 'PF',
    totalApolices: doCliente.length,
    // Corretor responsável cadastrado no cliente; sem ele, o da apólice mais recente
    corretorId: c.corretorId ?? ultima?.corretorId ?? null,
    corretorNome: c.corretorNome ?? ultima?.corretorNome ?? null,
    telefones: (c.telefones || []).map((t) => ({
      ...t,
      numero: t.ddd ? `(${t.ddd}) ${t.numero}` : t.numero
    })),
    enderecos: (c.enderecos || []).map((e) => ({ ...e, uf: e.estado }))
  };
};
// ClienteHistoricoResponse { cliente, cotacoes, apolices } -> objeto único para o modal
export const mapClienteHistorico = (h) => {
  const apolices = (h.apolices || []).map(mapApolice);
  return {
    ...mapCliente(h.cliente, apolices),
    apolices,
    cotacoes: (h.cotacoes || []).map((c) => mapCotacao(c))
  };
};
// Telefone digitado "(61) 99888-7766" -> TelefoneDto { ddd, numero, tipo }
export const toTelefoneDto = (texto, tipo = 'CELULAR') => {
  const digitos = (texto || '').replace(/\D/g, '');
  if (digitos.length < 10) return null;
  const ddd = digitos.substring(0, 2);
  const resto = digitos.substring(2);
  const numero = resto.length === 9 ? `${resto.substring(0, 5)}-${resto.substring(5)}` : `${resto.substring(0, 4)}-${resto.substring(4)}`;
  return { ddd, numero, tipo };
};
// ---------- Corretores ----------
export const mapCorretor = (c, apolices = []) => {
  const doCorretor = apolices.filter((a) => a.corretorId === c.id);
  const ativas = doCorretor.filter((a) => a.situacaoCodigo === 'ATIVA' || a.situacao === 'Ativa');
  return {
    ...c,
    registroSusep: c.dadosProfissionais,
    status: labelSituacao(c.status),
    totalApolices: ativas.length,
    totalClientes: new Set(doCorretor.map((a) => a.clienteId)).size
  };
};
// ---------- Usuários ----------
export const mapUsuario = (u) => ({
  ...u,
  email: u.loginEmail,
  nome: u.loginEmail ? u.loginEmail.split('@')[0] : '',
  perfil: u.perfilAcesso,
  ativo: String(u.status).toUpperCase() === 'ATIVO'
});
// ---------- Alertas / notificações ----------
export const mapAlerta = (a) => {
  const assunto = a.assunto || '';
  const ponto = assunto.indexOf('.');
  return {
    ...a,
    titulo: ponto > 0 ? assunto.substring(0, ponto) : assunto,
    mensagem: assunto,
    lido: String(a.status).toUpperCase() === 'LIDA',
    tipo: /venc/i.test(assunto) ? 'VENCIMENTO' : 'INFO'
  };
};
// ---------- Datas ----------
// Data no fuso do navegador no formato AAAA-MM-DD (toISOString usa UTC e, à noite
// no horário de Brasília, já devolveria o dia seguinte)
export const dataLocalISO = (data = new Date()) => {
  const d = new Date(data);
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
};

// "2026-11-16" -> "16/11/2026" (sem passar por Date, para não sofrer com fuso horário)
export const formatarData = (iso) => {
  if (!iso) return '';
  const [ano, mes, dia] = String(iso).substring(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
};

// ---------- Login ----------
// LoginResponse { token, tipo, userId, email, perfilAcesso, nome, status }
export const roleFromPerfil = (perfil) =>
  perfil === 'ADMINISTRADOR' ? 'admin' : perfil === 'CORRETOR' ? 'corretor' : 'cliente';
// GET /auth/me { id, email, perfilAcesso, status, nome, clienteId?, corretorId?, administradorId? }
export const mapUsuarioLogado = (me) => ({
  id: me.id,
  nome: me.nome,
  email: me.email,
  perfil: me.perfilAcesso,
  perfilAcesso: me.perfilAcesso,
  role: roleFromPerfil(me.perfilAcesso),
  clienteId: me.clienteId ?? null,
  corretorId: me.corretorId ?? null
});

export const mapLogin = (data) => ({
  id: data.userId,
  nome: data.nome,
  email: data.email,
  perfil: data.perfilAcesso,
  perfilAcesso: data.perfilAcesso,
  role: roleFromPerfil(data.perfilAcesso)
});
