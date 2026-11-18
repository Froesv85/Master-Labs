import { jsPDF } from "jspdf";
import fs from 'fs';
import path from 'path';

export type ExportData = {
  projectTitle: string;
  projectDescription: string;
  projectUrl: string;
  creator: string;
  tags: string[];
  difficulties: { description: string; date: string }[];
  technicalRequirements: string[];
  suggestedBom: { quantity: string; item: string; notes: string }[];
  assemblySteps: { step: number; title: string; detail: string }[];
  suggestedCode?: string;
  videoUrl?: string | null;
};

// As fontes padrao do jsPDF (helvetica/courier) so cobrem Latin-1 + WinAnsi
// (acentos, ç, •, –, —, aspas curvas, …). Basta UM caractere fora disso
// (━, →, Ω, ≥, emoji) para o jsPDF codificar a linha inteira em 2 bytes e a linha
// sair ilegivel no PDF. Aqui trocamos os simbolos comuns por equivalentes e
// descartamos o resto, preservando a acentuacao do portugues.
const WIN_ANSI_EXTRA = new Set('€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ');
const SYMBOL_MAP: Record<string, string> = {
  '━': '—', '─': '—', '═': '—', '▬': '—',
  '→': '->', '←': '<-', '↔': '<->', '⇒': '=>', '↑': '^', '↓': 'v',
  'Ω': 'ohm', 'Δ': 'delta', 'π': 'pi',
  '≥': '>=', '≤': '<=', '≈': '~', '≠': '!=', '∞': 'infinito',
  '✓': 'v', '✔': 'v', '✗': 'x', '✘': 'x', '★': '*', '☆': '*',
  '′': "'", '″': '"', '‐': '-', '‑': '-', '−': '-', '\u2009': ' ', '\u202F': ' ',
};

export function pdfSafe(text: string): string {
  let out = '';
  for (const ch of text.normalize('NFC')) {
    const code = ch.codePointAt(0)!;
    if (code === 10 || code === 9 || (code >= 0x20 && code <= 0xff) || WIN_ANSI_EXTRA.has(ch)) {
      out += ch;
    } else if (SYMBOL_MAP[ch] !== undefined) {
      out += SYMBOL_MAP[ch];
    } else {
      // tenta a letra base (ex.: ő -> o); se nao der, descarta o simbolo
      const base = ch.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
      if ([...base].every((c) => c.codePointAt(0)! <= 0xff)) out += base;
    }
  }
  return out;
}

