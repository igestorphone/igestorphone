# Assets - Imagens

## Logo da Marca

Para usar seu logo personalizado:

1. **Substitua o arquivo `logo.png`** neste diretório pelo seu logo real
2. **Formato recomendado**: PNG com fundo transparente
3. **Tamanho recomendado**: 200x200px ou maior (será redimensionado automaticamente)
4. **Nome do arquivo**: `logo.png` (obrigatório)

## Estrutura de Arquivos

```
public/assets/images/
├── logo.png          # Logo principal da marca
└── README.md         # Este arquivo
```

## Fallback

Se o logo não for encontrado ou não carregar, o sistema automaticamente mostrará um ícone de celular com gradiente como fallback.

## Como Funciona

- O logo é carregado de `/assets/images/logo.png`
- Se a imagem falhar ao carregar, o sistema mostra um fallback automático
- O logo aparece nas telas de login e dashboard
- Suporta qualquer formato de imagem (PNG, JPG, SVG, etc.)














