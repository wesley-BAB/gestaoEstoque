import React, { useState } from 'react';
import { User, Lock, ArrowRight, PenLine, KeyRound } from 'lucide-react';
import { toast } from 'react-toastify';
import { supabase } from './supabase';
import { sha256 } from './utils';

export const Login = ({ onLogin }: { onLogin: (user: any) => void }) => {
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
        .maybeSingle();

      if (error) {
        toast.error('Erro ao acessar o banco de dados.');
      } else if (!data) {
        toast.error('Usuário não encontrado.');
      } else {
        const hashedInput = await sha256(pass.trim());
        
        if (data.senha === hashedInput) {
            toast.success(`Bem-vindo, ${data.usuario}!`);
            localStorage.setItem('wes_erp_user', JSON.stringify(data));
            onLogin(data);
        } else if (data.senha === pass.trim()) {
            toast.success(`Bem-vindo, ${data.usuario}!`);
            toast.info("Recomendamos alterar sua senha para maior segurança.");
            localStorage.setItem('wes_erp_user', JSON.stringify(data));
            onLogin(data);
        } else {
            toast.error('Senha incorreta.');
        }
      }
    } catch (err) {
      toast.error('Erro inesperado de conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f6f8] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-200/20 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-200/20 rounded-full blur-[100px]"></div>

      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-[420px] p-10 z-10 relative">
        <div className="flex flex-col items-center mb-10">
          <div className="bg-emerald-500 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-200">
            <PenLine className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">WES</h1>
          <p className="text-emerald-500 text-[10px] font-bold tracking-[0.2em] mt-1.5 uppercase">Gestão Inteligente</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Usuário</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
              </div>
              <input 
                type="text" 
                value={user}
                onChange={(e) => setUser(e.target.value)}
                className="w-full bg-slate-100/80 border-none rounded-xl py-3.5 pl-12 text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all duration-200"
                placeholder="Ex: wesley.benevides"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Senha</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
              </div>
              <input 
                type="password" 
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                className="w-full bg-slate-100/80 border-none rounded-xl py-3.5 pl-12 text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all duration-200"
                placeholder="••••••••"
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-500 text-white py-3.5 rounded-xl hover:bg-emerald-600 transition-all duration-200 font-semibold shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? 'Acessando...' : 'Entrar'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
};

export const ChangePasswordModal = ({ user, onClose, onUpdateUser }: any) => {
    const [currentPass, setCurrentPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (newPass !== confirmPass) {
            toast.error('As novas senhas não coincidem.');
            return;
        }
        
        if (newPass.length < 4) {
             toast.error('A nova senha deve ter pelo menos 4 caracteres.');
             return;
        }

        setLoading(true);

        try {
             const hashedCurrent = await sha256(currentPass);
             const { data: dbUser, error: fetchError } = await supabase
                .from('usuarios')
                .select('senha')
                .eq('cod_usuario', user.cod_usuario || user.id) // Fallback para id se cod_usuario nao existir no objeto local
                .single();
             
             if (fetchError || !dbUser) {
                 toast.error('Erro ao verificar usuário.');
                 setLoading(false);
                 return;
             }

             const isCurrentValid = dbUser.senha === hashedCurrent || dbUser.senha === currentPass;

             if (!isCurrentValid) {
                 toast.error('A senha atual está incorreta.');
                 setLoading(false);
                 return;
             }

             const hashedNew = await sha256(newPass);
             const { error: updateError } = await supabase
                .from('usuarios')
                .update({ senha: hashedNew })
                .eq('cod_usuario', user.cod_usuario || user.id);

             if (updateError) {
                 toast.error('Erro ao atualizar senha: ' + updateError.message);
             } else {
                 toast.success('Senha alterada com sucesso!');
                 onUpdateUser({ ...user, senha: hashedNew });
                 onClose();
             }

        } catch (err) {
            console.error(err);
            toast.error('Erro inesperado.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden">
                <div className="px-6 py-4 bg-emerald-600 flex justify-between items-center">
                    <h3 className="text-white font-semibold flex items-center gap-2"><KeyRound className="w-4 h-4"/> Alterar Senha</h3>
                    <button onClick={onClose} className="text-white hover:text-emerald-200">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Senha Atual</label>
                        <input type="password" required className="w-full border border-gray-300 rounded p-2" value={currentPass} onChange={e => setCurrentPass(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
                        <input type="password" required className="w-full border border-gray-300 rounded p-2" value={newPass} onChange={e => setNewPass(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nova Senha</label>
                        <input type="password" required className="w-full border border-gray-300 rounded p-2" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} />
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                        <button type="button" onClick={onClose} className="px-3 py-2 text-gray-600 text-sm hover:bg-gray-100 rounded">Cancelar</button>
                        <button type="submit" disabled={loading} className="px-3 py-2 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700">
                            {loading ? 'Salvando...' : 'Alterar Senha'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};