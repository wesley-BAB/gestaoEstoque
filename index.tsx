import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { ToastContainer, toast } from 'react-toastify';
import { 
  Package, 
  Users, 
  Truck, 
  ArrowRightLeft, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  LayoutDashboard, 
  LogOut, 
  Settings,
  Box,
  UserCircle,
  FileText
} from 'lucide-react';

// --- Configuração Supabase ---
const supabaseUrl = 'https://nwkburfesthrdfhorpwm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53a2J1cmZlc3RocmRmaG9ycHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NDk3NDIsImV4cCI6MjA4MTMyNTc0Mn0.89G-BBHYhjPhRJPn8R3UwdSMsZs9ZbKA0wTFUzLiUdg';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Tipos ---
type ViewState = 'dashboard' | 'produtos' | 'entradas' | 'saidas' | 'funcionarios' | 'fornecedores' | 'setores' | 'usuarios' | 'relatorio_funcionario' | 'relatorio_material';

// --- Componentes de UI ---

const Card = ({ title, value, icon: Icon, colorClass }: any) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
    <div>
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800 mt-1">{value}</h3>
    </div>
    <div className={`p-3 rounded-full ${colorClass}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
  </div>
);

// --- Login Component ---
const Login = ({ onLogin }: { onLogin: (user: any) => void }) => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Usar maybeSingle() para não retornar erro se não encontrar usuário, apenas null
      // Trim remove espaços em branco acidentais
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('usuario', user.trim())
        .eq('senha', pass.trim()) 
        .maybeSingle();

      if (error) {
        console.error('Erro de Login Supabase:', error);
        toast.error('Erro ao acessar o banco de dados. Verifique se as tabelas foram criadas.');
      } else if (!data) {
        toast.error('Usuário ou senha incorretos.');
      } else {
        toast.success(`Bem-vindo, ${data.usuario}!`);
        onLogin(data);
      }
    } catch (err) {
      console.error('Erro de Exceção:', err);
      toast.error('Erro inesperado de conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-emerald-900">Wes ERP</h1>
          <p className="text-gray-500">Faça login para acessar o sistema</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuário</label>
            <input 
              type="text" 
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="Ex: Wesley.benevides"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input 
              type="password" 
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-2 rounded-md hover:bg-emerald-700 transition duration-200 font-medium"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <p className="mt-4 text-xs text-center text-gray-400">
            Se for o primeiro acesso, certifique-se de ter rodado o script SQL no Supabase.
        </p>
      </div>
    </div>
  );
};

// --- Dashboard View ---
const Dashboard = () => {
  const [stats, setStats] = useState({ totalProdutos: 0, totalEstoque: 0, saidasRecentes: [] as any[] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    // Fetch Produtos Stats
    const { data: produtos } = await supabase.from('produtos').select('quantidade_atual');
    const totalProd = produtos?.length || 0;
    const totalEst = produtos?.reduce((acc, curr) => acc + (curr.quantidade_atual || 0), 0) || 0;

    // Fetch Saidas Recentes
    const { data: saidas } = await supabase
      .from('saidas')
      .select(`
        id,
        quantidade,
        data_saida,
        produtos (descricao),
        funcionarios (nome)
      `)
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
        <Card 
          title="Produtos Cadastrados" 
          value={stats.totalProdutos} 
          icon={Package} 
          colorClass="bg-blue-500" 
        />
        <Card 
          title="Itens em Estoque" 
          value={stats.totalEstoque} 
          icon={Box} 
          colorClass="bg-emerald-500" 
        />
        <Card 
          title="Saídas Recentes" 
          value={stats.saidasRecentes.length} 
          icon={ArrowRightLeft} 
          colorClass="bg-amber-500" 
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50">
          <h3 className="font-semibold text-gray-800">Últimas Saídas para Funcionários</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-500 font-medium">
              <tr>
                <th className="p-4">Produto</th>
                <th className="p-4">Qtd</th>
                <th className="p-4">Funcionário</th>
                <th className="p-4">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.saidasRecentes.map((saida) => (
                <tr key={saida.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-800">{saida.produtos?.descricao || 'Produto Removido'}</td>
                  <td className="p-4 text-red-600 font-medium">-{saida.quantidade}</td>
                  <td className="p-4">{saida.funcionarios?.nome || 'Func. Removido'}</td>
                  <td className="p-4">{new Date(saida.data_saida).toLocaleString('pt-BR')}</td>
                </tr>
              ))}
              {stats.saidasRecentes.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400">Nenhuma saída registrada recentemente.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- Formulários e Listas Genéricas ---

const SimpleForm = ({ title, fields, onSubmit, onClose }: any) => {
  const [formData, setFormData] = useState<any>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 bg-emerald-600 flex justify-between items-center">
          <h3 className="text-white font-semibold">{title}</h3>
          <button onClick={onClose} className="text-white hover:text-emerald-200">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {fields.map((field: any) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
              {field.type === 'select' ? (
                <select
                  required={field.required}
                  className="w-full border border-gray-300 rounded p-2"
                  onChange={(e) => handleChange(field.name, e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {field.options?.map((opt: any) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type || 'text'}
                  required={field.required}
                  className="w-full border border-gray-300 rounded p-2"
                  onChange={(e) => handleChange(field.name, e.target.value)}
                />
              )}
            </div>
          ))}
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Módulo Almoxarifado Main Component ---
const AlmoxarifadoModule = () => {
  const [view, setView] = useState<ViewState>('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [listData, setListData] = useState<any[]>([]);
  const [auxData, setAuxData] = useState<any>({}); // Para selects (FKs)

  // Carregar dados dependendo da view
  useEffect(() => {
    loadData();
  }, [view]);

  const loadData = async () => {
    let data: any[] = [];
    
    // CRUD Básico
    if (view === 'produtos') {
      const res = await supabase.from('produtos').select('*').order('descricao');
      if (res.data) data = res.data;
    } else if (view === 'funcionarios') {
      const res = await supabase.from('funcionarios').select('*, setores(descricao)').order('nome');
      if (res.data) data = res.data;
      const setores = await supabase.from('setores').select('*');
      setAuxData(prev => ({ ...prev, setores: setores.data }));
    } else if (view === 'fornecedores') {
      const res = await supabase.from('fornecedores').select('*').order('nome');
      if (res.data) data = res.data;
    } else if (view === 'setores') {
      const res = await supabase.from('setores').select('*').order('descricao');
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
    } 
    // Relatórios (Processamento no cliente devido a simplicidade do Supabase JS)
    else if (view === 'relatorio_funcionario') {
      const res = await supabase.from('saidas').select('*, funcionarios(nome), produtos(descricao)');
      if (res.data) {
        // Agrupar por funcionário
        const grouped = res.data.reduce((acc: any, curr: any) => {
          const nome = curr.funcionarios?.nome || 'Desconhecido';
          if (!acc[nome]) acc[nome] = { funcionario: nome, total_itens: 0, retiradas: 0, ultima_saida: curr.data_saida };
          acc[nome].total_itens += curr.quantidade;
          acc[nome].retiradas += 1;
          if (new Date(curr.data_saida) > new Date(acc[nome].ultima_saida)) acc[nome].ultima_saida = curr.data_saida;
          return acc;
        }, {});
        data = Object.values(grouped);
      }
    } else if (view === 'relatorio_material') {
      const res = await supabase.from('saidas').select('*, produtos(descricao)');
      if (res.data) {
        // Agrupar por produto
        const grouped = res.data.reduce((acc: any, curr: any) => {
          const desc = curr.produtos?.descricao || 'Desconhecido';
          if (!acc[desc]) acc[desc] = { produto: desc, total_saida: 0, frequencia: 0 };
          acc[desc].total_saida += curr.quantidade;
          acc[desc].frequencia += 1;
          return acc;
        }, {});
        data = Object.values(grouped);
      }
    }

    setListData(data);
  };

  const handleSave = async (data: any) => {
    let table = '';
    let payload = { ...data };

    switch(view) {
      case 'produtos': table = 'produtos'; break;
      case 'setores': table = 'setores'; break;
      case 'fornecedores': table = 'fornecedores'; break;
      case 'funcionarios': table = 'funcionarios'; break;
      case 'entradas': table = 'entradas'; break;
      case 'saidas': table = 'saidas'; break;
    }

    if (!table) return;

    // --- VALIDAÇÃO DE ESTOQUE PARA SAÍDAS ---
    if (view === 'saidas') {
      try {
        const { data: produtoData, error: prodError } = await supabase
          .from('produtos')
          .select('quantidade_atual, descricao')
          .eq('cod_produto', payload.produto_id)
          .single();

        if (prodError || !produtoData) {
          toast.error('Produto não encontrado!');
          return;
        }

        // Converter para número para garantir comparação correta
        const qtdEstoque = Number(produtoData.quantidade_atual);
        const qtdSaida = Number(payload.quantidade);

        if (qtdEstoque < qtdSaida) {
          toast.error(`Estoque insuficiente! Disponível: ${qtdEstoque} | Solicitado: ${qtdSaida}`);
          return; // Interrompe o salvamento
        }
      } catch (err) {
        toast.error('Erro ao verificar estoque.');
        return;
      }
    }
    // ------------------------------------------

    const { error } = await supabase.from(table).insert(payload);
    
    if (error) {
      toast.error('Erro ao salvar: ' + error.message);
    } else {
      toast.success('Registro salvo com sucesso!');
      setShowModal(false);
      loadData();
    }
  };

  // Configuração dos campos do formulário baseado na view
  const getFormConfig = () => {
    switch (view) {
      case 'produtos':
        return {
          title: 'Novo Produto',
          fields: [
            { name: 'descricao', label: 'Descrição', required: true },
            { name: 'quantidade_atual', label: 'Quantidade Inicial', type: 'number', required: true }
          ]
        };
      case 'funcionarios':
        return {
          title: 'Novo Funcionário',
          fields: [
            { name: 'nome', label: 'Nome Completo', required: true },
            { name: 'matricula', label: 'Matrícula', required: true },
            { name: 'setor_id', label: 'Setor', type: 'select', required: true, options: auxData.setores?.map((s:any) => ({ value: s.cod_setor, label: s.descricao })) }
          ]
        };
      case 'fornecedores':
        return {
          title: 'Novo Fornecedor',
          fields: [
            { name: 'nome', label: 'Nome da Empresa', required: true },
            { name: 'cnpj', label: 'CNPJ', required: true },
            { name: 'telefone', label: 'Telefone' },
            { name: 'endereco', label: 'Endereço' }
          ]
        };
      case 'setores':
        return {
          title: 'Novo Setor',
          fields: [
            { name: 'descricao', label: 'Descrição do Setor', required: true }
          ]
        };
      case 'entradas':
        return {
          title: 'Registrar Entrada de Material',
          fields: [
            { name: 'produto_id', label: 'Produto', type: 'select', required: true, options: auxData.produtos?.map((p:any) => ({ value: p.cod_produto, label: p.descricao })) },
            { name: 'quantidade_entrada', label: 'Quantidade', type: 'number', required: true },
            { name: 'fornecedor_id', label: 'Fornecedor', type: 'select', required: true, options: auxData.fornecedores?.map((f:any) => ({ value: f.cod_fornecedor, label: f.nome })) },
            { name: 'local_estoque', label: 'Local de Estoque' }
          ]
        };
      case 'saidas':
        return {
          title: 'Registrar Saída de Material',
          fields: [
            { name: 'produto_id', label: 'Produto', type: 'select', required: true, options: auxData.produtos?.map((p:any) => ({ value: p.cod_produto, label: `${p.descricao} (Estoque: ${p.quantidade_atual})` })) },
            { name: 'quantidade', label: 'Quantidade', type: 'number', required: true },
            { name: 'funcionario_id', label: 'Funcionário', type: 'select', required: true, options: auxData.funcionarios?.map((f:any) => ({ value: f.id, label: f.nome })) }
          ]
        };
      default: return null;
    }
  };

  const formConfig = getFormConfig();

  // Renderização da Tabela
  const renderTable = () => {
    if (view === 'dashboard') return <Dashboard />;
    
    if (listData.length === 0) return <div className="p-8 text-center text-gray-500">Nenhum registro encontrado.</div>;

    // Headers personalizados para relatórios ou genéricos para CRUD
    let headers: string[] = [];
    if (view === 'relatorio_funcionario') {
      headers = ['funcionario', 'total_itens', 'retiradas', 'ultima_saida'];
    } else if (view === 'relatorio_material') {
      headers = ['produto', 'total_saida', 'frequencia'];
    } else {
      headers = Object.keys(listData[0]).filter(k => typeof listData[0][k] !== 'object' && k !== 'id' && k !== 'cod_produto' && k !== 'cod_setor' && k !== 'cod_fornecedor');
    }
    
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 uppercase text-xs font-semibold text-gray-500">
            <tr>
              {headers.map(h => <th key={h} className="p-4">{h.replace('_', ' ')}</th>)}
              {/* Colunas extras para FKs (apenas em views normais) */}
              {view === 'funcionarios' && <th className="p-4">Setor</th>}
              {view === 'entradas' && <><th className="p-4">Produto</th><th className="p-4">Fornecedor</th></>}
              {view === 'saidas' && <><th className="p-4">Produto</th><th className="p-4">Funcionário</th></>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {listData.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                {headers.map(h => (
                  <td key={h} className="p-4">
                     {h.includes('data') || h === 'ultima_saida' 
                       ? new Date(row[h]).toLocaleDateString('pt-BR') 
                       : row[h]}
                  </td>
                ))}
                {/* Dados Extras FK */}
                {view === 'funcionarios' && <td className="p-4">{row.setores?.descricao}</td>}
                {view === 'entradas' && <><td className="p-4">{row.produtos?.descricao}</td><td className="p-4">{row.fornecedores?.nome}</td></>}
                {view === 'saidas' && <><td className="p-4">{row.produtos?.descricao}</td><td className="p-4">{row.funcionarios?.nome}</td></>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
        <div className="p-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Principal</h2>
          <nav className="space-y-1">
            <button onClick={() => setView('dashboard')} className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${view === 'dashboard' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-700 hover:bg-gray-50'}`}>
              <LayoutDashboard className="w-5 h-5 mr-3" /> Dashboard
            </button>
          </nav>
        </div>

        <div className="p-4 pt-0">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Movimentações</h2>
          <nav className="space-y-1">
            <button onClick={() => setView('entradas')} className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${view === 'entradas' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-700 hover:bg-gray-50'}`}>
              <ArrowDownCircle className="w-5 h-5 mr-3 text-green-600" /> Registrar Entrada
            </button>
            <button onClick={() => setView('saidas')} className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${view === 'saidas' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-700 hover:bg-gray-50'}`}>
              <ArrowUpCircle className="w-5 h-5 mr-3 text-red-600" /> Registrar Saída
            </button>
          </nav>
        </div>

        <div className="p-4 pt-0">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Relatórios</h2>
          <nav className="space-y-1">
            <button onClick={() => setView('relatorio_funcionario')} className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${view === 'relatorio_funcionario' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-700 hover:bg-gray-50'}`}>
              <UserCircle className="w-5 h-5 mr-3" /> Saída por Funcionário
            </button>
            <button onClick={() => setView('relatorio_material')} className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${view === 'relatorio_material' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-700 hover:bg-gray-50'}`}>
              <FileText className="w-5 h-5 mr-3" /> Saída por Material
            </button>
          </nav>
        </div>

        <div className="p-4 pt-0">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Cadastros</h2>
          <nav className="space-y-1">
            <button onClick={() => setView('produtos')} className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${view === 'produtos' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-700 hover:bg-gray-50'}`}>
              <Package className="w-5 h-5 mr-3" /> Produtos
            </button>
            <button onClick={() => setView('funcionarios')} className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${view === 'funcionarios' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-700 hover:bg-gray-50'}`}>
              <Users className="w-5 h-5 mr-3" /> Funcionários
            </button>
            <button onClick={() => setView('fornecedores')} className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${view === 'fornecedores' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-700 hover:bg-gray-50'}`}>
              <Truck className="w-5 h-5 mr-3" /> Fornecedores
            </button>
            <button onClick={() => setView('setores')} className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${view === 'setores' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-700 hover:bg-gray-50'}`}>
              <Box className="w-5 h-5 mr-3" /> Setores
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 capitalize">
            {view.replace('relatorio_', 'Relatório de ').replace('_', ' ')}
          </h1>
          {formConfig && (
            <button 
              onClick={() => setShowModal(true)}
              className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 flex items-center gap-2"
            >
              <span>+ Novo Registro</span>
            </button>
          )}
        </div>
        
        {renderTable()}

        {showModal && formConfig && (
          <SimpleForm 
            title={formConfig.title} 
            fields={formConfig.fields} 
            onSubmit={handleSave} 
            onClose={() => setShowModal(false)} 
          />
        )}
      </main>
    </div>
  );
};

// --- App Principal ---
const App = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [changePasswordModal, setChangePasswordModal] = useState(false);

  const handleLogout = () => setCurrentUser(null);

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      
      {!currentUser ? (
        <Login onLogin={setCurrentUser} />
      ) : (
        <div className="flex flex-col h-screen">
          {/* Top Bar */}
          <header className="bg-emerald-800 text-white shadow-lg h-16 flex items-center justify-between px-6 z-10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-emerald-800 font-bold text-lg">
                W
              </div>
              <span className="font-bold text-xl tracking-wide">Wes ERP</span>
            </div>

            {/* Módulos Menu (Simulado) */}
            <div className="hidden md:flex space-x-1 bg-emerald-900/50 p-1 rounded-lg">
              <button className="px-4 py-1.5 bg-emerald-600 rounded shadow text-sm font-medium">Almoxarifado</button>
              <button className="px-4 py-1.5 text-emerald-200 hover:text-white text-sm font-medium opacity-50 cursor-not-allowed">Financeiro</button>
              <button className="px-4 py-1.5 text-emerald-200 hover:text-white text-sm font-medium opacity-50 cursor-not-allowed">RH</button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end mr-2">
                <span className="text-sm font-medium">{currentUser.usuario}</span>
                <span className="text-xs text-emerald-300">Administrador</span>
              </div>
              
              <div className="h-8 w-[1px] bg-emerald-600 mx-1"></div>

              <button 
                onClick={() => toast.info('Funcionalidade de alterar senha será implementada em breve.')} 
                className="p-2 text-emerald-200 hover:text-white hover:bg-emerald-700 rounded-full transition" 
                title="Alterar Senha"
              >
                <Settings className="w-5 h-5" />
              </button>
              
              <button 
                onClick={handleLogout} 
                className="p-2 text-red-300 hover:text-red-100 hover:bg-red-900/50 rounded-full transition" 
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Conteúdo do Módulo */}
          <AlmoxarifadoModule />
        </div>
      )}
    </>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);