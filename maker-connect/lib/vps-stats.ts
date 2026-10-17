import os from 'os';

export type VpsStats = {
  host: string;
  totalMemMb: number;
  usedMemMb: number;
  usedMemPercent: number;
  loadAvg1: number;
  uptimeHours: number;
};

// Sem limite de memoria por cgroup no docker-compose.prod.yml, os.totalmem()/freemem()
// dentro do container refletem a VPS host real (unica VM rodando toda a stack).
export function getVpsStats(): VpsStats {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const [loadAvg1] = os.loadavg();

  return {
    host: 'VPS Hostinger',
    totalMemMb: Math.round((totalMem / 1024 / 1024) * 100) / 100,
    usedMemMb: Math.round((usedMem / 1024 / 1024) * 100) / 100,
    usedMemPercent: Math.round((usedMem / totalMem) * 1000) / 10,
    loadAvg1: Math.round(loadAvg1 * 100) / 100,
    uptimeHours: Math.round((os.uptime() / 3600) * 10) / 10,
  };
}
