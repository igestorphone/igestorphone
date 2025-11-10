import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, User, Shield, Eye, EyeOff, Search, Filter, MoreVertical, Calendar, CreditCard, Mail, Phone } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { usersApi } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  name: string;
  email: string;
  tipo: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  cpf?: string;
  rg?: string;
  data_nascimento?: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
  permissions?: string[];
  subscription?: {
    plan_type: string;
    duration_months: number;
    price: number;
    status: string;
    end_date: string;
  };
}

export default function ManageUsersPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Debug: Log do estado de users
  console.log('📊 Estado atual dos usuários:', {
    users,
    usersLength: users.length,
    loading,
    searchTerm,
    statusFilter
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Verificar se é admin
  if (user?.tipo !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Acesso Negado</h2>
          <p className="text-white/70">Apenas administradores podem gerenciar usuários.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('🔍 Buscando usuários...');
      const response = await usersApi.getAll();
      console.log('📊 Resposta da API:', response);
      console.log('👥 Usuários encontrados:', response.data?.users);
      setUsers(response.data?.users || []);
    } catch (error) {
      console.error('❌ Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await usersApi.delete(userToDelete.id);
      setUsers(users.filter(u => u.id !== userToDelete.id));
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
    }
  };

  const handleEditUser = (userId: string) => {
    navigate(`/admin/users/edit/${userId}`);
  };

  const handleCreateUser = () => {
    navigate('/admin/users/create');
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || 
                         (statusFilter === 'active' && user.is_active) ||
                         (statusFilter === 'inactive' && !user.is_active);
    
    console.log('🔍 Filtro usuário:', {
      name: user.name,
      email: user.email,
      searchTerm,
      statusFilter,
      isActive: user.is_active,
      matchesSearch,
      matchesStatus,
      finalMatch: matchesSearch && matchesStatus
    });
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        isActive 
          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
          : 'bg-red-500/20 text-red-400 border border-red-500/30'
      }`}>
        {isActive ? 'Ativo' : 'Inativo'}
      </span>
    );
  };

  const getTypeBadge = (tipo: string) => {
    const colors = {
      admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      user: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      supplier: 'bg-green-500/20 text-green-400 border-green-500/30'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${colors[tipo as keyof typeof colors] || colors.user}`}>
        {tipo === 'admin' ? 'Administrador' : tipo === 'supplier' ? 'Fornecedor' : 'Usuário'}
      </span>
    );
  };

  const getPermissionsText = (permissions: string[] = []) => {
    if (permissions.length === 0) return 'Nenhuma permissão';
    
    const permissionNames = {
      'consultar_listas': 'Consultar Listas',
      'medias_preco': 'Médias de Preço',
      'buscar_iphone_barato': 'Buscar iPhone Mais Barato',
      'envio_fora_sp': 'Envio pra Fora de SP'
    };

    return permissions.map(p => permissionNames[p as keyof typeof permissionNames] || p).join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white/70">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Gerenciar Usuários</h1>
          <p className="text-white/70 mt-1">Gerencie usuários e suas permissões</p>
        </div>
        <button
          onClick={handleCreateUser}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Usuário</span>
        </button>
      </div>

      {/* Filters */}
      <div className="glass rounded-xl p-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-primary pl-10 w-full"
              />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-primary"
          >
            <option value="">Todos os status</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>

          <div className="text-white/70 text-sm">
            {filteredUsers.length} de {users.length} usuários
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.map((user) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{user.name}</h3>
                  <p className="text-white/70 text-sm">{user.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    {getTypeBadge(user.tipo)}
                    {getStatusBadge(user.is_active)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleEditUser(user.id)}
                  className="p-2 text-white/50 hover:text-blue-400 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setUserToDelete(user);
                    setShowDeleteModal(true);
                  }}
                  className="p-2 text-white/50 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* User Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-white/50">Telefone:</span>
                <p className="text-white/80">{user.telefone || 'Não informado'}</p>
              </div>
              <div>
                <span className="text-white/50">Criado em:</span>
                <p className="text-white/80">{new Date(user.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-white/50">Último login:</span>
                <p className="text-white/80">
                  {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Nunca'}
                </p>
              </div>
            </div>

            {/* Permissions */}
            {user.tipo === 'user' && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <span className="text-white/50 text-sm">Permissões:</span>
                <p className="text-white/80 text-sm mt-1">{getPermissionsText(user.permissions)}</p>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass rounded-xl p-6 w-full max-w-md"
          >
            <h3 className="text-xl font-bold text-white mb-4">Confirmar Exclusão</h3>
            <p className="text-white/70 mb-6">
              Tem certeza que deseja excluir o usuário <strong>{userToDelete.name}</strong>? 
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteUser}
                className="btn-danger"
              >
                Excluir
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}