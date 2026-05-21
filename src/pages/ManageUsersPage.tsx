import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, User, Shield, Search, Calendar, CreditCard, Link as LinkIcon, Copy, Clock, AlertCircle, CheckCircle2, LogOut, MessageCircle } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { openRenewalWhatsAppToClient, openRenewalWhatsAppToSupport } from '@/lib/renewalWhatsApp';
import { calendarDaysRemainingSaoPaulo } from '@/lib/subscriptionExpiryCalendar';
import { useAuthStore } from '@/stores/authStore';
import { usersApi, registrationApi, asaasApi } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

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
    plan_name?: string;
    duration_months: number;
    price: number;
    status: string;
    end_date: string;
  };
  plan_name?: string;
  plan_type?: string;
  subscription_status?: string;
  subscription_expires_at?: string;
  subscription_days_remaining?: number | null;
  asaas_subscription_id?: string;
  approval_status?: string;
  access_expires_at?: string;
  access_duration_days?: number;
}

interface RegistrationLink {
  id: number;
  token: string;
  url: string;
  createdAt: string;
  expiresAt: string;
  isUsed: boolean;
  usedAt?: string;
  createdByName?: string;
  usedByName?: string;
  isValid: boolean;
}

interface PendingUser {
  id: string;
  name: string;
  email: string;
  created_at: string;
  approval_status: string;
}

