import React, { useState, useEffect } from 'react';
import { Users, Briefcase, LayoutDashboard, Box, Search, Trash2, Edit } from 'lucide-react';
import { toast } from 'react-toastify';
import { supabase } from '../supabase';
import { Card, SimpleForm, ConfirmModal } from '../ui';
import { RHView } from '../types';

const DashboardRH = () => {
    const [stats, setStats] = useState({ totalFuncionarios: 0, totalSetores: 0 });
    useEffect(() => {
      const fetch = async () => {
        const { count: countFunc } = await supabase.from('funcionarios').select('*', { count: 'exact', head: true });
        const { count: countSetores } = await supabase.from('setores').select('*', { count: 'exact', head: true });
        setStats({ totalFuncionarios: countFunc || 0, totalSetores: countSetores || 0 });
      };
      fetch();
    }, []);
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Visão Geral de RH</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Funcionários Ativos" value={stats.totalFuncionarios} icon={Users} colorClass="bg-purple-500" />
          <Card title="Setores Cadastrados" value={stats.totalSetores} icon={Briefcase} colorClass="bg-orange-500" />
        </div>
      </div>
    );
};

export const RHModule = () => {
    const [view, setView] = useState<RHView>('dashboard');
    const [showModal, setShowModal] = useState(false);
    const [listData, setListData] = useState<any[]>([]);
    const [auxData, setAuxData] = useState<any>({});
    const [searchTerm, setSearchTerm] = useState('');

    // Estados para edição e exclusão
    const [editingItem, setEditingItem] = useState<any>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<any>(null);
  
    useEffect(() => { setSearchTerm(''); setListData([]); loadData(); }, [view]);
  
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
        let pkField = 'id';
        let pkValue = null;

        if (view === 'funcionarios') {
            table = 'funcionarios';
            pkValue = editingItem?.id;
        } else if (view === 'setores') {
            table = 'setores';
            pkField = 'cod_setor';
            pkValue = editingItem?.cod_setor;
        }

        if (!table) return;

        let error;
        if (editingItem) {
             const { setores, ...cleanPayload } = data; // Remove join
             const { error: err } = await supabase.from(table).update(cleanPayload).eq(pkField, pkValue);
             error = err;
        } else {
             const { error: err } = await supabase.from(table).insert(data);
             error = err;
        }

        if (error) toast.error('Erro ao salvar: ' + error.message); 
        else { 
            toast.success('Registro salvo com sucesso!'); 
            setShowModal(false); 
            setEditingItem(null); 
            loadData(); 
        }
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;

        let table = ''; let pkField = 'id'; let id = itemToDelete.id;
        if (view === 'funcionarios') { table = 'funcionarios'; } 
        else if (view === 'setores') { table = 'setores'; pkField = 'cod_setor'; id = itemToDelete.cod_setor; }
        
        if (!table) return;

        const { error } = await supabase.from(table).delete().eq(pkField, id);
        
        if (error) { 
            if (error.code === '23503') toast.error('Não é possível excluir: Existem funcionários vinculados a este setor.'); 
            else toast.error('Erro ao excluir: ' + error.message); 
        } 
        else { 
            toast.success('Registro excluído com sucesso.'); 
            loadData(); 
        }
        setDeleteModalOpen(false);
        setItemToDelete(null);
      };

    const handleDeleteClick = (row: any) => {
        setItemToDelete(row);
        setDeleteModalOpen(true);
    };

    const handleEditClick = (row: any) => {
        setEditingItem(row);
        setShowModal(true);
    };

    const getFormConfig = () => {
        if (view === 'funcionarios') return { title: editingItem ? 'Editar Funcionário' : 'Novo Funcionário', fields: [ { name: 'nome', label: 'Nome Completo', required: true }, { name: 'matricula', label: 'Matrícula', required: true }, { name: 'setor_id', label: 'Setor', type: 'select', required: true, options: auxData.setores?.map((s:any) => ({ value: s.cod_setor, label: s.descricao })) } ] };
        if (view === 'setores') return { title: editingItem ? 'Editar Setor' : 'Novo Setor', fields: [ { name: 'descricao', label: 'Descrição do Setor', required: true } ] };
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
            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            {headers.map(h => <th key={h}>{h.replace('_', ' ')}</th>)}
                            {view === 'funcionarios' && <th>Setor</th>}
                            {canDelete && <th className="text-right">Ações</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((row, idx) => (
                            <tr key={idx}>
                                {headers.map(h => <td key={h}>{row[h]}</td>)}
                                {view === 'funcionarios' && <td>{row.setores?.descricao}</td>}
                                {canDelete && (
                                    <td className="text-right whitespace-nowrap">
                                        <button onClick={() => handleEditClick(row)} className="text-blue-400 hover:text-blue-600 transition-colors p-1 mr-2" title="Editar"><Edit className="w-4 h-4" /></button>
                                        <button onClick={() => handleDeleteClick(row)} className="text-red-400 hover:text-red-600 transition-colors p-1" title="Excluir"><Trash2 className="w-4 h-4" /></button>
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
        <div className="main-layout">
            <aside className="sidebar">
                <div className="sidebar-section">
                    <h2 className="sidebar-title">Gestão de Pessoas</h2>
                    <nav className="sidebar-nav">
                        <button onClick={() => setView('dashboard')} className={`sidebar-btn ${view === 'dashboard' ? 'active' : ''}`}><LayoutDashboard /> Dashboard RH</button>
                    </nav>
                </div>
                <div className="sidebar-section pt-0">
                    <h2 className="sidebar-title">Cadastros</h2>
                    <nav className="sidebar-nav">
                        <button onClick={() => setView('funcionarios')} className={`sidebar-btn ${view === 'funcionarios' ? 'active' : ''}`}><Users /> Funcionários</button>
                        <button onClick={() => setView('setores')} className={`sidebar-btn ${view === 'setores' ? 'active' : ''}`}><Box /> Setores</button>
                    </nav>
                </div>
            </aside>
            <main className="main-content">
                <div className="flex justify-between items-center mb-6"><h1 className="text-2xl font-bold text-gray-800 capitalize">{view === 'dashboard' ? 'Painel de RH' : `Gestão de ${view}`}</h1>{formConfig && (<button onClick={() => { setEditingItem(null); setShowModal(true); }} className="btn-primary"><span>+ Novo Registro</span></button>)}</div>
                {['funcionarios', 'setores'].includes(view) && (<div className="relative mb-6"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-5 w-5 text-gray-400" /></div><input type="text" className="input-search" placeholder={`Pesquisar em ${view}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>)}
                {renderTable()}
                {showModal && formConfig && (<SimpleForm title={formConfig.title} fields={formConfig.fields} onSubmit={handleSave} onClose={() => setShowModal(false)} initialValues={editingItem} />)}
                {deleteModalOpen && (<ConfirmModal title="Confirmar Exclusão" message="Tem certeza que deseja excluir este registro?" onConfirm={confirmDelete} onCancel={() => setDeleteModalOpen(false)} isDestructive={true} />)}
            </main>
        </div>
    );
};