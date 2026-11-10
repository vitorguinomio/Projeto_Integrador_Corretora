import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { styles } from '../styles';

export default function ClientesTab() {
  const [clientes, setClientes] = useState([]);
  const [termo, setTermo] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [historicoModal, setHistoricoModal] = useState(null);
  const [editando, setEditando] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Formulário
  const [nome, setNome] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [dataNasc, setDataNasc] = useState('');
  const [email, setEmail] = useState('');
  const [senhaAcesso, setSenhaAcesso] = useState('');
  // Endereço
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('DF');
  // Telefone
  const [ddd, setDdd] = useState('61');
  const [numTel, setNumTel] = useState('');
  const [tipoTel, setTipoTel] = useState('CELULAR');

  const carregarClientes = async (busca = '') => {
    try {
      setLoading(true);
      const url = busca ? `/clientes?busca=${encodeURIComponent(busca)}` : '/clientes';
      const data = await apiFetch(url);
      setClientes(data);
    } catch (err) {
      setFeedback({ tipo: 'erro', texto: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarClientes();
  }, []);

  const abrirNovo = () => {
    setEditando(null);
    setNome('');
    setCpfCnpj('');
    setDataNasc('1990-01-01');
    setEmail('');
    setSenhaAcesso('cliente123');
    setCep('70000-000');
    setLogradouro('Quadra 1');
    setNumero('10');
    setComplemento('');
    setBairro('Asa Sul');
    setCidade('Brasília');
    setEstado('DF');
    setDdd('61');
    setNumTel('98765-4321');
    setTipoTel('CELULAR');
    setModalAberto(true);
  };

  const abrirEdicao = (c) => {
    setEditando(c);
    setNome(c.nome);
    setCpfCnpj(c.cpfCnpj);
    setDataNasc(c.dataNasc || '');
    setEmail(c.email);
    setSenhaAcesso('');
    if (c.enderecos && c.enderecos.length > 0) {
      const e = c.enderecos[0];
      setCep(e.cep);
      setLogradouro(e.logradouro);
      setNumero(e.numero);
      setComplemento(e.complemento || '');
      setBairro(e.bairro);
      setCidade(e.cidade);
      setEstado(e.estado);
    }
    if (c.telefones && c.telefones.length > 0) {
      const t = c.telefones[0];
      setDdd(t.ddd);
      setNumTel(t.numero);
      setTipoTel(t.tipo);
    }
    setModalAberto(true);
  };

  const salvarCliente = async (e) => {
    e.preventDefault();
    setFeedback(null);
    const payload = {
      nome,
      cpfCnpj,
      dataNasc,
      email,
      senhaAcesso: senhaAcesso || undefined,
      enderecos: [{ cep, logradouro, numero, complemento, bairro, cidade, estado }],
      telefones: [{ ddd, numero: numTel, tipo: tipoTel }]
    };

    try {
      if (editando) {
        await apiFetch(`/clientes/${editando.id}`, { method: 'PUT', body: JSON.stringify(payload) });
        setFeedback({ tipo: 'sucesso', texto: 'Cliente atualizado com sucesso!' });
      } else {
        await apiFetch('/clientes', { method: 'POST', body: JSON.stringify(payload) });
        setFeedback({ tipo: 'sucesso', texto: 'Cliente cadastrado com sucesso!' });
      }
      setModalAberto(false);
      carregarClientes(termo);
    } catch (err) {
      setFeedback({ tipo: 'erro', texto: err.message });
    }
  };

  const excluirCliente = async (id, nomeCliente) => {
    if (!window.confirm(`Tem certeza que deseja excluir o cliente ${nomeCliente}?`)) return;
    try {
      await apiFetch(`/clientes/${id}`, { method: 'DELETE' });
      setFeedback({ tipo: 'sucesso', texto: `Cliente ${nomeCliente} excluído com sucesso.` });
      carregarClientes(termo);
    } catch (err) {
      setFeedback({ tipo: 'erro', texto: `Bloqueio de integridade (RF04/RF34): ${err.message}` });
    }
  };

  const verHistorico = async (id) => {
    try {
      setLoading(true);
      const data = await apiFetch(`/clientes/${id}/historico`);
      setHistoricoModal(data);
    } catch (err) {
      setFeedback({ tipo: 'erro', texto: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0 }}>Gestão de Clientes (RF01 - RF04, RF24)</h2>
        <button style={styles.button('success')} onClick={abrirNovo}>+ Novo Cliente</button>
      </div>

      {feedback && (
        <div style={{
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '16px',
          backgroundColor: feedback.tipo === 'erro' ? '#fee2e2' : '#dcfce7',
          color: feedback.tipo === 'erro' ? '#b91c1c' : '#15803d'
        }}>
          {feedback.texto}
        </div>
      )}

      <div style={{ ...styles.card, padding: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            style={styles.input}
            placeholder="Pesquisar por Nome, CPF/CNPJ ou E-mail (RF03, RF25)..."
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && carregarClientes(termo)}
          />
          <button style={styles.button('primary')} onClick={() => carregarClientes(termo)}>Buscar</button>
          <button style={styles.button('secondary')} onClick={() => { setTermo(''); carregarClientes(''); }}>Limpar</button>
        </div>
      </div>

      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Nome</th>
              <th style={styles.th}>CPF/CNPJ</th>
              <th style={styles.th}>E-mail</th>
              <th style={styles.th}>Data Nasc.</th>
              <th style={styles.th}>Endereço / Telefone</th>
              <th style={styles.th}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map(c => {
              const end = c.enderecos && c.enderecos[0] ? `${c.enderecos[0].cidade}-${c.enderecos[0].estado}` : '-';
              const tel = c.telefones && c.telefones[0] ? `(${c.telefones[0].ddd}) ${c.telefones[0].numero}` : '-';
              return (
                <tr key={c.id}>
                  <td style={styles.td}>#{c.id}</td>
                  <td style={{ ...styles.td, fontWeight: '600' }}>{c.nome}</td>
                  <td style={styles.td}>{c.cpfCnpj}</td>
                  <td style={styles.td}>{c.email}</td>
                  <td style={styles.td}>{c.dataNasc}</td>
                  <td style={styles.td}>{end} | {tel}</td>
                  <td style={styles.td}>
                    <button style={styles.button('primary')} onClick={() => verHistorico(c.id)}>Histórico</button>
                    <button style={styles.button('warning')} onClick={() => abrirEdicao(c)}>Editar</button>
                    <button style={styles.button('danger')} onClick={() => excluirCliente(c.id, c.nome)}>Excluir</button>
                  </td>
                </tr>
              );
            })}
            {clientes.length === 0 && !loading && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                  Nenhum cliente cadastrado ou encontrado na pesquisa.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Cadastro/Edição */}
      {modalAberto && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>{editando ? `Editar Cliente #${editando.id}` : 'Novo Cadastro de Cliente (RF01)'}</h3>
            <form onSubmit={salvarCliente}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Nome Completo *</label>
                  <input style={styles.input} required value={nome} onChange={(e) => setNome(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold' }}>CPF ou CNPJ *</label>
                  <input style={styles.input} required value={cpfCnpj} onChange={(e) => setCpfCnpj(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Data de Nascimento *</label>
                  <input type="date" style={styles.input} required value={dataNasc} onChange={(e) => setDataNasc(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold' }}>E-mail *</label>
                  <input type="email" style={styles.input} required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Senha de Acesso ao Portal (opcional)</label>
                <input type="password" style={styles.input} placeholder="Deixe em branco para manter" value={senhaAcesso} onChange={(e) => setSenhaAcesso(e.target.value)} />
              </div>

              <h4 style={{ margin: '16px 0 8px' }}>Endereço (Tabela endereco)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <input style={styles.input} placeholder="CEP" value={cep} onChange={(e) => setCep(e.target.value)} />
                <input style={styles.input} placeholder="Logradouro" value={logradouro} onChange={(e) => setLogradouro(e.target.value)} />
                <input style={styles.input} placeholder="Número" value={numero} onChange={(e) => setNumero(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                <input style={styles.input} placeholder="Complemento" value={complemento} onChange={(e) => setComplemento(e.target.value)} />
                <input style={styles.input} placeholder="Bairro" value={bairro} onChange={(e) => setBairro(e.target.value)} />
                <input style={styles.input} placeholder="Cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} />
                <input style={styles.input} placeholder="UF" maxLength="2" value={estado} onChange={(e) => setEstado(e.target.value.toUpperCase())} />
              </div>

              <h4 style={{ margin: '16px 0 8px' }}>Telefone (Tabela telefone)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                <input style={styles.input} placeholder="DDD" maxLength="2" value={ddd} onChange={(e) => setDdd(e.target.value)} />
                <input style={styles.input} placeholder="Número" value={numTel} onChange={(e) => setNumTel(e.target.value)} />
                <select style={styles.input} value={tipoTel} onChange={(e) => setTipoTel(e.target.value)}>
                  <option value="CELULAR">CELULAR</option>
                  <option value="FIXO">FIXO</option>
                  <option value="COMERCIAL">COMERCIAL</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" style={styles.button('secondary')} onClick={() => setModalAberto(false)}>Cancelar</button>
                <button type="submit" style={styles.button('success')}>Salvar Cliente</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Histórico do Cliente */}
      {historicoModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>Histórico Completo do Segurado (RF24 / EU18)</h3>
            <p style={{ margin: '4px 0 16px', color: '#475569' }}>
              <strong>Cliente:</strong> {historicoModal.cliente.nome} | <strong>CPF:</strong> {historicoModal.cliente.cpfCnpj}
            </p>

            <h4>Apólices Vinculadas ({historicoModal.apolices.length})</h4>
            {historicoModal.apolices.length === 0 ? <p style={{ fontSize: '13px', color: '#64748b' }}>Nenhuma apólice contratada.</p> : (
              <table style={{ ...styles.table, marginBottom: '16px' }}>
                <thead>
                  <tr>
                    <th style={styles.th}>Número</th>
                    <th style={styles.th}>Seguro</th>
                    <th style={styles.th}>Vigência</th>
                    <th style={styles.th}>Situação</th>
                    <th style={styles.th}>Prêmio</th>
                  </tr>
                </thead>
                <tbody>
                  {historicoModal.apolices.map(a => (
                    <tr key={a.id}>
                      <td style={styles.td}>{a.numeroApolice}</td>
                      <td style={styles.td}>{a.seguroNome}</td>
                      <td style={styles.td}>{a.dataInicio} até {a.dataTermino}</td>
                      <td style={styles.td}><span style={styles.badge(a.situacao)}>{a.situacao}</span></td>
                      <td style={styles.td}>R$ {a.valorPremio?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <h4>Cotações Realizadas ({historicoModal.cotacoes.length})</h4>
            {historicoModal.cotacoes.length === 0 ? <p style={{ fontSize: '13px', color: '#64748b' }}>Nenhuma cotação registrada.</p> : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Seguro</th>
                    <th style={styles.th}>Corretor</th>
                    <th style={styles.th}>Situação</th>
                    <th style={styles.th}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {historicoModal.cotacoes.map(c => (
                    <tr key={c.id}>
                      <td style={styles.td}>#{c.id}</td>
                      <td style={styles.td}>{c.seguroNome}</td>
                      <td style={styles.td}>{c.corretorNome}</td>
                      <td style={styles.td}><span style={styles.badge(c.situacao)}>{c.situacao}</span></td>
                      <td style={styles.td}>R$ {c.valor?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button style={styles.button('primary')} onClick={() => setHistoricoModal(null)}>Fechar Histórico</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
