import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Mail, Phone, Calendar, Shield, CheckCircle, AlertCircle } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-primary p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <FileText className="w-12 h-12 text-blue-400 mr-3" />
            <h1 className="text-4xl font-bold text-white">Termos de Uso</h1>
          </div>
          <p className="text-white/70 text-lg">
            iGestorPhone - Sistema de Gestão Inteligente para Lojistas Apple
          </p>
          <div className="flex items-center justify-center mt-4 space-x-6 text-sm text-white/60">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Última atualização: 16 de Setembro de 2024
            </div>
            <div className="flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              Versão 1.0.0
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20"
        >
          {/* 1. Aceitação dos Termos */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <CheckCircle className="w-6 h-6 text-green-400 mr-3" />
              1. Aceitação dos Termos
            </h2>
            <p className="text-white/80 leading-relaxed">
              Ao utilizar o sistema iGestorPhone, você concorda em cumprir e estar vinculado a estes Termos de Uso. 
              Se você não concordar com qualquer parte destes termos, não deve utilizar nosso serviço.
            </p>
          </section>

          {/* 2. Descrição do Serviço */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <CheckCircle className="w-6 h-6 text-green-400 mr-3" />
              2. Descrição do Serviço
            </h2>
            <p className="text-white/80 leading-relaxed mb-4">
              O iGestorPhone é um sistema inteligente de gestão desenvolvido especificamente para lojistas de produtos Apple, 
              oferecendo:
            </p>
            <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
              <li>Análise inteligente de preços com IA</li>
              <li>Gestão de fornecedores e produtos</li>
              <li>Relatórios e estatísticas detalhadas</li>
              <li>Validação automática de listas de produtos</li>
              <li>Busca otimizada por melhores preços</li>
              <li>Dashboard interativo e intuitivo</li>
            </ul>
          </section>

          {/* 3. Conta de Usuário */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <CheckCircle className="w-6 h-6 text-green-400 mr-3" />
              3. Conta de Usuário
            </h2>
            <div className="space-y-4 text-white/80">
              <p>
                <strong>3.1 Registro:</strong> Para utilizar o sistema, você deve criar uma conta fornecendo informações 
                precisas e atualizadas.
              </p>
              <p>
                <strong>3.2 Responsabilidade:</strong> Você é responsável por manter a confidencialidade de sua senha 
                e por todas as atividades que ocorrem em sua conta.
              </p>
              <p>
                <strong>3.3 Verificação:</strong> Reservamo-nos o direito de verificar a identidade dos usuários e 
                suspender contas que violem estes termos.
              </p>
            </div>
          </section>

          {/* 4. Uso Aceitável */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <CheckCircle className="w-6 h-6 text-green-400 mr-3" />
              4. Uso Aceitável
            </h2>
            <div className="space-y-4 text-white/80">
              <p>Você concorda em NÃO:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Usar o sistema para atividades ilegais ou não autorizadas</li>
                <li>Tentar acessar contas de outros usuários</li>
                <li>Interferir no funcionamento do sistema</li>
                <li>Distribuir malware ou código malicioso</li>
                <li>Violar direitos de propriedade intelectual</li>
                <li>Usar o sistema para spam ou comunicações não solicitadas</li>
              </ul>
            </div>
          </section>

          {/* 5. Propriedade Intelectual */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <CheckCircle className="w-6 h-6 text-green-400 mr-3" />
              5. Propriedade Intelectual
            </h2>
            <div className="space-y-4 text-white/80">
              <p>
                O iGestorPhone e todo seu conteúdo, incluindo mas não limitado a textos, gráficos, logos, 
                ícones, imagens, software e compilações, são propriedade da empresa e protegidos por leis 
                de direitos autorais e outras leis de propriedade intelectual.
              </p>
              <p>
                Você não pode reproduzir, distribuir, modificar ou criar trabalhos derivados baseados em 
                nosso conteúdo sem autorização expressa por escrito.
              </p>
            </div>
          </section>

          {/* 6. Privacidade e Dados */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <CheckCircle className="w-6 h-6 text-green-400 mr-3" />
              6. Privacidade e Proteção de Dados
            </h2>
            <div className="space-y-4 text-white/80">
              <p>
                <strong>6.1 Coleta de Dados:</strong> Coletamos apenas os dados necessários para fornecer 
                nossos serviços, incluindo informações de conta, dados de uso e informações de contato.
              </p>
              <p>
                <strong>6.2 Uso dos Dados:</strong> Seus dados são utilizados exclusivamente para:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Fornecer e melhorar nossos serviços</li>
                <li>Processar transações e pagamentos</li>
                <li>Comunicar atualizações e suporte</li>
                <li>Cumprir obrigações legais</li>
              </ul>
              <p>
                <strong>6.3 Segurança:</strong> Implementamos medidas de segurança adequadas para proteger 
                seus dados contra acesso não autorizado, alteração, divulgação ou destruição.
              </p>
            </div>
          </section>

          {/* 7. Limitação de Responsabilidade */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <AlertCircle className="w-6 h-6 text-yellow-400 mr-3" />
              7. Limitação de Responsabilidade
            </h2>
            <div className="space-y-4 text-white/80">
              <p>
                O iGestorPhone é fornecido "como está" e "conforme disponível". Não garantimos que o serviço 
                será ininterrupto, livre de erros ou atenderá às suas necessidades específicas.
              </p>
              <p>
                Em nenhuma circunstância seremos responsáveis por danos diretos, indiretos, incidentais, 
                especiais ou consequenciais resultantes do uso ou incapacidade de usar nosso serviço.
              </p>
            </div>
          </section>

          {/* 8. Modificações */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <CheckCircle className="w-6 h-6 text-green-400 mr-3" />
              8. Modificações dos Termos
            </h2>
            <p className="text-white/80 leading-relaxed">
              Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entrarão 
              em vigor imediatamente após a publicação. Seu uso continuado do serviço após as modificações 
              constitui aceitação dos novos termos.
            </p>
          </section>

          {/* 9. Rescisão */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <CheckCircle className="w-6 h-6 text-green-400 mr-3" />
              9. Rescisão
            </h2>
            <div className="space-y-4 text-white/80">
              <p>
                Você pode encerrar sua conta a qualquer momento. Podemos suspender ou encerrar sua conta 
                imediatamente, sem aviso prévio, por violação destes termos.
              </p>
              <p>
                Após a rescisão, seu direito de usar o serviço cessará imediatamente, mas as disposições 
                que por sua natureza devem sobreviver continuarão em vigor.
              </p>
            </div>
          </section>

          {/* 10. Contato */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <CheckCircle className="w-6 h-6 text-green-400 mr-3" />
              10. Contato e Suporte
            </h2>
            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <p className="text-white/80 mb-4">
                Se você tiver dúvidas sobre estes Termos de Uso, entre em contato conosco:
              </p>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-blue-400 mr-3" />
                  <span className="text-white/80">Email: </span>
                  <a 
                    href="mailto:igestorphone@gmail.com" 
                    className="text-blue-400 hover:text-blue-300 ml-2"
                  >
                    igestorphone@gmail.com
                  </a>
                </div>
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-green-400 mr-3" />
                  <span className="text-white/80">WhatsApp: </span>
                  <a 
                    href="https://wa.me/5511983132474" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-green-400 hover:text-green-300 ml-2"
                  >
                    (11) 98313-2474
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="border-t border-white/20 pt-6 mt-8">
            <p className="text-center text-white/60 text-sm">
              © 2024 iGestorPhone. Todos os direitos reservados.
            </p>
            <p className="text-center text-white/50 text-xs mt-2">
              Este documento foi atualizado em 16 de Setembro de 2024.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}