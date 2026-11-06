import { NextRequest } from 'next/server';

jest.mock('@/lib/prisma', () => ({
  prisma: { appSetting: { findUnique: jest.fn(), upsert: jest.fn() } },
}));
jest.mock('@/lib/admin', () => ({ getAdminSession: jest.fn() }));

import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/admin';
import { GET, PUT } from '@/app/api/admin/settings/ui/route';
import { UI_SETTINGS_DEFAULTS, normalizeUiSettings, uiSettingsCss } from '@/lib/ui-settings';

const admin = { userId: 1, email: 'admin@test.com', name: 'Admin' };
const valid = { welcomeMs: 5000, minRideMs: 800, celebrateMs: 2000, pageTransitionMs: 400 };

function put(body: unknown) {
  return new NextRequest(new URL('/api/admin/settings/ui', 'http://localhost:3000'), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

afterEach(() => jest.clearAllMocks());

describe('GET /api/admin/settings/ui', () => {
  it('403 para quem não é admin', async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(null);
    expect((await GET()).status).toBe(403);
  });

  it('sem nada salvo devolve os padrões', async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(admin);
    (prisma.appSetting.findUnique as jest.Mock).mockResolvedValue(null);
    const body = await (await GET()).json();
    expect(body.data).toEqual(UI_SETTINGS_DEFAULTS);
  });
});

describe('PUT /api/admin/settings/ui', () => {
  it('403 para quem não é admin (não grava)', async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(null);
    expect((await PUT(put(valid))).status).toBe(403);
    expect(prisma.appSetting.upsert).not.toHaveBeenCalled();
  });

  it('salva valores válidos com o id do admin', async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(admin);
    const res = await PUT(put(valid));
    expect(res.status).toBe(200);
    expect((await res.json()).data).toEqual(valid);
    const args = (prisma.appSetting.upsert as jest.Mock).mock.calls[0][0];
    expect(JSON.parse(args.create.value)).toEqual(valid);
    expect(args.update.updatedById).toBe(1);
  });

  it.each([
    [{ ...valid, welcomeMs: 999_999 }],
    [{ ...valid, celebrateMs: 100 }],
    [{ ...valid, minRideMs: '800' }],
    [{ ...valid, pageTransitionMs: undefined }],
  ])('400 para valor fora da faixa ou inválido: %j', async (body) => {
    (getAdminSession as jest.Mock).mockResolvedValue(admin);
    expect((await PUT(put(body))).status).toBe(400);
    expect(prisma.appSetting.upsert).not.toHaveBeenCalled();
  });
});

describe('normalizeUiSettings / uiSettingsCss', () => {
  it('limita à faixa e completa campos ausentes com o padrão', () => {
    expect(normalizeUiSettings({ welcomeMs: -5, celebrateMs: 99_999, minRideMs: 'x' })).toEqual({
      welcomeMs: 0,
      minRideMs: UI_SETTINGS_DEFAULTS.minRideMs,
      celebrateMs: 5000,
      pageTransitionMs: UI_SETTINGS_DEFAULTS.pageTransitionMs,
    });
  });

  it('gera as variáveis CSS (queda nos últimos 600ms)', () => {
    expect(uiSettingsCss(valid)).toBe(':root{--vt-ms:400ms;--nodo-celebrate-ms:2000ms;--nodo-drop-delay-ms:1400ms}');
  });
});
