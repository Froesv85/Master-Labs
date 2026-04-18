import Link from 'next/link';
import { LanguageSelector } from '@/components/language-selector';

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#0f172a] text-zinc-50 overflow-hidden font-sans">
      {/* Background Graphic (MakerBrain Hero) */}
      <div className="absolute inset-0 z-0 opacity-50">
        <img
          src="/maker-hero.png"
          alt="MakerBrain AI Visualization"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/80 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a] via-[#0f172a]/60 to-transparent"></div>

        {/* Maker Vibes: Efeitos de Fundo (Grid/Pontos Holográficos) */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/0 via-[#0f172a]/50 to-[#0f172a] opacity-80"></div>
        <div className="absolute top-1/3 left-1/4 h-[300px] w-[300px] rounded-full bg-emerald-500/30 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-cyan-500/20 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Navbar */}
        <header className="flex w-full items-center justify-between px-8 py-6">
          <div className="flex items-center gap-3">
            <img
              src="/maker-logo.png"
              alt="Maker Connect Logo"
              className="h-16 w-20 sm:h-20 sm:w-24 object-contain mix-blend-screen drop-shadow-[0_0_15px_rgba(0,196,180,0.8)]"
            />
            <span className="text-xl font-bold tracking-tight text-white hidden sm:block">
              Maker<span className="text-master-cyan">Connect</span>
            </span>
          </div>
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-300">
              <Link href="#features" className="hover:text-master-cyan transition-colors">Recursos IA</Link>
              <Link href="/admin/metrics" className="hover:text-master-cyan transition-colors">Governança</Link>
              <Link
                href="/feed"
                className="rounded-full bg-white/10 px-5 py-2 text-white ring-1 ring-white/20 backdrop-blur-md transition-all hover:bg-white/20 hover:ring-master-cyan"
              >
                Acessar Plataforma
              </Link>
            </nav>
            <LanguageSelector />
          </div>
        </header>

        {/* Hero Content */}
        <main className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-32 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-400 backdrop-blur-md mb-8 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
              </span>
              Master Labs • Engenharia do Futuro
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white mb-6 leading-[1.2]">
              A Inteligência por trás da <br />
              sua <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-xl inline-block pb-2">Inovação.</span>
            </h1>

            <p className="text-lg sm:text-xl text-zinc-400 mb-10 max-w-2xl leading-relaxed border-l-4 border-emerald-500/50 pl-4 py-1">
              Junte-se ao <strong>Movimento Maker</strong>. O ecossistema inteligente que une a mão na massa com orquestração de IA. Construa robótica e IoT enquanto nossos agentes cuidam do código base e documentação técnica.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/feed"
                className="flex items-center justify-center rounded-lg bg-gradient-to-r from-master-teal to-master-cyan px-8 py-4 text-sm font-bold text-slate-900 transition-all hover:shadow-[0_0_20px_rgba(0,196,180,0.4)] hover:scale-105"
              >
                Explorar Projetos
              </Link>
              <Link
                href="/admin/metrics"
                className="flex items-center justify-center rounded-lg bg-white/5 px-8 py-4 text-sm font-semibold text-white ring-1 ring-white/10 backdrop-blur-md transition-all hover:bg-white/10"
              >
                Dashboard Executiva
              </Link>
            </div>
          </div>
        </main>

        {/* Features Bento Grid */}
        <section id="features" className="w-full px-8 py-20 bg-slate-900/80 backdrop-blur-lg border-t border-white/5">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold mb-10 text-center">Governança + IA na prática</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-panel p-8 rounded-2xl flex flex-col justify-between group hover:border-master-teal/50 transition-colors">
                <div>
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-6 text-emerald-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">MakerBrain RAG</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">Pipelines de extração inteligentes que garantem aterramento técnico usando manuais reais, eliminando alucinações na lista de componentes.</p>
                </div>
              </div>

              <div className="glass-panel p-8 rounded-2xl flex flex-col justify-between group hover:border-master-cyan/50 transition-colors">
                <div>
                  <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-6 text-cyan-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Computer Vision</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">Upload simplificado de fotos e esquemáticos. O agente analisa a imagem, identifica os circuitos e sugere a Firmware base (Arduino/ESP).</p>
                </div>
              </div>

              <div className="glass-panel p-8 rounded-2xl flex flex-col justify-between group hover:border-blue-500/50 transition-colors">
                <div>
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-6 text-blue-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Dossiê Técnico S3</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">Todo o seu trabalho centralizado em um bucket de segurança empresarial. Documentação PDF com BOM, Código e Diário de Bordo formatados perfeitamente.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full border-t border-white/5 bg-slate-900/90 py-8 px-8 text-center backdrop-blur-md mt-auto">
          <p className="text-zinc-500 text-sm font-medium">
            Desenvolvido pela Engenharia de Inovação da{' '}
            <a href="https://masterbytech.com.br/master-labs" target="_blank" rel="noreferrer" className="text-master-teal hover:text-white transition-colors">
              Master By Tech
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
