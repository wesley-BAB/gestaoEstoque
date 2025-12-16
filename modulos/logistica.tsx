import React, { useState, useEffect } from 'react';
import { Truck, Calendar, AlertCircle, Clock, CheckCircle, CheckSquare, XCircle, Filter, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import { supabase } from '../supabase';
import { SimpleForm, SearchableSelect } from '../ui';
import { LogisticaView } from '../types';

export const LogisticaModule = () => {
    const [view, setView] = useState<LogisticaView>('solicitacoes');
    const [listData, setListData] = useState<any[]>([]);
    const [auxData, setAuxData] = useState<any>({});
    const [showModal, setShowModal] = useState(false);
    const [selectedReportId, setSelectedReportId] = useState(''); // Para filtro de fornecedor
    const [selectedDate, setSelectedDate] = useState(''); // Para filtro de data
    const currentUser = JSON.parse(localStorage.getItem('wes_erp_user') || '{}');
    const isTerceiro = currentUser.tipo === 'terceiro';

    useEffect(() => {
        setListData([]);
        setSelectedReportId('');
        setSelectedDate('');
        loadData();
    }, [view]);

    const loadData = async () => {
        let data: any[] = [];
        if (view === 'solicitacoes') {
             let query = supabase.from('solicitacoes_logistica').select('*, produtos(descricao), fornecedores(nome)').order('created_at', { ascending: false });
             if (isTerceiro && currentUser.fornecedor_id) {
                 query = query.eq('fornecedor_id', currentUser.fornecedor_id);
             }
             const res = await query;
             if (res.data) data = res.data;
        } else if (view === 'relatorio_fornecedor') {
             const res = await supabase.from('fornecedores').select('*').order('nome');
             if (res.data) setAuxData(prev => ({ ...prev, fornecedores: res.data }));
        }

        const prodRes = await supabase.from('produtos').select('cod_produto, descricao');
        const fornRes = await supabase.from('fornecedores').select('cod_fornecedor, nome');
        setAuxData(prev => ({ 
            ...prev, 
            produtos: prodRes.data,
            fornecedores: fornRes.data 
        }));
        
        if (view === 'solicitacoes') setListData(data);
    };

    const handleRunReport = async () => {
        let query = supabase.from('solicitacoes_logistica').select('*, produtos(descricao), fornecedores(nome)').order('created_at', { ascending: false });

        if (view === 'relatorio_fornecedor') {
            if (!selectedReportId) { toast.warn('Selecione um fornecedor.'); return; }
            query = query.eq('fornecedor_id', selectedReportId);
        } else if (view === 'relatorio_data') {
            if (!selectedDate) { toast.warn('Selecione uma data.'); return; }
            query = query.eq('data_desejada', selectedDate);
        }

        const res = await query;
        if (res.data) {
            setListData(res.data);
            if (res.data.length === 0) toast.info('Nenhum registro encontrado para este filtro.');
        } else {
            toast.error('Erro ao buscar relatório.');
        }
    };

    const handleSave = async (data: any) => {
        const payload = {
            ...data,
            fornecedor_id: isTerceiro ? currentUser.fornecedor_id : data.fornecedor_id,
            status: 'Pendente' 
        };

        const { error } = await supabase.from('solicitacoes_logistica').insert(payload);
        if (error) {
            toast.error('Erro ao criar solicitação: ' + error.message);
        } else {
            toast.success('Solicitação criada com sucesso!');
            setShowModal(false);
            if (view === 'solicitacoes') loadData();
        }
    };

    const handleStatusChange = async (id: number, newStatus: string) => {
        const { error } = await supabase.from('solicitacoes_logistica').update({ status: newStatus }).eq('id', id);
        if (error) {
            toast.error('Erro ao atualizar status.');
        } else {
            toast.success(`Status alterado para ${newStatus}`);
            setListData(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
        }
    };

    const getFormConfig = () => {
        const commonFields = [
            { 
                name: 'tipo', 
                label: 'Tipo de Solicitação', 
                type: 'select', 
                required: true,
                options: [
                    { value: 'Coleta', label: 'Coleta (Retirar Material)' },
                    { value: 'Entrega', label: 'Entrega (Entregar Material)' }
                ]
            },
            { 
                name: 'produto_id', 
                label: 'Material / Produto', 
                type: 'select', 
                required: true,
                options: auxData.produtos?.map((p:any) => ({ value: p.cod_produto, label: p.descricao }))
            },
            { name: 'quantidade', label: 'Quantidade', type: 'number', required: true },
            { name: 'data_desejada', label: 'Data Desejada', type: 'date', required: true },
            { 
                name: 'periodo', 
                label: 'Período Preferencial', 
                type: 'select', 
                required: true,
                options: [
                    { value: 'Manhã', label: 'Manhã (08h - 12h)' },
                    { value: 'Tarde', label: 'Tarde (13h - 18h)' },
                    { value: 'Comercial', label: 'Horário Comercial' }
                ]
            },
            { name: 'observacoes', label: 'Observações (Opcional)' }
        ];

        if (isTerceiro) {
            return { title: 'Nova Solicitação', fields: commonFields };
        } else {
            return {
                title: 'Registrar Solicitação para Fornecedor',
                fields: [
                    { 
                        name: 'fornecedor_id', 
                        label: 'Selecione o Fornecedor', 
                        type: 'select', 
                        required: true,
                        options: auxData.fornecedores?.map((f:any) => ({ value: f.cod_fornecedor, label: f.nome }))
                    },
                    ...commonFields
                ]
            };
        }
    };
    const formConfig = getFormConfig();

    const StatusBadge = ({ status }: { status: string }) => {
        let color = 'bg-gray-100 text-gray-600';
        let icon = AlertCircle;
        
        switch (status) {
            case 'Pendente': color = 'bg-yellow-100 text-yellow-700'; icon = Clock; break;
            case 'Aprovado': color = 'bg-blue-100 text-blue-700'; icon = CheckCircle; break;
            case 'Em Trânsito': color = 'bg-purple-100 text-purple-700'; icon = Truck; break;
            case 'Concluído': color = 'bg-green-100 text-green-700'; icon = CheckSquare; break;
            case 'Recusado': color = 'bg-red-100 text-red-700'; icon = XCircle; break;
        }
        const IconComp = icon;
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
                <IconComp className="w-3.5 h-3.5" />
                {status}
            </span>
        );
    };

    const renderToolbar = () => {
        if (view === 'relatorio_fornecedor') {
            return (
                <div className="flex gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Selecione o Fornecedor</label>
                        <SearchableSelect 
                            options={auxData.fornecedores?.map((f: any) => ({ value: f.cod_fornecedor, label: f.nome }))} 
                            value={selectedReportId} 
                            onChange={setSelectedReportId} 
                            placeholder="Buscar fornecedor..." 
                        />
                    </div>
                    <button onClick={handleRunReport} className="btn-primary"><Filter className="w-4 h-4" /> Visualizar</button>
                </div>
            );
        }
        if (view === 'relatorio_data') {
            return (
                <div className="flex gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Selecione a Data Desejada</label>
                        <input type="date" className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                    </div>
                    <button onClick={handleRunReport} className="btn-primary"><Filter className="w-4 h-4" /> Visualizar</button>
                </div>
            );
        }
        return null;
    };

    const renderTable = () => {
        if ((view === 'relatorio_fornecedor' || view === 'relatorio_data') && listData.length === 0) {
             return <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg border border-gray-200 text-gray-400"><Filter className="w-12 h-12 mb-2 opacity-50" /><p>Utilize os filtros acima para gerar o relatório.</p></div>;
        }

        if (listData.length === 0) return <div className="p-8 text-center text-gray-500">Nenhuma solicitação encontrada.</div>;

        return (
            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Tipo</th>
                            <th>Fornecedor</th>
                            <th>Material</th>
                            <th>Qtd</th>
                            <th>Data / Período</th>
                            <th>Status</th>
                            {!isTerceiro && <th className="text-right">Ações</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {listData.map((row) => (
                            <tr key={row.id}>
                                <td className="font-mono text-xs">#{row.id}</td>
                                <td><span className={`font-medium ${row.tipo === 'Coleta' ? 'text-blue-600' : 'text-orange-600'}`}>{row.tipo}</span></td>
                                <td className="font-medium text-gray-800">{row.fornecedores?.nome || 'N/A'}</td>
                                <td>{row.produtos?.descricao}</td>
                                <td className="font-bold">{row.quantidade}</td>
                                <td>
                                    <div className="flex flex-col">
                                        <span className="flex items-center gap-1 text-gray-700"><Calendar className="w-3 h-3"/> {new Date(row.data_desejada).toLocaleDateString('pt-BR')}</span>
                                        <span className="text-xs text-gray-500">{row.periodo}</span>
                                    </div>
                                </td>
                                <td><StatusBadge status={row.status} /></td>
                                
                                {!isTerceiro && (
                                    <td className="text-right">
                                        {row.status === 'Pendente' && (
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleStatusChange(row.id, 'Aprovado')} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Aprovar"><CheckCircle className="w-5 h-5" /></button>
                                                <button onClick={() => handleStatusChange(row.id, 'Recusado')} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Recusar"><XCircle className="w-5 h-5" /></button>
                                            </div>
                                        )}
                                        {row.status === 'Aprovado' && (
                                            <button onClick={() => handleStatusChange(row.id, 'Em Trânsito')} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200">Iniciar Trânsito</button>
                                        )}
                                        {row.status === 'Em Trânsito' && (
                                            <button onClick={() => handleStatusChange(row.id, 'Concluído')} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200">Concluir</button>
                                        )}
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
                    <h2 className="sidebar-title">Logística</h2>
                    <nav className="sidebar-nav">
                        <button onClick={() => setView('solicitacoes')} className={`sidebar-btn ${view === 'solicitacoes' ? 'active' : ''}`}>
                            <Truck /> {isTerceiro ? 'Minhas Solicitações' : 'Gerenciar Solicitações'}
                        </button>
                    </nav>
                </div>
                {!isTerceiro && (
                    <div className="sidebar-section pt-0">
                        <h2 className="sidebar-title">Relatórios</h2>
                        <nav className="sidebar-nav">
                            <button onClick={() => setView('relatorio_fornecedor')} className={`sidebar-btn ${view === 'relatorio_fornecedor' ? 'active' : ''}`}>
                                <Users /> Por Fornecedor
                            </button>
                            <button onClick={() => setView('relatorio_data')} className={`sidebar-btn ${view === 'relatorio_data' ? 'active' : ''}`}>
                                <Calendar /> Por Data
                            </button>
                        </nav>
                    </div>
                )}
            </aside>
            <main className="main-content">
                 <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 capitalize">
                        {view === 'solicitacoes' 
                            ? (isTerceiro ? 'Minhas Solicitações' : 'Central de Solicitações') 
                            : view.replace('relatorio_', 'Relatório por ').replace('_', ' ')}
                    </h1>
                    <button onClick={() => setShowModal(true)} className="btn-primary">
                        <Truck className="w-4 h-4" /> Nova Solicitação
                    </button>
                </div>
                {renderToolbar()}
                {renderTable()}
                {showModal && formConfig && (<SimpleForm title={formConfig.title} fields={formConfig.fields} onSubmit={handleSave} onClose={() => setShowModal(false)} />)}
            </main>
        </div>
    );
};