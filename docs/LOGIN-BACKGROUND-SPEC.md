# Spec: fundo da tela de login (mobile + desktop)

Use estas medidas para criar o fundo da tela de login (mobile e desktop).

---

## Onde colocar as imagens no projeto

Coloque as artes **sem o logo** (o app já exibe o logo em cima) em:

- **Desktop:** `public/assets/images/login-bg-desktop.png`
- **Mobile:** `public/assets/images/login-bg-mobile.png`

O layout usa desktop a partir de `md` (768px) e mobile abaixo disso. Se um arquivo não existir, o fundo usa o gradiente padrão.

---

## Onde o fundo é usado

- Tela de **Login** (`/login`)
- Mesmo layout usado em: **Cadastro**, **Recuperar senha**, etc. (`AuthLayout`)

O fundo cobre **toda a viewport** (tela cheia), atrás do card branco/glass com o formulário.

---

## Comportamento do layout

- **Fundo:** ocupa 100% da largura e 100% da altura da tela (`min-h-screen`, viewport inteiro).
- **Conteúdo (card):** centralizado, largura máxima **448px** (`max-w-md`).
- **Padding da página:** **16px** em todos os lados (mobile e desktop).
- O fundo pode ser **imagem** (ex.: `background-size: cover`) ou **gradiente/ilustração** que se adapte a qualquer tamanho de tela.

---

## Medidas recomendadas para arte final

### Mobile (uma arte)

| Especificação | Valor | Observação |
|---------------|--------|------------|
| **Largura**   | **414px** | Referência iPhone (ou 390px se preferir) |
| **Altura**    | **896px** | Referência iPhone (ou 844px) |
| **Proporção** | 9:19,5 (aprox.) | Pode ser maior (ex.: 414 x 932) para telas altas |

- Entregar em **414 x 896 px** (ou 390 x 844 px).
- Considerar **safe area**: não colocar informação crítica nos cantos (notch, gestos).
- O card de login fica no centro; o fundo à esquerda/direita e em cima/embaixo pode ser mais “decorativo”.

### Desktop (uma arte)

| Especificação | Valor | Observação |
|---------------|--------|------------|
| **Largura**   | **1920px** | Full HD |
| **Altura**    | **1080px** | Full HD |
| **Proporção** | 16:9 | Pode ser 1440 x 900 ou 2560 x 1440 se quiser |

- Entregar em **1920 x 1080 px** (ou 1440 x 900 px).
- Se for **imagem única** com `background-size: cover`, o centro da imagem tende a aparecer mais; evitar texto ou logo importante só nas bordas.

---

## Resumo para o designer

1. **Mobile:** arte em **414 x 896 px** (72 dpi ou 2x: 828 x 1792 px).
2. **Desktop:** arte em **1920 x 1080 px** (72 dpi ou 2x: 3840 x 2160 px).
3. O fundo **preenche a tela inteira**; no centro há um card de **até 448px** de largura – não é preciso “reservar” um retângulo exato, só evitar detalhes críticos nas bordas se for crop (cover).
4. Formato de arquivo: **PNG** (com transparência se precisar) ou **JPG** (fundo opaco). **WebP** também é aceitável para implementação web.

---

## Breakpoints do projeto (referência)

| Nome   | Largura mínima (px) | Uso típico   |
|--------|----------------------|--------------|
| (base) | 0                    | Mobile first |
| `sm`   | 640                  | Mobile largo |
| `md`   | 768                  | Tablet       |
| `lg`   | 1024                 | Desktop      |
| `xl`   | 1280                 | Desktop largo|
| `2xl`  | 1536                 | Telas grandes|

O fundo é único para toda a largura; não há mudança de arte por breakpoint, só redimensionamento/crop da mesma imagem (ou uso de mobile vs desktop conforme implementação).

---

## Cores atuais do gradiente (referência)

Hoje o fundo usa um gradiente escuro (pode ser substituído pela nova arte):

- `#0A0E21` → `#1a1f3a` (135deg)
- Theme color no `index.html`: `#0A0E21`

Útil para o designer manter contraste com texto branco e o card de login.
