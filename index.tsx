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
  FileText,
  Search,
  Filter,
  Briefcase,
  Shield,
  Lock,
  CheckSquare,
  Trash2
} from 'lucide-react';

// --- Configuração Supabase ---
const supabaseUrl = 'https://nwkburfesthrdfhorpwm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53a2J1cmZlc3RocmRmaG9ycHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NDk3NDIsImV4cCI6MjA4MTMyNTc0Mn0.89G-BBHYhjPhRJPn8R3UwdSMsZs9ZbKA0wTFUzLiUdg';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Tipos ---
type ModuleType = 'almoxarifado' | 'rh' | 'administracao' | 'financeiro';
type AlmoxarifadoView = 'dashboard' | 'produtos' | 'entradas' | 'saidas' | 'fornecedores' | 'relatorio_funcionario' | 'relatorio_material';
type RHView = 'dashboard' | 'funcionarios' | 'setores';
type AdminView = 'dashboard' | 'usuarios';

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

// --- Dashboard View (Almoxarifado) ---
const DashboardAlmoxarifado = () => {
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

// --- Dashboard View (RH) ---
const DashboardRH = () => {
    const [stats, setStats] = useState({ totalFuncionarios: 0, totalSetores: 0 });
  
    useEffect(() => {
      const fetch = async () => {
        const { count: countFunc } = await supabase.from('funcionarios').select('*', { count: 'exact', head: true });
        const { count: countSetores } = await supabase.from('setores').select('*', { count: 'exact', head: true });
        setStats({
            totalFuncionarios: countFunc || 0,
            totalSetores: countSetores || 0
        });
      };
      fetch();
    }, []);
  
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Visão Geral de RH</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card 
            title="Funcionários Ativos" 
            value={stats.totalFuncionarios} 
            icon={Users} 
            colorClass="bg-purple-500" 
          />
          <Card 
            title="Setores Cadastrados" 
            value={stats.totalSetores} 
            icon={Briefcase} 
            colorClass="bg-orange-500" 
          />
        </div>
      </div>
    );
  };

// --- Dashboard View (Administração) ---
const DashboardAdmin = () => {
    const [stats, setStats] = useState({ totalUsuarios: 0 });
  
    useEffect(() => {
      const fetch = async () => {
        const { count } = await supabase.from('usuarios').select('*', { count: 'exact', head: true });
        setStats({ totalUsuarios: count || 0 });
      };
      fetch();
    }, []);
  
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Visão Geral Administrativa</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card 
            title="Usuários do Sistema" 
            value={stats.totalUsuarios} 
            icon={Shield} 
            colorClass="bg-gray-800" 
          />
        </div>
      </div>
    );
  };

// --- Componente de Formulário Genérico ---

