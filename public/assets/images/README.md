# Assets - Imagens

## Logo da Marca

Para usar seu logo personalizado:

1. **Substitua o arquivo `logo.png`** neste diretório pelo seu logo real
2. **Formato recomendado**: PNG com fundo transparente
3. **Tamanho recomendado**: 200x200px ou maior (será redimensionado automaticamente)
4. **Nome do arquivo**: `logo.png` (obrigatório)

## Fundo da tela de login (desktop e mobile)

Para usar fundo personalizado na tela de login/cadastro:

1. Coloque **duas imagens** neste diretório **sem o logo** (o app já exibe o logo em cima):
   - **Desktop:** `login-bg-desktop.png` (ex.: 1920×1080 px)
   - **Mobile:** `login-bg-mobile.png` (ex.: 414×896 px)
2. O layout usa a versão desktop a partir de 768px de largura e a mobile em telas menores.
3. Medidas e detalhes: veja `docs/LOGIN-BACKGROUND-SPEC.md`.

## Estrutura de Arquivos

```
public/assets/images/
├── logo.png              # Logo principal da marca
├── login-bg-desktop.png  # Fundo login (desktop) – opcional
├── login-bg-mobile.png   # Fundo login (mobile) – opcional
└── README.md             # Este arquivo
```

## Fallback

Se o logo não for encontrado ou não carregar, o sistema automaticamente mostrará um ícone de celular com gradiente como fallback.

## Como Funciona

- O logo é carregado de `/assets/images/logo.png`
- Se a imagem falhar ao carregar, o sistema mostra um fallback automático
- O logo aparece nas telas de login e dashboard
- Suporta qualquer formato de imagem (PNG, JPG, SVG, etc.)