export async function buildPdf(data: ExportData): Promise<Buffer> {
  const doc = new jsPDF();
  let cursorY = 20;
  const marginLeft = 20;
  const maxWidth = 170; // A4 width is 210, minus 40 for margins

  const checkPage = (height: number) => {
    if (cursorY + height > 280) {
      doc.addPage();
      cursorY = 20;
    }
  };

  const addText = (text: string, size: number, isBold: boolean = false, color: number[] = [0,0,0]) => {
    if (!text) return;
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    
    // Converte e garante que sempre é string
    const stringText = pdfSafe(typeof text === 'object' ? JSON.stringify(text) : String(text));
    const lines = doc.splitTextToSize(stringText, maxWidth);
    
    lines.forEach((line: string) => {
      checkPage(size * 0.35 + 2);
      doc.text(line, marginLeft, cursorY);
      cursorY += (size * 0.35) + 2;
    });
    cursorY += 2; // Padding after block
  };

  const addLink = (label: string, url: string) => {
    if (!url) return;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(37, 99, 235); // Blue-600
    checkPage(6);
    doc.textWithLink(pdfSafe(label), marginLeft, cursorY, { url });
    cursorY += 6;
  };

  // HEADER LOGO (Canto Superior Direito)
  try {
    const logoPath = path.join(process.cwd(), 'public', 'maker-logo-pdf.png');
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      const logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
      // maker-logo-pdf.png e 700x180 (wordmark horizontal) - largura fixa com altura
      // proporcional evita esticar o logo num quadrado e distorce-lo.
      const logoWidth = 35;
      const logoHeight = logoWidth * (180 / 700);
      const logoX = marginLeft + maxWidth - logoWidth; // alinhado com a margem direita do conteudo
      doc.addImage(logoBase64, 'PNG', logoX, 10, logoWidth, logoHeight); // Top Right corner
    }
  } catch (e) {
    console.error('Erro ao injetar logo no PDF:', e);
  }

  // HEADER TITLE
  addText('MakerConnect Export', 24, true, [0, 196, 180]); // Teal
  cursorY += 2;
  addText(data.projectTitle, 16, true);

  // Metadata
  addText(`Criador: ${data.creator}`, 11);
  addText(`Tags: ${data.tags.join(', ')}`, 11);
  addText(`Data de exportação: ${new Date().toLocaleString('pt-BR')}`, 11);
  if (data.projectUrl) addLink('Ver projeto online', data.projectUrl);
  if (data.videoUrl) addLink('Assistir ao vídeo do projeto', data.videoUrl);
  cursorY += 5;

  if (data.projectDescription) {
    addText('Visão Geral', 14, true, [16, 185, 129]);
    cursorY += 2;
    addText(data.projectDescription, 10, false, [100, 100, 100]);
    cursorY += 5;
  }

  // Tech Reqs
  if (data.technicalRequirements && data.technicalRequirements.length > 0) {
    addText('Requisitos Técnicos', 14, true, [16, 185, 129]);
    cursorY += 2;
    data.technicalRequirements.forEach((req) => {
      addText(`• ${req}`, 10);
    });
    cursorY += 5;
  }

  // BOM
  if (data.suggestedBom && data.suggestedBom.length > 0) {
    addText('Lista de Materiais (BOM)', 14, true, [16, 185, 129]); // Emerald 500
    cursorY += 2;
    data.suggestedBom.forEach((bom) => {
      addText(`• ${bom.quantity}x ${bom.item} - ${bom.notes}`, 10);
    });
    cursorY += 5;
  }

  // Etapas de Montagem
  if (data.assemblySteps && data.assemblySteps.length > 0) {
    addText('Etapas de Montagem', 14, true, [16, 185, 129]);
    cursorY += 2;
    data.assemblySteps.forEach((step) => {
      addText(`${step.step}. ${step.title}`, 10, true);
      if (step.detail) addText(step.detail, 10, false, [80, 80, 80]);
    });
    cursorY += 5;
  }

  // Dificuldades
  if (data.difficulties && data.difficulties.length > 0) {
    addText('Log de Dificuldades Técnicas', 14, true, [16, 185, 129]);
    cursorY += 2;
    data.difficulties.forEach((diff) => {
      addText(`[${diff.date}]: ${diff.description}`, 10);
    });
  }

  // SUGGESTED CODE
  if (data.suggestedCode) {
    checkPage(40);
    addText('Código-Fonte Sugerido (Arduino C++)', 14, true, [16, 185, 129]);
    cursorY += 2;
    
    // Draw a light grey background box for the code
    const codeLines = doc.splitTextToSize(pdfSafe(data.suggestedCode), maxWidth - 10);
    const boxHeight = (codeLines.length * 4) + 10;
    
    checkPage(boxHeight + 10);
    doc.setFillColor(245, 245, 245);
    doc.rect(marginLeft - 2, cursorY, maxWidth + 4, boxHeight, 'F');
    
    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.setTextColor(50, 50, 50);
    doc.text(codeLines, marginLeft + 3, cursorY + 7);
    cursorY += boxHeight + 10;
  }

  // Footer
  checkPage(20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text('Gerado pelo MakerConnect, desenvolvido pela Master by Tech', 105, 290, { align: 'center' });

  return Buffer.from(doc.output('arraybuffer'));
}
