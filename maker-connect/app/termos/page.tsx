import type { Metadata } from 'next';
import Link from 'next/link';
import { LEGAL_CONTACT_EMAIL, LegalPage, List, Section } from '@/components/legal-page';

export const metadata: Metadata = {
  title: 'Termos de Uso | MakerConnect',
  description: 'Regras de uso da MakerConnect, a rede social dos makers.',
};

const mail = <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>;

export default function TermosPage() {
  return (
    <LegalPage
      title="Termos de Uso"
      intro={
        <p>
          Estes termos são as regras para usar a MakerConnect. Ao criar uma conta ou usar a plataforma, você concorda com
          eles e com a <Link href="/privacidade" className="text-amber-400 hover:text-amber-300">Política de Privacidade</Link>.
          Se não concordar, não use o serviço.
        </p>
      }
    >
      <Section id="servico" title="1. O que é a MakerConnect">
        <p>
          A MakerConnect é uma rede social gratuita para makers: um lugar para publicar projetos de eletrônica, robótica,
          impressão 3D e marcenaria, montar equipes, participar de comunidades e gerar documentação técnica com ajuda de
          inteligência artificial.
        </p>
        <p>
          A plataforma é um projeto de Trabalho de Conclusão de Curso de Engenharia de Software da Universidade Católica de
          Santa Catarina, desenvolvido por <strong>Vinicius Froes</strong> com participação e patrocínio da{' '}
          <strong>Master by Tech</strong>, que juntos são responsáveis pelo serviço. Por ser um projeto em desenvolvimento,
          funções podem mudar, ficar indisponíveis ou ser descontinuadas.
        </p>
      </Section>

      <Section id="conta" title="2. Sua conta">
        <List>
          <li>Informe dados verdadeiros e mantenha-os atualizados.</li>
          <li>
            Você é responsável pelo que acontece na sua conta. Guarde sua senha e avise-nos pelo e-mail {mail} se suspeitar
            de uso indevido.
          </li>
          <li>Cada conta é pessoal. Não crie contas em nome de outra pessoa sem autorização.</li>
          <li>
            Menores de 18 anos precisam da autorização dos pais ou responsáveis, e crianças de até 12 anos incompletos, do
            consentimento específico de um deles, como explicado na{' '}
            <Link href="/privacidade#menores">Política de Privacidade</Link>.
          </li>
        </List>
      </Section>

      <Section id="conteudo" title="3. Seu conteúdo">
        <p>
          <strong>O que você publica continua sendo seu.</strong> Para que a plataforma funcione, você nos concede uma
          licença gratuita, não exclusiva e válida em todo o mundo para hospedar, armazenar, reproduzir, exibir e adaptar
          esse conteúdo dentro da MakerConnect, inclusive para:
        </p>
        <List>
          <li>mostrá-lo a outros usuários, conforme a visibilidade que você escolher (público, privado ou equipe);</li>
          <li>processá-lo com inteligência artificial para gerar documentação, listas de materiais e sugestões;</li>
          <li>gerar o PDF do dossiê técnico do projeto.</li>
        </List>
        <p>
          <strong>Forks:</strong> outros usuários podem fazer um fork (uma cópia) dos seus projetos públicos para adaptá-los.
          O fork fica na conta de quem o fez e mantém um vínculo com o projeto original, dando crédito a você. Se depois você
          apagar o seu projeto, os forks já feitos continuam existindo.
        </p>
        <p>
          A licença termina quando você remove o conteúdo ou a conta, exceto pelos forks já feitos e por cópias de segurança
          mantidas pelo tempo necessário.
        </p>
      </Section>

      <Section id="terceiros" title="4. Direitos de terceiros">
        <p>
          Só publique o que você tem direito de compartilhar. Ao usar código, modelos 3D, esquemáticos, imagens ou textos de
          outras pessoas, respeite a licença original (por exemplo Creative Commons, GPL ou MIT) e dê o crédito exigido. Não
          publique dados pessoais ou imagens de outras pessoas sem autorização.
        </p>
        <p>
          Se você acredita que algum conteúdo viola seus direitos, escreva para {mail} indicando o conteúdo e o motivo.
        </p>
      </Section>

      <Section id="proibido" title="5. O que não é permitido">
        <List>
          <li>conteúdo ilegal, ofensivo, discriminatório, violento, sexual ou que incentive ódio ou assédio;</li>
          <li>instruções para fabricar armas, explosivos ou dispositivos feitos para causar dano ou burlar a lei;</li>
          <li>spam, golpes, propaganda enganosa ou se passar por outra pessoa ou organização;</li>
          <li>vírus, malware ou qualquer tentativa de invadir, sobrecarregar ou burlar a segurança da plataforma;</li>
          <li>coleta automatizada em massa de dados ou de conteúdo de outros usuários (scraping);</li>
          <li>manipular votos, ranking ou reputação, por exemplo com contas falsas.</li>
        </List>
      </Section>

      <Section id="seguranca" title="6. Segurança nos projetos e conteúdo gerado por IA">
        <p>
          Projetos maker podem envolver eletricidade, inclusive tensão de rede (127/220 V), baterias de lítio, ferramentas de
          corte, calor e peças em movimento. <strong>Você é responsável por executar seus projetos com segurança</strong>,
          seguindo normas técnicas, manuais dos fabricantes e, quando necessário, a orientação de um profissional habilitado,
          como em instalações elétricas.
        </p>
        <p>
          A documentação, as listas de materiais e as sugestões geradas pela IA, assim como os projetos de outros usuários,
          são pontos de partida e podem conter erros ou omissões. Revise tudo antes de montar, comprar componentes ou ligar
          um circuito.
        </p>
      </Section>

      <Section id="moderacao" title="7. Moderação">
        <p>
          Podemos remover conteúdo ou suspender contas que violem estes termos ou a lei, de preferência avisando o motivo.
          Para denunciar algo, escreva para {mail}.
        </p>
      </Section>

      <Section id="plataforma" title="8. Propriedade da plataforma">
        <p>
          A marca MakerConnect, o logotipo e a interface da plataforma pertencem aos responsáveis pelo serviço. Estes termos
          não dão a você nenhum direito sobre eles além do uso normal da plataforma.
        </p>
      </Section>

      <Section id="responsabilidade" title="9. Responsabilidade">
        <p>
          Oferecemos a plataforma gratuitamente e no estado em que se encontra, como projeto acadêmico em desenvolvimento.
          Trabalhamos para mantê-la disponível e segura, mas não garantimos funcionamento ininterrupto nem livre de erros.
          Nos limites da legislação aplicável, inclusive o Código de Defesa do Consumidor, não respondemos por danos causados
          pela execução de projetos publicados por usuários ou sugeridos pela IA, nem pelo conteúdo que os usuários publicam.
        </p>
      </Section>

      <Section id="encerramento" title="10. Encerramento">
        <p>
          Você pode encerrar sua conta quando quiser, pedindo a exclusão pelo e-mail {mail}. Antes, você pode exportar o PDF
          dos seus projetos. Se decidirmos encerrar a plataforma, avisaremos com antecedência razoável para que você possa
          salvar seu conteúdo.
        </p>
      </Section>

      <Section id="alteracoes" title="11. Alterações destes termos">
        <p>
          Podemos atualizar estes termos. A data no topo indica a versão em vigor, e mudanças relevantes serão avisadas na
          plataforma. Continuar usando o serviço depois do aviso significa aceitar a nova versão.
        </p>
      </Section>

      <Section id="lei" title="12. Lei aplicável e foro">
        <p>
          Estes termos seguem as leis do Brasil. Eventuais disputas serão resolvidas no foro do domicílio do usuário.
        </p>
      </Section>
    </LegalPage>
  );
}
