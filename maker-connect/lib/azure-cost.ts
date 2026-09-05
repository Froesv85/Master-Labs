type AzureCostResult = {
  configured: boolean;
  monthToDateCost?: number;
  currency?: string;
  asOf?: string;
  error?: string;
};

const CACHE_TTL_MS = 15 * 60 * 1000;
const ERROR_CACHE_TTL_MS = 5 * 60 * 1000;
let cache: { data: AzureCostResult; expiresAt: number } | null = null;

export async function getAzureCost(): Promise<AzureCostResult> {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;

  if (!tenantId || !clientId || !clientSecret || !subscriptionId) {
    return { configured: false };
  }

  if (cache && cache.expiresAt > Date.now()) {
    return cache.data;
  }

  try {
    const tokenRes = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://management.azure.com/.default',
      }),
    });

    if (!tokenRes.ok) {
      throw new Error(`Falha ao autenticar na Azure (HTTP ${tokenRes.status})`);
    }

    const tokenData = (await tokenRes.json()) as { access_token?: string };
    if (!tokenData.access_token) {
      throw new Error('Token da Azure ausente na resposta de autenticação');
    }

    const costRes = await fetch(
      `https://management.azure.com/subscriptions/${subscriptionId}/providers/Microsoft.CostManagement/query?api-version=2023-11-01`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'ActualCost',
          timeframe: 'MonthToDate',
          dataset: {
            granularity: 'None',
            aggregation: { totalCost: { name: 'PreTaxCost', function: 'Sum' } },
          },
        }),
      }
    );

    if (!costRes.ok) {
      throw new Error(`Falha ao consultar custos da Azure (HTTP ${costRes.status})`);
    }

    const costData = (await costRes.json()) as {
      properties: { columns: { name: string }[]; rows: (number | string)[][] };
    };

    const columns = costData.properties.columns.map((c) => c.name);
    const costIdx = columns.indexOf('PreTaxCost');
    const currencyIdx = columns.indexOf('Currency');
    const row = costData.properties.rows[0] ?? [];

    const result: AzureCostResult = {
      configured: true,
      monthToDateCost: costIdx >= 0 ? Number(row[costIdx]) : 0,
      currency: currencyIdx >= 0 ? String(row[currencyIdx]) : 'BRL',
      asOf: new Date().toISOString(),
    };

    cache = { data: result, expiresAt: Date.now() + CACHE_TTL_MS };
    return result;
  } catch (error) {
    const result: AzureCostResult = {
      configured: true,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao consultar a Azure',
    };
    cache = { data: result, expiresAt: Date.now() + ERROR_CACHE_TTL_MS };
    return result;
  }
}
