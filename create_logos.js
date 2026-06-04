const fs = require('fs');
const path = require('path');

// Cores da paleta
const colors = {
  laranja: '#FFA500',
  laranjaCinza: '#FFB84D',
  azulEscuro: '#1A3A4D',
  preto: '#1a1a1a',
  branco: '#FFFFFF'
};

// ====== NODE CONNECT LOGO ======
const nodeConnectBase = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="200" height="200" fill="${colors.branco}"/>
  
  <!-- Nó central (principal) -->
  <circle cx="100" cy="100" r="8" fill="${colors.laranja}"/>
  
  <!-- Nós secundários (laranja) -->
  <circle cx="130" cy="75" r="6" fill="${colors.laranjaCinza}" opacity="0.9"/>
  <circle cx="130" cy="125" r="6" fill="${colors.laranjaCinza}" opacity="0.9"/>
  
  <!-- Nós secundários (azul) -->
  <circle cx="70" cy="75" r="6" fill="${colors.azulEscuro}" opacity="0.8"/>
  <circle cx="70" cy="125" r="6" fill="${colors.azulEscuro}" opacity="0.8"/>
  
  <!-- Linhas de conexão -->
  <line x1="100" y1="100" x2="130" y2="75" stroke="${colors.laranja}" stroke-width="2.5"/>
  <line x1="100" y1="100" x2="130" y2="125" stroke="${colors.laranja}" stroke-width="2.5"/>
  <line x1="100" y1="100" x2="70" y2="75" stroke="${colors.azulEscuro}" stroke-width="2.5"/>
  <line x1="100" y1="100" x2="70" y2="125" stroke="${colors.azulEscuro}" stroke-width="2.5"/>
  
  <!-- Linhas conectando secundários (suave) -->
  <line x1="130" y1="75" x2="70" y2="75" stroke="#e0e0e0" stroke-width="1.5" stroke-dasharray="3,3"/>
  <line x1="130" y1="125" x2="70" y2="125" stroke="#e0e0e0" stroke-width="1.5" stroke-dasharray="3,3"/>
</svg>`;

// ====== CIRCUIT COMMUNITY LOGO ======
const circuitCommBase = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="200" height="200" fill="${colors.branco}"/>
  
  <!-- Circuito (L invertido) -->
  <path d="M 65 60 L 135 60 L 135 90 L 75 90" stroke="${colors.azulEscuro}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  
  <!-- Pontos de conexão (nós do circuito) -->
  <circle cx="65" cy="60" r="5" fill="${colors.laranja}"/>
  <circle cx="135" cy="60" r="5" fill="${colors.laranja}"/>
  <circle cx="135" cy="90" r="5" fill="${colors.azulEscuro}"/>
  <circle cx="75" cy="90" r="5" fill="${colors.azulEscuro}"/>
  
  <!-- Radiação/comunidade (linhas saindo dos nós) -->
  <!-- De (65, 60) -->
  <line x1="65" y1="60" x2="50" y2="40" stroke="${colors.laranjaCinza}" stroke-width="1.5"/>
  <line x1="65" y1="60" x2="45" y2="55" stroke="${colors.laranjaCinza}" stroke-width="1.5"/>
  <circle cx="50" cy="40" r="2.5" fill="${colors.laranjaCinza}" opacity="0.85"/>
  <circle cx="45" cy="55" r="2.5" fill="${colors.laranjaCinza}" opacity="0.85"/>
  
  <!-- De (135, 60) -->
  <line x1="135" y1="60" x2="150" y2="40" stroke="${colors.laranjaCinza}" stroke-width="1.5"/>
  <line x1="135" y1="60" x2="155" y2="50" stroke="${colors.laranjaCinza}" stroke-width="1.5"/>
  <circle cx="150" cy="40" r="2.5" fill="${colors.laranjaCinza}" opacity="0.85"/>
  <circle cx="155" cy="50" r="2.5" fill="${colors.laranjaCinza}" opacity="0.85"/>
  
  <!-- De (135, 90) -->
  <line x1="135" y1="90" x2="155" y2="105" stroke="${colors.laranjaCinza}" stroke-width="1.5"/>
  <line x1="135" y1="90" x2="150" y2="120" stroke="${colors.laranjaCinza}" stroke-width="1.5"/>
  <circle cx="155" cy="105" r="2.5" fill="${colors.laranjaCinza}" opacity="0.85"/>
  <circle cx="150" cy="120" r="2.5" fill="${colors.laranjaCinza}" opacity="0.85"/>
  
  <!-- De (75, 90) -->
  <line x1="75" y1="90" x2="60" y2="115" stroke="${colors.laranjaCinza}" stroke-width="1.5"/>
  <line x1="75" y1="90" x2="50" y2="105" stroke="${colors.laranjaCinza}" stroke-width="1.5"/>
  <circle cx="60" cy="115" r="2.5" fill="${colors.laranjaCinza}" opacity="0.85"/>
  <circle cx="50" cy="105" r="2.5" fill="${colors.laranjaCinza}" opacity="0.85"/>
</svg>`;

