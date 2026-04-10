import { jsPDF } from "jspdf";

export type ExportData = {
  projectTitle: string;
  projectDescription: string;
  creator: string;
  category: string;
  difficulties: { description: string; date: string }[];
  technicalRequirements: string[];
  suggestedBom: { quantity: string; item: string; notes: string }[];
};

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
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(text, maxWidth);
    checkPage(lines.length * (size * 0.4));
    doc.text(lines, marginLeft, cursorY);
    cursorY += lines.length * (size * 0.4) + 4;
  };

  // HEADER
  addText('MakerConnect Export', 22, true);
  cursorY += 5;
  addText(data.projectTitle, 16, true);
  cursorY += 5;

  // Metadata
  addText(`Criador: ${data.creator}`, 11);
  addText(`Categoria: ${data.category}`, 11);
  addText(`Data de Exportacao: ${new Date().toLocaleString('pt-BR')}`, 11);
  cursorY += 5;

  if (data.projectDescription) {
    addText(data.projectDescription, 10, false, [100, 100, 100]);
    cursorY += 5;
  }

  // BOM
  if (data.suggestedBom && data.suggestedBom.length > 0) {
    addText('Bill of Materials (BOM) sugerido pela IA', 14, true, [16, 185, 129]); // Emerald 500
    cursorY += 2;
    data.suggestedBom.forEach((bom) => {
      addText(`• ${bom.quantity}x ${bom.item} - ${bom.notes}`, 10);
    });
    cursorY += 5;
  }

  // Tech Reqs
  if (data.technicalRequirements && data.technicalRequirements.length > 0) {
    addText('Requisitos Tecnicos (via RAG)', 14, true, [16, 185, 129]);
    cursorY += 2;
    data.technicalRequirements.forEach((req) => {
      addText(`• ${req}`, 10);
    });
    cursorY += 5;
  }

  // Dificuldades
  if (data.difficulties && data.difficulties.length > 0) {
    addText('Log de Dificuldades Tecnicas', 14, true, [16, 185, 129]);
    cursorY += 2;
    data.difficulties.forEach((diff) => {
      addText(`[${diff.date}]: ${diff.description}`, 10);
    });
  }

  // Footer
  checkPage(20);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Documento gerado e validado via MakerBrain (AI RAG Pipeline). Exportacao Auditavel.', 105, 290, { align: 'center' });

  return Buffer.from(doc.output('arraybuffer'));
}