const SimpleForm = ({ title, fields, onSubmit, onClose }: any) => {
  const [formData, setFormData] = useState<any>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleCheckboxGroupChange = (field: string, optionValue: string, checked: boolean) => {
    setFormData((prev: any) => {
        const currentValues = prev[field] || [];
        if (checked) {
            return { ...prev, [field]: [...currentValues, optionValue] };
        } else {
            return { ...prev, [field]: currentValues.filter((v: string) => v !== optionValue) };
        }
    });
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
              ) : field.type === 'checkbox-group' ? (
                 <div className="space-y-2 bg-gray-50 p-3 rounded border border-gray-200">
                    {field.options?.map((opt: any) => (
                        <label key={opt.value} className="flex items-center space-x-2 cursor-pointer">
                            <input 
                                type="checkbox"
                                value={opt.value}
                                onChange={(e) => handleCheckboxGroupChange(field.name, opt.value, e.target.checked)}
                                className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                            />
                            <span className="text-sm text-gray-700">{opt.label}</span>
                        </label>
                    ))}
                 </div>
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

// ==========================================
// MÓDULO ALMOXARIFADO
// ==========================================
const AlmoxarifadoModule = () => {
  const [view, setView] = useState<AlmoxarifadoView>('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [listData, setListData] = useState<any[]>([]);
  const [auxData, setAuxData] = useState<any>({}); 
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReportId, setSelectedReportId] = useState('');

  useEffect(() => {
    setSearchTerm(''); 
    setSelectedReportId(''); 
    setListData([]); 
    loadData();
  }, [view]);

  const loadData = async () => {
    let data: any[] = [];
    
    // CRUD e Operações
    if (view === 'produtos') {
      const res = await supabase.from('produtos').select('*').order('descricao');
      if (res.data) data = res.data;
    } else if (view === 'fornecedores') {
      const res = await supabase.from('fornecedores').select('*').order('nome');
      if (res.data) data = res.data;
    } else if (view === 'entradas') {
      const res = await supabase.from('entradas').select('*, produtos(descricao), fornecedores(nome)').order('data_entrada', { ascending: false });
      if (res.data) data = res.data;
      // Carregar auxiliares para os dropdowns do formulário
      const prod = await supabase.from('produtos').select('*');
      const forn = await supabase.from('fornecedores').select('*');
      setAuxData({ produtos: prod.data, fornecedores: forn.data });
    } else if (view === 'saidas') {
      const res = await supabase.from('saidas').select('*, produtos(descricao), funcionarios(nome)').order('data_saida', { ascending: false });
      if (res.data) data = res.data;
      // Carregar auxiliares para os dropdowns do formulário
      const prod = await supabase.from('produtos').select('*');
      const func = await supabase.from('funcionarios').select('*');
      setAuxData({ produtos: prod.data, funcionarios: func.data });
    } 
    // Relatórios
    else if (view === 'relatorio_funcionario') {
      // Carrega lista de funcionários para o filtro
      const res = await supabase.from('funcionarios').select('*').order('nome');
      if (res.data) setAuxData({ funcionarios: res.data });
      data = []; 
    } else if (view === 'relatorio_material') {
      const res = await supabase.from('produtos').select('*').order('descricao');
      if (res.data) setAuxData({ produtos: res.data });
      data = []; 
    }

    setListData(data);
  };

  const handleRunReport = async () => {
    if (!selectedReportId) {
      toast.warn('Selecione um item para gerar o relatório.');
      return;
    }
    let data: any[] = [];
    if (view === 'relatorio_funcionario') {
        const res = await supabase
            .from('saidas')
            .select('*, produtos(descricao), funcionarios(nome)')
            .eq('funcionario_id', selectedReportId)
            .order('data_saida', { ascending: false });
        if (res.data) {
            data = res.data.map(item => ({
                data_saida: item.data_saida,
                produto: item.produtos?.descricao,
                quantidade: item.quantidade
            }));
        }
    } else if (view === 'relatorio_material') {
        const res = await supabase
            .from('saidas')
            .select('*, funcionarios(nome), produtos(descricao)')
            .eq('produto_id', selectedReportId)
            .order('data_saida', { ascending: false });
         if (res.data) {
             data = res.data.map(item => ({
                data_saida: item.data_saida,
                funcionario: item.funcionarios?.nome,
                quantidade: item.quantidade
             }));
         }
    }
    setListData(data);
    if (data.length === 0) toast.info('Nenhum registro encontrado para a seleção.');
  };

  const handleSave = async (data: any) => {
    let table = '';
    let payload = { ...data };

    switch(view) {
      case 'produtos': table = 'produtos'; break;
      case 'fornecedores': table = 'fornecedores'; break;
      case 'entradas': table = 'entradas'; break;
      case 'saidas': table = 'saidas'; break;
    }

    if (!table) return;

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

        const qtdEstoque = Number(produtoData.quantidade_atual);
        const qtdSaida = Number(payload.quantidade);

        if (qtdEstoque < qtdSaida) {
          toast.error(`Estoque insuficiente! Disponível: ${qtdEstoque} | Solicitado: ${qtdSaida}`);
          return; 
        }
      } catch (err) {
        toast.error('Erro ao verificar estoque.');
        return;
      }
    }

    const { error } = await supabase.from(table).insert(payload);
    
    if (error) {
      toast.error('Erro ao salvar: ' + error.message);
    } else {
      toast.success('Registro salvo com sucesso!');
      setShowModal(false);
      loadData();
    }
  };

  const handleDelete = async (row: any) => {
    if (!window.confirm('Tem certeza que deseja excluir este registro?')) return;

    let table = '';
    let pkField = 'id';
    let id = row.id;

    if (view === 'produtos') {
        table = 'produtos';
        pkField = 'cod_produto'; // Baseado no select do form anterior
        id = row.cod_produto;
    } else if (view === 'fornecedores') {
        table = 'fornecedores';
        pkField = 'cod_fornecedor';
        id = row.cod_fornecedor;
    } else if (view === 'entradas') {
        table = 'entradas';
    } else if (view === 'saidas') {
        table = 'saidas';
    }

    if (!table) return;
    
    // Fallback se o ID específico não existir no objeto row (ex: se o supabase retornou 'id' padrão)
    if (!id && row.id) {
        pkField = 'id';
        id = row.id;
    }

    const { error } = await supabase.from(table).delete().eq(pkField, id);

    if (error) {
        // Erro comum: FK Constraint
        if (error.code === '23503') {
             toast.error('Não é possível excluir: Este item está sendo usado em outros registros (ex: entradas ou saídas).');
        } else {
             toast.error('Erro ao excluir: ' + error.message);
        }
    } else {
        toast.success('Registro excluído com sucesso.');
        loadData();
    }
  };

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
        return (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg border border-gray-200 text-gray-400">
                <Filter className="w-12 h-12 mb-2 opacity-50" />
                <p>Selecione um item acima e clique em "Visualizar" para gerar o relatório.</p>
            </div>
        );
    }
    
    if (filteredData.length === 0) return <div className="p-8 text-center text-gray-500">Nenhum registro encontrado.</div>;

    let headers: string[] = [];
    if (view === 'relatorio_funcionario') {
      headers = ['data_saida', 'produto', 'quantidade'];
    } else if (view === 'relatorio_material') {
      headers = ['data_saida', 'funcionario', 'quantidade'];
    } else {
      headers = Object.keys(filteredData[0]).filter(k => typeof filteredData[0][k] !== 'object' && k !== 'id' && k !== 'cod_produto' && k !== 'cod_setor' && k !== 'cod_fornecedor');
    }
    
    const canDelete = ['produtos', 'fornecedores', 'entradas', 'saidas'].includes(view);

    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 uppercase text-xs font-semibold text-gray-500">
            <tr>
              {headers.map(h => <th key={h} className="p-4">{h.replace('_', ' ')}</th>)}
              {view === 'entradas' && <><th className="p-4">Produto</th><th className="p-4">Fornecedor</th></>}
              {view === 'saidas' && <><th className="p-4">Produto</th><th className="p-4">Funcionário</th></>}
              {canDelete && <th className="p-4 text-right">Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredData.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                {headers.map(h => (
                  <td key={h} className="p-4">
                     {h.includes('data') || h === 'ultima_saida' 
                       ? new Date(row[h]).toLocaleDateString('pt-BR') 
                       : row[h]}
                  </td>
                ))}
                {view === 'entradas' && <><td className="p-4">{row.produtos?.descricao}</td><td className="p-4">{row.fornecedores?.nome}</td></>}
                {view === 'saidas' && <><td className="p-4">{row.produtos?.descricao}</td><td className="p-4">{row.funcionarios?.nome}</td></>}
                {canDelete && (
                    <td className="p-4 text-right">
                        <button 
                            onClick={() => handleDelete(row)}
                            className="text-red-400 hover:text-red-600 transition-colors p-1"
                            title="Excluir Registro"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </td>
                )}
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
                    <select 
                        className="w-full border border-gray-300 rounded-md p-2 focus:ring-emerald-500 focus:border-emerald-500"
                        value={selectedReportId}
                        onChange={(e) => setSelectedReportId(e.target.value)}
                    >
                        <option value="">Selecione...</option>
                        {auxData.funcionarios?.map((f: any) => (
                            <option key={f.id} value={f.id}>{f.nome} - {f.matricula}</option>
                        ))}
                    </select>
                </div>
                <button 
                    onClick={handleRunReport}
                    className="bg-emerald-600 text-white px-6 py-2 rounded-md hover:bg-emerald-700 flex items-center gap-2 font-medium"
                >
                    <Filter className="w-4 h-4" /> Visualizar
                </button>
            </div>
        );
    }
    if (view === 'relatorio_material') {
        return (
             <div className="flex gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200 items-end">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Selecione o Produto</label>
                    <select 
                        className="w-full border border-gray-300 rounded-md p-2 focus:ring-emerald-500 focus:border-emerald-500"
                        value={selectedReportId}
                        onChange={(e) => setSelectedReportId(e.target.value)}
                    >
                        <option value="">Selecione...</option>
                        {auxData.produtos?.map((p: any) => (
                            <option key={p.cod_produto} value={p.cod_produto}>{p.descricao}</option>
                        ))}
                    </select>
                </div>
                <button 
                    onClick={handleRunReport}
                    className="bg-emerald-600 text-white px-6 py-2 rounded-md hover:bg-emerald-700 flex items-center gap-2 font-medium"
                >
                    <Filter className="w-4 h-4" /> Visualizar
                </button>
            </div>
        );
    }

    if (['produtos', 'fornecedores'].includes(view)) {
        return (
            <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder={`Pesquisar em ${view}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        );
    }

    return null;
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
            <button onClick={() => setView('fornecedores')} className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${view === 'fornecedores' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-700 hover:bg-gray-50'}`}>
              <Truck className="w-5 h-5 mr-3" /> Fornecedores
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
        
        {renderToolbar()}

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

// ==========================================
// MÓDULO RH (RECURSOS HUMANOS)
// ==========================================
const RHModule = () => {
    const [view, setView] = useState<RHView>('dashboard');
    const [showModal, setShowModal] = useState(false);
    const [listData, setListData] = useState<any[]>([]);
    const [auxData, setAuxData] = useState<any>({});
    const [searchTerm, setSearchTerm] = useState('');
  
    useEffect(() => {
        setSearchTerm('');
        setListData([]);
        loadData();
    }, [view]);
  
    const loadData = async () => {
        let data: any[] = [];
        if (view === 'funcionarios') {
            const res = await supabase.from('funcionarios').select('*, setores(descricao)').order('nome');
            if (res.data) data = res.data;
            const setores = await supabase.from('setores').select('*');
            setAuxData(prev => ({ ...prev, setores: setores.data }));
        } else if (view === 'setores') {
            const res = await supabase.from('setores').select('*').order('descricao');
            if (res.data) data = res.data;
        }
        setListData(data);
    };

    const handleSave = async (data: any) => {
        let table = '';
        if (view === 'funcionarios') table = 'funcionarios';
        else if (view === 'setores') table = 'setores';

        if (!table) return;

        const { error } = await supabase.from(table).insert(data);
        if (error) {
            toast.error('Erro ao salvar: ' + error.message);
        } else {
            toast.success('Registro salvo com sucesso!');
            setShowModal(false);
            loadData();
        }
    };

    const handleDelete = async (row: any) => {
        if (!window.confirm('Tem certeza que deseja excluir este registro?')) return;
    
        let table = '';
        let pkField = 'id';
        let id = row.id;
    
        if (view === 'funcionarios') {
            table = 'funcionarios';
            // Funcionarios usam ID padrão do supabase
        } else if (view === 'setores') {
            table = 'setores';
            pkField = 'cod_setor';
            id = row.cod_setor;
        }
    
        if (!table) return;
        
        // Fallback
        if (!id && row.id) {
            pkField = 'id';
            id = row.id;
        }
    
        const { error } = await supabase.from(table).delete().eq(pkField, id);
    
        if (error) {
            if (error.code === '23503') {
                 toast.error('Não é possível excluir: Existem funcionários vinculados a este setor.');
            } else {
                 toast.error('Erro ao excluir: ' + error.message);
            }
        } else {
            toast.success('Registro excluído com sucesso.');
            loadData();
        }
      };

    const getFormConfig = () => {
        if (view === 'funcionarios') {
            return {
                title: 'Novo Funcionário',
                fields: [
                    { name: 'nome', label: 'Nome Completo', required: true },
                    { name: 'matricula', label: 'Matrícula', required: true },
                    { name: 'setor_id', label: 'Setor', type: 'select', required: true, options: auxData.setores?.map((s:any) => ({ value: s.cod_setor, label: s.descricao })) }
                ]
            };
        }
        if (view === 'setores') {
            return {
                title: 'Novo Setor',
                fields: [
                    { name: 'descricao', label: 'Descrição do Setor', required: true }
                ]
            };
        }
        return null;
    };
    const formConfig = getFormConfig();

    const renderTable = () => {
        if (view === 'dashboard') return <DashboardRH />;

        let filteredData = listData;
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            filteredData = listData.filter(item => {
                if (view === 'funcionarios') return item.nome?.toLowerCase().includes(lowerTerm) || item.matricula?.toLowerCase().includes(lowerTerm);
                if (view === 'setores') return item.descricao?.toLowerCase().includes(lowerTerm);
                return false;
            });
        }

        if (filteredData.length === 0) return <div className="p-8 text-center text-gray-500">Nenhum registro encontrado.</div>;
        
        const headers = Object.keys(filteredData[0]).filter(k => typeof filteredData[0][k] !== 'object' && k !== 'id' && k !== 'cod_setor');
        const canDelete = ['funcionarios', 'setores'].includes(view);

        return (
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 uppercase text-xs font-semibold text-gray-500">
                        <tr>
                            {headers.map(h => <th key={h} className="p-4">{h.replace('_', ' ')}</th>)}
                            {view === 'funcionarios' && <th className="p-4">Setor</th>}
                            {canDelete && <th className="p-4 text-right">Ações</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredData.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                                {headers.map(h => <td key={h} className="p-4">{row[h]}</td>)}
                                {view === 'funcionarios' && <td className="p-4">{row.setores?.descricao}</td>}
                                {canDelete && (
                                    <td className="p-4 text-right">
                                        <button 
                                            onClick={() => handleDelete(row)}
                                            className="text-red-400 hover:text-red-600 transition-colors p-1"
                                            title="Excluir Registro"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="flex h-[calc(100vh-64px)]">
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
                <div className="p-4">
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Gestão de Pessoas</h2>
                    <nav className="space-y-1">
                        <button onClick={() => setView('dashboard')} className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${view === 'dashboard' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-700 hover:bg-gray-50'}`}>
                            <LayoutDashboard className="w-5 h-5 mr-3" /> Dashboard RH
                        </button>
                    </nav>
                </div>
                <div className="p-4 pt-0">
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Cadastros</h2>
                    <nav className="space-y-1">
                        <button onClick={() => setView('funcionarios')} className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${view === 'funcionarios' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-700 hover:bg-gray-50'}`}>
                            <Users className="w-5 h-5 mr-3" /> Funcionários
                        </button>
                        <button onClick={() => setView('setores')} className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${view === 'setores' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-700 hover:bg-gray-50'}`}>
                            <Box className="w-5 h-5 mr-3" /> Setores
                        </button>
                    </nav>
                </div>
            </aside>
            <main className="flex-1 bg-gray-50 p-8 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 capitalize">
                        {view === 'dashboard' ? 'Painel de RH' : `Gestão de ${view}`}
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

                {['funcionarios', 'setores'].includes(view) && (
                     <div className="relative mb-6">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                            placeholder={`Pesquisar em ${view}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                )}

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

// ==========================================
// MÓDULO ADMINISTRAÇÃO
// ==========================================
const AdministracaoModule = () => {
    const [view, setView] = useState<AdminView>('dashboard');
    const [showModal, setShowModal] = useState(false);
    const [listData, setListData] = useState<any[]>([]);

    useEffect(() => {
        setListData([]);
        loadData();
    }, [view]);

    const loadData = async () => {
        let data: any[] = [];
        if (view === 'usuarios') {
            const res = await supabase.from('usuarios').select('*').order('usuario');
            if (res.data) data = res.data;
        }
        setListData(data);
    };

    const handleSave = async (data: any) => {
        if (view === 'usuarios') {
            // Garantir que permissões sejam salvas, mesmo que vazio
            const payload = {
                ...data,
                // O SimpleForm retorna array de strings para checkboxes
                permissoes: data.permissoes || [] 
            };
            
            const { error } = await supabase.from('usuarios').insert(payload);
            if (error) {
                toast.error('Erro ao salvar usuário: ' + error.message);
            } else {
                toast.success('Usuário salvo com sucesso!');
                setShowModal(false);
                loadData();
            }
        }
    };

    const handleDelete = async (row: any) => {
        if (row.usuario === 'Wesley.benevides') {
            toast.warn('Não é possível excluir o usuário Master.');
            return;
        }
        
        if (!window.confirm(`Tem certeza que deseja excluir o usuário ${row.usuario}?`)) return;

        const { error } = await supabase.from('usuarios').delete().eq('id', row.id);

        if (error) {
             toast.error('Erro ao excluir: ' + error.message);
        } else {
            toast.success('Usuário excluído com sucesso.');
            loadData();
        }
    };

    const getFormConfig = () => {
        if (view === 'usuarios') {
            return {
                title: 'Novo Usuário',
                fields: [
                    { name: 'usuario', label: 'Nome de Usuário', required: true },
                    { name: 'senha', label: 'Senha', type: 'password', required: true },
                    { name: 'email', label: 'E-mail', type: 'email' },
                    { name: 'telefone', label: 'Telefone' },
                    { 
                        name: 'permissoes', 
                        label: 'Módulos Permitidos', 
                        type: 'checkbox-group', 
                        options: [
                            { value: 'almoxarifado', label: 'Almoxarifado' },
                            { value: 'rh', label: 'RH' },
                            { value: 'financeiro', label: 'Financeiro' },
                            { value: 'administracao', label: 'Administração' }
                        ]
                    }
                ]
            };
        }
        return null;
    };
    const formConfig = getFormConfig();

    const renderTable = () => {
        if (view === 'dashboard') return <DashboardAdmin />;

        if (listData.length === 0) return <div className="p-8 text-center text-gray-500">Nenhum registro encontrado.</div>;
        
        // Exibir colunas específicas
        return (
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 uppercase text-xs font-semibold text-gray-500">
                        <tr>
                            <th className="p-4">Usuário</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Permissões</th>
                            <th className="p-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {listData.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                                <td className="p-4 font-medium">{row.usuario}</td>
                                <td className="p-4">{row.email}</td>
                                <td className="p-4">
                                    <div className="flex gap-2">
                                        {row.permissoes && Array.isArray(row.permissoes) ? (
                                            row.permissoes.map((p: string) => (
                                                <span key={p} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs capitalize">
                                                    {p}
                                                </span>
                                            ))
                                        ) : <span className="text-gray-400 italic">Nenhuma</span>}
                                        {row.usuario === 'Wesley.benevides' && (
                                            <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-xs font-bold border border-emerald-200">MASTER</span>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    {row.usuario !== 'Wesley.benevides' && (
                                        <button 
                                            onClick={() => handleDelete(row)}
                                            className="text-red-400 hover:text-red-600 transition-colors p-1"
                                            title="Excluir Usuário"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="flex h-[calc(100vh-64px)]">
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
                <div className="p-4">
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Admin</h2>
                    <nav className="space-y-1">
                        <button onClick={() => setView('dashboard')} className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${view === 'dashboard' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-700 hover:bg-gray-50'}`}>
                            <LayoutDashboard className="w-5 h-5 mr-3" /> Dashboard
                        </button>
                        <button onClick={() => setView('usuarios')} className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${view === 'usuarios' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-700 hover:bg-gray-50'}`}>
                            <Users className="w-5 h-5 mr-3" /> Gerenciar Usuários
                        </button>
                    </nav>
                </div>
            </aside>
            <main className="flex-1 bg-gray-50 p-8 overflow-y-auto">
                 <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 capitalize">
                        {view === 'dashboard' ? 'Painel Administrativo' : 'Gestão de Usuários'}
                    </h1>
                    {formConfig && (
                        <button 
                            onClick={() => setShowModal(true)}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 flex items-center gap-2"
                        >
                            <span>+ Novo Usuário</span>
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
  const [currentModule, setCurrentModule] = useState<ModuleType>('almoxarifado');

  const handleLogout = () => setCurrentUser(null);

  // Determinar permissões
  const isMaster = currentUser?.usuario === 'Wesley.benevides';
  
  const hasAccess = (module: ModuleType) => {
    if (!currentUser) return false;
    if (isMaster) return true;
    return currentUser.permissoes && currentUser.permissoes.includes(module);
  };

  // Redirecionar se perder acesso ao modulo atual
  useEffect(() => {
    if (currentUser && !hasAccess(currentModule)) {
        // Tenta encontrar o primeiro módulo permitido
        const modules: ModuleType[] = ['almoxarifado', 'rh', 'financeiro', 'administracao'];
        const firstAllowed = modules.find(m => hasAccess(m));
        if (firstAllowed) setCurrentModule(firstAllowed);
    }
  }, [currentUser]);

  const renderModuleButton = (module: ModuleType, label: string, disabled: boolean = false) => {
      if (!hasAccess(module) && !disabled) return null; // Esconde visualmente o botão

      return (
        <button 
            onClick={() => !disabled && setCurrentModule(module)}
            className={`px-4 py-1.5 rounded shadow text-sm font-medium transition-colors 
                ${currentModule === module ? 'bg-emerald-600 text-white' : 'text-emerald-200 hover:text-white hover:bg-emerald-700/50'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
        >
            {label}
        </button>
      );
  };

  const renderContent = () => {
      // Se por algum motivo o estado ainda não atualizou mas o usuário não tem permissão
      if (!hasAccess(currentModule)) {
         return <div className="p-10 text-center text-gray-500">Acesso não autorizado a este módulo.</div>;
      }

      switch(currentModule) {
          case 'almoxarifado': return <AlmoxarifadoModule />;
          case 'rh': return <RHModule />;
          case 'administracao': return <AdministracaoModule />;
          default: return <div className="p-10 text-center">Módulo em desenvolvimento ou sem acesso.</div>;
      }
  };

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

            {/* Módulos Menu */}
            <div className="hidden md:flex space-x-1 bg-emerald-900/50 p-1 rounded-lg">
              {renderModuleButton('almoxarifado', 'Almoxarifado')}
              {renderModuleButton('rh', 'RH')}
              {renderModuleButton('financeiro', 'Financeiro', true)}
              {renderModuleButton('administracao', 'Administração')}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end mr-2">
                <span className="text-sm font-medium">{currentUser.usuario}</span>
                <span className="text-xs text-emerald-300">
                    {isMaster ? 'Master Admin' : 'Usuário'}
                </span>
              </div>
              
              <div className="h-8 w-[1px] bg-emerald-600 mx-1"></div>
              
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
          {renderContent()}
        </div>
      )}
    </>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);