// Permissões por perfil no frontend.
// Espelham as regras do backend (core/security/SecurityConfig.java): aqui elas só
// escondem o que o perfil não pode usar — quem garante o bloqueio é a API.

// Telas (abas do menu) liberadas para cada perfil
const TELAS_POR_PERFIL = {
  admin: ['painel', 'clientes', 'apolices', 'premios', 'cotacoes', 'alertas', 'seguros', 'corretores', 'usuarios', 'relatorios', 'auditoria'],
  corretor: ['painel', 'clientes', 'apolices', 'premios', 'cotacoes', 'alertas', 'seguros'],
  cliente: ['painel', 'apolices', 'cotacoes', 'alertas', 'seguros']
};

// Ações dentro das telas
const ACOES_POR_PERFIL = {
  gerenciarClientes: ['admin', 'corretor'], // cadastrar, excluir, ver lista de clientes
  gerenciarApolices: ['admin', 'corretor'], // contratar, renovar, cancelar, baixar parcela
  elaborarProposta: ['admin', 'corretor'],
  responderProposta: ['admin', 'cliente'], // aceitar / recusar
  gerenciarSeguros: ['admin'], // novo seguro, nova cobertura
  gerenciarCorretores: ['admin'],
  verIndicadoresGerais: ['admin', 'corretor'] // totais da corretora (/dashboard)
};

export const podeVerTela = (role, tela) => (TELAS_POR_PERFIL[role] || []).includes(tela);

export const pode = (role, acao) => (ACOES_POR_PERFIL[acao] || []).includes(role);

export const ROTULO_PERFIL = {
  admin: 'Administrador',
  corretor: 'Corretor',
  cliente: 'Cliente'
};
