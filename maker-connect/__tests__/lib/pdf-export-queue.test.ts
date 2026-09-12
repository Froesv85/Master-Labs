const mockQueueAdd = jest.fn().mockResolvedValue({ id: 'pdf-export-1' });

jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({ add: mockQueueAdd })),
  Worker: jest.fn().mockImplementation(() => ({ on: jest.fn() })),
}));

jest.mock('ioredis', () => jest.fn().mockImplementation(() => ({})));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    projectExport: { update: jest.fn() },
    project: { findUnique: jest.fn() },
  },
}));

jest.mock('@/lib/s3-service', () => ({
  uploadFile: jest.fn().mockResolvedValue('https://minio.local/docs/project-1.pdf'),
}));

jest.mock('@/lib/pdf-service', () => ({
  buildPdf: jest.fn().mockResolvedValue(Buffer.from('pdf-bytes')),
}));

import { prisma } from '@/lib/prisma';
import { buildPdf } from '@/lib/pdf-service';
import { processPdfExportJob } from '@/lib/pdf-export-queue';

const baseProject = {
  id: 42,
  title: 'ESP32 Weather Station',
  description: 'Uma estacao meteorologica com ESP32.',
  creator: { name: 'Ana Silva', email: 'ana@maker.com' },
  tags: [{ tag: 'IoT' }],
  difficulties: [],
  dossier: null as unknown,
  extractionLogs: [] as unknown[],
};

afterEach(() => jest.clearAllMocks());

describe('processPdfExportJob', () => {
  it('usa o dossie salvo (editado pelo dono) quando ele existe, ignorando a extracao bruta', async () => {
    (prisma.project.findUnique as jest.Mock).mockResolvedValue({
      ...baseProject,
      dossier: {
        technicalRequirements: JSON.stringify([{ name: 'WiFi', detail: 'conectividade' }]),
        suggestedBOM: JSON.stringify([{ quantity: '1', item: 'ESP32 (editado)', notes: '' }]),
        assemblySteps: JSON.stringify([{ step: 1, title: 'Montar', detail: 'Fixar na base' }]),
        videoUrl: 'https://youtube.com/watch?v=abc12345678',
      },
      extractionLogs: [
        {
          output: JSON.stringify({
            technicalRequirements: [{ name: 'Requisito da extracao bruta (nao deve aparecer)' }],
            suggestedBOM: [{ quantity: '1', item: 'ESP32 (bruto, nao deve aparecer)', notes: '' }],
            suggestedCode: 'void setup(){}',
          }),
        },
      ],
    });

    await processPdfExportJob({ exportId: 1, projectId: 42 });

    const exportData = (buildPdf as jest.Mock).mock.calls[0][0];
    expect(exportData.suggestedBom[0].item).toBe('ESP32 (editado)');
    expect(exportData.assemblySteps).toEqual([{ step: 1, title: 'Montar', detail: 'Fixar na base' }]);
    expect(exportData.videoUrl).toBe('https://youtube.com/watch?v=abc12345678');
    // suggestedCode ainda vem da extracao bruta, o dossie nao guarda codigo
    expect(exportData.suggestedCode).toBe('void setup(){}');
    expect(exportData.projectUrl).toBe('https://makerconnect.com.br/projects/42');
  });

  it('cai para o output bruto da extracao quando nao existe dossie ainda', async () => {
    (prisma.project.findUnique as jest.Mock).mockResolvedValue({
      ...baseProject,
      dossier: null,
      extractionLogs: [
        {
          output: JSON.stringify({
            technicalRequirements: [{ name: 'WiFi', detail: 'conectividade' }],
            suggestedBOM: [{ quantity: '1', item: 'ESP32', notes: '' }],
            assemblySteps: [{ step: 1, title: 'Montar', detail: '' }],
          }),
        },
      ],
    });

    await processPdfExportJob({ exportId: 2, projectId: 42 });

    const exportData = (buildPdf as jest.Mock).mock.calls[0][0];
    expect(exportData.suggestedBom[0].item).toBe('ESP32');
    expect(exportData.assemblySteps).toEqual([{ step: 1, title: 'Montar', detail: '' }]);
  });

  it('nao quebra quando nao ha dossie nem extracao concluida', async () => {
    (prisma.project.findUnique as jest.Mock).mockResolvedValue(baseProject);

    await processPdfExportJob({ exportId: 3, projectId: 42 });

    const exportData = (buildPdf as jest.Mock).mock.calls[0][0];
    expect(exportData.technicalRequirements).toEqual([]);
    expect(exportData.suggestedBom).toEqual([]);
    expect(exportData.assemblySteps).toEqual([]);
    expect(prisma.projectExport.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 3 }, data: expect.objectContaining({ status: 'done' }) })
    );
  });

  it('lanca erro quando o projeto nao existe', async () => {
    (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(processPdfExportJob({ exportId: 4, projectId: 999 })).rejects.toThrow(/nao encontrado/);
  });
});