// ====== VARIAÇÕES ======

// Horizontal (icon + nome)
const nodeConnectHorizontal = `<svg viewBox="0 0 450 120" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .brand-text { font-family: Arial, sans-serif; font-size: 36px; font-weight: bold; fill: ${colors.preto}; }
    </style>
  </defs>
  <!-- Icon -->
  <circle cx="60" cy="60" r="8" fill="${colors.laranja}"/>
  <circle cx="85" cy="40" r="6" fill="${colors.laranjaCinza}" opacity="0.9"/>
  <circle cx="85" cy="80" r="6" fill="${colors.laranjaCinza}" opacity="0.9"/>
  <circle cx="35" cy="40" r="6" fill="${colors.azulEscuro}" opacity="0.8"/>
  <circle cx="35" cy="80" r="6" fill="${colors.azulEscuro}" opacity="0.8"/>
  <line x1="60" y1="60" x2="85" y2="40" stroke="${colors.laranja}" stroke-width="2.5"/>
  <line x1="60" y1="60" x2="85" y2="80" stroke="${colors.laranja}" stroke-width="2.5"/>
  <line x1="60" y1="60" x2="35" y2="40" stroke="${colors.azulEscuro}" stroke-width="2.5"/>
  <line x1="60" y1="60" x2="35" y2="80" stroke="${colors.azulEscuro}" stroke-width="2.5"/>
  
  <!-- Texto -->
  <text x="140" y="80" class="brand-text">NODE CONNECT</text>
</svg>`;

const circuitCommHorizontal = `<svg viewBox="0 0 500 120" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .brand-text { font-family: Arial, sans-serif; font-size: 36px; font-weight: bold; fill: ${colors.preto}; }
    </style>
  </defs>
  <!-- Icon -->
  <path d="M 35 35 L 85 35 L 85 55 L 45 55" stroke="${colors.azulEscuro}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="35" cy="35" r="5" fill="${colors.laranja}"/>
  <circle cx="85" cy="35" r="5" fill="${colors.laranja}"/>
  <circle cx="85" cy="55" r="5" fill="${colors.azulEscuro}"/>
  <circle cx="45" cy="55" r="5" fill="${colors.azulEscuro}"/>
  <line x1="35" y1="35" x2="20" y2="15" stroke="${colors.laranjaCinza}" stroke-width="1.5"/>
  <line x1="35" y1="35" x2="15" y2="30" stroke="${colors.laranjaCinza}" stroke-width="1.5"/>
  <circle cx="20" cy="15" r="2.5" fill="${colors.laranjaCinza}" opacity="0.85"/>
  <circle cx="15" cy="30" r="2.5" fill="${colors.laranjaCinza}" opacity="0.85"/>
  <line x1="85" y1="35" x2="100" y2="15" stroke="${colors.laranjaCinza}" stroke-width="1.5"/>
  <line x1="85" y1="35" x2="110" y2="25" stroke="${colors.laranjaCinza}" stroke-width="1.5"/>
  <circle cx="100" cy="15" r="2.5" fill="${colors.laranjaCinza}" opacity="0.85"/>
  <circle cx="110" cy="25" r="2.5" fill="${colors.laranjaCinza}" opacity="0.85"/>
  
  <!-- Texto -->
  <text x="160" y="80" class="brand-text">CIRCUIT COMMUNITY</text>
</svg>`;

// Quadrado (para redes sociais)
const nodeConnectSquare = nodeConnectBase;
const circuitCommSquare = circuitCommBase;

