import Link from 'next/link';
import { Logo } from '@/components/logo';

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#080c17] text-zinc-50 overflow-hidden font-sans">
      {/* Animated background glows */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-amber-500/8 blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-orange-600/6 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-amber-400/4 blur-[180px]" />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(245,158,11,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.8) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Navbar */}
        <header className="flex w-full items-center justify-between border-b border-amber-500/10 bg-[#080c17]/90 px-8 py-4 backdrop-blur-md">
          <Logo size={36} />
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <Link href="#features" className="transition-colors hover:text-amber-400">Recursos</Link>
            <Link href="#social" className="transition-colors hover:text-amber-400">Comunidade</Link>
            <Link href="#robots" className="transition-colors hover:text-amber-400">Robôs</Link>
            <Link href="/admin/metrics" className="transition-colors hover:text-amber-400">Métricas</Link>
          </nav>
          <Link
            href="/feed"
            className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-5 py-2 text-sm font-bold text-amber-400 transition-all hover:bg-amber-500/20 hover:border-amber-500/70"
          >
            Acessar Plataforma →
          </Link>
        </header>

        {/* Hero */}
        <main className="flex flex-1 flex-col items-center justify-center px-8 py-24 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-400 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
            </span>
            Plataforma ao vivo • Master By Tech
          </div>

          <h1 className="max-w-4xl text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.1] mb-6">
            A rede social dos{' '}
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              Makers
            </span>{' '}
            
          </h1>

          <p className="max-w-2xl text-lg text-zinc-400 leading-relaxed mb-10">
            Conecte-se com makers, compartilhe projetos, acompanhe robôs em competições e cresça dentro de comunidades que constroem o futuro — da bancada à arena.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/feed"
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-4 text-sm font-bold text-black shadow-[0_0_24px_rgba(245,158,11,0.35)] transition-all hover:shadow-[0_0_32px_rgba(245,158,11,0.5)] hover:scale-105"
            >
              Explorar Feed
            </Link>
            <Link
              href="/robots"
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-8 py-4 text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-white/10 hover:border-amber-500/30"
            >
              Ver Arena de Robôs
            </Link>
          </div>

          {/* Stats bar */}
          <div className="mt-16 grid grid-cols-2 gap-px rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md sm:grid-cols-4 overflow-hidden">
            {[
              { value: '500+', label: 'Makers Ativos' },
              { value: '120+', label: 'Robôs Cadastrados' },
              { value: '40+', label: 'Competições' },
              { value: '15+', label: 'Comunidades' },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center justify-center px-8 py-6 bg-[#0a0f1e]/60">
                <span className="text-3xl font-black text-amber-400">{stat.value}</span>
                <span className="mt-1 text-xs font-medium text-zinc-500 uppercase tracking-widest">{stat.label}</span>
              </div>
            ))}
          </div>
        </main>

        {/* Features */}
        <section id="features" className="border-t border-white/5 bg-[#0a0f1e]/60 px-8 py-20 backdrop-blur-lg">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 text-center">
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-amber-500">Plataforma</span>
              <h2 className="mt-2 text-3xl font-black text-white">Tudo que um Maker precisa</h2>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ),
                  color: 'amber',
                  title: 'MakerBrain RAG',
                  desc: 'Pipelines de extração inteligentes com aterramento técnico real — sem alucinações na lista de componentes.',
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ),
                  color: 'orange',
                  title: 'Visão Computacional',
                  desc: 'Analise fotos e esquemáticos. O agente identifica circuitos e sugere firmware base (Arduino/ESP).',
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  ),
                  color: 'yellow',
                  title: 'Dossiê Técnico S3',
                  desc: 'Documentação PDF com BOM, código e diário de bordo armazenados em bucket empresarial seguro.',
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-white/8 bg-[#0d1424] p-8 transition-all hover:border-amber-500/30 hover:bg-[#111827]"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                    {f.icon}
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-white">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-zinc-500">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Social features */}
        <section id="social" className="border-t border-white/5 px-8 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 text-center">
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-amber-500">Comunidade</span>
              <h2 className="mt-2 text-3xl font-black text-white">Arena dos Makers</h2>
              <p className="mt-3 text-zinc-500 max-w-xl mx-auto">Perfis, seguir makers, badges de conquista, equipes e comunidades temáticas.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: '◉', title: 'Perfis', desc: 'Nível Maker, reputação, badges e portfólio de projetos.', href: '/profile/1' },
                { icon: '◇', title: 'Equipes', desc: 'Monte sua equipe de competição ou colaboração open-source.', href: '/teams' },
                { icon: '◎', title: 'Comunidades', desc: 'Grupos temáticos: Robótica, 3D Print, IoT, Woodworking.', href: '/communities' },
                { icon: '◈', title: 'Feed', desc: 'Projetos e conquistas de quem você segue.', href: '/feed' },
              ].map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group rounded-2xl border border-white/8 bg-[#0d1424] p-6 transition-all hover:border-amber-500/40 hover:bg-[#111827]"
                >
                  <div className="mb-4 text-3xl text-amber-400">{item.icon}</div>
                  <h3 className="mb-1 text-base font-bold text-white group-hover:text-amber-400 transition-colors">{item.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Robots arena */}
        <section id="robots" className="border-t border-white/5 bg-[#0a0f1e]/60 px-8 py-20 backdrop-blur-lg">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1">
                <span className="text-xs font-bold uppercase tracking-[0.3em] text-amber-500">Arena</span>
                <h2 className="mt-2 text-3xl font-black text-white mb-4">Robôs em Competição</h2>
                <p className="text-zinc-500 leading-relaxed mb-6">
                  Ranking ELO em tempo real, histórico de partidas, premiações e eventos. Acompanhe cada batalha de sumo, combat, line follower e mais.
                </p>
                <div className="flex flex-wrap gap-3 mb-8">
                  {['Sumo', 'Combate', 'Seguidor de Linha', 'Autônomo', 'IoT'].map((cat) => (
                    <span key={cat} className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
                      {cat}
                    </span>
                  ))}
                </div>
                <Link
                  href="/robots"
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-3 text-sm font-bold text-black shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all hover:bg-amber-400 hover:scale-105"
                >
                  Ver Ranking Completo →
                </Link>
              </div>

              {/* Mock ranking card */}
              <div className="flex-1 max-w-sm w-full">
                <div className="rounded-2xl border border-amber-500/20 bg-[#0d1424] overflow-hidden shadow-[0_0_40px_rgba(245,158,11,0.08)]">
                  <div className="border-b border-white/5 bg-amber-500/5 px-5 py-3 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Top Ranking ELO</span>
                    <span className="text-xs text-zinc-600">ao vivo</span>
                  </div>
                  {[
                    { pos: 1, name: 'ThunderBot MK3', elo: 1620, team: 'Robótica UFSC', medal: '🥇' },
                    { pos: 2, name: 'NanoStriker', elo: 1544, team: 'SteelBots Arena', medal: '🥈' },
                    { pos: 3, name: 'LineX Velocity', elo: 1498, team: 'UFSC', medal: '🥉' },
                    { pos: 4, name: 'CyberArm v2', elo: 1421, team: 'Robótica UFSC', medal: null },
                    { pos: 5, name: 'Phantom Racer', elo: 1356, team: 'SteelBots', medal: null },
                  ].map((r) => (
                    <div key={r.pos} className="flex items-center gap-3 px-5 py-3 border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                      <span className="w-6 text-center text-sm font-bold text-zinc-600">{r.medal ?? `#${r.pos}`}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{r.name}</p>
                        <p className="text-xs text-zinc-600 truncate">{r.team}</p>
                      </div>
                      <span className={`text-sm font-black ${r.pos <= 3 ? 'text-amber-400' : 'text-zinc-500'}`}>
                        {r.elo}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-white/5 px-8 py-20 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-4xl font-black text-white mb-4">Pronto para entrar na arena?</h2>
            <p className="text-zinc-500 mb-8">Crie seu perfil, cadastre seu robô e conecte-se com os melhores makers do Brasil.</p>
            <Link
              href="/feed"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-10 py-4 text-base font-black text-black shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all hover:shadow-[0_0_40px_rgba(245,158,11,0.6)] hover:scale-105"
            >
              Entrar na Plataforma
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 bg-[#080c17] px-8 py-8">
          <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <Logo size={28} />
            <p className="text-xs text-zinc-600">
              Desenvolvido pela Engenharia de Inovação da{' '}
              <a href="https://masterbytech.com.br/master-labs" target="_blank" rel="noreferrer" className="text-amber-500/70 hover:text-amber-400 transition-colors">
                Master By Tech
              </a>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
