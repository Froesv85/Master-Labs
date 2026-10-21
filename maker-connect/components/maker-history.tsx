import Image from 'next/image';
import Link from 'next/link';

type Source = { label: string; url: string };

type Milestone = {
  year: string;
  title: string;
  text: string;
  source: Source;
  image?: { src: string; alt: string; width: number; height: number };
};

// Imagens em public/historia/, todas de licenca livre (creditos em IMAGE_CREDITS).
const MILESTONES: Milestone[] = [
  {
    year: '1943',
    title: 'Make Do and Mend',
    text: 'Consertar e reaproveitar como resposta à escassez.',
    source: { label: 'Glasgow Women’s Library', url: 'https://collections.womenslibrary.org.uk/museum/museum-object/973838' },
  },
  {
    year: '1968',
    title: 'Whole Earth Catalog',
    text: 'Ferramentas e conhecimento nas mãos de qualquer pessoa.',
    source: { label: 'MoMA', url: 'https://www.moma.org/calendar/exhibitions/1166' },
  },
  {
    year: '1975',
    title: 'Homebrew Computer Club',
    text: 'A computação pessoal nasce entre amadores.',
    source: { label: 'Computer History Museum', url: 'https://computerhistory.org/blog/the-homebrew-computer-club-2013-reunion/' },
    image: {
      src: '/historia/homebrew-convite-1975.webp',
      alt: 'Convite datilografado para a primeira reunião do Homebrew Computer Club, 1975',
      width: 900,
      height: 608,
    },
  },
  {
    year: 'Anos 2000',
    title: 'Primeiros Fab Labs',
    text: 'O MIT cria os primeiros laboratórios de fabricação digital abertos à comunidade.',
    source: { label: 'MIT', url: 'https://oge.mit.edu/oge_news/how-mits-fab-labs-scaled-around-the-world/' },
    image: {
      src: '/historia/fablab-amsterdam.webp',
      alt: 'Fab Lab da Waag Society em Amsterdã, com fresadora CNC e bancadas',
      width: 600,
      height: 450,
    },
  },
  {
    year: '2005',
    title: 'Make:, Arduino, RepRap e Instructables',
    text: 'Surgem a revista que deu nome ao movimento, a placa que popularizou a eletrônica, a impressora 3D que fabrica as próprias peças e a maior vitrine de projetos DIY.',
    source: { label: 'Science Museum (RepRap)', url: 'https://collection.sciencemuseum.org.uk/objects/co8357315/darwin-reprap-self-replicating-3d-printer-printer' },
    image: {
      src: '/historia/reprap-darwin.webp',
      alt: 'Maker ao lado de uma impressora 3D RepRap Darwin em montagem',
      width: 675,
      height: 900,
    },
  },
  {
    year: '2006',
    title: 'Primeira Maker Faire',
    text: 'Na Califórnia, a “feira de ciências para todas as idades”.',
    source: { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Maker_Faire' },
    image: {
      src: '/historia/maker-faire-2008.webp',
      alt: 'Escultura cinética de luzes coloridas exposta na Maker Faire de 2008',
      width: 675,
      height: 900,
    },
  },
  {
    year: '2008',
    title: 'Thingiverse',
    text: 'Modelos 3D abertos passam a ser compartilhados com o mundo.',
    source: { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Thingiverse' },
  },
  {
    year: '2009',
    title: 'Fim da patente da FDM',
    text: 'Impressoras 3D acessíveis começam a chegar às casas.',
    source: { label: 'Google Patents (US5121329)', url: 'https://patents.google.com/patent/US5121329A/en' },
  },
  {
    year: '2012',
    title: 'Raspberry Pi',
    text: 'Um computador completo pelo preço de um livro.',
    source: { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Raspberry_Pi' },
    image: {
      src: '/historia/raspberry-pi-model-b.webp',
      alt: 'Placa Raspberry Pi da primeira geração vista de cima',
      width: 900,
      height: 600,
    },
  },
  {
    year: '2014',
    title: 'Maker Faire na Casa Branca',
    text: 'O movimento chega às políticas públicas.',
    source: {
      label: 'Arquivo da Casa Branca',
      url: 'https://obamawhitehouse.archives.gov/the-press-office/2014/06/17/presidential-proclamation-national-day-making-2014',
    },
    image: {
      src: '/historia/white-house-maker-faire-2014.webp',
      alt: 'Carro elétrico exposto nos jardins da Casa Branca durante a Maker Faire de 2014',
      width: 900,
      height: 600,
    },
  },
  {
    year: 'Hoje',
    title: 'Makers por todo o Brasil',
    text: 'Fab labs, espaços maker, equipes de robótica e home labs espalhados pelo país, inclusive aqui em Santa Catarina.',
    source: { label: 'MakerConnect', url: '/projects' },
  },
];

const EXTRA_SOURCES: Source[] = [
  { label: 'Make (revista), Wikipedia', url: 'https://en.wikipedia.org/wiki/Make_(magazine)' },
  { label: 'Arduino, Wikipedia', url: 'https://en.wikipedia.org/wiki/Arduino' },
  { label: 'RepRap Ltd: RepRap is 10', url: 'https://reprapltd.com/reprap-is-10/' },
  { label: 'Sobre o Instructables', url: 'https://www.instructables.com/about' },
];

const IMAGE_CREDITS: { what: string; author: string; license: string; licenseUrl: string; fileUrl: string }[] = [
  {
    what: 'Capa do panfleto Make Do and Mend (1943)',
    author: 'Jill Greenwood / Ministry of Information',
    license: 'Domínio público',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/deed.pt-br',
    fileUrl: 'https://commons.wikimedia.org/wiki/File:Make_Do_and_Mend_pamphlet_-_pink_cover,1943.jpg',
  },
  {
    what: 'Convite para a 1ª reunião do Homebrew Computer Club',
    author: 'Gotanero',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/deed.pt-br',
    fileUrl: 'https://commons.wikimedia.org/wiki/File:Invitation_to_First_Homebrew_Computer_Club_meeting.jpg',
  },
  {
    what: 'Fab Lab da Waag Society, Amsterdã',
    author: 'Rory Hyde',
    license: 'CC BY-SA 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0/deed.pt-br',
    fileUrl: 'https://commons.wikimedia.org/wiki/File:Amsterdam_Fab_Lab_at_The_Waag_Society.JPG',
  },
  {
    what: 'Arduino Uno',
    author: 'SparkFun Electronics',
    license: 'CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0/deed.pt-br',
    fileUrl: 'https://commons.wikimedia.org/wiki/File:Arduino_Uno_-_R3.jpg',
  },
  {
    what: 'RepRap Darwin',
    author: 'Zach Hoeken',
    license: 'CC BY-SA 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0/deed.pt-br',
    fileUrl: 'https://commons.wikimedia.org/wiki/File:RepRap_Darwin_3.jpg',
  },
  {
    what: 'Escultura ORBIT 3, de Carl Pisaturo, na Maker Faire 2008',
    author: 'Michel Deschênes',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/deed.pt-br',
    fileUrl: 'https://commons.wikimedia.org/wiki/File:Maker_Faire_2008_spinning_lights.jpg',
  },
  {
    what: 'Raspberry Pi da primeira geração',
    author: 'Tors',
    license: 'CC BY-SA 3.0 DE',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/de/deed.pt-br',
    fileUrl: 'https://commons.wikimedia.org/wiki/File:Raspberry_Pi_Model_B_Rev._2.jpg',
  },
  {
    what: 'Maker Faire da Casa Branca, 2014',
    author: 'Pete Souza / Obama White House',
    license: 'Domínio público',
    licenseUrl: 'https://commons.wikimedia.org/wiki/Template:PD-USGov',
    fileUrl: 'https://commons.wikimedia.org/wiki/File:P061814PS-0086_(14992502137).jpg',
  },
];

const VALUES = ['Criatividade', 'Colaboração', 'Sustentabilidade', 'Escalabilidade'];

function ExternalLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  const internal = href.startsWith('/');
  return internal ? (
    <Link href={href} className={className}>
      {children}
    </Link>
  ) : (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {children}
    </a>
  );
}

export function MakerHistory() {
  return (
    <section id="historia" className="border-t border-white/5 px-4 py-20 sm:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Abertura */}
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-amber-500">Nossa história</span>
            <h2 className="mt-3 max-w-3xl text-3xl font-black leading-tight text-white sm:text-4xl">
              Do “faça você mesmo” à comunidade maker
            </h2>
            <div className="mt-6 max-w-3xl space-y-4 text-base leading-relaxed text-zinc-400">
              <p className="text-lg text-zinc-300">Antes de existir a palavra maker, já existia gente que fazia.</p>
              <p>
                Durante a Segunda Guerra Mundial, a campanha britânica <em className="text-zinc-200">Make Do and Mend</em>{' '}
                ensinava famílias a consertar, reaproveitar e criar diante da escassez. A necessidade virou cultura: por
                décadas, o saber prático passou de mão em mão, na oficina do avô, na máquina de costura da mãe, no rádio
                desmontado na mesa da cozinha. Fazer com o que se tem nunca saiu de moda.
              </p>
              <p>
                Nos anos 1960 e 70, esse espírito ganhou um lado tecnológico. O <em className="text-zinc-200">Whole Earth Catalog</em>{' '}
                prometia “acesso a ferramentas”, e clubes de entusiastas como o Homebrew Computer Club mostraram que um
                computador também podia nascer numa garagem.
              </p>
              <p>
                Em 2005, o movimento ganhou nome. A revista <em className="text-zinc-200">Make:</em> reuniu eletrônica,
                marcenaria, costura e programação sob um único rótulo: maker. No mesmo ano surgiram o Arduino, a placa que
                colocou a eletrônica ao alcance de estudantes e artistas, e o RepRap, a impressora 3D capaz de fabricar as
                próprias peças. A partir daí, a cultura maker deixou de ser hobby isolado e virou movimento global.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <figure className="row-span-2 overflow-hidden rounded-2xl border border-white/10 bg-[#0d1424]">
              <Image
                src="/historia/make-do-and-mend-1943.webp"
                alt="Capa rosa do panfleto Make Do and Mend, de 1943, com ilustrações de pessoas costurando e remendando roupas"
                width={576}
                height={900}
                className="h-full w-full object-cover"
              />
              <figcaption className="px-3 py-2 text-[11px] text-zinc-500">Panfleto Make Do and Mend, 1943</figcaption>
            </figure>
            <figure className="overflow-hidden rounded-2xl border border-white/10 bg-white">
              <Image
                src="/historia/arduino-uno.webp"
                alt="Placa Arduino Uno azul vista em perspectiva"
                width={600}
                height={600}
                className="aspect-square w-full object-contain p-2"
              />
              <figcaption className="bg-[#0d1424] px-3 py-2 text-[11px] text-zinc-500">Arduino Uno</figcaption>
            </figure>
            <blockquote className="flex flex-col justify-center rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
              <p className="text-sm font-semibold leading-snug text-amber-300">“Genialidade nasce da limitação, não da abundância.”</p>
            </blockquote>
          </div>
        </div>

        {/* Linha do tempo */}
        <div className="mt-20">
          <h3 className="text-2xl font-black text-white">Marcos do movimento maker</h3>
          <ol className="relative mt-10 space-y-8 border-l border-amber-500/20 pl-6 sm:pl-10">
            {MILESTONES.map((m) => (
              <li key={m.year + m.title} className="relative">
                <span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full border-2 border-amber-500 bg-[#080c17] sm:-left-[47px]" />
                <div className={`grid gap-4 ${m.image ? 'md:grid-cols-[1fr_240px] md:items-start' : ''}`}>
                  <div>
                    <span className="text-sm font-black tracking-wide text-amber-400">{m.year}</span>
                    <h4 className="mt-1 text-lg font-bold text-white">{m.title}</h4>
                    <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-400">{m.text}</p>
                    {!m.source.url.startsWith('/') && (
                      <ExternalLink
                        href={m.source.url}
                        className="mt-2 inline-block text-xs text-zinc-500 underline decoration-zinc-700 underline-offset-2 transition-colors hover:text-amber-400"
                      >
                        Fonte: {m.source.label}
                      </ExternalLink>
                    )}
                  </div>
                  {m.image && (
                    <Image
                      src={m.image.src}
                      alt={m.image.alt}
                      width={m.image.width}
                      height={m.image.height}
                      className="max-h-48 w-full rounded-xl border border-white/10 object-cover md:max-w-[240px]"
                    />
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Onde entra a MakerConnect */}
        <div className="mt-20 rounded-3xl border border-amber-500/20 bg-gradient-to-br from-[#0d1424] to-[#1a1408] p-8 sm:p-12">
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-amber-500">Onde entra a MakerConnect</span>
          <p className="mt-4 max-w-3xl text-xl font-semibold leading-snug text-white sm:text-2xl">
            Todo projeto maker começa com um rascunho, alguns sensores e uma pergunta: como documentar isso para que outra
            pessoa consiga repetir?
          </p>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-zinc-400">
            A MakerConnect nasceu para responder a essa pergunta. É uma rede social para makers que usa inteligência
            artificial para transformar ideias, fotos e anotações em documentação técnica de verdade: lista de materiais,
            pinagem e guia de montagem. Assim, o conhecimento não se perde e a comunidade cresce em cima do que já foi feito.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {VALUES.map((v) => (
              <span key={v} className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
                {v}
              </span>
            ))}
          </div>
          <Link
            href="/projects"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-4 text-sm font-bold text-black shadow-[0_0_24px_rgba(245,158,11,0.35)] transition-all hover:scale-105 hover:shadow-[0_0_32px_rgba(245,158,11,0.5)]"
          >
            Comece seu projeto
          </Link>
        </div>

        {/* Fontes e creditos */}
        <details className="group mt-10 rounded-2xl border border-white/8 bg-[#0d1424]/60 px-6 py-4 text-sm text-zinc-500">
          <summary className="cursor-pointer select-none font-semibold text-zinc-300 transition-colors hover:text-amber-400">
            Fontes e créditos das imagens
          </summary>
          <div className="mt-4 grid gap-8 md:grid-cols-2">
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400">Fontes</h4>
              <ul className="space-y-1.5">
                {[...MILESTONES.filter((m) => !m.source.url.startsWith('/')).map((m) => ({ label: `${m.year}: ${m.source.label}`, url: m.source.url })), ...EXTRA_SOURCES].map(
                  (s) => (
                    <li key={s.url}>
                      <a href={s.url} target="_blank" rel="noreferrer" className="underline decoration-zinc-700 underline-offset-2 hover:text-amber-400">
                        {s.label}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400">Imagens (Wikimedia Commons)</h4>
              <ul className="space-y-1.5">
                {IMAGE_CREDITS.map((c) => (
                  <li key={c.fileUrl}>
                    <a href={c.fileUrl} target="_blank" rel="noreferrer" className="underline decoration-zinc-700 underline-offset-2 hover:text-amber-400">
                      {c.what}
                    </a>
                    {', '}
                    {c.author},{' '}
                    <a href={c.licenseUrl} target="_blank" rel="noreferrer" className="underline decoration-zinc-700 underline-offset-2 hover:text-amber-400">
                      {c.license}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-zinc-600">Imagens redimensionadas e convertidas para WebP.</p>
            </div>
          </div>
        </details>
      </div>
    </section>
  );
}
