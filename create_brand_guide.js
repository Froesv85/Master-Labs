const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
        AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign,
        HeadingLevel, PageBreak } = require('docx');
const fs = require('fs');

// Cores para uso no documento
const colors = {
  laranja: '#FFA500',
  azulEscuro: '#1A3A4D',
  preto: '#1a1a1a',
  cinza: '#666666',
  cinzaClaro: '#f5f5f5'
};

// Configuração de bordas
const border = { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "Arial", size: 22 }
      }
    },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        run: { size: 40, bold: true, font: "Arial", color: colors.azulEscuro.slice(1) },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 0 }
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        run: { size: 32, bold: true, font: "Arial", color: colors.laranja.slice(1) },
        paragraph: { spacing: { before: 180, after: 100 }, outlineLevel: 1 }
      },
      {
        id: "Heading3",
        name: "Heading 3",
        basedOn: "Normal",
        next: "Normal",
        run: { size: 28, bold: true, font: "Arial", color: colors.preto.slice(1) },
        paragraph: { spacing: { before: 120, after: 60 }, outlineLevel: 2 }
      }
    ]
  },
  sections: [{
    properties: {
      page: {
        size: {
          width: 12240,
          height: 15840
        },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children: [
      // CAPA
      new Paragraph({
        children: [new TextRun("")],
        spacing: { before: 480 }
      }),
      
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({
          text: "GUIA DE MARCA",
          bold: true,
          size: 52,
          color: colors.laranja.slice(1)
        })],
        spacing: { after: 120 }
      }),
      
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({
          text: "MakerConnect",
          bold: true,
          size: 48,
          color: colors.azulEscuro.slice(1)
        })],
        spacing: { after: 480 }
      }),
      
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({
          text: "Versão 1.0 | Abril 2026",
          size: 20,
          color: colors.cinza.slice(1)
        })],
        spacing: { after: 480 }
      }),
      
      // ÍNDICE
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("Índice")]
      }),
      
      new Paragraph({
        children: [new TextRun("1. Visão Geral da Marca")],
        spacing: { after: 80 }
      }),
      new Paragraph({
        children: [new TextRun("2. Propostas de Logo")],
        spacing: { after: 80 }
      }),
      new Paragraph({
        children: [new TextRun("3. Paleta de Cores")],
        spacing: { after: 80 }
      }),
      new Paragraph({
        children: [new TextRun("4. Tipografia")],
        spacing: { after: 80 }
      }),
      new Paragraph({
        children: [new TextRun("5. Variações de Logo")],
        spacing: { after: 80 }
      }),
      new Paragraph({
        children: [new TextRun("6. Uso Incorreto")],
        spacing: { after: 80 }
      }),
      new Paragraph({
        children: [new TextRun("7. Espaçamento e Proporções")],
        spacing: { after: 480 }
      }),
      
      new Paragraph({ children: [new PageBreak()] }),
      
      // SEÇÃO 1: VISÃO GERAL
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("1. Visão Geral da Marca")]
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Identidade MakerConnect")]
      }),
      
      new Paragraph({
        children: [new TextRun("MakerConnect é uma plataforma de inovação que conecta makers, entusiastas de tecnologia e criadores de projetos. A marca representa o equilíbrio entre comunidade colaborativa e inovação tecnológica.")],
        spacing: { after: 200 }
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("Valores da Marca")]
      }),
      
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Comunidade: Conectar makers ao redor do mundo")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Inovação: Fomentar criatividade e desenvolvimento técnico")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Clareza: Comunicação direta e honesta")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Modernidade: Design contemporâneo e acessível")],
        spacing: { after: 240 }
      }),
      
      new Paragraph({ children: [new PageBreak()] }),
      
      // SEÇÃO 2: PROPOSTAS
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("2. Propostas de Logo")]
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("PROPOSTA 1: NODE CONNECT")]
      }),
      
      new Paragraph({
        children: [new TextRun({
          text: "Descrição: ",
          bold: true
        }), new TextRun("Um nó central conectado a múltiplos nós periféricos, representando a conexão entre makers em uma comunidade global. As cores laranja e azul indicam inovação (laranja) e confiança (azul).")],
        spacing: { after: 120 }
      }),
      
      new Paragraph({
        children: [new TextRun({
          text: "Características: ",
          bold: true
        }), new TextRun("Minimalista, escalável, reconhecível em qualquer tamanho, forte impacto visual")],
        spacing: { after: 240 }
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("PROPOSTA 2: CIRCUIT COMMUNITY")]
      }),
      
      new Paragraph({
        children: [new TextRun({
          text: "Descrição: ",
          bold: true
        }), new TextRun("Um circuito eletrônico (representando inovação tecnológica) com nós que irradiam energia (representando a comunidade colaborativa e dinâmica)")],
        spacing: { after: 120 }
      }),
      
      new Paragraph({
        children: [new TextRun({
          text: "Características: ",
          bold: true
        }), new TextRun("Moderna, diferenciada, maior profundidade conceitual, funciona bem em vários contextos")],
        spacing: { after: 240 }
      }),
      
      new Paragraph({
        children: [new TextRun({
          text: "RECOMENDAÇÃO: ",
          bold: true,
          color: colors.laranja.slice(1),
          size: 24
        }), new TextRun({
          text: "CIRCUIT COMMUNITY",
          bold: true,
          size: 24
        })],
        spacing: { after: 120 }
      }),
      
      new Paragraph({
        children: [new TextRun("Por equilibrar perfeitamente conceito (circuito + comunidade), diferenciação visual e versatilidade de uso.")],
        spacing: { after: 240 }
      }),
      
      new Paragraph({ children: [new PageBreak()] }),
      
      // SEÇÃO 3: PALETA DE CORES
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("3. Paleta de Cores")]
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Cores Principais")]
      }),
      
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2340, 2340, 2340, 2340],
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders,
                width: { size: 2340, type: WidthType.DXA },
                shading: { fill: "FFA500", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({
                  text: "LARANJA\nPRINCIPAL",
                  bold: true,
                  size: 18,
                  color: "FFFFFF"
                })] })]
              }),
              new TableCell({
                borders,
                width: { size: 2340, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({
                  text: "#FFA500",
                  bold: true,
                  size: 20
                })] }), new Paragraph({ children: [new TextRun({
                  text: "RGB: 255, 165, 0",
                  size: 18
                })] })]
              }),
              new TableCell({
                borders,
                width: { size: 2340, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({
                  text: "CMYK: 0%, 35%, 100%, 0%",
                  size: 18
                })] })]
              }),
              new TableCell({
                borders,
                width: { size: 2340, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({
                  text: "Uso: Foco, destaque, CTAs",
                  size: 18
                })] })]
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                borders,
                width: { size: 2340, type: WidthType.DXA },
                shading: { fill: "1A3A4D", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({
                  text: "AZUL ESCURO\nSECUNDÁRIO",
                  bold: true,
                  size: 18,
                  color: "FFFFFF"
                })] })]
              }),
              new TableCell({
                borders,
                width: { size: 2340, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({
                  text: "#1A3A4D",
                  bold: true,
                  size: 20
                })] }), new Paragraph({ children: [new TextRun({
                  text: "RGB: 26, 58, 77",
                  size: 18
                })] })]
              }),
              new TableCell({
                borders,
                width: { size: 2340, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({
                  text: "CMYK: 66%, 25%, 0%, 70%",
                  size: 18
                })] })]
              }),
              new TableCell({
                borders,
                width: { size: 2340, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({
                  text: "Uso: Confiança, base",
                  size: 18
                })] })]
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                borders,
                width: { size: 2340, type: WidthType.DXA },
                shading: { fill: "FFB84D", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({
                  text: "LARANJA\nCOMPLEMENTAR",
                  bold: true,
                  size: 18,
                  color: "FFFFFF"
                })] })]
              }),
              new TableCell({
                borders,
                width: { size: 2340, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({
                  text: "#FFB84D",
                  bold: true,
                  size: 20
                })] }), new Paragraph({ children: [new TextRun({
                  text: "RGB: 255, 184, 77",
                  size: 18
                })] })]
              }),
              new TableCell({
                borders,
                width: { size: 2340, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({
                  text: "CMYK: 0%, 28%, 70%, 0%",
                  size: 18
                })] })]
              }),
              new TableCell({
                borders,
                width: { size: 2340, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({
                  text: "Uso: Suave, transições",
                  size: 18
                })] })]
              })
            ]
          })
        ]
      }),
      
      new Paragraph({
        children: [new TextRun("")],
        spacing: { after: 240 }
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("Proporção de Uso")]
      }),
      
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({
          text: "Laranja Principal: ",
          bold: true
        }), new TextRun("60% - Cor dominante")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({
          text: "Azul Escuro: ",
          bold: true
        }), new TextRun("30% - Cor complementar")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({
          text: "Laranja Complementar: ",
          bold: true
        }), new TextRun("10% - Acentos e transições")],
        spacing: { after: 240 }
      }),
      
      new Paragraph({ children: [new PageBreak()] }),
      
      // SEÇÃO 4: TIPOGRAFIA
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("4. Tipografia")]
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Fonte Principal")]
      }),
      
      new Paragraph({
        children: [new TextRun("Arial (ou equivalente sans-serif moderna)")]
      }),
      
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({
          text: "Headings: ",
          bold: true
        }), new TextRun("Bold, 32px - 52px")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({
          text: "Body: ",
          bold: true
        }), new TextRun("Regular, 12px - 16px")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({
          text: "Labels: ",
          bold: true
        }), new TextRun("Bold, 11px - 14px")],
        spacing: { after: 240 }
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Combinações")]
      }),
      
      new Paragraph({
        children: [new TextRun({
          text: "MakerConnect:",
          bold: true
        }), new TextRun(" Arial Bold em Laranja Principal ou Azul Escuro (marca)")]
      }),
      new Paragraph({
        children: [new TextRun({
          text: "Taglines: ",
          bold: true
        }), new TextRun("Arial Regular em cinza escuro")]
      }),
      
      new Paragraph({ children: [new PageBreak()] }),
      
      // SEÇÃO 5: VARIAÇÕES
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("5. Variações de Logo")]
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("5.1 Versão Horizontal (com nome)")]
      }),
      
      new Paragraph({
        children: [new TextRun("Use para: Header, navbar, social media profile")],
        spacing: { after: 200 }
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("5.2 Versão Quadrada (icon only)")]
      }),
      
      new Paragraph({
        children: [new TextRun("Use para: Favicon, redes sociais, ícone de app")],
        spacing: { after: 200 }
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("5.3 Favicon (simplificado)")]
      }),
      
      new Paragraph({
        children: [new TextRun("Use para: Browser tab, favorites, bookmarks")],
        spacing: { after: 200 }
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("5.4 Monocromática (preto)")]
      }),
      
      new Paragraph({
        children: [new TextRun("Use para: Documentos impressos, preto e branco, fotocopiadoras")],
        spacing: { after: 200 }
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("5.5 Versão Dark (fundo escuro)")]
      }),
      
      new Paragraph({
        children: [new TextRun("Use para: Dark mode, banners escuros, apresentações")],
        spacing: { after: 240 }
      }),
      
      new Paragraph({ children: [new PageBreak()] }),
      
      // SEÇÃO 6: USO INCORRETO
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("6. Uso Incorreto")]
      }),
      
      new Paragraph({
        children: [new TextRun("Para manter a integridade da marca, NUNCA:")]
      }),
      
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Altere as cores (usar apenas as especificadas)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Distorça ou redimensione desproporcionalmente")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Adicione sombras, gradientes ou efeitos")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Coloque sobre fundos muito claros ou muito escuros sem contraste")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Use em tamanho menor que 64x64px para logos quadradas")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Modifique a geometria ou altere elementos")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Use sem espaço mínimo ao redor")]
      }),
      
      new Paragraph({ children: [new PageBreak()] }),
      
      // SEÇÃO 7: ESPAÇAMENTO
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("7. Espaçamento e Proporções")]
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Espaço Mínimo")]
      }),
      
      new Paragraph({
        children: [new TextRun("Mantenha no mínimo 20% da altura da logo como espaço claro ao redor (para logo quadrada, use 20px em todos os lados)")]
      }),
      
      new Paragraph({
        children: [new TextRun("")]
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("Tamanho Mínimo")]
      }),
      
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({
          text: "Digital: ",
          bold: true
        }), new TextRun("64x64px")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({
          text: "Impresso: ",
          bold: true
        }), new TextRun("15mm")]
      }),
      
      new Paragraph({
        children: [new TextRun("")]
      }),
      
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("Proporções")]
      }),
      
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Logo quadrada: 1:1")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Logo horizontal: 3:1")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Favicon: 1:1")]
      }),
      
      new Paragraph({
        children: [new TextRun("")]
      }),
      
      new Paragraph({
        children: [new TextRun("")]
      }),
      
      new Paragraph({
        children: [new TextRun({
          text: "Todos os arquivos de logo estão em: /assets/logos/",
          italics: true,
          size: 18,
          color: colors.cinza.slice(1)
        })]
      }),
      
      new Paragraph({
        children: [new TextRun({
          text: "Formato: SVG (vetorial - escalável)",
          italics: true,
          size: 18,
          color: colors.cinza.slice(1)
        })]
      })
    ]
  }],
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          {
            level: 0,
            format: "bullet",
            text: "•",
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: {
                indent: { left: 720, hanging: 360 }
              }
            }
          }
        ]
      }
    ]
  }
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/sessions/relaxed-festive-faraday/mnt/Master-Labs-main/GUIA_DE_MARCA_MakerConnect.docx", buffer);
  console.log("✓ Guia de Marca criado com sucesso!");
  console.log("📄 Arquivo: GUIA_DE_MARCA_MakerConnect.docx");
});
