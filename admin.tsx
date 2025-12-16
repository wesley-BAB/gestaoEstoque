import React, { useState, useEffect } from 'react';
import { Users, UserCircle, Truck, LayoutDashboard, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { supabase } from './supabase';
import { Card, SimpleForm } from './ui';
import { AdminView } from './types';
import { sha256 } from './utils';

const DashboardAdmin = () => {
    const [stats, setStats] = useState({ totalUsuarios: 0, funcionarios: 0, terceiros: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            const { data: users } = await supabase.from('usuarios').select('tipo');
            if (users) {
                const total = users.length;
                const func = users.filter(u => u.tipo === 'funcionario' || !u.tipo).length;
                const terc = users.filter(u => u.tipo === 'terceiro').length;
                setStats({ totalUsuarios: total, funcionarios: func, terceiros: terc });
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Visão Geral Administrativa</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card title="Total de Usuários" value={stats.totalUsuarios} icon={Users} colorClass="bg-blue-600" />
                <Card title="Funcionários Internos" value={stats.funcionarios} icon={UserCircle} colorClass="bg-emerald-600" />
                <Card title="Terceiros / Fornecedores" value={stats.terceiros} icon={Truck} colorClass="bg-orange-600" />
            </div>
        </div>
    );
};

export const AdministracaoModule = () => {
    const [view, setView] = useState<AdminView>('dashboard');
    const [userTab, setUserTab] = useState<'funcionario' | 'terceiro'>('funcionario');
    const [showModal, setShowModal] = useState(false);
    const [listData, setListData] = useState<any[]>([]);
    const [auxData, setAuxData] = useState<any>({});

    useEffect(() => {
        setListData([]);
        loadData();
    }, [view]);

    const loadData = async () => {
        let data: any[] = [];
        if (view === 'usuarios') {
            const res = await supabase.from('usuarios').select('*, funcionarios(nome), fornecedores(nome)').order('usuario');
            if (res.data) data = res.data;
            const funcRes = await supabase.from('funcionarios').select('id, nome, matricula');
            const fornRes = await supabase.from('fornecedores').select('cod_fornecedor, nome, cnpj');
            setAuxData({
                funcionarios: funcRes.data || [],
                fornecedores: fornRes.data || []
            });
        }
        setListData(data);
    };

    const handleSave = async (data: any) => {
        if (view === 'usuarios') {
            let hashedPassword = data.senha;
            if (data.senha) {
                hashedPassword = await sha256(data.senha);
            }
            const payload = {
                usuario: data.usuario,
                senha: hashedPassword,
                email: data.email,
                telefone: data.telefone,
                permissoes: data.permissoes || [],
                tipo: data.tipo,
                funcionario_id: data.tipo === 'funcionario' ? data.funcionario_id : null,
                fornecedor_id: data.tipo === 'terceiro' ? data.fornecedor_id : null
            };
            const { error } = await supabase.from('usuarios').insert(payload);
            if (error) toast.error('Erro ao salvar usuário: ' + error.message);
            else { toast.success('Usuário salvo com sucesso!'); setShowModal(false); loadData(); }
        }
    };

    const handleDelete = async (row: any) => {
        if (row.usuario === 'Wesley.benevides') { toast.warn('Não é possível excluir o usuário Master.'); return; }
        if (!window.confirm(`Tem certeza que deseja excluir o usuário ${row.usuario}?`)) return;
        const { error } = await supabase.from('usuarios').delete().eq('id', row.id);
        if (error) toast.error('Erro ao excluir: ' + error.message);
        else { toast.success('Usuário excluído com sucesso.'); loadData(); }
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
                    { name: 'tipo', label: 'Tipo de Usuário', type: 'select', required: true, options: [{ value: 'funcionario', label: 'Funcionário Interno (RH)' }, { value: 'terceiro', label: 'Terceiro (Fornecedor)' }] },
                    { name: 'funcionario_id', label: 'Vincular a Funcionário', type: 'select', required: true, showIf: { field: 'tipo', value: 'funcionario' }, options: auxData.funcionarios?.map((f:any) => ({ value: f.id, label: `${f.nome} (Matr: ${f.matricula})` })) },
                    { name: 'fornecedor_id', label: 'Vincular a Fornecedor', type: 'select', required: true, showIf: { field: 'tipo', value: 'terceiro' }, options: auxData.fornecedores?.map((f:any) => ({ value: f.cod_fornecedor, label: `${f.nome} (CNPJ: ${f.cnpj})` })) },
                    { name: 'permissoes', label: 'Módulos Permitidos', type: 'checkbox-group', options: [{ value: 'almoxarifado', label: 'Almoxarifado' }, { value: 'rh', label: 'RH' }, { value: 'logistica', label: 'Logística' }, { value: 'administracao', label: 'Administração' }] }
                ]
            };
        }
        return null;
    };
    const formConfig = getFormConfig();

    const renderTable = () => {
        if (view === 'dashboard') return <DashboardAdmin />;

        const filteredData = listData.filter(user => {
            if (userTab === 'funcionario') return user.tipo === 'funcionario' || !user.tipo;
            if (userTab === 'terceiro') return user.tipo === 'terceiro';
            return true;
        });

        return (
            <div className="flex flex-col h-full">
                <div className="flex border-b border-gray-200 mb-4">
                    <button onClick={() => setUserTab('funcionario')} className={`py-2 px-4 font-medium text-sm focus:outline-none ${userTab === 'funcionario' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}>Funcionários (Internos)</button>
                    <button onClick={() => setUserTab('terceiro')} className={`py-2 px-4 font-medium text-sm focus:outline-none ${userTab === 'terceiro' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}>Terceiros (Fornecedores)</button>
                </div>

                {filteredData.length === 0 ? <div className="p-8 text-center text-gray-500">Nenhum usuário encontrado nesta categoria.</div> : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Usuário</th>
                                    <th>Vinculado a</th>
                                    <th>Email</th>
                                    <th>Permissões</th>
                                    <th className="text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((row, idx) => (
                                    <tr key={idx}>
                                        <td className="font-medium">{row.usuario}</td>
                                        <td className="text-gray-800">{row.tipo === 'terceiro' ? (row.fornecedores?.nome || <span className="text-gray-400 italic">Não vinculado</span>) : (row.funcionarios?.nome || <span className="text-gray-400 italic">Não vinculado</span>)}</td>
                                        <td>{row.email}</td>
                                        <td>
                                            <div className="flex gap-2 flex-wrap max-w-xs">
                                                {row.permissoes && Array.isArray(row.permissoes) ? (row.permissoes.map((p: string) => <span key={p} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs capitalize">{p}</span>)) : <span className="text-gray-400 italic">Nenhuma</span>}
                                                {row.usuario === 'Wesley.benevides' && <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-xs font-bold border border-emerald-200">MASTER</span>}
                                            </div>
                                        </td>
                                        <td className="text-right">
                                            {row.usuario !== 'Wesley.benevides' && (<button onClick={() => handleDelete(row)} className="text-red-400 hover:text-red-600 transition-colors p-1" title="Excluir Usuário"><Trash2 className="w-4 h-4" /></button>)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="main-layout">
            <aside className="sidebar">
                <div className="sidebar-section">
                    <h2 className="sidebar-title">Admin</h2>
                    <nav className="sidebar-nav">
                        <button onClick={() => setView('dashboard')} className={`sidebar-btn ${view === 'dashboard' ? 'active' : ''}`}><LayoutDashboard /> Dashboard</button>
                        <button onClick={() => setView('usuarios')} className={`sidebar-btn ${view === 'usuarios' ? 'active' : ''}`}><Users /> Gerenciar Usuários</button>
                    </nav>
                </div>
            </aside>
            <main className="main-content">
                 <div className="flex justify-between items-center mb-6"><h1 className="text-2xl font-bold text-gray-800 capitalize">{view === 'dashboard' ? 'Painel Administrativo' : 'Gestão de Usuários'}</h1>{formConfig && (<button onClick={() => setShowModal(true)} className="btn-primary"><span>+ Novo Usuário</span></button>)}</div>
                {renderTable()}
                {showModal && formConfig && (<SimpleForm title={formConfig.title} fields={formConfig.fields} onSubmit={handleSave} onClose={() => setShowModal(false)} />)}
            </main>
        </div>
    );
};