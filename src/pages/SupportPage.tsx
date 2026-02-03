import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  HelpCircle, 
  Mail, 
  Phone, 
  MessageCircle, 
  Send, 
  CheckCircle, 
  Clock, 
  Users, 
  Shield,
  Zap,
  FileText,
  Settings,
  AlertTriangle,
  Info
} from 'lucide-react';
import { supportApi } from '@/lib/api';

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: 'pending' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState<'contact' | 'faq' | 'tickets'>('contact');
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    message: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  const loadTickets = async () => {
    setTicketsLoading(true);
    try {
      const res = await supportApi.getTickets();
      const list = (res as { tickets?: Array<{ id: string; subject: string; message: string; status: string; priority: string; createdAt: string | null }> }).tickets ?? [];
      setTickets(list.map((t) => ({
        id: t.id,
        subject: t.subject,
        message: t.message,
        status: t.status as SupportTicket['status'],
        priority: t.priority as SupportTicket['priority'],
        createdAt: t.createdAt || ''
      })));
    } catch {
      setTickets([]);
    } finally {
      setTicketsLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const faqItems = [
    {
      question: 'Como faço para criar uma conta?',
      answer: 'Para criar uma conta, clique em "Registrar" na página de login e preencha os dados solicitados. Um administrador aprovará sua conta em até 24 horas.'
    },
    {
      question: 'Esqueci minha senha, como recuperar?',
      answer: 'Clique em "Esqueci minha senha" na página de login e siga as instruções enviadas por email. Se não receber o email, verifique a pasta de spam.'
    },
    {
      question: 'Como funciona a análise de preços com IA?',
      answer: 'Nossa IA analisa automaticamente os preços dos produtos, identifica tendências de mercado e sugere os melhores fornecedores baseado em critérios como preço, qualidade e confiabilidade.'
    },
    {
      question: 'Posso exportar meus dados?',
      answer: 'Sim, você pode exportar relatórios, listas de produtos e dados de fornecedores em formatos Excel e PDF através do menu de relatórios.'
    },
    {
      question: 'O sistema funciona offline?',
      answer: 'Não, o iGestorPhone é uma aplicação web que requer conexão com a internet para funcionar corretamente e sincronizar dados em tempo real.'
    },
    {
      question: 'Como atualizar informações de fornecedores?',
      answer: 'Acesse "Gerenciar Fornecedores" no menu lateral, clique no fornecedor desejado e selecione "Editar" para atualizar as informações.'
    }
  ];

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await supportApi.createTicket({
        subject: ticketForm.subject,
        message: ticketForm.message,
        priority: ticketForm.priority
      }) as { ticket?: { id: string; subject: string; message: string; status: string; priority: string; createdAt: string | null } };
      if (res.ticket) {
        const t = res.ticket;
        setTickets((prev) => [{
          id: t.id,
          subject: t.subject,
          message: t.message,
          status: (t.status || 'pending') as SupportTicket['status'],
          priority: (t.priority || 'medium') as SupportTicket['priority'],
          createdAt: t.createdAt || new Date().toISOString().split('T')[0]
        }, ...prev]);
      }
      setTicketForm({ subject: '', message: '', priority: 'medium' });
      toast.success('Ticket enviado com sucesso!');
    } catch {
      toast.error('Erro ao enviar ticket. Tente novamente.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-400/20';
      case 'in_progress': return 'text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-400/20';
      case 'pending': return 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-400/20';
      default: return 'text-gray-700 dark:text-gray-400 bg-gray-100 dark:bg-gray-400/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-400/20';
      case 'medium': return 'text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-400/20';
      case 'low': return 'text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-400/20';
      default: return 'text-gray-700 dark:text-gray-400 bg-gray-100 dark:bg-gray-400/20';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-primary p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <HelpCircle className="w-12 h-12 text-blue-500 dark:text-blue-400 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Central de Suporte</h1>
          </div>
          <p className="text-gray-600 dark:text-white/70 text-lg">
            Estamos aqui para ajudar você a aproveitar ao máximo o iGestorPhone
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white dark:bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-gray-200 dark:border-white/20 mb-8"
        >
          <div className="flex space-x-1 mb-6">
            {[
              { id: 'contact', label: 'Contato', icon: MessageCircle },
              { id: 'faq', label: 'Perguntas Frequentes', icon: FileText },
              { id: 'tickets', label: 'Meus Tickets', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-4 py-2 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Contact Methods */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-6 border border-gray-200 dark:border-white/10">
                  <div className="flex items-center mb-4">
                    <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Email</h3>
                  </div>
                  <p className="text-gray-600 dark:text-white/80 mb-4">
                    Envie suas dúvidas por email e receba resposta em até 24 horas.
                  </p>
                  <a
                    href="mailto:igestorphone@gmail.com"
                    className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    igestorphone@gmail.com
                  </a>
                </div>

                <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-6 border border-gray-200 dark:border-white/10">
                  <div className="flex items-center mb-4">
                    <Phone className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">WhatsApp</h3>
                  </div>
                  <p className="text-gray-600 dark:text-white/80 mb-4">
                    Suporte rápido e direto via WhatsApp.
                  </p>
                  <a
                    href="https://wa.me/5511983132474"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    (11) 98313-2474
                  </a>
                </div>
              </div>

              {/* Support Ticket Form */}
              <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-6 border border-gray-200 dark:border-white/10">
                <div className="flex items-center mb-4">
                  <Send className="w-6 h-6 text-purple-600 dark:text-purple-400 mr-3" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Abrir Ticket de Suporte</h3>
                </div>
                <form onSubmit={handleSubmitTicket} className="space-y-4">
                  <div>
                    <label className="block text-gray-700 dark:text-white/80 text-sm font-medium mb-2">
                      Assunto
                    </label>
                    <input
                      type="text"
                      value={ticketForm.subject}
                      onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Descreva brevemente o problema"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 dark:text-white/80 text-sm font-medium mb-2">
                      Prioridade
                    </label>
                    <select
                      value={ticketForm.priority}
                      onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value as any })}
                      className="w-full px-4 py-2 bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Baixa</option>
                      <option value="medium">Média</option>
                      <option value="high">Alta</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 dark:text-white/80 text-sm font-medium mb-2">
                      Mensagem
                    </label>
                    <textarea
                      value={ticketForm.message}
                      onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Descreva detalhadamente o problema ou dúvida"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Enviar Ticket
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* FAQ Tab */}
          {activeTab === 'faq' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {faqItems.map((item, index) => (
                <div key={index} className="bg-gray-50 dark:bg-white/5 rounded-lg p-6 border border-gray-200 dark:border-white/10">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                    {item.question}
                  </h3>
                  <p className="text-gray-600 dark:text-white/80 leading-relaxed">{item.answer}</p>
                </div>
              ))}
            </motion.div>
          )}

          {/* Tickets Tab */}
          {activeTab === 'tickets' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {ticketsLoading ? (
                <div className="text-center py-8 text-gray-600 dark:text-white/80">Carregando seus tickets...</div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="w-12 h-12 text-yellow-500 dark:text-yellow-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-white/80">Nenhum ticket encontrado. Abra um novo na aba Contato.</p>
                </div>
              ) : (
                tickets.map((ticket) => (
                  <div key={ticket.id} className="bg-gray-50 dark:bg-white/5 rounded-lg p-6 border border-gray-200 dark:border-white/10">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{ticket.subject}</h3>
                      <div className="flex space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {ticket.status === 'resolved' ? 'Resolvido' : 
                           ticket.status === 'in_progress' ? 'Em Andamento' : 'Pendente'}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority === 'high' ? 'Alta' : 
                           ticket.priority === 'medium' ? 'Média' : 'Baixa'}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-white/80 mb-3">{ticket.message}</p>
                    <div className="flex items-center text-sm text-gray-500 dark:text-white/60">
                      <Clock className="w-4 h-4 mr-2" />
                      Criado em {ticket.createdAt}
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white dark:bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-gray-200 dark:border-white/20"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Ações Rápidas</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <a
              href="https://wa.me/5511983132474"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center p-4 bg-green-100 dark:bg-green-500/20 hover:bg-green-200 dark:hover:bg-green-500/30 rounded-lg border border-green-300 dark:border-green-500/30 transition-colors"
            >
              <MessageCircle className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" />
              <span className="text-gray-900 dark:text-white font-medium">Chat WhatsApp</span>
            </a>
            <a
              href="mailto:igestorphone@gmail.com"
              className="flex items-center justify-center p-4 bg-blue-100 dark:bg-blue-500/20 hover:bg-blue-200 dark:hover:bg-blue-500/30 rounded-lg border border-blue-300 dark:border-blue-500/30 transition-colors"
            >
              <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
              <span className="text-gray-900 dark:text-white font-medium">Enviar Email</span>
            </a>
            <button
              onClick={() => setActiveTab('faq')}
              className="flex items-center justify-center p-4 bg-purple-100 dark:bg-purple-500/20 hover:bg-purple-200 dark:hover:bg-purple-500/30 rounded-lg border border-purple-300 dark:border-purple-500/30 transition-colors"
            >
              <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400 mr-3" />
              <span className="text-gray-900 dark:text-white font-medium">Ver FAQ</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}