export default function ManageUsersPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState<'all' | 'mensal'>('all');
  const [activeTab, setActiveTab] = useState<'users' | 'pending' | 'expiring'>('users');
  const [currentRegistrationLink, setCurrentRegistrationLink] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [showGenerateLinkModal, setShowGenerateLinkModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [userToApprove, setUserToApprove] = useState<PendingUser | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<5 | 30>(30);
  const [mensalOverrideBrl, setMensalOverrideBrl] = useState<number | null>(null);
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [linkExpiresIn, setLinkExpiresIn] = useState(7);
  const [cleanupLoading, setCleanupLoading] = useState(false);

  // Verificar se é admin
  if (user?.tipo !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Acesso Negado</h2>
          <p className="text-gray-600 dark:text-white/70">Apenas administradores podem gerenciar usuários.</p>
        </div>
      </div>
    );
  }

  const [expiringUsers, setExpiringUsers] = useState<{
    expired: any[];
    expiring_3_days: any[];
    expiring_7_days: any[];
    expiring_30_days: any[];
  }>({
    expired: [],
    expiring_3_days: [],
    expiring_7_days: [],
    expiring_30_days: []
  });
  const [expiringLoading, setExpiringLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    if (activeTab === 'pending') {
      fetchPendingUsers();
    }
    if (activeTab === 'expiring') {
      fetchExpiringUsers();
    }
    // Carregar link atual se não tiver
    if (!currentRegistrationLink) {
      loadCurrentLink();
    }
  }, [activeTab]);

  useEffect(() => {
    let cancelled = false
    asaasApi
      .getMensalOverride()
      .then((data: unknown) => {
        if (cancelled) return
        const v = (data as { value?: number | null })?.value
        setMensalOverrideBrl(typeof v === 'number' && v > 0 ? v : null)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, []);

  // Função para normalizar URL para sempre usar www.igestorphone.com.br
  const normalizeLinkUrl = (url: string): string => {
    if (!url) return url;
    // Se for igestorphone.com.br sem www, adicionar www
    if (url.includes('igestorphone.com.br') && !url.includes('www.')) {
      return url.replace(/https?:\/\/(www\.)?igestorphone\.com\.br/, 'https://www.igestorphone.com.br');
    }
    // Garantir que use https
    if (url.startsWith('http://')) {
      return url.replace('http://', 'https://');
    }
    return url;
  };

  const loadCurrentLink = async () => {
    try {
      const response = await registrationApi.getAllLinks();
      const links = response.data?.links || [];
      const activeLink = links.find((link: RegistrationLink) => link.isValid);
      if (activeLink) {
        setCurrentRegistrationLink(normalizeLinkUrl(activeLink.url));
      }
    } catch (error) {
      // Silenciar erro, não é crítico
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('🔍 Buscando usuários...');
      const response = await usersApi.getAll();
      console.log('📊 Resposta da API:', response);
      
      // Backend retorna { users: [...], pagination: {...} }
      // apiClient retorna response.data diretamente
      const users = (response as any).users || (response as any).data?.users || [];
      console.log('👥 Usuários encontrados:', users);
      setUsers(users);
    } catch (error: any) {
      console.error('❌ Erro ao carregar usuários:', error);
      toast.error(error.response?.data?.message || 'Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setDeleteLoading(true);
    try {
      await usersApi.delete(String(userToDelete.id));
      setUsers(users.filter(u => u.id !== userToDelete.id));
      setShowDeleteModal(false);
      setUserToDelete(null);
      toast.success('Usuário excluído com sucesso');
    } catch (error: any) {
      console.error('Erro ao deletar usuário:', error);
      toast.error(error?.message || error?.response?.data?.message || 'Erro ao excluir usuário');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCleanupInactive = async () => {
    const count = users.filter(u => !u.is_active).length;
    if (count === 0) {
      toast.success('Nenhum usuário inativo para excluir');
      return;
    }
    if (!confirm(`Excluir permanentemente ${count} usuário(s) inativo(s)? Os e-mails ficarão livres para novo cadastro.`)) {
      return;
    }

    try {
      setCleanupLoading(true);
      const res = await usersApi.cleanupInactive();
      const data = (res as any)?.data ?? res;
      const deleted = data?.deleted ?? 0;
      toast.success(data?.message || `${deleted} usuário(s) excluído(s)`);
      await fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao excluir usuários inativos');
    } finally {
      setCleanupLoading(false);
    }
  };

  const handleForceLogoutAll = async () => {
    if (!confirm('⚠️ ATENÇÃO: Isso desconectará TODOS os usuários do sistema, incluindo você!\n\nDeseja continuar?')) {
      return;
    }

    try {
      const response = await usersApi.forceLogoutAll();
      const data = (response as any)?.data ?? response;
      toast.success(`✅ Todos os usuários foram desconectados! (${data?.affected_users ?? 0} usuários afetados)`);
      
      // Desconectar você também após 2 segundos
      setTimeout(() => {
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
      }, 2000);
    } catch (error: any) {
      console.error('Erro ao desconectar todos os usuários:', error);
      toast.error(error.response?.data?.message || 'Erro ao desconectar usuários');
    }
  };

  const handleEditUser = (userId: string) => {
    navigate(`/admin/users/edit/${userId}`);
  };

  const handleCreateUser = () => {
    navigate('/admin/users/create');
  };

  const fetchPendingUsers = async () => {
    try {
      setPendingLoading(true);
      const response = await usersApi.getPending();
      console.log('📋 Resposta da API getPending:', response);
      
      // Backend retorna { data: { users: [...] } }
      // apiClient.get retorna response.data, então temos { data: { users: [...] } }
      const users = (response as any).data?.users || (response as any).users || [];
      console.log('⏳ Usuários pendentes:', users);
      setPendingUsers(users);
      
      if (users.length === 0) {
        console.log('ℹ️ Nenhum usuário pendente encontrado');
      }
    } catch (error: any) {
      console.error('❌ Erro ao buscar usuários pendentes:', error);
      toast.error(error.response?.data?.message || 'Erro ao carregar usuários pendentes');
    } finally {
      setPendingLoading(false);
    }
  };

  const fetchExpiringUsers = async () => {
    try {
      setExpiringLoading(true);
      const response = await usersApi.getExpiring();
      console.log('📅 Resposta da API getExpiring:', response);
      
      // Backend retorna { data: { expired: [], expiring_3_days: [], ... } }
      // apiClient.get retorna response.data
      const data = (response as any).data || {};
      setExpiringUsers({
        expired: data.expired || [],
        expiring_3_days: data.expiring_3_days || [],
        expiring_7_days: data.expiring_7_days || [],
        expiring_30_days: data.expiring_30_days || []
      });
      
      console.log('📅 Usuários próximos do vencimento carregados:', {
        expired: data.expired?.length || 0,
        expiring_3_days: data.expiring_3_days?.length || 0,
        expiring_7_days: data.expiring_7_days?.length || 0,
        expiring_30_days: data.expiring_30_days?.length || 0
      });
    } catch (error: any) {
      console.error('❌ Erro ao buscar usuários próximos do vencimento:', error);
      toast.error(error.response?.data?.message || 'Erro ao carregar usuários próximos do vencimento');
    } finally {
      setExpiringLoading(false);
    }
  };

  const handleGenerateLink = async () => {
    try {
      const response = await registrationApi.generateLink(7);
      const linkUrl = response.data?.url;
      if (linkUrl) {
        const normalizedUrl = normalizeLinkUrl(linkUrl);
        setCurrentRegistrationLink(normalizedUrl);
        // Copiar automaticamente o link normalizado
        navigator.clipboard.writeText(normalizedUrl);
        toast.success('Link gerado e copiado!');
      }
      setShowGenerateLinkModal(false);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao gerar link';
      toast.error(message);
    }
  };

  const handleCopyRegistrationLink = () => {
    if (currentRegistrationLink) {
      navigator.clipboard.writeText(currentRegistrationLink);
      toast.success('Link copiado!');
    } else {
      setShowGenerateLinkModal(true);
    }
  };

  const handleApproveUser = async () => {
    if (!userToApprove) return;

    try {
      await usersApi.approve(userToApprove.id, selectedDuration);
      toast.success(`Usuário aprovado por ${selectedDuration} dias!`);
      setShowApproveModal(false);
      setUserToApprove(null);
      await fetchPendingUsers();
      await fetchUsers(); // Atualizar lista de usuários
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao aprovar usuário';
      toast.error(message);
    }
  };

  const handleSetAsaasMensalTestFive = async () => {
    setOverrideLoading(true);
    try {
      const res = (await asaasApi.setMensalOverride({ value: 5 })) as { message?: string };
      setMensalOverrideBrl(5);
      toast.success(res?.message || 'Checkout mensal: R$ 5,00 (mínimo Asaas).');
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err?.message || 'Erro ao aplicar valor de teste');
    } finally {
      setOverrideLoading(false);
    }
  };

  const handleClearAsaasMensalOverride = async () => {
    setOverrideLoading(true);
    try {
      const res = (await asaasApi.setMensalOverride({ clear: true })) as { message?: string };
      setMensalOverrideBrl(null);
      toast.success(res?.message || 'Valor padrão do checkout restaurado.');
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err?.message || 'Erro ao remover override');
    } finally {
      setOverrideLoading(false);
    }
  };

  const pickUserPhone = (u: { whatsapp?: string; telefone?: string; phone?: string }) => {
    const raw = (u.whatsapp || u.telefone || u.phone || '').trim();
    const digits = raw.replace(/\D/g, '');
    return digits.length >= 10 ? raw : null;
  };

  const handleWhatsAppRenewal = (
    user: {
      name: string;
      email: string;
      whatsapp?: string;
      telefone?: string;
      phone?: string;
      subscription_expires_at?: string;
      access_expires_at?: string;
      days_remaining?: number;
      days_expired?: number;
    },
    expired = false
  ) => {
    const phone = pickUserPhone(user);
    const expiresAt = user.subscription_expires_at || user.access_expires_at;
    const daysRemaining = expired
      ? 0
      : Math.round(
          user.days_remaining ??
            calendarDaysRemainingSaoPaulo(expiresAt) ??
            0
        );
    const clientOpts = {
      clientName: user.name,
      daysRemaining,
      expiresAt,
      expired,
    };
    if (phone) {
      openRenewalWhatsAppToClient(phone, clientOpts);
      toast.success('Abrindo WhatsApp do cliente com mensagem de renovação');
    } else {
      openRenewalWhatsAppToSupport({
        userName: user.name,
        userEmail: user.email,
        expiresAt,
        daysRemaining,
      });
      toast('Cliente sem WhatsApp no cadastro — abrindo atendimento', { icon: 'ℹ️' });
    }
  };

  const renderRenewalActions = (user: (typeof expiringUsers.expired)[0], expired = false) => (
    <div className="flex flex-col sm:flex-row gap-2 shrink-0">
      <button
        type="button"
        onClick={() => handleEditUser(user.id)}
        className={expired ? 'btn-secondary text-sm px-3 py-1' : 'btn-primary text-sm px-3 py-1'}
      >
        Renovar
      </button>
      <button
        type="button"
        onClick={() => handleWhatsAppRenewal(user, expired)}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white text-sm font-semibold px-3 py-1.5"
      >
        <MessageCircle className="w-4 h-4" />
        WhatsApp
      </button>
    </div>
  );

  const filteredUsers = users
  .filter(user => {
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
    
    const matchesPlan = (() => {
      if (planFilter === 'all') return true;
      const planType = (user.plan_type || (user as any).subscription?.plan_type || '').toString().toLowerCase();
      const planName = (user.plan_name || (user as any).subscription?.plan_name || '').toString().toLowerCase();
      if (planFilter === 'mensal') return planType === 'mensal' || /mensal/.test(planName);
      return true;
    })();
    
    return matchesSearch && matchesStatus && matchesPlan;
  })
  .sort((a, b) => {
    const isAdminA = (a.tipo || '').toString().toLowerCase() === 'admin';
    const isAdminB = (b.tipo || '').toString().toLowerCase() === 'admin';
    if (isAdminA !== isAdminB) return isAdminA ? 1 : -1;
    return 0;
  });

  const getStatusBadge = (user: User) => {
    const sub = user.subscription_status;
    if (sub === 'pending_payment') {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
          Aguardando pagamento
        </span>
      );
    }
    if (sub === 'overdue') {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
          Pagamento atrasado
        </span>
      );
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        user.is_active
          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
          : 'bg-red-500/20 text-red-400 border border-red-500/30'
      }`}>
        {user.is_active ? 'Ativo' : 'Inativo'}
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
          <p className="text-gray-600 dark:text-white/70">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gerenciar Usuários</h1>
          <p className="text-gray-600 dark:text-white/70 mt-1">Gerencie usuários e suas permissões</p>
        </div>
        <div className="flex items-center space-x-3">
          {activeTab === 'users' && (
            <div className="flex items-center space-x-3">
              <button
                onClick={handleCleanupInactive}
                disabled={cleanupLoading || users.filter(u => !u.is_active).length === 0}
                className="btn-secondary flex items-center space-x-2 bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/30 text-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Excluir permanentemente usuários inativos (e-mails ficam livres)"
              >
                {cleanupLoading ? (
                  <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>Excluir Inativos</span>
              </button>
              <button
                onClick={handleForceLogoutAll}
                className="btn-secondary flex items-center space-x-2 bg-red-500/20 hover:bg-red-500/30 border-red-500/30 text-red-400"
                title="Desconectar todos os usuários do sistema"
              >
                <LogOut className="w-4 h-4" />
                <span>Desconectar Todos</span>
              </button>
              <button
                onClick={handleCopyRegistrationLink}
                className="btn-primary flex items-center space-x-2"
              >
                <LinkIcon className="w-4 h-4" />
                <span>{currentRegistrationLink ? 'Copiar Link para Cadastro' : 'Convidar Novo Usuário'}</span>
              </button>
              <button
                onClick={handleCreateUser}
                className="btn-secondary flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Criar Usuário</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-200 dark:border-white/10">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'users'
              ? 'text-gray-900 dark:text-white border-b-2 border-blue-500'
              : 'text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white/80'
          }`}
        >
          Usuários
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 font-medium transition-colors relative ${
            activeTab === 'pending'
              ? 'text-gray-900 dark:text-white border-b-2 border-blue-500'
              : 'text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white/80'
          }`}
        >
          Pendentes
          {pendingUsers.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {pendingUsers.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('expiring')}
          className={`px-4 py-2 font-medium transition-colors relative ${
            activeTab === 'expiring'
              ? 'text-gray-900 dark:text-white border-b-2 border-blue-500'
              : 'text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white/80'
          }`}
        >
          Renovações
          {(expiringUsers.expired.length > 0 ||
            expiringUsers.expiring_3_days.length > 0 ||
            expiringUsers.expiring_7_days.length > 0) && (
            <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {expiringUsers.expired.length + expiringUsers.expiring_3_days.length + expiringUsers.expiring_7_days.length}
            </span>
          )}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl p-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-white/50 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">Todos os status</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>

          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value as 'all' | 'mensal')}
            className="bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">Todos (plano)</option>
            <option value="mensal">Mensal / mensal no nome</option>
          </select>

          <div className="text-gray-600 dark:text-white/70 text-sm">
            {filteredUsers.length} de {users.length} usuários
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-gray-200 dark:border-white/10 flex flex-wrap items-center gap-3">
          <span className="text-sm text-gray-600 dark:text-white/70">
            Plano único: <strong className="text-gray-900 dark:text-white">R$ 150,00/mês</strong>
            {mensalOverrideBrl === 5 && (
              <span className="ml-2 text-amber-600 dark:text-amber-400">· modo teste R$ 5,00 ativo</span>
            )}
          </span>
          <button
            type="button"
            disabled={overrideLoading}
            onClick={mensalOverrideBrl === 5 ? handleClearAsaasMensalOverride : handleSetAsaasMensalTestFive}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 disabled:opacity-50"
          >
            {mensalOverrideBrl === 5 ? 'Voltar ao plano R$ 150,00' : 'Checkout R$ 5,00 (teste)'}
          </button>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'users' && (
        <>
      {/* Current Registration Link Card */}
      {currentRegistrationLink && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl p-6 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Link de Cadastro Ativo</h3>
              <div className="bg-gray-100 dark:bg-white/5 rounded-lg p-3 mb-2">
                <code className="text-sm text-gray-800 dark:text-white/90 break-all">{currentRegistrationLink}</code>
              </div>
              <p className="text-gray-500 dark:text-white/50 text-xs">Copie este link e envie para convidar novos usuários</p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(currentRegistrationLink);
                toast.success('Link copiado!');
              }}
              className="btn-primary ml-4 flex items-center space-x-2"
            >
              <Copy className="w-4 h-4" />
              <span>Copiar</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <div className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl p-12 text-center">
            <User className="w-16 h-16 text-gray-300 dark:text-white/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-white/70 mb-2">Nenhum usuário encontrado</h3>
            <p className="text-gray-500 dark:text-white/50">
              {searchTerm || statusFilter 
                ? 'Tente ajustar os filtros de busca.'
                : 'Nenhum usuário cadastrado ainda.'}
            </p>
          </div>
        ) : (
          filteredUsers.map((user) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{user.name}</h3>
                  <p className="text-gray-600 dark:text-white/70 text-sm">{user.email}</p>
                  <div className="flex items-center space-x-2 mt-2 flex-wrap gap-1">
                    {getTypeBadge(user.tipo)}
                    {getStatusBadge(user)}
                    {(() => {
                      const p = (user.plan_name || user.subscription?.plan_name) || '';
                      const lastPayment = (user as any).last_payment_amount;
                      if (!p && lastPayment == null) return null;
                      const priceLabel = lastPayment != null ? formatPrice(Number(lastPayment)) : '';
                      return (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                          <CreditCard className="w-3 h-3" />
                          {p ? p.replace(/iGestorPhone\s*/i, '') : 'Assinatura'}
                          {priceLabel && <span className="opacity-90">· {priceLabel}</span>}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleEditUser(user.id)}
                  className="p-2 text-gray-500 dark:text-white/50 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUserToDelete(user);
                    setShowDeleteModal(true);
                  }}
                  className="p-2 text-gray-500 dark:text-white/50 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                  title="Excluir usuário"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* User Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-white/50">Telefone:</span>
                <p className="text-gray-700 dark:text-white/80">{user.telefone || 'Não informado'}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-white/50">Criado em:</span>
                <p className="text-gray-700 dark:text-white/80">{new Date(user.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-white/50">Último login:</span>
                <p className="text-gray-700 dark:text-white/80">
                  {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Nunca'}
                </p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-white/50">Status assinatura:</span>
                <p className="text-gray-700 dark:text-white/80">{user.subscription_status || '—'}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-white/50">Assinatura até:</span>
                <p className="text-gray-700 dark:text-white/80">
                  {user.subscription_expires_at
                    ? new Date(user.subscription_expires_at).toLocaleString('pt-BR')
                    : '—'}
                </p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-white/50">Dias restantes:</span>
                <p className="text-gray-700 dark:text-white/80">
                  {user.subscription_expires_at == null
                    ? '—'
                    : `${user.subscription_days_remaining ?? calendarDaysRemainingSaoPaulo(user.subscription_expires_at) ?? 0} dias`}
                </p>
              </div>
            </div>

            {/* Permissions */}
            {user.tipo === 'user' && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
                <span className="text-gray-500 dark:text-white/50 text-sm">Permissões:</span>
                <p className="text-gray-700 dark:text-white/80 text-sm mt-1">{getPermissionsText(user.permissions)}</p>
              </div>
            )}
          </motion.div>
        ))
        )}
      </div>
        </>
      )}


      {/* Pending Users Tab */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-white/70">Carregando usuários pendentes...</p>
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl p-12 text-center">
              <CheckCircle2 className="w-16 h-16 text-gray-300 dark:text-white/30 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-white/70">Nenhum usuário pendente de aprovação.</p>
            </div>
          ) : (
            pendingUsers.map((pendingUser) => (
              <motion.div
                key={pendingUser.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl p-6"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full flex items-center justify-center shrink-0">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{pendingUser.name}</h3>
                      <p className="text-gray-600 dark:text-white/70 text-sm truncate">{pendingUser.email}</p>
                      <p className="text-gray-500 dark:text-white/50 text-xs mt-1">
                        Cadastrado em {new Date(pendingUser.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setUserToApprove(pendingUser);
                      setShowApproveModal(true);
                    }}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Aprovar</span>
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Expiring Users Tab */}
      {activeTab === 'expiring' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-[#25D366]/25 bg-[#25D366]/5 px-4 py-3 text-sm text-gray-700 dark:text-white/80">
            <strong className="text-gray-900 dark:text-white">WhatsApp na renovação:</strong> o botão verde abre o
            WhatsApp do cliente com mensagem pronta (link de pagamento R$ 150). Se não tiver número cadastrado, abre o
            atendimento.
          </div>
          {expiringLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-white/70">Carregando usuários próximos do vencimento...</p>
            </div>
          ) : (
            <>
              {/* Expired Users */}
              {expiringUsers.expired.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Expirados ({expiringUsers.expired.length})</h3>
                  </div>
                  <div className="space-y-3">
                    {expiringUsers.expired.map((user) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl p-4 border-l-4 border-red-500"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-gray-900 dark:text-white font-semibold">{user.name}</h4>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30">
                                Expirado
                              </span>
                            </div>
                            <p className="text-gray-600 dark:text-white/70 text-sm mb-1 truncate">{user.email}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-white/50">
                              <span>Expirou há {Math.abs(Math.round(user.days_expired || 0))} dias</span>
                              {(user.subscription_expires_at || user.access_expires_at) && (
                                <span>
                                  {new Date(user.subscription_expires_at || user.access_expires_at).toLocaleDateString('pt-BR')}
                                </span>
                              )}
                            </div>
                          </div>
                          {renderRenewalActions(user, true)}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expiring in 3 days */}
              {expiringUsers.expiring_3_days.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <AlertCircle className="w-5 h-5 text-orange-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Expirando em até 3 dias ({expiringUsers.expiring_3_days.length})</h3>
                  </div>
                  <div className="space-y-3">
                    {expiringUsers.expiring_3_days.map((user) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl p-4 border-l-4 border-orange-500"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-gray-900 dark:text-white font-semibold">{user.name}</h4>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/30">
                                Urgente
                              </span>
                            </div>
                            <p className="text-gray-600 dark:text-white/70 text-sm mb-1 truncate">{user.email}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-white/50">
                              <span className="text-orange-600 dark:text-orange-400 font-semibold">
                                {Math.round(user.days_remaining || 0)} dias restantes
                              </span>
                              {(user.subscription_expires_at || user.access_expires_at) && (
                                <span>
                                  Expira em {new Date(user.subscription_expires_at || user.access_expires_at).toLocaleDateString('pt-BR')}
                                </span>
                              )}
                            </div>
                          </div>
                          {renderRenewalActions(user, false)}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expiring in 7 days */}
              {expiringUsers.expiring_7_days.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <Clock className="w-5 h-5 text-yellow-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Expirando em até 7 dias ({expiringUsers.expiring_7_days.length})</h3>
                  </div>
                  <div className="space-y-3">
                    {expiringUsers.expiring_7_days.map((user) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl p-4 border-l-4 border-yellow-500"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-gray-900 dark:text-white font-semibold">{user.name}</h4>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30">
                                Atenção
                              </span>
                            </div>
                            <p className="text-gray-600 dark:text-white/70 text-sm mb-1 truncate">{user.email}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-white/50">
                              <span className="text-amber-700 dark:text-yellow-400 font-semibold">
                                {Math.round(user.days_remaining || 0)} dias restantes
                              </span>
                              {(user.subscription_expires_at || user.access_expires_at) && (
                                <span>
                                  Expira em {new Date(user.subscription_expires_at || user.access_expires_at).toLocaleDateString('pt-BR')}
                                </span>
                              )}
                            </div>
                          </div>
                          {renderRenewalActions(user, false)}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expiring in 30 days */}
              {expiringUsers.expiring_30_days.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Expirando em até 30 dias ({expiringUsers.expiring_30_days.length})</h3>
                  </div>
                  <div className="space-y-3">
                    {expiringUsers.expiring_30_days.map((user) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl p-4 border-l-4 border-blue-500"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-gray-900 dark:text-white font-semibold">{user.name}</h4>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30">
                                Em breve
                              </span>
                            </div>
                            <p className="text-gray-600 dark:text-white/70 text-sm mb-1 truncate">{user.email}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-white/50">
                              <span className="text-blue-600 dark:text-blue-400">
                                {Math.round(user.days_remaining || 0)} dias restantes
                              </span>
                              {(user.subscription_expires_at || user.access_expires_at) && (
                                <span>
                                  Expira em {new Date(user.subscription_expires_at || user.access_expires_at).toLocaleDateString('pt-BR')}
                                </span>
                              )}
                            </div>
                          </div>
                          {renderRenewalActions(user, false)}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {expiringUsers.expired.length === 0 &&
               expiringUsers.expiring_3_days.length === 0 &&
               expiringUsers.expiring_7_days.length === 0 &&
               expiringUsers.expiring_30_days.length === 0 && (
                <div className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl p-12 text-center">
                  <CheckCircle2 className="w-16 h-16 text-gray-300 dark:text-white/30 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 dark:text-white/70 mb-2">Nenhum usuário próximo do vencimento</h3>
                  <p className="text-gray-500 dark:text-white/50">Todos os usuários estão com acesso válido.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl p-6 w-full max-w-md"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Confirmar Exclusão</h3>
            <p className="text-gray-600 dark:text-white/70 mb-6">
              Tem certeza que deseja excluir o usuário <strong>{userToDelete.name}</strong>? 
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => { setShowDeleteModal(false); setUserToDelete(null); }}
                disabled={deleteLoading}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={deleteLoading}
                className="btn-danger flex items-center gap-2 disabled:opacity-50"
              >
                {deleteLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  'Excluir'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Generate Link Modal */}
      {showGenerateLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl p-6 w-full max-w-md"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Gerar Link de Cadastro</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-2">
                  Válido por quantos dias?
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={linkExpiresIn}
                  onChange={(e) => setLinkExpiresIn(parseInt(e.target.value) || 7)}
                  className="input-primary w-full"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowGenerateLinkModal(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGenerateLink}
                  className="btn-primary"
                >
                  Gerar Link
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Approve User Modal */}
      {showApproveModal && userToApprove && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" style={{ zIndex: 9999 }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-slate-900/95 border border-gray-200 dark:border-white/20 rounded-xl p-6 w-full max-w-md relative shadow-xl"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Aprovar Usuário</h3>
            <p className="text-gray-600 dark:text-white/70 mb-4">
              Aprovar <strong className="text-gray-900 dark:text-white">{userToApprove.name}</strong> e definir período de acesso:
            </p>
            <div className="text-sm text-gray-500 dark:text-white/60 mb-6">
              <p>Email: {userToApprove.email}</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-2">
                  Período de Acesso
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {([5, 30] as const).map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setSelectedDuration(days)}
                      className={`p-3 rounded-lg border transition-colors ${
                        selectedDuration === days
                          ? 'bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-500/20 dark:border-blue-500 dark:text-white'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 dark:bg-white/5 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/10'
                      }`}
                    >
                      <div className="text-center">
                        <div className="font-semibold">{days} dias</div>
                        <div className="text-xs opacity-70 mt-1">
                          {days === 5 ? 'Demonstração' : '1 mês (acesso)'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowApproveModal(false);
                    setUserToApprove(null);
                  }}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleApproveUser}
                  className="btn-primary"
                >
                  Aprovar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}