// Favicon (simplificado)
const nodeConnectFavicon = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <circle cx="32" cy="32" r="5" fill="${colors.laranja}"/>
  <circle cx="48" cy="24" r="4" fill="${colors.laranjaCinza}"/>
  <circle cx="48" cy="40" r="4" fill="${colors.laranjaCinza}"/>
  <circle cx="16" cy="24" r="4" fill="${colors.azulEscuro}"/>
  <circle cx="16" cy="40" r="4" fill="${colors.azulEscuro}"/>
  <line x1="32" y1="32" x2="48" y2="24" stroke="${colors.laranja}" stroke-width="1.5"/>
  <line x1="32" y1="32" x2="48" y2="40" stroke="${colors.laranja}" stroke-width="1.5"/>
  <line x1="32" y1="32" x2="16" y2="24" stroke="${colors.azulEscuro}" stroke-width="1.5"/>
  <line x1="32" y1="32" x2="16" y2="40" stroke="${colors.azulEscuro}" stroke-width="1.5"/>
</svg>`;

const circuitCommFavicon = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <path d="M 20 16 L 44 16 L 44 28 L 24 28" stroke="${colors.azulEscuro}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <circle cx="20" cy="16" r="3" fill="${colors.laranja}"/>
  <circle cx="44" cy="16" r="3" fill="${colors.laranja}"/>
  <circle cx="44" cy="28" r="3" fill="${colors.azulEscuro}"/>
  <circle cx="24" cy="28" r="3" fill="${colors.azulEscuro}"/>
  <line x1="20" y1="16" x2="8" y2="6" stroke="${colors.laranjaCinza}" stroke-width="1"/>
  <line x1="44" y1="16" x2="56" y2="6" stroke="${colors.laranjaCinza}" stroke-width="1"/>
  <line x1="44" y1="28" x2="56" y2="38" stroke="${colors.laranjaCinza}" stroke-width="1"/>
  <line x1="24" y1="28" x2="12" y2="38" stroke="${colors.laranjaCinza}" stroke-width="1"/>
</svg>`;

// Monocromático (preto)
const nodeConnectMonochrome = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <circle cx="100" cy="100" r="8" fill="${colors.preto}"/>
  <circle cx="130" cy="75" r="6" fill="${colors.preto}" opacity="0.7"/>
  <circle cx="130" cy="125" r="6" fill="${colors.preto}" opacity="0.7"/>
  <circle cx="70" cy="75" r="6" fill="${colors.preto}" opacity="0.7"/>
  <circle cx="70" cy="125" r="6" fill="${colors.preto}" opacity="0.7"/>
  <line x1="100" y1="100" x2="130" y2="75" stroke="${colors.preto}" stroke-width="2.5"/>
  <line x1="100" y1="100" x2="130" y2="125" stroke="${colors.preto}" stroke-width="2.5"/>
  <line x1="100" y1="100" x2="70" y2="75" stroke="${colors.preto}" stroke-width="2.5"/>
  <line x1="100" y1="100" x2="70" y2="125" stroke="${colors.preto}" stroke-width="2.5"/>
</svg>`;

const circuitCommMonochrome = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <path d="M 65 60 L 135 60 L 135 90 L 75 90" stroke="${colors.preto}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="65" cy="60" r="5" fill="${colors.preto}"/>
  <circle cx="135" cy="60" r="5" fill="${colors.preto}"/>
  <circle cx="135" cy="90" r="5" fill="${colors.preto}"/>
  <circle cx="75" cy="90" r="5" fill="${colors.preto}"/>
  <line x1="65" y1="60" x2="50" y2="40" stroke="${colors.preto}" stroke-width="1.5" opacity="0.6"/>
  <line x1="65" y1="60" x2="45" y2="55" stroke="${colors.preto}" stroke-width="1.5" opacity="0.6"/>
  <circle cx="50" cy="40" r="2.5" fill="${colors.preto}" opacity="0.6"/>
  <circle cx="45" cy="55" r="2.5" fill="${colors.preto}" opacity="0.6"/>
  <line x1="135" y1="60" x2="150" y2="40" stroke="${colors.preto}" stroke-width="1.5" opacity="0.6"/>
  <line x1="135" y1="60" x2="155" y2="50" stroke="${colors.preto}" stroke-width="1.5" opacity="0.6"/>
  <circle cx="150" cy="40" r="2.5" fill="${colors.preto}" opacity="0.6"/>
  <circle cx="155" cy="50" r="2.5" fill="${colors.preto}" opacity="0.6"/>
</svg>`;

