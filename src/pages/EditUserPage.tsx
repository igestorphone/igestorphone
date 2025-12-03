import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Shield, Eye, EyeOff, Save, ArrowLeft, Trash2 } from 'lucide-react';
import { usersApi } from '@/lib/api';

interface UserFormData {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
  telefone: string;
  tipo: string;
  isActive: boolean;
  permissions: string[];
}


const EditUserPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [formData, setFormData] = useState<UserFormData>({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    telefone: '',
    tipo: 'user',
    isActive: true,
    permissions: []
  });

  useEffect(() => {
    if (id) {
      loadUser();
    }
  }, [id]);

  const loadUser = async () => {
    try {
      setLoadingUser(true);
      const response = await usersApi.getById(id!);
      console.log('📥 Resposta da API getById:', response);
      
      // Backend retorna { user: {...} } diretamente
      // apiClient.get retorna response.data, então temos { user: {...} }
      const user = (response as any).user || (response as any).data?.user || (response as any).data;
      console.log('👤 Usuário carregado:', user);
      
      if (!user) {
        throw new Error('Usuário não encontrado');
      }
      
      setFormData({
        nome: user.name || '',
        email: user.email || '',
        senha: '',
        confirmarSenha: '',
        telefone: user.telefone || '',
        tipo: user.tipo || 'user',
        isActive: user.is_active !== false,
        permissions: user.tipo === 'admin' ? (user.permissions || []) : ['consultar_listas', 'medias_preco', 'buscar_iphone_barato']
      });
    } catch (error: any) {
      console.error('Erro ao carregar usuário:', error);
      setErrors({ submit: error.response?.data?.message || 'Erro ao carregar dados do usuário' });
    } finally {
      setLoadingUser(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    
    // Limpar erro quando usuário começar a digitar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };


  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (formData.senha && formData.senha.length < 6) {
      newErrors.senha = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (formData.senha !== formData.confirmarSenha) {
      newErrors.confirmarSenha = 'Senhas não coincidem';
    }

    if (!formData.telefone.trim()) {
      newErrors.telefone = 'Telefone é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const updateData: any = {
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        tipo: formData.tipo,
        is_active: formData.isActive,
        permissions: formData.permissions
      };

      // Só incluir senha se foi preenchida
      if (formData.senha) {
        updateData.senha = formData.senha;
      }

      await usersApi.update(id!, updateData);
      navigate('/manage-users');
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      setErrors({ submit: 'Erro ao atualizar usuário. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    try {
      await usersApi.delete(id!);
      navigate('/manage-users');
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      setErrors({ submit: 'Erro ao deletar usuário' });
    }
  };

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white/70">Carregando usuário...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex items-center space-x-4"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/manage-users')}
          className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-3xl font-bold text-white"
          >
            Editar Usuário
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-white/70 mt-1"
          >
            Atualize as informações do usuário
          </motion.p>
        </div>
      </motion.div>

      {/* Form */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="glass rounded-xl p-8"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Dados Básicos */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-400" />
              Dados Básicos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  className={`input-primary w-full ${errors.nome ? 'border-red-500' : ''}`}
                  placeholder="Digite o nome completo"
                />
                {errors.nome && <p className="text-red-400 text-sm mt-1">{errors.nome}</p>}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`input-primary w-full ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="Digite o email"
                />
                {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
              >
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Telefone *
                </label>
                <input
                  type="tel"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleInputChange}
                  className={`input-primary w-full ${errors.telefone ? 'border-red-500' : ''}`}
                  placeholder="(11) 99999-9999"
                />
                {errors.telefone && <p className="text-red-400 text-sm mt-1">{errors.telefone}</p>}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 1.0 }}
              >
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Tipo de Usuário
                </label>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleInputChange}
                  className="input-primary w-full"
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                </select>
              </motion.div>
            </div>
          </motion.div>

          {/* Senha */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-green-400" />
              Alterar Senha (Opcional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
              >
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Nova Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="senha"
                    value={formData.senha}
                    onChange={handleInputChange}
                    className={`input-primary w-full pr-10 ${errors.senha ? 'border-red-500' : ''}`}
                    placeholder="Deixe em branco para manter a senha atual"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.senha && <p className="text-red-400 text-sm mt-1">{errors.senha}</p>}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 1.0 }}
              >
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  name="confirmarSenha"
                  value={formData.confirmarSenha}
                  onChange={handleInputChange}
                  className={`input-primary w-full ${errors.confirmarSenha ? 'border-red-500' : ''}`}
                  placeholder="Confirme a nova senha"
                />
                {errors.confirmarSenha && <p className="text-red-400 text-sm mt-1">{errors.confirmarSenha}</p>}
              </motion.div>
            </div>
          </motion.div>


          {/* Status */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            <h3 className="text-lg font-semibold text-white mb-6">Status</h3>
            <div className="glass rounded-lg p-4 border border-white/10">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="text-white font-medium cursor-pointer">
                  Usuário ativo
                </label>
              </div>
            </div>
          </motion.div>

          {/* Submit */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.3 }}
            className="flex justify-between items-center pt-6 border-t border-white/10"
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-xl transition-all duration-200"
            >
              <Trash2 className="w-4 h-4" />
              <span>Excluir Usuário</span>
            </motion.button>

            <div className="flex space-x-4">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => navigate('/manage-users')}
                className="btn-secondary px-6 py-3"
              >
                Cancelar
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50 px-6 py-3"
              >
                <Save className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Salvando...' : 'Salvar Alterações'}</span>
              </motion.button>
            </div>
          </motion.div>

          {errors.submit && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-red-400 text-sm text-center mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
            >
              {errors.submit}
            </motion.div>
          )}
        </form>
      </motion.div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass rounded-xl p-8 max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-bold text-white mb-4">Confirmar Exclusão</h3>
            <p className="text-white/70 mb-6">
              Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteUser}
                className="btn-danger flex-1"
              >
                Excluir
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default EditUserPage;