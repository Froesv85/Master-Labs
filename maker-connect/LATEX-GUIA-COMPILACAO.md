# Guia de Compilação: Paper MakerConnect (LaTeX)

**Arquivo**: `paper-trabalhos-relacionados.tex`  
**Referências**: `refs.bib`  
**Classe**: `sbcreviews-2025`  
**Idioma**: Português  

---

## 📋 Pré-requisitos

### Instalação Local
Você precisa ter instalado:
- **TeX/LaTeX**: MiKTeX (Windows) ou TeXLive (Linux/Mac)
- **Editor**: Overleaf (online) ou VS Code + LaTeX Workshop

### Dependências Adicionais
```bash
# Caso use MiKTeX, instale:
mpm --install sbcreviews-2025
mpm --install orcidlink
mpm --install xcolor
mpm --install tabularray
mpm --install fontawesome
```

---

## 🚀 Como Compilar

### Opção 1: Overleaf (Recomendado - Online)

1. Acesse [Overleaf](https://www.overleaf.com/)
2. Clique em "New Project" → "Upload Project"
3. Faça upload dos arquivos:
   - `paper-trabalhos-relacionados.tex`
   - `refs.bib`
4. Clique em "Compile"

**Resultado**: PDF gerado automaticamente

---

### Opção 2: Terminal (Linux/Mac)

```bash
# Navegar até o diretório
cd /caminho/para/maker-connect

# Compilação completa
pdflatex -interaction=nonstopmode paper-trabalhos-relacionados.tex
bibtex paper-trabalhos-relacionados
pdflatex -interaction=nonstopmode paper-trabalhos-relacionados.tex
pdflatex -interaction=nonstopmode paper-trabalhos-relacionados.tex

# Resultado: paper-trabalhos-relacionados.pdf
```

---

### Opção 3: PowerShell (Windows)

```powershell
# Navegar até o diretório
cd "C:\Users\ViniciusFroes\OneDrive - A3C Tecnologia\Área de Trabalho\7 Semestre\PAC\Master-Labs-main\maker-connect"

# Compilação com MiKTeX
pdflatex -synctex=1 -interaction=nonstopmode paper-trabalhos-relacionados.tex
bibtex paper-trabalhos-relacionados.aux
pdflatex -synctex=1 -interaction=nonstopmode paper-trabalhos-relacionados.tex
pdflatex -synctex=1 -interaction=nonstopmode paper-trabalhos-relacionados.tex

# Resultado: paper-trabalhos-relacionados.pdf
```

---

### Opção 4: VS Code + LaTeX Workshop

1. Instale a extensão **LaTeX Workshop** (James Yu)
2. Abra `paper-trabalhos-relacionados.tex`
3. Clique no ícone ✓ (Build LaTeX project) ou use `Ctrl+Alt+B`

**Resultado**: PDF aberto no visualizador integrado

---

## 📊 Estrutura do Documento

```latex
paper-trabalhos-relacionados.tex
├── Preâmbulo (linhas 1-40)
│   ├── Documentclass: sbcreviews-2025
│   ├── Packages: orcidlink, xcolor, tabularray
│   └── Configurações periódico
├── Frontmatter
│   ├── Título + Subtítulo em inglês
│   ├── Autor + ORCID
│   ├── Abstract (PT + EN)
│   └── Palavras-chave
├── Seção 1: Introdução e Problema
├── Seção 2: Objetivos
├── Seção 3: Abordagem de IA e Pipeline
├── Seção 4: Arquitetura da Solução
├── Seção 5: **TRABALHOS RELACIONADOS** (Nova)
│   ├── Parágrafo explicativo
│   ├── Tabela Comparativa (3 papers + 2 plataformas)
│   └── Análise de lacunas
├── Seção 6: Aspectos Éticos, LGPD e Qualidade
├── Seção 7: Conclusão
└── Declarações obrigatórias
```

---

## 🔍 Seção "Trabalhos Relacionados" (Novo Conteúdo)

### O que foi adicionado:

1. **Parágrafo Explicativo** (3 domínios emergentes)
   - Redes sociais técnicas para makers
   - Orquestração de agentes IA com RAG
   - Governança e rastreabilidade IoT com LGPD

2. **Busca Sistemática** (3 papers principais)
   - Dong et al. (2025) — ChatIoT
   - Hangyu et al. (2026) — RAG Federado
   - Singh et al. (2025) — Agentic RAG

3. **Tabela Comparativa** (Tabela~\ref{tab:comparative})
   - Comparação: 3 papers + 2 plataformas + MakerConnect
   - Dimensões: RAG, IoT, Orquestração, Documentação, Rastreabilidade, LGPD
   - Status: Conceitual, Protótipo, Produção, MVP

4. **Análise Crítica** (5 lacunas identificadas)
   - RAG + IoT em conjunto
   - Orquestração de múltiplos agentes
   - Documentação técnica pró-ativa
   - Rastreabilidade social (fork/lineage)
   - LGPD em aplicação maker

5. **Posicionamento da MakerConnect** (6 dimensões)
   - RAG + IoT
   - Orquestração n8n
   - Mecanismos sociais
   - Conformidade LGPD
   - MVP funcional

---

## 📚 Arquivo de Referências (refs.bib)

O arquivo `refs.bib` contém:

### Principais (3 papers - foco)
```bibtex
@article{dong2025chatiot, ...}     % ChatIoT + RAG
@article{hangyu2026federated, ...} % RAG Federado
@article{singh2025agentic, ...}    % Agentic RAG
```

### Complementares (7 papers - contexto)
```bibtex
@article{gao2023rag, ...}          % Survey RAG
@article{gupta2024comprehensive, ...} % Survey completo
@article{rackauckas2024ragfusion, ...} % RAG-Fusion
@article{zeng2024privacy, ...}     % Privacidade RAG
@article{alqatf2025rag4ds, ...}    % RAG Data Spaces
@article{oh2024realtime, ...}      % RAG + IoT real-time
@article{chan2024rqrag, ...}       % Otimização queries
```

### Plataformas (2 referências)
```bibtex
@misc{manualmaker2026, ...}        % Manual Maker
@misc{rabbitagents2026, ...}       % Rabbit Agents
```

### Complementárias (5 referências)
```bibtex
@article{lewis2020retrieval, ...}  % RAG fundacional
@misc{leis2023lgpd, ...}           % LGPD legislação
@article{vaswani2017attention, ...} % Transformers
@misc{n8n2024, ...}                % n8n
@misc{pinecone2024, ...}           % Pinecone
```

---

## ✅ Checklist de Compilação

- [ ] `paper-trabalhos-relacionados.tex` está no diretório
- [ ] `refs.bib` está no diretório
- [ ] Classe `sbcreviews-2025` está instalada/disponível
- [ ] Packages necessários instalados:
  - [ ] `orcidlink`
  - [ ] `xcolor`
  - [ ] `tabularray`
  - [ ] `fontawesome` (para `\faEnvelope`)
- [ ] Nenhum arquivo `.aux`, `.bbl` corrompido
- [ ] Primeira compilação: `pdflatex`
- [ ] Segunda compilação: `bibtex`
- [ ] Terceira e quarta compilação: `pdflatex` (para resolver referências)

---

## 🐛 Troubleshooting

### Erro: "Class sbcreviews-2025 not found"
**Solução**: 
- Overleaf: classe automática
- Local: descarregue de [CTAN](https://ctan.org/) ou use classe similar

### Erro: "Package orcidlink not found"
**Solução**:
```bash
# MiKTeX
mpm --install orcidlink

# TeXLive
tlmgr install orcidlink
```

### Erro: "Undefined citations"
**Solução**:
1. Certifique-se de que `refs.bib` está no mesmo diretório
2. Execute `bibtex paper-trabalhos-relacionados`
3. Compile novamente com `pdflatex`

### Erro: "Special character encoding"
**Solução**:
- Verifique que o arquivo está em **UTF-8**
- Adicione ao preâmbulo:
```latex
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
```

---

## 📝 Próximos Passos

1. **Completar refs.bib** com DOI dos papers
2. **Validar citações**: `\cite{dong2025chatiot}` deve resolver
3. **Ajustar numeração** de tabelas se necessário
4. **Adicionar figuras** da arquitetura MakerConnect
5. **Publicação**: enviar para revisor em `.pdf`

---

## 📞 Contato

**Autor**: Vinícius Fróes  
**Email**: vinicius.froes@catolicasc.edu.br  
**Repositório**: https://github.com/Froesv85/Master-Labs  

---

**Última atualização**: Maio 2026  
**Versão**: 1.0
