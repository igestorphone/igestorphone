# Fazer push pelo Cursor

Para o **push funcionar direto no Cursor** (sem abrir o Terminal do sistema), faça esta configuração **uma vez**.

## Passo 1: Token do GitHub

Se ainda não tiver um Personal Access Token:

1. GitHub → **Settings** → **Developer settings** → **Personal access tokens**
2. **Generate new token** (classic)
3. Marque pelo menos **repo**
4. Copie o token (começa com `ghp_`)

## Passo 2: Salvar a credencial

No **Terminal do macOS** (fora do Cursor), na pasta do projeto:

```bash
cd /Users/MAC/igestorphone
chmod +x configurar-push-cursor.sh
./configurar-push-cursor.sh
```

Quando pedir, **cole o token** e dê Enter. O token fica salvo em `~/.git-credentials` (só na sua máquina, não vai pro repositório).

## Passo 3: Usar no Cursor

Depois disso:

- **Terminal integrado do Cursor**: `git push origin main` deve funcionar sem pedir senha.
- **Source Control (Ctrl+Shift+G)**: ao dar **Push**, também deve usar a credencial salva.

O repositório está configurado com `credential.helper = store`, então o Git usa o arquivo `~/.git-credentials` e não abre popup de senha.

## Se ainda pedir senha

Rode no Terminal (uma vez):

```bash
git config --global credential.helper store
```

Depois execute de novo o `configurar-push-cursor.sh` para garantir que `~/.git-credentials` tem a linha do GitHub.

## Segurança

- O token **não** fica em nenhum arquivo commitado.
- Fica só em `~/.git-credentials` na sua máquina.
- Se trocar de computador, repita os passos 1 e 2.
