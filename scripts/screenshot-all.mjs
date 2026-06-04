/**
 * Captura screenshots de todas as telas do MakerConnect.
 * Uso: node scripts/screenshot-all.mjs
 * Pré-req: dev server rodando em localhost:3000
 */

import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'http://localhost:3000';
const EMAIL = 'test@example.com';
const PASSWORD = 'maker123';

const DATE = new Date().toISOString().slice(0, 10);
const OUT_DIR = join(__dirname, '..', 'docs', 'screenshots', DATE);

const VIEWPORT = { width: 1440, height: 900 };

async function shot(page, name) {
  const file = join(OUT_DIR, `${name}.png`);
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  await page.screenshot({ path: file, fullPage: true });
  console.log(`  capturado: ${name}.png`);
}

(async () => {
  await mkdir(OUT_DIR, { recursive: true });
  console.log(`\nSalvando em: ${OUT_DIR}\n`);

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: VIEWPORT });
  const page = await ctx.newPage();

  // ── 1. Landing page (sem login) ────────────────────────────────────────────
  console.log('>> Telas públicas');
  await page.goto(BASE_URL);
  await shot(page, '01-landing');

  await page.goto(`${BASE_URL}/login`);
  await shot(page, '02-login');

  // ── Login ──────────────────────────────────────────────────────────────────
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/feed`, { timeout: 10000 }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});

  // ── 2. Feed ────────────────────────────────────────────────────────────────
  console.log('>> Telas autenticadas');
  await page.goto(`${BASE_URL}/feed`);
  await shot(page, '03-feed');

  // Feed com filtro Robótica
  await page.goto(`${BASE_URL}/feed?category=Robotics`);
  await shot(page, '04-feed-robotica');

  // ── 3. Projeto individual ──────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/projects/55`);
  await shot(page, '05-projeto-detalhe');

  // ── 4. Robôs ───────────────────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/robots`);
  await shot(page, '06-robos-lista');

  await page.goto(`${BASE_URL}/robots/1`);
  await shot(page, '07-robo-detalhe');

  // ── 5. Comunidades ─────────────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/communities`);
  await shot(page, '08-comunidades-lista');

  await page.goto(`${BASE_URL}/communities/5`);
  await shot(page, '09-comunidade-detalhe');

  // ── 6. Perfil ─────────────────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/profile`);
  await shot(page, '10-perfil-proprio');

  await page.goto(`${BASE_URL}/profile/1`);
  await shot(page, '11-perfil-publico');

  // ── 7. Métricas ────────────────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/admin/metrics`);
  await shot(page, '12-admin-metricas');

  // ── 8. Cadastro de robô (modal) ────────────────────────────────────────────
  await page.goto(`${BASE_URL}/robots`);
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  const btnAdd = page.locator('button', { hasText: /Cadastrar|Novo Rob/i }).first();
  if (await btnAdd.isVisible()) {
    await btnAdd.click();
    await page.waitForTimeout(600);
    await shot(page, '13-robo-cadastro-modal');
  }

  // ── 9. Criar comunidade (modal) ────────────────────────────────────────────
  await page.goto(`${BASE_URL}/communities`);
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  const btnCom = page.locator('button', { hasText: /Criar|Nova Comunidade/i }).first();
  if (await btnCom.isVisible()) {
    await btnCom.click();
    await page.waitForTimeout(600);
    await shot(page, '14-comunidade-criar-modal');
  }

  await browser.close();

  console.log(`\nTotal: ${14} screenshots salvas em docs/screenshots/${DATE}/\n`);
})();
