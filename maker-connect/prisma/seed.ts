import {
  Category,
  CommunityRole,
  MakerLevel,
  PrismaClient,
  RobotCategory,
  TeamRole,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // ── Users ─────────────────────────────────────────────────────────
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: { email: 'test@example.com', name: 'Vinicius Froes' },
    }),
    prisma.user.upsert({
      where: { email: 'ana.silva@maker.com' },
      update: {},
      create: { email: 'ana.silva@maker.com', name: 'Ana Silva' },
    }),
    prisma.user.upsert({
      where: { email: 'carlos.robo@maker.com' },
      update: {},
      create: { email: 'carlos.robo@maker.com', name: 'Carlos Robotics' },
    }),
    prisma.user.upsert({
      where: { email: 'julia.3d@maker.com' },
      update: {},
      create: { email: 'julia.3d@maker.com', name: 'Júlia 3D' },
    }),
    prisma.user.upsert({
      where: { email: 'pedro.iot@maker.com' },
      update: {},
      create: { email: 'pedro.iot@maker.com', name: 'Pedro IoT' },
    }),
  ]);

  const [vini, ana, carlos, julia, pedro] = users;
  console.log('Users:', users.map((u) => u.email).join(', '));

  // ── UserProfiles ──────────────────────────────────────────────────
  const profiles = [
    {
      userId: vini.id,
      bio: 'Engenheiro maker, TCC sobre IA aplicada à robótica. Apaixonado por IoT e automação inteligente.',
      location: 'Florianópolis, SC',
      website: 'https://github.com/froesv',
      githubUrl: 'https://github.com/froesv',
      makerLevel: MakerLevel.master,
      reputation: 1240,
      expertise: JSON.stringify(['IoT', 'Robótica', 'IA', 'Arduino', 'Raspberry Pi']),
    },
    {
      userId: ana.id,
      bio: 'Especialista em impressão 3D e prototipagem rápida. Criadora de robôs de competição desde 2019.',
      location: 'São Paulo, SP',
      website: 'https://anasilva.maker.com',
      githubUrl: 'https://github.com/anasilva',
      makerLevel: MakerLevel.grandmaster,
      reputation: 2180,
      expertise: JSON.stringify(['3D Printing', 'CAD', 'Robótica de Competição', 'Prototipagem']),
    },
    {
      userId: carlos.id,
      bio: 'Campeão da RoboCore Arena 2024. Desenvolvedor de robôs sumo e combate há 6 anos.',
      location: 'Curitiba, PR',
      makerLevel: MakerLevel.grandmaster,
      reputation: 3450,
      expertise: JSON.stringify(['Sumo', 'Combate', 'Eletrônica', 'Mecânica']),
    },
    {
      userId: julia.id,
      bio: 'Maker focada em wearables e impressão 3D artística. Moderadora da comunidade 3D Printing Brasil.',
      location: 'Belo Horizonte, MG',
      makerLevel: MakerLevel.journeyman,
      reputation: 890,
      expertise: JSON.stringify(['3D Printing', 'Wearables', 'Design', 'Fusion 360']),
    },
    {
      userId: pedro.id,
      bio: 'Desenvolvedor de sistemas IoT industriais. Especialista em LoRa, MQTT e automação.',
      location: 'Porto Alegre, RS',
      makerLevel: MakerLevel.master,
      reputation: 1560,
      expertise: JSON.stringify(['IoT', 'LoRa', 'MQTT', 'NodeMCU', 'Sensores']),
    },
  ];

  for (const p of profiles) {
    await prisma.userProfile.upsert({
      where: { userId: p.userId },
      update: p,
      create: p,
    });
  }

  // ── Badges ────────────────────────────────────────────────────────
  const badgeData = [
    { userId: vini.id, type: 'first_project', title: 'Primeiro Projeto' },
    { userId: vini.id, type: 'team_player', title: 'Team Player' },
    { userId: vini.id, type: 'rag_pioneer', title: 'Pioneiro RAG' },
    { userId: ana.id, type: 'grandmaster', title: 'Grandmaster Maker' },
    { userId: ana.id, type: 'robot_master', title: 'Robot Master' },
    { userId: ana.id, type: 'first_fork', title: 'Primeiro Fork' },
    { userId: carlos.id, type: 'champion', title: 'Campeão Nacional' },
    { userId: carlos.id, type: 'robot_master', title: 'Robot Master' },
    { userId: carlos.id, type: 'arena_legend', title: 'Lenda da Arena' },
    { userId: julia.id, type: 'first_project', title: 'Primeiro Projeto' },
    { userId: julia.id, type: 'documentation_hero', title: 'Herói da Documentação' },
    { userId: pedro.id, type: 'iot_expert', title: 'Especialista IoT' },
    { userId: pedro.id, type: 'first_project', title: 'Primeiro Projeto' },
  ];

  await prisma.userBadge.deleteMany({ where: { userId: { in: users.map((u) => u.id) } } });
  await prisma.userBadge.createMany({ data: badgeData });

  // ── Follows ───────────────────────────────────────────────────────
  const followData = [
    { followerId: vini.id, followingId: ana.id },
    { followerId: vini.id, followingId: carlos.id },
    { followerId: ana.id, followingId: vini.id },
    { followerId: ana.id, followingId: carlos.id },
    { followerId: carlos.id, followingId: ana.id },
    { followerId: julia.id, followingId: ana.id },
    { followerId: pedro.id, followingId: vini.id },
  ];

  for (const f of followData) {
    await prisma.userFollow
      .upsert({ where: { followerId_followingId: f }, update: {}, create: f })
      .catch(() => {});
  }

  // ── RobotEvents ───────────────────────────────────────────────────
  await prisma.robotAward.deleteMany();
  await prisma.robotEventParticipation.deleteMany();
  await prisma.robotMatch.deleteMany();
  await prisma.robotEvent.deleteMany();
  await prisma.robot.deleteMany({ where: { ownerId: { in: users.map((u) => u.id) } } });

  const [arenaEvent, gauchoEvent, makerFest, arena2025] = await Promise.all([
    prisma.robotEvent.create({ data: { name: 'RoboCore Arena 2024', description: 'O maior campeonato de robótica do Brasil.', location: 'São Paulo, SP', eventDate: new Date('2024-08-15'), category: 'competition' } }),
    prisma.robotEvent.create({ data: { name: 'Campeonato Gaúcho de Robótica 2024', description: 'Competição regional de robôs sumo e line follower.', location: 'Porto Alegre, RS', eventDate: new Date('2024-05-20'), category: 'competition' } }),
    prisma.robotEvent.create({ data: { name: 'Maker Fest Floripa 2024', description: 'Festival maker com exposição e competição de robôs.', location: 'Florianópolis, SC', eventDate: new Date('2024-10-05'), category: 'exhibition' } }),
    prisma.robotEvent.create({ data: { name: 'RoboCore Arena 2025', description: 'Edição 2025 do maior campeonato de robótica do Brasil.', location: 'São Paulo, SP', eventDate: new Date('2025-08-10'), category: 'competition' } }),
  ]);

  // ── Robots ────────────────────────────────────────────────────────
  const thunderbot = await prisma.robot.create({
    data: {
      ownerId: carlos.id,
      name: 'ThunderBot MK3',
      description: 'Robô sumo de alto desempenho com chassi de alumínio anodizado e sensores infravermelhos de precisão. Campeão da categoria Sumo 3kg na RoboCore Arena 2024.',
      category: RobotCategory.sumo,
      status: 'active',
      wins: 18,
      losses: 3,
      draws: 1,
      eloScore: 1620,
    },
  });

  const nanobot = await prisma.robot.create({
    data: {
      ownerId: ana.id,
      name: 'NanoStriker',
      description: 'Robô de combate compacto com pá frontal intercambiável. Especializado em competições até 500g.',
      category: RobotCategory.combat,
      status: 'active',
      wins: 12,
      losses: 5,
      draws: 0,
      eloScore: 1380,
    },
  });

  const lineX = await prisma.robot.create({
    data: {
      ownerId: vini.id,
      name: 'LineX Velocity',
      description: 'Line follower ultra-rápido com sensores TCRT5000 e controle PID ajustável via Bluetooth. Desenvolvido para competições universitárias.',
      category: RobotCategory.line_follower,
      status: 'active',
      wins: 7,
      losses: 4,
      draws: 1,
      eloScore: 1150,
    },
  });

  const cyberarm = await prisma.robot.create({
    data: {
      ownerId: vini.id,
      name: 'CyberArm v2',
      description: 'Braço robótico educacional com 4 graus de liberdade, controlado por Arduino Mega e interface web.',
      category: RobotCategory.educational,
      status: 'active',
      wins: 0,
      losses: 0,
      draws: 0,
      eloScore: 1000,
    },
  });

  const phantom = await prisma.robot.create({
    data: {
      ownerId: ana.id,
      name: 'Phantom Racer',
      description: 'Robô de competição autônomo com visão computacional para evasão de obstáculos em alta velocidade.',
      category: RobotCategory.autonomous,
      status: 'active',
      wins: 9,
      losses: 6,
      draws: 2,
      eloScore: 1210,
    },
  });

  // ── RobotMatches ──────────────────────────────────────────────────
  await prisma.robotMatch.createMany({
    data: [
      { robotId: thunderbot.id, opponentName: 'IronBull v4', result: 'win', myScore: 3, opponentScore: 0, eventName: 'RoboCore Arena 2024', matchDate: new Date('2024-08-15') },
      { robotId: thunderbot.id, opponentName: 'SteelPusher', result: 'win', myScore: 2, opponentScore: 1, eventName: 'RoboCore Arena 2024', matchDate: new Date('2024-08-15') },
      { robotId: thunderbot.id, opponentName: 'TitanSumo', result: 'win', myScore: 3, opponentScore: 1, eventName: 'RoboCore Arena 2024', matchDate: new Date('2024-08-15') },
      { robotId: thunderbot.id, opponentName: 'BullDozer 500', result: 'loss', myScore: 1, opponentScore: 3, eventName: 'Campeonato Gaúcho 2024', matchDate: new Date('2024-05-20') },
      { robotId: thunderbot.id, opponentName: 'MegaForca', result: 'win', myScore: 3, opponentScore: 0, eventName: 'Campeonato Gaúcho 2024', matchDate: new Date('2024-05-20') },
      { robotId: thunderbot.id, opponentName: 'NanoStriker', result: 'win', myScore: 2, opponentScore: 1, eventName: 'Maker Fest Floripa 2024', matchDate: new Date('2024-10-05'), notes: 'Final disputada — vitória por margem mínima.' },
      { robotId: nanobot.id, opponentName: 'ThunderBot MK3', result: 'loss', myScore: 1, opponentScore: 2, eventName: 'Maker Fest Floripa 2024', matchDate: new Date('2024-10-05') },
      { robotId: nanobot.id, opponentName: 'CrushBot', result: 'win', myScore: 3, opponentScore: 0, eventName: 'RoboCore Arena 2024', matchDate: new Date('2024-08-15') },
      { robotId: nanobot.id, opponentName: 'SpinnerX', result: 'win', myScore: 2, opponentScore: 0, eventName: 'RoboCore Arena 2024', matchDate: new Date('2024-08-15') },
      { robotId: lineX.id, opponentName: 'SpeedLine Pro', result: 'win', myScore: null, opponentScore: null, eventName: 'Maker Fest Floripa 2024', matchDate: new Date('2024-10-05'), notes: 'Melhor tempo: 4.2s' },
      { robotId: lineX.id, opponentName: 'TrackMaster', result: 'loss', myScore: null, opponentScore: null, eventName: 'Maker Fest Floripa 2024', matchDate: new Date('2024-10-05') },
      { robotId: phantom.id, opponentName: 'AutoBot V3', result: 'win', myScore: null, opponentScore: null, eventName: 'RoboCore Arena 2024', matchDate: new Date('2024-08-15') },
    ],
  });

  // ── RobotEventParticipations ──────────────────────────────────────
  await prisma.robotEventParticipation.createMany({
    data: [
      { robotId: thunderbot.id, eventId: arenaEvent.id, placement: 1 },
      { robotId: thunderbot.id, eventId: gauchoEvent.id, placement: 2 },
      { robotId: thunderbot.id, eventId: makerFest.id, placement: 1 },
      { robotId: nanobot.id, eventId: arenaEvent.id, placement: 3 },
      { robotId: nanobot.id, eventId: makerFest.id, placement: 2 },
      { robotId: lineX.id, eventId: makerFest.id, placement: 3 },
      { robotId: phantom.id, eventId: arenaEvent.id, placement: 4 },
      { robotId: phantom.id, eventId: arena2025.id, placement: null },
    ],
  });

  // ── RobotAwards ───────────────────────────────────────────────────
  await prisma.robotAward.createMany({
    data: [
      { robotId: thunderbot.id, eventId: arenaEvent.id, title: '1º Lugar Sumo 3kg', placement: 1, year: 2024 },
      { robotId: thunderbot.id, eventId: makerFest.id, title: '1º Lugar Sumo Open', placement: 1, year: 2024 },
      { robotId: thunderbot.id, eventId: gauchoEvent.id, title: '2º Lugar Sumo 3kg', placement: 2, year: 2024 },
      { robotId: nanobot.id, eventId: arenaEvent.id, title: '3º Lugar Combate 500g', placement: 3, year: 2024 },
      { robotId: nanobot.id, title: 'Melhor Design — RoboCore 2024', placement: null, year: 2024 },
      { robotId: lineX.id, eventId: makerFest.id, title: '3º Lugar Line Follower', placement: 3, year: 2024 },
    ],
  });

  console.log('Robots and events seeded.');

  // ── Teams ─────────────────────────────────────────────────────────
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();

  const team1 = await prisma.team.create({
    data: {
      name: 'Robótica UFSC',
      description: 'Equipe oficial de robótica da UFSC — competindo desde 2018 em torneios nacionais e internacionais.',
      ownerId: vini.id,
      isPublic: true,
    },
  });

  const team2 = await prisma.team.create({
    data: {
      name: 'SteelBots Arena',
      description: 'Time especializado em robôs de combate e sumo. Múltiplos campeões nacionais.',
      ownerId: carlos.id,
      isPublic: true,
    },
  });

  const team3 = await prisma.team.create({
    data: {
      name: 'Print & Prototype Lab',
      description: 'Laboratório de impressão 3D e prototipagem focado em inovação maker.',
      ownerId: julia.id,
      isPublic: true,
    },
  });

  await prisma.teamMember.createMany({
    data: [
      { teamId: team1.id, userId: vini.id, role: TeamRole.owner },
      { teamId: team1.id, userId: ana.id, role: TeamRole.admin },
      { teamId: team1.id, userId: pedro.id, role: TeamRole.member },
      { teamId: team2.id, userId: carlos.id, role: TeamRole.owner },
      { teamId: team2.id, userId: ana.id, role: TeamRole.admin },
      { teamId: team3.id, userId: julia.id, role: TeamRole.owner },
      { teamId: team3.id, userId: vini.id, role: TeamRole.member },
    ],
  });

  console.log('Teams seeded.');

  // ── Communities ───────────────────────────────────────────────────
  await prisma.communityPost.deleteMany();
  await prisma.communityMember.deleteMany();
  await prisma.community.deleteMany();

  const comm1 = await prisma.community.create({
    data: {
      name: 'Robótica de Competição Brasil',
      description: 'Comunidade oficial para makers de robótica de competição — sumo, combate, line follower e autônomos.',
      category: Category.Robotics,
      creatorId: carlos.id,
      isPublic: true,
    },
  });

  const comm2 = await prisma.community.create({
    data: {
      name: '3D Printing Brasil',
      description: 'Tudo sobre impressão 3D: FDM, resina, filamentos, slicers e projetos.',
      category: Category.Printing3D,
      creatorId: julia.id,
      isPublic: true,
    },
  });

  const comm3 = await prisma.community.create({
    data: {
      name: 'IoT & Automação',
      description: 'Projetos de Internet das Coisas, automação residencial e industrial com Arduino, ESP32, Raspberry Pi.',
      category: Category.IoT,
      creatorId: pedro.id,
      isPublic: true,
    },
  });

  const comm4 = await prisma.community.create({
    data: {
      name: 'Woodworking Makers',
      description: 'Marcenaria moderna com CNC, laser e ferramentas digitais.',
      category: Category.Woodworking,
      creatorId: vini.id,
      isPublic: true,
    },
  });

  await prisma.communityMember.createMany({
    data: [
      { communityId: comm1.id, userId: carlos.id, role: CommunityRole.founder },
      { communityId: comm1.id, userId: ana.id, role: CommunityRole.moderator },
      { communityId: comm1.id, userId: vini.id, role: CommunityRole.member },
      { communityId: comm1.id, userId: pedro.id, role: CommunityRole.member },
      { communityId: comm2.id, userId: julia.id, role: CommunityRole.founder },
      { communityId: comm2.id, userId: ana.id, role: CommunityRole.moderator },
      { communityId: comm2.id, userId: vini.id, role: CommunityRole.member },
      { communityId: comm3.id, userId: pedro.id, role: CommunityRole.founder },
      { communityId: comm3.id, userId: vini.id, role: CommunityRole.moderator },
      { communityId: comm4.id, userId: vini.id, role: CommunityRole.founder },
      { communityId: comm4.id, userId: julia.id, role: CommunityRole.member },
    ],
  });

  await prisma.communityPost.createMany({
    data: [
      {
        communityId: comm1.id,
        authorId: carlos.id,
        title: 'ThunderBot MK3 vence RoboCore Arena 2024!',
        content: 'Galera, depois de muito treino e 3 versões do chassi, o ThunderBot finalmente foi campeão! Compartilho aqui os detalhes técnicos...',
        replies: 14,
        views: 312,
      },
      {
        communityId: comm1.id,
        authorId: ana.id,
        title: 'Dicas para escolher sensores infravermelhos para sumo',
        content: 'Muita gente me pergunta sobre sensores para robôs sumo. Vou listar os melhores custo-benefício disponíveis no Brasil...',
        replies: 8,
        views: 198,
      },
      {
        communityId: comm1.id,
        authorId: vini.id,
        title: 'Controle PID para Line Follower — tutorial completo',
        content: 'Depois de meses ajustando o LineX Velocity, escrevi um guia completo sobre implementação de PID em robôs line follower...',
        replies: 22,
        views: 540,
      },
      {
        communityId: comm2.id,
        authorId: julia.id,
        title: 'Comparativo: Bambu Lab X1C vs Creality K1 Max',
        content: 'Depois de testar as duas impressoras por 3 meses, trago minha análise honesta para quem está pensando em upgrades...',
        replies: 31,
        views: 720,
      },
      {
        communityId: comm2.id,
        authorId: ana.id,
        title: 'Melhores filamentos para peças mecânicas de robôs',
        content: 'PETG, PA12, ASA ou PC? Testei todos para peças estruturais de robôs de competição. Resultados surpreendentes...',
        replies: 19,
        views: 445,
      },
      {
        communityId: comm3.id,
        authorId: pedro.id,
        title: 'LoRaWAN para monitoramento agrícola — case real',
        content: 'Implantamos uma rede LoRaWAN com 12 nós em uma fazenda de 500 hectares. Compartilhando a arquitetura e os desafios...',
        replies: 27,
        views: 610,
      },
      {
        communityId: comm3.id,
        authorId: vini.id,
        title: 'MQTT com autenticação mTLS no ESP32',
        content: 'Tutorial de como configurar MQTT com certificados mTLS no ESP32 para projetos industriais que exigem segurança...',
        replies: 11,
        views: 289,
      },
    ],
  });

  console.log('Communities seeded.');

  // ── Projects ──────────────────────────────────────────────────────
  await prisma.project.deleteMany({ where: { creatorId: { in: users.map((u) => u.id) } } });

  const projectsData = [
    { title: 'Smart LED Matrix Display', category: Category.IoT, creatorId: pedro.id, description: 'Painel LED 32x16 controlado via MQTT com animações customizáveis.' },
    { title: '3D Printer Cable Organizer', category: Category.Printing3D, creatorId: julia.id, description: 'Sistema modular de organização de cabos para impressoras 3D.' },
    { title: 'Robotic Arm Gripper', category: Category.Robotics, creatorId: vini.id, description: 'Garra robótica com 3 dedos impressos em 3D, controlada por servo.' },
    { title: 'DIY CNC Router', category: Category.Woodworking, creatorId: vini.id, description: 'CNC router caseiro de 3 eixos com área de trabalho 300x300mm.' },
    { title: 'LoRaWAN Weather Station', category: Category.IoT, creatorId: pedro.id, description: 'Estação meteorológica com transmissão LoRa de até 10km.' },
    { title: 'Resin Print Stand', category: Category.Printing3D, creatorId: julia.id, description: 'Suporte para impressora de resina com cuba de lavagem integrada.' },
    { title: 'Servo Motor Tester', category: Category.Robotics, creatorId: carlos.id, description: 'Testador de servos com display OLED e geração de PWM ajustável.' },
    { title: 'Woodworking Jig System', category: Category.Woodworking, creatorId: vini.id, description: 'Sistema de gabaritos modulares para marcenaria de precisão.' },
    { title: 'Smart Plant Watering', category: Category.IoT, creatorId: pedro.id, description: 'Sistema de irrigação inteligente com sensor de umidade e app mobile.' },
    { title: 'Modular Robot Platform', category: Category.Robotics, creatorId: ana.id, description: 'Plataforma robótica modular compatível com múltiplos sensores e atuadores.' },
    { title: 'Arduino CNC Plotter', category: Category.Robotics, creatorId: carlos.id, description: 'Plotter XY baseado em Arduino com software GRBL.' },
    { title: 'ESP32 Home Automation', category: Category.IoT, creatorId: pedro.id, description: 'Sistema de automação residencial com ESPHome e integração Home Assistant.' },
  ];

  await prisma.project.createMany({ data: projectsData });

  console.log('Projects seeded. Done!');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
