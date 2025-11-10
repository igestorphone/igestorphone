import React, { useState } from 'react';
import { Upload, CheckCircle, AlertTriangle, XCircle, Brain, Loader2 } from 'lucide-react';

interface Product {
  name: string;
  model?: string;
  color?: string;
  storage?: string;
  condition?: string;
  price: number;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  validated_products: Product[];
}

const ListValidator: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const lines = content.split('\n').filter(line => line.trim());
        
        const parsedProducts: Product[] = lines.map((line, index) => {
          const parts = line.split(',').map(part => part.trim());
          return {
            name: parts[0] || `Produto ${index + 1}`,
            model: parts[1] || '',
            color: parts[2] || '',
            storage: parts[3] || '',
            condition: parts[4] || 'Novo',
            price: parseFloat(parts[5]) || 0
          };
        });

        setProducts(parsedProducts);
        setValidationResult(null);
        setError(null);
      } catch (err) {
        setError('Erro ao processar arquivo. Verifique o formato.');
      }
    };
    reader.readAsText(file);
  };

  const handleManualInput = () => {
    const newProduct: Product = {
      name: '',
      model: '',
      color: '',
      storage: '',
      condition: 'Novo',
      price: 0
    };
    setProducts([...products, newProduct]);
  };

  const updateProduct = (index: number, field: keyof Product, value: string | number) => {
    const updatedProducts = [...products];
    updatedProducts[index] = {
      ...updatedProducts[index],
      [field]: value
    };
    setProducts(updatedProducts);
  };

  const removeProduct = (index: number) => {
    const updatedProducts = products.filter((_, i) => i !== index);
    setProducts(updatedProducts);
  };

  const validateList = async () => {
    if (products.length === 0) {
      setError('Adicione pelo menos um produto para validar');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai/validate-list', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ products })
      });

      if (!response.ok) {
        throw new Error('Erro na validação');
      }

      const data = await response.json();
      setValidationResult(data.validation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na validação');
    } finally {
      setLoading(false);
    }
  };

  const getValidationIcon = (type: 'error' | 'warning' | 'success') => {
    switch (type) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Brain className="w-8 h-8 text-purple-600 mr-3" />
          Validação Inteligente de Listas
        </h1>
        <p className="text-gray-600 mt-2">
          Use IA para validar e otimizar suas listas de produtos Apple
        </p>
      </div>

      {/* Upload de Arquivo */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Importar Lista</h2>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            Faça upload de um arquivo CSV com os produtos
          </p>
          <input
            type="file"
            accept=".csv,.txt"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700"
          >
            Selecionar Arquivo
          </label>
          <p className="text-xs text-gray-500 mt-2">
            Formato: Nome, Modelo, Cor, Armazenamento, Condição, Preço
          </p>
        </div>
      </div>

      {/* Lista de Produtos */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Lista de Produtos ({products.length})
          </h2>
          <button
            onClick={handleManualInput}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Adicionar Produto
          </button>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhum produto adicionado. Importe um arquivo ou adicione manualmente.
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome *
                    </label>
                    <input
                      type="text"
                      value={product.name}
                      onChange={(e) => updateProduct(index, 'name', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="iPhone 15 Pro"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Modelo
                    </label>
                    <input
                      type="text"
                      value={product.model || ''}
                      onChange={(e) => updateProduct(index, 'model', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="A3108"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cor
                    </label>
                    <input
                      type="text"
                      value={product.color || ''}
                      onChange={(e) => updateProduct(index, 'color', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="Titanium Natural"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Armazenamento
                    </label>
                    <input
                      type="text"
                      value={product.storage || ''}
                      onChange={(e) => updateProduct(index, 'storage', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="256GB"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Condição
                    </label>
                    <select
                      value={product.condition || 'Novo'}
                      onChange={(e) => updateProduct(index, 'condition', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="Novo">Novo</option>
                      <option value="Seminovo">Seminovo</option>
                      <option value="Usado">Usado</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço *
                    </label>
                    <div className="flex">
                      <input
                        type="number"
                        value={product.price}
                        onChange={(e) => updateProduct(index, 'price', parseFloat(e.target.value) || 0)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="8999.00"
                        step="0.01"
                      />
                      <button
                        onClick={() => removeProduct(index)}
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {products.length > 0 && (
          <div className="mt-6 text-center">
            <button
              onClick={validateList}
              disabled={loading}
              className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center mx-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Validando com IA...
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5 mr-2" />
                  Validar Lista com IA
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Resultados da Validação */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {validationResult && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            {validationResult.valid ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                Validação Concluída
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-red-500 mr-2" />
                Validação com Problemas
              </>
            )}
          </h2>

          {/* Erros */}
          {validationResult.errors.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium text-red-700 mb-2">Erros Encontrados:</h3>
              <ul className="space-y-1">
                {validationResult.errors.map((error, index) => (
                  <li key={index} className="flex items-center text-red-600">
                    {getValidationIcon('error')}
                    <span className="ml-2">{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Avisos */}
          {validationResult.warnings.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium text-yellow-700 mb-2">Avisos:</h3>
              <ul className="space-y-1">
                {validationResult.warnings.map((warning, index) => (
                  <li key={index} className="flex items-center text-yellow-600">
                    {getValidationIcon('warning')}
                    <span className="ml-2">{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Sugestões */}
          {validationResult.suggestions.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium text-blue-700 mb-2">Sugestões da IA:</h3>
              <ul className="space-y-1">
                {validationResult.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-center text-blue-600">
                    <Brain className="w-4 h-4 mr-2" />
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Produtos Validados */}
          {validationResult.validated_products && validationResult.validated_products.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Produtos Validados:</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                  {JSON.stringify(validationResult.validated_products, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ListValidator;











