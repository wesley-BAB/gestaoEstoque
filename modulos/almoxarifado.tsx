import React, { useState, useEffect } from 'react';
import { Package, Box, ArrowRightLeft, LayoutDashboard, ArrowDownCircle, ArrowUpCircle, UserCircle, FileText, Truck, Filter, Search, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { supabase } from '../supabase';
import { Card, SimpleForm, SearchableSelect } from '../ui';
import { AlmoxarifadoView } from '../types';

const DashboardAlmoxarifado = () => {
  const [stats, setStats] = useState({ totalProdutos: 0, totalEstoque: 0, saidasRecentes: [] as any[] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    const { data: produtos } = await supabase.from('produtos').select('quantidade_atual');
    const totalProd = produtos?.length || 0;
    const totalEst = produtos?.reduce((acc, curr) => acc + (curr.quantidade_atual || 0), 0) || 0;

    const { data: saidas } = await supabase
      .from('saidas')
      .select('id, quantidade, data_saida, produtos (descricao), funcionarios (nome)')
      .order('data_saida', { ascending: false })
      .limit(5);

    setStats({
      totalProdutos: totalProd,
      totalEstoque: totalEst,
      saidasRecentes: saidas || []
    });
    setLoading(false);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando dashboard...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Visão Geral do Almoxarifado</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card title="Produtos Cadastrados" value={stats.totalProdutos} icon={Package} colorClass="bg-blue-500" />
        <Card title="Itens em Estoque" value={stats.totalEstoque} icon={Box} colorClass="bg-emerald-500" />
        <Card title="Saídas Recentes" value={stats.saidasRecentes.length} icon={ArrowRightLeft} colorClass="bg-amber-500" />
      </div>
      <div className="table-container">
        <div className="p-5 border-b border-gray-100 bg-gray-50">
          <h3 className="font-semibold text-gray-800">Últimas Saídas para Funcionários</h3>
        </div>
        <table className="data-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Qtd</th>
                <th>Funcionário</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {stats.saidasRecentes.map((saida) => (
                <tr key={saida.id}>
                  <td className="font-medium text-gray-800">{saida.produtos?.descricao || 'Produto Removido'}</td>
                  <td className="text-red-600 font-medium">-{saida.quantidade}</td>
                  <td>{saida.funcionarios?.nome || 'Func. Removido'}</td>
                  <td>{new Date(saida.data_saida).toLocaleString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>
    </div>
  );
};

export const AlmoxarifadoModule = () => {
    const [view, setView] = useState<AlmoxarifadoView>('dashboard');
    const [showModal, setShowModal] = useState(false);
    const [listData, setListData] = useState<any[]>([]);
    const [auxData, setAuxData] = useState<any>({}); 
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedReportId, setSelectedReportId] = useState('');
  
    useEffect(() => { setSearchTerm(''); setSelectedReportId(''); setListData([]); loadData(); }, [view]);
  
    const loadData = async () => {
      let data: any[] = [];
      if (view === 'produtos') {
        const res = await supabase.from('produtos').select('*').order('descricao');
        if (res.data) data = res.data;
      } else if (view === 'fornecedores') {
        const res = await supabase.from('fornecedores').select('*').order('nome');
        if (res.data) data = res.data;
      } else if (view === 'entradas') {
        const res = await supabase.from('entradas').select('*, produtos(descricao), fornecedores(nome)').order('data_entrada', { ascending: false });
        if (res.data) data = res.data;
        const prod = await supabase.from('produtos').select('*');
        const forn = await supabase.from('fornecedores').select('*');
        setAuxData({ produtos: prod.data, fornecedores: forn.data });
      } else if (view === 'saidas') {
        const res = await supabase.from('saidas').select('*, produtos(descricao), funcionarios(nome)').order('data_saida', { ascending: false });
        if (res.data) data = res.data;
        const prod = await supabase.from('produtos').select('*');
        const func = await supabase.from('funcionarios').select('*');
        setAuxData({ produtos: prod.data, funcionarios: func.data });
      } else if (view === 'relatorio_funcionario') {
        const res = await supabase.from('funcionarios').select('*').order('nome');
        if (res.data) setAuxData({ funcionarios: res.data });
      } else if (view === 'relatorio_material') {
        const res = await supabase.from('produtos').select('*').order('descricao');
        if (res.data) setAuxData({ produtos: res.data });
      }
      setListData(data);
    };

    const handleRunReport = async () => {
        if (!selectedReportId) { toast.warn('Selecione um item para gerar o relatório.'); return; }
        let data: any[] = [];
        if (view === 'relatorio_funcionario') {
            const res = await supabase.from('saidas').select('*, produtos(descricao), funcionarios(nome)').eq('funcionario_id', selectedReportId).order('data_saida', { ascending: false });
            if (res.data) data = res.data.map(item => ({ data_saida: item.data_saida, produto: item.produtos?.descricao, quantidade: item.quantidade }));
        } else if (view === 'relatorio_material') {
            const res = await supabase.from('saidas').select('*, funcionarios(nome), produtos(descricao)').eq('produto_id', selectedReportId).order('data_saida', { ascending: false });
             if (res.data) data = res.data.map(item => ({ data_saida: item.data_saida, funcionario: item.funcionarios?.nome, quantidade: item.quantidade }));
        }
        setListData(data);
        if (data.length === 0) toast.info('Nenhum registro encontrado para a seleção.');
    };
  
    const handleSave = async (data: any) => {
      let table = ''; let payload = { ...data };
      switch(view) { case 'produtos': table = 'produtos'; break; case 'fornecedores': table = 'fornecedores'; break; case 'entradas': table = 'entradas'; break; case 'saidas': table = 'saidas'; break; }
      if (!table) return;
      if (view === 'saidas') {
        try {
          const { data: produtoData, error: prodError } = await supabase.from('produtos').select('quantidade_atual, descricao').eq('cod_produto', payload.produto_id).single();
          if (prodError || !produtoData) { toast.error('Produto não encontrado!'); return; }
          if (Number(produtoData.quantidade_atual) < Number(payload.quantidade)) { toast.error(`Estoque insuficiente! Disponível: ${produtoData.quantidade_atual} | Solicitado: ${payload.quantidade}`); return; }
        } catch (err) { toast.error('Erro ao verificar estoque.'); return; }
      }
      const { error } = await supabase.from(table).insert(payload);
      if (error) toast.error('Erro ao salvar: ' + error.message); else { toast.success('Registro salvo com sucesso!'); setShowModal(false); loadData(); }
    };
  
    const handleDelete = async (row: any) => {
      if (!window.confirm('Tem certeza que deseja excluir este registro?')) return;
      let table = ''; let pkField = 'id'; let id = row.id;
      if (view === 'produtos') { table = 'produtos'; pkField = 'cod_produto'; id = row.cod_produto; }
      else if (view === 'fornecedores') { table = 'fornecedores'; pkField = 'cod_fornecedor'; id = row.cod_fornecedor; }
      else if (view === 'entradas') { table = 'entradas'; } else if (view === 'saidas') { table = 'saidas'; }
      if (!table) return; if (!id && row.id) { pkField = 'id'; id = row.id; }
      const { error } = await supabase.from(table).delete().eq(pkField, id);
      if (error) { if (error.code === '23503') toast.error('Não é possível excluir: Este item está sendo usado em outros registros.'); else toast.error('Erro ao excluir: ' + error.message); }
      else { toast.success('Registro excluído com sucesso.'); loadData(); }
    };
  
    const getFormConfig = () => {
      switch (view) {
        case 'produtos': return { title: 'Novo Produto', fields: [ { name: 'descricao', label: 'Descrição', required: true }, { name: 'quantidade_atual', label: 'Quantidade Inicial', type: 'number', required: true } ] };
        case 'fornecedores': return { title: 'Novo Fornecedor', fields: [ { name: 'nome', label: 'Nome da Empresa', required: true }, { name: 'cnpj', label: 'CNPJ', required: true }, { name: 'telefone', label: 'Telefone' }, { name: 'endereco', label: 'Endereço' } ] };
        case 'entradas': return { title: 'Registrar Entrada de Material', fields: [ { name: 'produto_id', label: 'Produto', type: 'select', required: true, options: auxData.produtos?.map((p:any) => ({ value: p.cod_produto, label: p.descricao })) }, { name: 'quantidade_entrada', label: 'Quantidade', type: 'number', required: true }, { name: 'fornecedor_id', label: 'Fornecedor', type: 'select', required: true, options: auxData.fornecedores?.map((f:any) => ({ value: f.cod_fornecedor, label: f.nome })) }, { name: 'local_estoque', label: 'Local de Estoque' } ] };
        case 'saidas': return { title: 'Registrar Saída de Material', fields: [ { name: 'produto_id', label: 'Produto', type: 'select', required: true, options: auxData.produtos?.map((p:any) => ({ value: p.cod_produto, label: `${p.descricao} (Estoque: ${p.quantidade_atual})` })) }, { name: 'quantidade', label: 'Quantidade', type: 'number', required: true }, { name: 'funcionario_id', label: 'Funcionário', type: 'select', required: true, options: auxData.funcionarios?.map((f:any) => ({ value: f.id, label: f.nome })) } ] };
        default: return null;
      }
    };
    const formConfig = getFormConfig();
  
    const renderTable = () => {
        if (view === 'dashboard') return <DashboardAlmoxarifado />;
        let filteredData = listData;
        if (searchTerm && ['produtos', 'fornecedores'].includes(view)) {
          const lowerTerm = searchTerm.toLowerCase();
          filteredData = listData.filter(item => {
            if (view === 'produtos') return item.descricao?.toLowerCase().includes(lowerTerm);
            if (view === 'fornecedores') return item.nome?.toLowerCase().includes(lowerTerm) || item.cnpj?.includes(lowerTerm);
            return false;
          });
        }
        if ((view === 'relatorio_funcionario' || view === 'relatorio_material') && listData.length === 0) {
            return <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg border border-gray-200 text-gray-400"><Filter className="w-12 h-12 mb-2 opacity-50" /><p>Selecione um item acima e clique em "Visualizar" para gerar o relatório.</p></div>;
        }
        if (filteredData.length === 0) return <div className="p-8 text-center text-gray-500">Nenhum registro encontrado.</div>;
        let headers: string[] = [];
        if (view === 'relatorio_funcionario') headers = ['data_saida', 'produto', 'quantidade'];
        else if (view === 'relatorio_material') headers = ['data_saida', 'funcionario', 'quantidade'];
        else headers = Object.keys(filteredData[0]).filter(k => typeof filteredData[0][k] !== 'object' && k !== 'id' && k !== 'cod_produto' && k !== 'cod_setor' && k !== 'cod_fornecedor');
        const canDelete = ['produtos', 'fornecedores', 'entradas', 'saidas'].includes(view);
        return (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  {headers.map(h => <th key={h}>{h.replace('_', ' ')}</th>)}
                  {view === 'entradas' && <><th>Produto</th><th>Fornecedor</th></>}
                  {view === 'saidas' && <><th>Produto</th><th>Funcionário</th></>}
                  {canDelete && <th className="text-right">Ações</th>}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, idx) => (
                  <tr key={idx}>
                    {headers.map(h => <td key={h}>{h.includes('data') || h === 'ultima_saida' ? new Date(row[h]).toLocaleDateString('pt-BR') : row[h]}</td>)}
                    {view === 'entradas' && <><td>{row.produtos?.descricao}</td><td>{row.fornecedores?.nome}</td></>}
                    {view === 'saidas' && <><td>{row.produtos?.descricao}</td><td>{row.funcionarios?.nome}</td></>}
                    {canDelete && (<td className="text-right"><button onClick={() => handleDelete(row)} className="text-red-400 hover:text-red-600 transition-colors p-1"><Trash2 className="w-4 h-4" /></button></td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      };
    
      const renderToolbar = () => {
        if (view === 'relatorio_funcionario') {
            return (
                <div className="flex gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Selecione o Funcionário</label>
                        <SearchableSelect options={auxData.funcionarios?.map((f: any) => ({ value: f.id, label: `${f.nome} - ${f.matricula}` }))} value={selectedReportId} onChange={setSelectedReportId} placeholder="Digite para buscar funcionário..." />
                    </div>
                    <button onClick={handleRunReport} className="btn-primary"><Filter className="w-4 h-4" /> Visualizar</button>
                </div>
            );
        }
        if (view === 'relatorio_material') {
            return (
                 <div className="flex gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Selecione o Produto</label>
                        <SearchableSelect options={auxData.produtos?.map((p: any) => ({ value: p.cod_produto, label: p.descricao }))} value={selectedReportId} onChange={setSelectedReportId} placeholder="Digite para buscar produto..." />
                    </div>
                    <button onClick={handleRunReport} className="btn-primary"><Filter className="w-4 h-4" /> Visualizar</button>
                </div>
            );
        }
        if (['produtos', 'fornecedores'].includes(view)) {
            return <div className="relative mb-6"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-5 w-5 text-gray-400" /></div><input type="text" className="input-search" placeholder={`Pesquisar em ${view}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>;
        }
        return null;
      };
    
      return (
        <div className="main-layout">
          <aside className="sidebar">
            <div className="sidebar-section">
                <h2 className="sidebar-title">Principal</h2>
                <nav className="sidebar-nav">
                    <button onClick={() => setView('dashboard')} className={`sidebar-btn ${view === 'dashboard' ? 'active' : ''}`}><LayoutDashboard /> Dashboard</button>
                </nav>
            </div>
            <div className="sidebar-section pt-0">
                <h2 className="sidebar-title">Movimentações</h2>
                <nav className="sidebar-nav">
                    <button onClick={() => setView('entradas')} className={`sidebar-btn ${view === 'entradas' ? 'active' : ''}`}><ArrowDownCircle className="text-green-600" /> Registrar Entrada</button>
                    <button onClick={() => setView('saidas')} className={`sidebar-btn ${view === 'saidas' ? 'active' : ''}`}><ArrowUpCircle className="text-red-600" /> Registrar Saída</button>
                </nav>
            </div>
            <div className="sidebar-section pt-0">
                <h2 className="sidebar-title">Relatórios</h2>
                <nav className="sidebar-nav">
                    <button onClick={() => setView('relatorio_funcionario')} className={`sidebar-btn ${view === 'relatorio_funcionario' ? 'active' : ''}`}><UserCircle /> Saída por Funcionário</button>
                    <button onClick={() => setView('relatorio_material')} className={`sidebar-btn ${view === 'relatorio_material' ? 'active' : ''}`}><FileText /> Saída por Material</button>
                </nav>
            </div>
            <div className="sidebar-section pt-0">
                <h2 className="sidebar-title">Cadastros</h2>
                <nav className="sidebar-nav">
                    <button onClick={() => setView('produtos')} className={`sidebar-btn ${view === 'produtos' ? 'active' : ''}`}><Package /> Produtos</button>
                    <button onClick={() => setView('fornecedores')} className={`sidebar-btn ${view === 'fornecedores' ? 'active' : ''}`}><Truck /> Fornecedores</button>
                </nav>
            </div>
          </aside>
          <main className="main-content">
            <div className="flex justify-between items-center mb-6"><h1 className="text-2xl font-bold text-gray-800 capitalize">{view.replace('relatorio_', 'Relatório de ').replace('_', ' ')}</h1>{formConfig && (<button onClick={() => setShowModal(true)} className="btn-primary"><span>+ Novo Registro</span></button>)}</div>
            {renderToolbar()}
            {renderTable()}
            {showModal && formConfig && (<SimpleForm title={formConfig.title} fields={formConfig.fields} onSubmit={handleSave} onClose={() => setShowModal(false)} />)}
          </main>
        </div>
      );
};