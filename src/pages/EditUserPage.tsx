import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Shield, Eye, EyeOff, Save, ArrowLeft, Trash2, Calendar, Clock, Crown, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
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
  const [accessExpiresAt, setAccessExpiresAt] = useState<string | null>(null);
  const [renewAccess, setRenewAccess] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<5 | 30 | 90 | 365>(30);
  const [subscriptionData, setSubscriptionData] = useState({
    planName: '',
    planType: 'mensal' as 'mensal' | 'trimestral' | 'anual' | 'embaixador',
    durationMonths: 1,
    price: 0,
    paymentMethod: 'pix',
    startDate: '',
    endDate: '',
    autoRenew: false,
    status: 'active'
  });
  const [calendarUsers, setCalendarUsers] = useState<{ id: number; name: string; email: string; created_at: string; is_active: boolean }[]>([]);
  const [loadedUserIsMaster, setLoadedUserIsMaster] = useState(false);
  const [loadedUserParent, setLoadedUserParent] = useState<{ id: number; name: string; email: string } | null>(null);
  const [loadedSubscriptionStatus, setLoadedSubscriptionStatus] = useState<string | null>(null);
  const [regularizingPayment, setRegularizingPayment] = useState(false);

  const planTypeToMonths: Record<string, number> = { mensal: 1, trimestral: 3, anual: 12, embaixador: 12 };

  const addMonthsToDate = (dateStr: string, months: number): string => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T12:00:00');
    d.setMonth(d.getMonth() + months);
    return d.toISOString().slice(0, 10);
  };

  const setPlanType = (value: string) => {
    const months = planTypeToMonths[value] ?? subscriptionData.durationMonths;
    setSubscriptionData(prev => ({
      ...prev,
      planType: value as 'mensal' | 'trimestral' | 'anual' | 'embaixador',
      durationMonths: months,
      endDate: prev.startDate ? addMonthsToDate(prev.startDate, months) : prev.endDate,
      price: value === 'embaixador' ? 0 : prev.price
    }));
  };
  
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

      setLoadedUserIsMaster(!user.parent_id);
      setCalendarUsers(user.calendar_users || []);
      setLoadedUserParent(user.parent || null);
      setLoadedSubscriptionStatus(user.subscription_status || null);

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
      
      // Carregar data de expiração do acesso
      setAccessExpiresAt(user.access_expires_at || null);

      const normPlanType = (t: string, months?: number) => {
        if (t === 'mensal' || t === 'trimestral' || t === 'anual' || t === 'embaixador') return t;
        if (months === 12) return 'anual';
        if (months === 3) return 'trimestral';
        return 'mensal';
      };
      const startStr = (d: string) => d ? new Date(d).toISOString().slice(0, 10) : '';
      const computedEnd = (start: string, months: number) => start && months ? addMonthsToDate(start, months) : '';

      // Carregar assinatura se existir
      if (user.subscription) {
        const sub = user.subscription;
        const dur = sub.duration_months ?? 1;
        const start = startStr(sub.start_date);
        setSubscriptionData({
          planName: sub.plan_name || '',
          planType: normPlanType(sub.plan_type || '', dur),
          durationMonths: dur,
          price: parseFloat(sub.price) || 0,
          paymentMethod: sub.payment_method || 'pix',
          startDate: start,
          endDate: computedEnd(start, dur) || startStr(sub.end_date),
          autoRenew: sub.auto_renew || false,
          status: sub.status || 'active'
        });
      } else {
        try {
          const subResponse = await usersApi.getSubscription(id!) as { subscription?: any };
          if (subResponse.subscription) {
            const sub = subResponse.subscription;
            const dur = sub.duration_months ?? 1;
            const start = startStr(sub.start_date);
            setSubscriptionData({
              planName: sub.plan_name || '',
              planType: normPlanType(sub.plan_type || '', dur),
              durationMonths: dur,
              price: parseFloat(sub.price) || 0,
              paymentMethod: sub.payment_method || 'pix',
              startDate: start,
              endDate: computedEnd(start, dur) || startStr(sub.end_date),
              autoRenew: sub.auto_renew || false,
              status: sub.status || 'active'
            });
          }
        } catch (subError) {
          console.log('Nenhuma assinatura encontrada');
        }
      }
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


  const handleRegularizePayment = async () => {
    if (!id) return;
    setRegularizingPayment(true);
    try {
      await usersApi.updateSubscription(id, {
        status: 'active',
        durationMonths: 1,
        planType: subscriptionData.planType || 'mensal',
        planName: subscriptionData.planName || 'Plano',
        price: subscriptionData.price,
        paymentMethod: subscriptionData.paymentMethod,
      });
      toast.success('Pagamento regularizado. O usuário já pode acessar.');
      setSubscriptionData(prev => ({ ...prev, status: 'active' }));
      setLoadedSubscriptionStatus('active');
      await loadUser();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Não foi possível regularizar.');
    } finally {
      setRegularizingPayment(false);
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

      // Sempre enviar assinatura (criar ou atualizar) para que os dados sejam salvos
      try {
        await usersApi.updateSubscription(id!, {
          planName: subscriptionData.planName || subscriptionData.planType || 'Plano',
          planType: subscriptionData.planType,
          durationMonths: subscriptionData.durationMonths,
          price: subscriptionData.price,
          paymentMethod: subscriptionData.paymentMethod,
          startDate: subscriptionData.startDate || undefined,
          endDate: subscriptionData.endDate || undefined,
          autoRenew: subscriptionData.autoRenew,
          status: subscriptionData.status
        });
      } catch (subError: any) {
        console.error('Erro ao atualizar assinatura:', subError);
        const msg = subError.response?.data?.message || subError.message || 'Erro ao salvar assinatura';
        toast.error(`Assinatura não foi salva: ${msg}`);
      }

      // Incluir renovação de acesso se solicitada
      if (renewAccess) {
        updateData.renewAccess = true;
        updateData.durationDays = selectedDuration;
      }

      await usersApi.update(id!, updateData);
      toast.success('Usuário atualizado com sucesso!');
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
          <p className="text-gray-600 dark:text-white/70">Carregando usuário...</p>
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
          className="p-2 text-gray-600 dark:text-white/50 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-3xl font-bold text-gray-900 dark:text-white"
          >
            Editar Usuário
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-gray-600 dark:text-white/70 mt-1"
          >
            Atualize as informações do usuário
          </motion.p>
          {loadedUserParent && (
            <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Usuário do calendário vinculado a
              <Link to={`/admin/users/edit/${loadedUserParent.id}`} className="font-medium hover:underline">
                {loadedUserParent.name}
              </Link>
            </p>
          )}
        </div>
      </motion.div>

      {/* Form */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl p-8"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Dados Básicos */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
              Dados Básicos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  className={`w-full bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.nome ? 'border-red-500' : ''}`}
                  placeholder="Digite o nome completo"
                />
                {errors.nome && <p className="text-red-400 text-sm mt-1">{errors.nome}</p>}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="Digite o email"
                />
                {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
              >
                <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-2">
                  Telefone *
                </label>
                <input
                  type="tel"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleInputChange}
                  className={`w-full bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.telefone ? 'border-red-500' : ''}`}
                  placeholder="(11) 99999-9999"
                />
                {errors.telefone && <p className="text-red-400 text-sm mt-1">{errors.telefone}</p>}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 1.0 }}
              >
                <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-2">
                  Tipo de Usuário
                </label>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleInputChange}
                  className="w-full bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                </select>
              </motion.div>
            </div>
          </motion.div>

          {/* Usuários do calendário vinculados (só para usuário master, sem parent_id) */}
          {loadedUserIsMaster && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="border border-gray-200 dark:border-white/20 rounded-xl p-6 bg-gray-50/50 dark:bg-white/5"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Usuários do calendário vinculados
              </h3>
              <p className="text-sm text-gray-600 dark:text-white/60 mb-4">
                Usuários criados por este assinante (acesso apenas ao calendário). Clique em Editar para gerenciar.
              </p>
              {calendarUsers.length === 0 ? (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4">
                  <p className="text-gray-500 dark:text-white/50 text-sm">Nenhum usuário do calendário vinculado.</p>
                  <Link
                    to="/funcionarios-calendario"
                    className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <UserPlus className="w-4 h-4" />
                    Criar na página Usuário do calendário
                  </Link>
                </div>
              ) : (
                <ul className="space-y-2">
                  {calendarUsers.map((cu) => (
                    <li
                      key={cu.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-3 px-4 rounded-lg bg-white dark:bg-white/10 border border-gray-100 dark:border-white/10"
                    >
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">{cu.name}</span>
                        <span className="text-gray-500 dark:text-white/50 text-sm ml-2">({cu.email})</span>
                        {!cu.is_active && (
                          <span className="ml-2 text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">Inativo</span>
                        )}
                      </div>
                      <Link
                        to={`/admin/users/edit/${cu.id}`}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        <User className="w-4 h-4" />
                        Editar
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}

          {/* Senha */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
              Alterar Senha (Opcional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
              >
                <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-2">
                  Nova Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="senha"
                    value={formData.senha}
                    onChange={handleInputChange}
                    className={`w-full bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-3 pr-10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.senha ? 'border-red-500' : ''}`}
                    placeholder="Deixe em branco para manter a senha atual"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-2">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  name="confirmarSenha"
                  value={formData.confirmarSenha}
                  onChange={handleInputChange}
                  className={`w-full bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.confirmarSenha ? 'border-red-500' : ''}`}
                  placeholder="Confirme a nova senha"
                />
                {errors.confirmarSenha && <p className="text-red-400 text-sm mt-1">{errors.confirmarSenha}</p>}
              </motion.div>
            </div>
          </motion.div>

          {/* Assinatura — plano, valor, datas e renovação */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
              <Crown className="w-5 h-5 mr-2 text-amber-500 dark:text-amber-400" />
              Assinatura
            </h3>
            <p className="text-sm text-gray-500 dark:text-white/60 mb-4">
              Defina o plano, valor pago, datas de entrada e último pagamento. Use a data de término para inativar ou renovar o acesso.
            </p>
            {(loadedSubscriptionStatus === 'overdue' || loadedSubscriptionStatus === 'past_due') && (
              <div className="mb-6 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  Este usuário está com <strong>pagamento atrasado</strong>. Se ele já pagou (PIX/link), clique abaixo para regularizar e liberar o acesso.
                </p>
                <button
                  type="button"
                  onClick={handleRegularizePayment}
                  disabled={regularizingPayment}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium disabled:opacity-60"
                >
                  {regularizingPayment ? 'Regularizando…' : 'Regularizar pagamento (marcar como pago)'}
                </button>
              </div>
            )}
            <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-6 border border-gray-200 dark:border-white/10 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Nome do Plano */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-1.5">
                    Nome do Plano
                  </label>
                  <input
                    type="text"
                    value={subscriptionData.planName}
                    onChange={(e) => setSubscriptionData({ ...subscriptionData, planName: e.target.value })}
                    className="w-full bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                    placeholder="Ex: Plano PRO, Plano Básico"
                  />
                </div>

                {/* Tipo de Plano — Mensal / Trimestral / Anual */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-1.5">
                    Tipo de Plano
                  </label>
                  <select
                    value={subscriptionData.planType}
                    onChange={(e) => setPlanType(e.target.value)}
                    className="w-full bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                  >
                    <option value="mensal">Mensal (1 mês)</option>
                    <option value="trimestral">Trimestral (3 meses)</option>
                    <option value="anual">Anual (12 meses)</option>
                    <option value="embaixador">Embaixador (parceria, não paga)</option>
                  </select>
                </div>

                {/* Valor (R$) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-1.5">
                    Valor que o usuário paga (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-white/50 text-sm">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={subscriptionData.price === 0 ? '' : subscriptionData.price}
                      onChange={(e) => setSubscriptionData({ ...subscriptionData, price: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2.5 pl-9 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                      placeholder="0,00"
                    />
                  </div>
                </div>

                {/* Método de Pagamento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-1.5">
                    Método de Pagamento
                  </label>
                  <select
                    value={subscriptionData.paymentMethod}
                    onChange={(e) => setSubscriptionData({ ...subscriptionData, paymentMethod: e.target.value })}
                    className="w-full bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                  >
                    <option value="pix">PIX</option>
                    <option value="credit_card">Cartão de Crédito</option>
                    <option value="debit_card">Cartão de Débito</option>
                    <option value="boleto">Boleto</option>
                    <option value="bank_transfer">Transferência Bancária</option>
                  </select>
                </div>

                {/* Duração (meses) — preenchido pelo tipo de plano, editável */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-1.5">
                    Duração (meses)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={subscriptionData.durationMonths}
                    onChange={(e) => {
                      const months = parseInt(e.target.value) || 1;
                      const end = subscriptionData.startDate ? addMonthsToDate(subscriptionData.startDate, months) : subscriptionData.endDate;
                      setSubscriptionData(prev => ({ ...prev, durationMonths: months, endDate: end }));
                    }}
                    className="w-full bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-1.5">
                    Status da Assinatura
                  </label>
                  <select
                    value={subscriptionData.status}
                    onChange={(e) => setSubscriptionData({ ...subscriptionData, status: e.target.value })}
                    className="w-full bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                  >
                    <option value="active">Ativo</option>
                    <option value="trial">Trial</option>
                    <option value="cancelled">Cancelado</option>
                    <option value="expired">Expirado</option>
                    <option value="past_due">Pagamento atrasado</option>
                  </select>
                </div>

                {/* Data de entrada (quando entrou no sistema) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-1.5">
                    Data de entrada
                  </label>
                  <input
                    type="date"
                    value={subscriptionData.startDate}
                    onChange={(e) => {
                      const start = e.target.value;
                      const end = start ? addMonthsToDate(start, subscriptionData.durationMonths) : subscriptionData.endDate;
                      setSubscriptionData(prev => ({ ...prev, startDate: start, endDate: end }));
                    }}
                    className="w-full bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                  />
                  <p className="text-xs text-gray-500 dark:text-white/50 mt-1">Data em que o usuário entrou no sistema (último pagamento)</p>
                </div>

                {/* Próximo pagamento (calculado: entrada + duração do plano) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-1.5">
                    Próximo pagamento
                  </label>
                  <input
                    type="date"
                    value={subscriptionData.endDate}
                    readOnly
                    className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2.5 text-gray-700 dark:text-white/80 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 dark:text-white/50 mt-1">Calculado: data de entrada + duração do plano (mensal +1 mês, trimestral +3, anual +12)</p>
                </div>
              </div>

              {/* Renovação automática */}
              <div className="flex items-center gap-3 pt-2 border-t border-gray-200 dark:border-white/10">
                <input
                  type="checkbox"
                  id="autoRenew"
                  checked={subscriptionData.autoRenew}
                  onChange={(e) => setSubscriptionData({ ...subscriptionData, autoRenew: e.target.checked })}
                  className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 dark:border-white/20 rounded"
                />
                <label htmlFor="autoRenew" className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                  Renovação automática (sistema pode renovar com base nesta data)
                </label>
              </div>
            </div>
          </motion.div>

          {/* Renovar Acesso */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.1 }}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
              Renovar/Prolongar Acesso
            </h3>
            <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-6 border border-gray-200 dark:border-white/10 space-y-4">
              {accessExpiresAt && (
                <div className="flex items-center space-x-2 text-gray-600 dark:text-white/70 mb-4">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">
                    {new Date(accessExpiresAt) > new Date() ? (
                      <>Acesso válido até: <strong className="text-gray-900 dark:text-white">{new Date(accessExpiresAt).toLocaleDateString('pt-BR')}</strong></>
                    ) : (
                      <>Acesso expirado em: <strong className="text-red-600 dark:text-red-400">{new Date(accessExpiresAt).toLocaleDateString('pt-BR')}</strong></>
                    )}
                  </span>
                </div>
              )}
              
              <div className="flex items-center space-x-3 mb-4">
                <input
                  type="checkbox"
                  id="renewAccess"
                  checked={renewAccess}
                  onChange={(e) => setRenewAccess(e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="renewAccess" className="text-gray-900 dark:text-white font-medium cursor-pointer">
                  Renovar/Prolongar período de acesso
                </label>
              </div>
              
              {renewAccess && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <p className="text-gray-600 dark:text-white/70 text-sm">
                    {accessExpiresAt && new Date(accessExpiresAt) > new Date() 
                      ? 'O período será prolongado a partir da data de expiração atual.'
                      : 'O período será calculado a partir de hoje.'}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[5, 30, 90, 365].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setSelectedDuration(days as 5 | 30 | 90 | 365)}
                        className={`p-4 rounded-lg border transition-colors ${
                          selectedDuration === days
                            ? 'bg-purple-100 dark:bg-purple-500/20 border-purple-500 text-purple-900 dark:text-white'
                            : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/10'
                        }`}
                      >
                        <div className="text-center">
                          <div className="font-semibold text-lg">
                            {days === 5 && '5 dias'}
                            {days === 30 && '30 dias'}
                            {days === 90 && '90 dias'}
                            {days === 365 && '1 ano'}
                          </div>
                          <div className="text-xs opacity-70 mt-1">
                            {days === 5 && '(Demonstração)'}
                            {days === 30 && '(1 mês)'}
                            {days === 90 && '(3 meses)'}
                            {days === 365 && '(Anual)'}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Status */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Status</h3>
            <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-4 border border-gray-200 dark:border-white/10">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="text-gray-900 dark:text-white font-medium cursor-pointer">
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
            className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-white/10"
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
            className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl p-8 max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Confirmar Exclusão</h3>
            <p className="text-gray-600 dark:text-white/70 mb-6">
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