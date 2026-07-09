import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Edit, Trash2, Users, Phone, Mail, Search, CheckCircle, AlertCircle, X, MapPin, Eraser, Camera } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { fornecedoresApi } from '@/lib/api';
import { SupplierAvatar, SupplierRatingBadge } from '@/components/ui/SupplierAvatar';

interface Supplier {
  id: number;
  name: string;
  whatsapp?: string;
  contact_phone?: string;
  contact_email?: string;
  city?: string;
  store_address?: string;
  website?: string;
  photo_url?: string | null;
  rating_avg?: number;
  rating_count?: number;
  is_active: boolean;
  created_at: string;
  last_processed_at?: string;
  processed_today?: boolean;
  products_processed_today?: number;
  product_count?: number;
}

export default function ManageSuppliersPage() {
  const { user } = useAuthStore();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteProductsModal, setShowDeleteProductsModal] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [supplierToDeleteProducts, setSupplierToDeleteProducts] = useState<Supplier | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    whatsapp: '',
    contact_phone: '',
    contact_email: '',
    website: '',
    city: '',
    store_address: '',
    photo_url: '' as string | null,
  });
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Verificar se é admin
  if (user?.tipo !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Acesso Negado</h2>
          <p className="text-gray-600 dark:text-white/70">Apenas administradores podem gerenciar fornecedores.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await fornecedoresApi.getAll();
      const suppliersData = response.data?.suppliers || response.suppliers || response.data || [];
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setSupplierToEdit(supplier);
    setEditForm({
      name: supplier.name || '',
      whatsapp: supplier.whatsapp || supplier.contact_phone || '',
      contact_phone: supplier.contact_phone || supplier.whatsapp || '',
      contact_email: supplier.contact_email || '',
      website: supplier.website || '',
      city: supplier.city || '',
      store_address: supplier.store_address || '',
      photo_url: supplier.photo_url || null,
    });
    setShowEditModal(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Selecione uma imagem (JPG, PNG, etc.)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('A foto deve ter no máximo 2 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setEditForm((prev) => ({ ...prev, photo_url: String(reader.result || '') }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEdit = async () => {
    if (!supplierToEdit) return;

    try {
      // Preparar dados para atualização (remover campos vazios)
      const updateData: any = {
        name: editForm.name,
      };
      
      if (editForm.whatsapp) updateData.whatsapp = editForm.whatsapp;
      if (editForm.contact_phone) updateData.contact_phone = editForm.contact_phone;
      if (editForm.contact_email) updateData.contact_email = editForm.contact_email;
      if (editForm.website) updateData.website = editForm.website;
      if (editForm.city) updateData.city = editForm.city;
      if (editForm.store_address.trim()) {
        updateData.store_address = editForm.store_address.trim();
      } else {
        updateData.store_address = '';
      }
      updateData.photo_url = editForm.photo_url || null;

      await fornecedoresApi.update(supplierToEdit.id.toString(), updateData);
      await fetchSuppliers();
      setShowEditModal(false);
      setSupplierToEdit(null);
    } catch (error: any) {
      console.error('Erro ao atualizar fornecedor:', error);
      alert(error.response?.data?.message || 'Erro ao atualizar fornecedor');
    }
  };

  const handleDelete = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setShowDeleteModal(true);
  };

  const handleDeleteProducts = (supplier: Supplier) => {
    setSupplierToDeleteProducts(supplier);
    setShowDeleteProductsModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!supplierToDelete) return;

    try {
      const response = await fornecedoresApi.delete(supplierToDelete.id.toString());
      const productsDeactivated = response.data?.products_deactivated || supplierToDelete.product_count || 0;
      
      await fetchSuppliers();
      setShowDeleteModal(false);
      setSupplierToDelete(null);
      
      if (productsDeactivated > 0) {
        alert(`✅ Fornecedor "${supplierToDelete.name}" excluído com sucesso!\n\n${productsDeactivated} produto(s) também foram desativados.`);
      } else {
        alert(`✅ Fornecedor "${supplierToDelete.name}" excluído com sucesso!`);
      }
    } catch (error: any) {
      console.error('Erro ao deletar fornecedor:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao deletar fornecedor';
      alert(errorMessage);
    }
  };

  const handleConfirmDeleteProducts = async () => {
    if (!supplierToDeleteProducts) return;

    try {
      const response = await fornecedoresApi.deleteProducts(supplierToDeleteProducts.id.toString());
      const productsDeactivated =
        response.data?.products_deactivated ??
        response.products_deactivated ??
        supplierToDeleteProducts.product_count ??
        0;

      await fetchSuppliers();
      setShowDeleteProductsModal(false);
      setSupplierToDeleteProducts(null);

      if (productsDeactivated > 0) {
        alert(`✅ ${productsDeactivated} produto(s) do fornecedor "${supplierToDeleteProducts.name}" foram excluídos/desativados.`);
      } else {
        alert(`ℹ️ O fornecedor "${supplierToDeleteProducts.name}" não possui produtos ativos para excluir.`);
      }
    } catch (error: any) {
      console.error('Erro ao excluir produtos do fornecedor:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao excluir produtos do fornecedor';
      alert(errorMessage);
    }
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (supplier.whatsapp && supplier.whatsapp.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (supplier.contact_phone && supplier.contact_phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (supplier.contact_email && supplier.contact_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (supplier.city && supplier.city.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-white/70">Carregando fornecedores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gerenciar Fornecedores</h1>
          <p className="text-gray-600 dark:text-white/70 mt-1">Gerencie fornecedores e suas informações</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl p-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-white/50 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar fornecedores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="text-gray-600 dark:text-white/70 text-sm">
            {filteredSuppliers.length} de {suppliers.length} fornecedores
          </div>
        </div>
      </div>

      {/* Suppliers List */}
      <div className="space-y-4">
        {filteredSuppliers.map((supplier) => (
          <motion.div
            key={supplier.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-4">
                <SupplierAvatar name={supplier.name} photoUrl={supplier.photo_url} size="lg" />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{supplier.name}</h3>
                    <SupplierRatingBadge avg={supplier.rating_avg} count={supplier.rating_count} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {supplier.whatsapp && (
                      <span className="text-gray-600 dark:text-white/70 text-sm flex items-center space-x-1">
                        <Phone className="w-3 h-3" />
                        <span>{supplier.whatsapp}</span>
                      </span>
                    )}
                    {supplier.contact_phone && !supplier.whatsapp && (
                      <span className="text-gray-600 dark:text-white/70 text-sm flex items-center space-x-1">
                        <Phone className="w-3 h-3" />
                        <span>{supplier.contact_phone}</span>
                      </span>
                    )}
                    {supplier.contact_email && (
                      <span className="text-gray-600 dark:text-white/70 text-sm flex items-center space-x-1">
                        <Mail className="w-3 h-3" />
                        <span>{supplier.contact_email}</span>
                      </span>
                    )}
                    {supplier.city && (
                      <span className="text-gray-600 dark:text-white/70 text-sm flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>{supplier.city}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    {supplier.processed_today && (
                      <span className="flex items-center space-x-1 bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded text-xs font-medium">
                        <CheckCircle className="w-3 h-3" />
                        <span>Processado hoje</span>
                      </span>
                    )}
                    {supplier.product_count !== undefined && supplier.product_count > 0 && (
                      <span className="text-gray-500 dark:text-white/60 text-xs">
                        {supplier.product_count} produtos
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDeleteProducts(supplier)}
                  className="p-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 rounded-lg transition-colors"
                  title="Excluir produtos do fornecedor"
                >
                  <Eraser className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEdit(supplier)}
                  className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                  title="Editar fornecedor"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(supplier)}
                  className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                  title="Excluir fornecedor"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {filteredSuppliers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 dark:text-white/30 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-white/70">Nenhum fornecedor encontrado</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && supplierToEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Editar Fornecedor</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSupplierToEdit(null);
                }}
                className="text-gray-500 dark:text-white/70 hover:text-gray-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <SupplierAvatar name={editForm.name} photoUrl={editForm.photo_url} size="lg" />
                <div className="flex flex-col gap-2">
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                  >
                    <Camera className="h-4 w-4" />
                    {editForm.photo_url ? 'Trocar foto' : 'Adicionar foto'}
                  </button>
                  {editForm.photo_url && (
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, photo_url: null })}
                      className="text-left text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                    >
                      Remover foto
                    </button>
                  )}
                  <p className="text-[11px] text-gray-500 dark:text-white/45">JPG/PNG até 2 MB. Aparece na busca e nas avaliações.</p>
                </div>
              </div>

              <div>
                <label className="block text-gray-600 dark:text-white/70 text-sm mb-2">Nome do Fornecedor *</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 focus:outline-none focus:border-blue-500"
                  placeholder="Nome do fornecedor"
                />
              </div>

              <div>
                <label className="block text-gray-600 dark:text-white/70 text-sm mb-2">WhatsApp</label>
                <input
                  type="text"
                  value={editForm.whatsapp}
                  onChange={(e) => setEditForm({ ...editForm, whatsapp: e.target.value })}
                  className="w-full bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 focus:outline-none focus:border-blue-500"
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <label className="block text-gray-600 dark:text-white/70 text-sm mb-2">Telefone</label>
                <input
                  type="text"
                  value={editForm.contact_phone}
                  onChange={(e) => setEditForm({ ...editForm, contact_phone: e.target.value })}
                  className="w-full bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 focus:outline-none focus:border-blue-500"
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <label className="block text-gray-600 dark:text-white/70 text-sm mb-2">Email</label>
                <input
                  type="email"
                  value={editForm.contact_email}
                  onChange={(e) => setEditForm({ ...editForm, contact_email: e.target.value })}
                  className="w-full bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 focus:outline-none focus:border-blue-500"
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <label className="block text-gray-600 dark:text-white/70 text-sm mb-2">Cidade</label>
                <input
                  type="text"
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  className="w-full bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 focus:outline-none focus:border-blue-500"
                  placeholder="São Paulo"
                />
              </div>

              <div>
                <label className="block text-gray-600 dark:text-white/70 text-sm mb-2">
                  Endereço no card (shopping / galeria)
                </label>
                <input
                  type="text"
                  value={editForm.store_address}
                  onChange={(e) => setEditForm({ ...editForm, store_address: e.target.value })}
                  className="w-full bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 focus:outline-none focus:border-blue-500"
                  placeholder="SHOPPING ORIENTAL LN-359"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-white/45">
                  Aparece no rodapé do card mobile na busca.
                </p>
              </div>

              <div>
                <label className="block text-gray-600 dark:text-white/70 text-sm mb-2">Website</label>
                <input
                  type="url"
                  value={editForm.website}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  className="w-full bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 focus:outline-none focus:border-blue-500"
                  placeholder="https://exemplo.com"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSupplierToEdit(null);
                }}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Salvar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && supplierToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Confirmar Exclusão</h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSupplierToDelete(null);
                }}
                className="text-gray-500 dark:text-white/70 hover:text-gray-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-gray-600 dark:text-white/70 mb-6">
              Tem certeza que deseja excluir o fornecedor <strong className="text-gray-900 dark:text-white">{supplierToDelete.name}</strong>?
            </p>

            {supplierToDelete.product_count !== undefined && supplierToDelete.product_count > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-500/20 border border-yellow-200 dark:border-yellow-500/30 rounded-lg p-4 mb-4">
                <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                  ⚠️ Este fornecedor possui {supplierToDelete.product_count} produto(s) associado(s).
                  <br />
                  Ao excluir, o fornecedor e todos os seus produtos serão desativados (não aparecerão mais nas buscas).
                </p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSupplierToDelete(null);
                }}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Excluir
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Products Modal */}
      {showDeleteProductsModal && supplierToDeleteProducts && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Excluir Produtos Processados</h3>
              <button
                onClick={() => {
                  setShowDeleteProductsModal(false);
                  setSupplierToDeleteProducts(null);
                }}
                className="text-gray-500 dark:text-white/70 hover:text-gray-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-gray-600 dark:text-white/70 mb-4">
              Deseja excluir/desativar os produtos do fornecedor <strong className="text-gray-900 dark:text-white">{supplierToDeleteProducts.name}</strong>?
            </p>

            <div className="bg-amber-50 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 rounded-lg p-4 mb-4">
              <p className="text-amber-700 dark:text-amber-300 text-sm">
                Essa ação remove os produtos da busca "Buscar mais barato", mas mantém o fornecedor cadastrado.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteProductsModal(false);
                  setSupplierToDeleteProducts(null);
                }}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDeleteProducts}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Excluir produtos
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

