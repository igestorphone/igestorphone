#!/bin/bash
# Configura as credenciais do GitHub para o push funcionar no Cursor (sem pedir senha).
# Rode UMA VEZ no Terminal (fora do Cursor), com seu Personal Access Token.
#
# Uso:
#   ./configurar-push-cursor.sh
#   (vai pedir o token)
#
# Ou com variável de ambiente:
#   GITHUB_TOKEN=ghp_xxxx ./configurar-push-cursor.sh

set -e
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
CREDENTIALS_FILE="${HOME}/.git-credentials"

if [ -n "$GITHUB_TOKEN" ]; then
  TOKEN="$GITHUB_TOKEN"
else
  echo "Para o push funcionar pelo Cursor, precisamos salvar seu token do GitHub."
  echo "Cole seu Personal Access Token (não será exibido):"
  read -s TOKEN
  echo ""
fi

if [ -z "$TOKEN" ]; then
  echo "Token vazio. Abortando."
  exit 1
fi

# Usuário do GitHub (pode ser o seu login; o token é que autentica)
GITHUB_USER="${GITHUB_USER:-igestorphone}"

# Remove linha antiga do github.com se o arquivo já existir
if [ -f "$CREDENTIALS_FILE" ]; then
  grep -v "github.com" "$CREDENTIALS_FILE" > "${CREDENTIALS_FILE}.tmp" 2>/dev/null || true
  [ -f "${CREDENTIALS_FILE}.tmp" ] && mv "${CREDENTIALS_FILE}.tmp" "$CREDENTIALS_FILE"
fi

echo "https://${GITHUB_USER}:${TOKEN}@github.com" >> "$CREDENTIALS_FILE"
chmod 600 "$CREDENTIALS_FILE"

echo "✅ Credenciais salvas em $CREDENTIALS_FILE"
echo "   Agora você pode fazer push pelo Cursor (Terminal integrado ou comando Git)."
echo "   Se ainda pedir senha, rode: git config --global credential.helper store"