// Invertido (fundo escuro)
const nodeConnectDark = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="200" fill="${colors.azulEscuro}"/>
  <circle cx="100" cy="100" r="8" fill="${colors.laranja}"/>
  <circle cx="130" cy="75" r="6" fill="${colors.laranjaCinza}" opacity="0.9"/>
  <circle cx="130" cy="125" r="6" fill="${colors.laranjaCinza}" opacity="0.9"/>
  <circle cx="70" cy="75" r="6" fill="${colors.branco}" opacity="0.8"/>
  <circle cx="70" cy="125" r="6" fill="${colors.branco}" opacity="0.8"/>
  <line x1="100" y1="100" x2="130" y2="75" stroke="${colors.laranja}" stroke-width="2.5"/>
  <line x1="100" y1="100" x2="130" y2="125" stroke="${colors.laranja}" stroke-width="2.5"/>
  <line x1="100" y1="100" x2="70" y2="75" stroke="${colors.branco}" stroke-width="2.5"/>
  <line x1="100" y1="100" x2="70" y2="125" stroke="${colors.branco}" stroke-width="2.5"/>
</svg>`;

const circuitCommDark = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="200" fill="${colors.azulEscuro}"/>
  <path d="M 65 60 L 135 60 L 135 90 L 75 90" stroke="${colors.branco}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="65" cy="60" r="5" fill="${colors.laranja}"/>
  <circle cx="135" cy="60" r="5" fill="${colors.laranja}"/>
  <circle cx="135" cy="90" r="5" fill="${colors.branco}"/>
  <circle cx="75" cy="90" r="5" fill="${colors.branco}"/>
  <line x1="65" y1="60" x2="50" y2="40" stroke="${colors.laranjaCinza}" stroke-width="1.5"/>
  <line x1="65" y1="60" x2="45" y2="55" stroke="${colors.laranjaCinza}" stroke-width="1.5"/>
  <circle cx="50" cy="40" r="2.5" fill="${colors.laranjaCinza}" opacity="0.85"/>
  <circle cx="45" cy="55" r="2.5" fill="${colors.laranjaCinza}" opacity="0.85"/>
  <line x1="135" y1="60" x2="150" y2="40" stroke="${colors.laranjaCinza}" stroke-width="1.5"/>
  <line x1="135" y1="60" x2="155" y2="50" stroke="${colors.laranjaCinza}" stroke-width="1.5"/>
  <circle cx="150" cy="40" r="2.5" fill="${colors.laranjaCinza}" opacity="0.85"/>
  <circle cx="155" cy="50" r="2.5" fill="${colors.laranjaCinza}" opacity="0.85"/>
</svg>`;

// Criando diretórios
const baseDir = '/sessions/relaxed-festive-faraday/mnt/Master-Labs-main/assets/logos';
const dirs = [
  baseDir,
  `${baseDir}/node-connect`,
  `${baseDir}/circuit-community`
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Salvando NODE CONNECT
fs.writeFileSync(`${baseDir}/node-connect/base.svg`, nodeConnectBase);
fs.writeFileSync(`${baseDir}/node-connect/horizontal.svg`, nodeConnectHorizontal);
fs.writeFileSync(`${baseDir}/node-connect/square.svg`, nodeConnectSquare);
fs.writeFileSync(`${baseDir}/node-connect/favicon.svg`, nodeConnectFavicon);
fs.writeFileSync(`${baseDir}/node-connect/monochrome.svg`, nodeConnectMonochrome);
fs.writeFileSync(`${baseDir}/node-connect/dark-bg.svg`, nodeConnectDark);

// Salvando CIRCUIT COMMUNITY
fs.writeFileSync(`${baseDir}/circuit-community/base.svg`, circuitCommBase);
fs.writeFileSync(`${baseDir}/circuit-community/horizontal.svg`, circuitCommHorizontal);
fs.writeFileSync(`${baseDir}/circuit-community/square.svg`, circuitCommSquare);
fs.writeFileSync(`${baseDir}/circuit-community/favicon.svg`, circuitCommFavicon);
fs.writeFileSync(`${baseDir}/circuit-community/monochrome.svg`, circuitCommMonochrome);
fs.writeFileSync(`${baseDir}/circuit-community/dark-bg.svg`, circuitCommDark);

console.log('✓ SVGs criados com sucesso!');
console.log(`\nArquivos salvos em: ${baseDir}`);
console.log('\nNode Connect:');
console.log('  - base.svg');
console.log('  - horizontal.svg');
console.log('  - square.svg');
console.log('  - favicon.svg');
console.log('  - monochrome.svg');
console.log('  - dark-bg.svg');
console.log('\nCircuit Community:');
console.log('  - base.svg');
console.log('  - horizontal.svg');
console.log('  - square.svg');
console.log('  - favicon.svg');
console.log('  - monochrome.svg');
console.log('  - dark-bg.svg');
