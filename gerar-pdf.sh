#!/bin/bash

# iGestorPhone - Gerador de PDF da Rotina
# Este script converte o arquivo markdown em PDF

echo "📄 Gerando PDF da Rotina Completa..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar se pandoc está instalado
if ! command -v pandoc &> /dev/null; then
    echo -e "${YELLOW}⚠️  Pandoc não encontrado. Instalando...${NC}"
    
    # Instalar pandoc via Homebrew
    if command -v brew &> /dev/null; then
        brew install pandoc
    else
        echo -e "${RED}❌ Homebrew não encontrado. Instale o pandoc manualmente:${NC}"
        echo "   https://pandoc.org/installing.html"
        exit 1
    fi
fi

# Verificar se wkhtmltopdf está instalado (alternativa)
if ! command -v wkhtmltopdf &> /dev/null; then
    echo -e "${YELLOW}⚠️  wkhtmltopdf não encontrado. Instalando...${NC}"
    
    if command -v brew &> /dev/null; then
        brew install wkhtmltopdf
    else
        echo -e "${YELLOW}⚠️  Usando pandoc com PDF engine padrão${NC}"
    fi
fi

# Gerar PDF usando pandoc
echo -e "${BLUE}🔄 Convertendo markdown para PDF...${NC}"

# Tentar com pandoc primeiro
if pandoc ROTINA_COMPLETA_iGestorPhone.md -o ROTINA_COMPLETA_iGestorPhone.pdf --pdf-engine=wkhtmltopdf --css=<(echo "
body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
h2 { color: #34495e; border-bottom: 2px solid #ecf0f1; padding-bottom: 5px; }
h3 { color: #7f8c8d; }
code { background-color: #f8f9fa; padding: 2px 4px; border-radius: 3px; font-family: 'Courier New', monospace; }
pre { background-color: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #3498db; }
blockquote { border-left: 4px solid #3498db; margin: 0; padding-left: 20px; color: #7f8c8d; }
ul, ol { padding-left: 20px; }
li { margin-bottom: 5px; }
table { border-collapse: collapse; width: 100%; margin: 20px 0; }
th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
th { background-color: #f2f2f2; font-weight: bold; }
.checklist { background-color: #e8f5e8; padding: 15px; border-radius: 5px; border-left: 4px solid #27ae60; }
.emergency { background-color: #fdf2f2; padding: 15px; border-radius: 5px; border-left: 4px solid #e74c3c; }
") 2>/dev/null; then
    echo -e "${GREEN}✅ PDF gerado com sucesso: ROTINA_COMPLETA_iGestorPhone.pdf${NC}"
elif pandoc ROTINA_COMPLETA_iGestorPhone.md -o ROTINA_COMPLETA_iGestorPhone.pdf 2>/dev/null; then
    echo -e "${GREEN}✅ PDF gerado com sucesso: ROTINA_COMPLETA_iGestorPhone.pdf${NC}"
else
    echo -e "${YELLOW}⚠️  Pandoc falhou. Tentando método alternativo...${NC}"
    
    # Método alternativo: converter para HTML e depois PDF
    if command -v wkhtmltopdf &> /dev/null; then
        pandoc ROTINA_COMPLETA_iGestorPhone.md -o temp.html
        wkhtmltopdf temp.html ROTINA_COMPLETA_iGestorPhone.pdf
        rm temp.html
        
        if [ -f "ROTINA_COMPLETA_iGestorPhone.pdf" ]; then
            echo -e "${GREEN}✅ PDF gerado com sucesso: ROTINA_COMPLETA_iGestorPhone.pdf${NC}"
        else
            echo -e "${RED}❌ Erro ao gerar PDF${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ Não foi possível gerar PDF. Instale wkhtmltopdf:${NC}"
        echo "   brew install wkhtmltopdf"
        exit 1
    fi
fi

# Verificar se o arquivo foi criado
if [ -f "ROTINA_COMPLETA_iGestorPhone.pdf" ]; then
    # Mostrar informações do arquivo
    FILE_SIZE=$(du -h ROTINA_COMPLETA_iGestorPhone.pdf | cut -f1)
    echo -e "${BLUE}📊 Informações do PDF:${NC}"
    echo -e "   Arquivo: ${GREEN}ROTINA_COMPLETA_iGestorPhone.pdf${NC}"
    echo -e "   Tamanho: ${GREEN}$FILE_SIZE${NC}"
    echo -e "   Localização: ${GREEN}$(pwd)${NC}"
    
    # Abrir o PDF automaticamente
    echo -e "${BLUE}🚀 Abrindo PDF...${NC}"
    open ROTINA_COMPLETA_iGestorPhone.pdf 2>/dev/null || echo -e "${YELLOW}⚠️  Abra o arquivo manualmente: ROTINA_COMPLETA_iGestorPhone.pdf${NC}"
    
    echo ""
    echo -e "${GREEN}🎉 PDF da Rotina Completa gerado com sucesso!${NC}"
    echo -e "${BLUE}💡 Você pode imprimir ou compartilhar este arquivo${NC}"
else
    echo -e "${RED}❌ Erro: Arquivo PDF não foi criado${NC}"
    exit 1
fi












