#!/bin/bash
# Executa UMA VEZ no VPS Hostinger para preparar o ambiente
# Uso: bash vps-setup.sh SEU_DOMINIO.com SEU_EMAIL@dominio.com

set -e

DOMAIN=${1:?"Forneça o domínio: bash vps-setup.sh meudominio.com meu@email.com"}
EMAIL=${2:?"Forneça o e-mail para Let's Encrypt"}

echo "==> Instalando Docker..."
curl -fsSL https://get.docker.com | sh
usermod -aG docker "$USER"

echo "==> Instalando Certbot..."
apt-get update && apt-get install -y certbot

echo "==> Clonando repositório..."
mkdir -p /opt/maker-connect
cd /opt/maker-connect
git clone https://github.com/Froesv85/Master-Labs-main.git . 2>/dev/null || git pull origin main

echo "==> Criando arquivo .env.prod..."
if [ ! -f .env.prod ]; then
  cp .env.prod.example .env.prod
  echo ""
  echo "ATENÇÃO: edite /opt/maker-connect/.env.prod com os valores reais antes de continuar!"
  echo "  nano /opt/maker-connect/.env.prod"
  exit 0
fi

echo "==> Emitindo certificado SSL para $DOMAIN..."
certbot certonly --standalone \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL" \
  -d "$DOMAIN" -d "www.$DOMAIN"

echo "==> Atualizando nginx.conf com o domínio..."
sed -i "s/SEU_DOMINIO.com/$DOMAIN/g" nginx/maker-connect.conf

echo "==> Autenticando no GitHub Container Registry..."
echo "Faça login com um Personal Access Token (read:packages):"
docker login ghcr.io -u Froesv85

echo "==> Subindo os serviços..."
docker compose -f docker-compose.prod.yml up -d

echo ""
echo "Deploy concluído! Acesse https://$DOMAIN"
