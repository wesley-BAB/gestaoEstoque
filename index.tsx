import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { ToastContainer } from 'react-toastify';
import { Package, Users, Truck, ArrowRightLeft, Shield, Settings, Lock, LogOut, Navigation } from 'lucide-react';
import { Login, ChangePasswordModal } from './auth';
import { AlmoxarifadoModule } from './modulos/almoxarifado';
import { RHModule } from './modulos/rh';
import { LogisticaModule } from './modulos/logistica';
import { AdministracaoModule } from './modulos/admin';
import { ModuleType } from './types';
import './styles.css'; // Importante: Carrega os estilos globais

// --- Tela Inicial (Home) ---
const HomeView = ({ currentUser, onSelectModule, hasAccess }: any) => {
    return (
        <main className="main-content">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Olá, {currentUser.usuario}!</h1>
                    <p className="text-gray-500 mt-2">Selecione um módulo para começar a trabalhar.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {hasAccess('almoxarifado') && (
                        <div onClick={() => onSelectModule('almoxarifado')} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors"><Package className="w-8 h-8 text-blue-600" /></div>
                                <ArrowRightLeft className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">Almoxarifado</h3>
                            <p className="text-gray-500 text-sm mt-2">Gestão de produtos, entradas, saídas e controle de estoque.</p>
                        </div>
                    )}
                    {hasAccess('rh') && (
                        <div onClick={() => onSelectModule('rh')} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors"><Users className="w-8 h-8 text-purple-600" /></div>
                                <ArrowRightLeft className="w-5 h-5 text-gray-300 group-hover:text-purple-500 transition-colors" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">Recursos Humanos</h3>
                            <p className="text-gray-500 text-sm mt-2">Gestão de funcionários, setores e hierarquia.</p>
                        </div>
                    )}
                    {hasAccess('logistica') && (
                        <div onClick={() => onSelectModule('logistica')} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors"><Truck className="w-8 h-8 text-orange-600" /></div>
                                <Navigation className="w-5 h-5 text-gray-300 group-hover:text-orange-500 transition-colors" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">Logística</h3>
                            <p className="text-gray-500 text-sm mt-2">Gestão de frota, entregas e monitoramento de terceiros.</p>
                        </div>
                    )}
                    {hasAccess('administracao') && (
                        <div onClick={() => onSelectModule('administracao')} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-gray-800 rounded-lg group-hover:bg-gray-700 transition-colors"><Shield className="w-8 h-8 text-white" /></div>
                                <Settings className="w-5 h-5 text-gray-300 group-hover:text-gray-600 transition-colors" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">Administração</h3>
                            <p className="text-gray-500 text-sm mt-2">Gestão de usuários (internos e terceiros) e permissões.</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
};

// --- App Principal ---
const App = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentModule, setCurrentModule] = useState<ModuleType>('home');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('wes_erp_user');
    if (savedUser) {
        try { setCurrentUser(JSON.parse(savedUser)); } catch (e) { console.error('Erro ao restaurar sessão', e); }
    }
  }, []);

  const handleLogout = () => { localStorage.removeItem('wes_erp_user'); setCurrentUser(null); setCurrentModule('home'); };
  const isMaster = currentUser?.usuario === 'Wesley.benevides';
  const hasAccess = (module: ModuleType) => {
    if (!currentUser) return false;
    if (module === 'home') return true;
    if (isMaster) return true;
    return currentUser.permissoes && currentUser.permissoes.includes(module);
  };
  useEffect(() => { if (currentUser && !hasAccess(currentModule)) setCurrentModule('home'); }, [currentUser, currentModule]);

  const renderModuleButton = (module: ModuleType, label: string, disabled: boolean = false) => {
      if (!hasAccess(module) && !disabled) return null; 
      return (
        <button 
            onClick={() => !disabled && setCurrentModule(module)}
            className={`header-nav-btn ${currentModule === module ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
        >
            {label}
        </button>
      );
  };

  const renderContent = () => {
      if (!hasAccess(currentModule)) return <div className="p-10 text-center text-gray-500">Acesso não autorizado a este módulo.</div>;
      switch(currentModule) {
          case 'home': return <HomeView currentUser={currentUser} onSelectModule={setCurrentModule} hasAccess={hasAccess} />;
          case 'almoxarifado': return <AlmoxarifadoModule />;
          case 'rh': return <RHModule />;
          case 'administracao': return <AdministracaoModule />;
          case 'logistica': return <LogisticaModule />;
          default: return <div className="p-10 text-center">Módulo em desenvolvimento ou sem acesso.</div>;
      }
  };

  return (
    <div className="app-container">
      <ToastContainer position="top-right" autoClose={3000} />
      {!currentUser ? ( <Login onLogin={setCurrentUser} /> ) : (
        <>
          <header className="app-header">
            <div className="header-logo" onClick={() => setCurrentModule('home')} title="Ir para o Início">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-emerald-800 font-bold text-lg">W</div>
              <span className="font-bold text-xl tracking-wide">Wes ERP</span>
            </div>
            {currentModule !== 'home' && (
                <div className="header-nav">
                {renderModuleButton('almoxarifado', 'Almoxarifado')}
                {renderModuleButton('rh', 'RH')}
                {renderModuleButton('logistica', 'Logística')}
                {renderModuleButton('administracao', 'Admin')}
                </div>
            )}
            {currentModule === 'home' && <div className="flex-1"></div>}
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end mr-2 text-right">
                <span className="text-sm font-medium">{currentUser.usuario}</span>
                <span className="text-xs text-emerald-300">{isMaster ? 'Master' : (currentUser.tipo === 'terceiro' ? 'Fornecedor' : 'Func.')}</span>
              </div>
              <div className="h-8 w-[1px] bg-emerald-600 mx-1"></div>
              <button onClick={() => setShowPasswordModal(true)} className="p-2 text-emerald-200 hover:text-white hover:bg-emerald-700/50 rounded-full transition" title="Alterar Senha"><Lock className="w-5 h-5" /></button>
              <button onClick={handleLogout} className="p-2 text-red-300 hover:text-red-100 hover:bg-red-900/50 rounded-full transition" title="Sair"><LogOut className="w-5 h-5" /></button>
            </div>
          </header>
          {renderContent()}
          {showPasswordModal && (<ChangePasswordModal user={currentUser} onClose={() => setShowPasswordModal(false)} onUpdateUser={(updatedUser: any) => { setCurrentUser(updatedUser); localStorage.setItem('wes_erp_user', JSON.stringify(updatedUser)); }} />)}
        </>
      )}
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);