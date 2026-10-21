import type { Metadata } from 'next';
import Link from 'next/link';
import { LEGAL_CONTACT_EMAIL, LegalPage, List, Section } from '@/components/legal-page';

export const metadata: Metadata = {
  title: 'Política de Privacidade | MakerConnect',
  description: 'Como a MakerConnect coleta, usa, guarda e protege os seus dados pessoais, conforme a LGPD.',
};

const mail = <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>;

export default function PrivacidadePage() {
  return (
    <LegalPage
      title="Política de Privacidade"
      intro={
        <p>
          Esta política explica quais dados pessoais a MakerConnect coleta, para que usa, com quem compartilha, por quanto
          tempo guarda e como você pode exercer seus direitos. Ela segue a Lei Geral de Proteção de Dados Pessoais (Lei
          nº 13.709/2018, a “LGPD”) e complementa os <Link href="/termos" className="text-amber-400 hover:text-amber-300">Termos de Uso</Link>.
        </p>
      }
    >
      <Section id="quem-somos" title="1. Quem é responsável pelos seus dados">
        <p>
          A MakerConnect é um projeto de Trabalho de Conclusão de Curso de Engenharia de Software da Universidade Católica
          de Santa Catarina (Jaraguá do Sul), desenvolvido por <strong>Vinicius Froes</strong> com participação e
          patrocínio da <strong>Master by Tech</strong>. Os dois atuam como <strong>controladores conjuntos</strong> dos
          dados pessoais tratados na plataforma.
        </p>
        <p>
          Para qualquer assunto de privacidade, inclusive falar com o encarregado pelo tratamento de dados, escreva para{' '}
          {mail}.
        </p>
      </Section>

      <Section id="dados" title="2. Quais dados coletamos">
        <List>
          <li>
            <strong>Cadastro:</strong> nome, e-mail, senha e idioma preferido. A senha nunca é guardada em texto: armazenamos
            apenas um resumo criptográfico (hash bcrypt).
          </li>
          <li>
            <strong>Login com Google ou GitHub:</strong> se você escolher essa opção, recebemos o identificador da conta, o
            nome e o e-mail. Não recebemos a sua senha desses serviços.
          </li>
          <li>
            <strong>Perfil (opcional):</strong> foto, biografia, cidade, site, perfil do GitHub, link de vídeo e áreas de
            interesse. O nível maker e a reputação são calculados pela própria plataforma.
          </li>
          <li>
            <strong>Conteúdo que você publica:</strong> projetos, descrições, imagens, arquivos 3D, código, lista de
            materiais, dificuldades, comentários, votos, compartilhamentos, equipes, comunidades, robôs e competições.
          </li>
          <li>
            <strong>Dados técnicos:</strong> um cookie de sessão (veja a seção 8) e registros de acesso, como endereço IP,
            data e hora.
          </li>
        </List>
        <p>Não pedimos CPF, endereço, telefone nem dados bancários. A plataforma é gratuita.</p>
      </Section>

      <Section id="finalidades" title="3. Para que usamos os dados e com qual base legal">
        <List>
          <li>
            <strong>Criar e manter sua conta e oferecer as funções da rede</strong> (perfil, projetos, equipes, comunidades,
            ranking): execução do contrato com você (LGPD, art. 7º, V).
          </li>
          <li>
            <strong>Gerar documentação técnica com inteligência artificial</strong> (lista de materiais, requisitos, etapas
            de montagem, PDF) quando você pede: execução do contrato (art. 7º, V).
          </li>
          <li>
            <strong>Busca e recomendação de projetos:</strong> legítimo interesse em tornar o conteúdo da comunidade
            encontrável (art. 7º, IX).
          </li>
          <li>
            <strong>Segurança, prevenção de abusos e guarda de registros de acesso:</strong> legítimo interesse e cumprimento
            de obrigação legal, inclusive o Marco Civil da Internet (art. 7º, II e IX).
          </li>
          <li>
            <strong>Pesquisa acadêmica do TCC:</strong> usamos apenas métricas agregadas ou anonimizadas, que não identificam
            você.
          </li>
        </List>
        <p>
          <strong>Não vendemos dados pessoais</strong> e não usamos seus dados para publicidade.
        </p>
      </Section>

      <Section id="ia" title="4. Inteligência artificial">
        <List>
          <li>
            Os modelos de IA que geram a documentação rodam na <strong>nossa própria infraestrutura</strong>. O texto dos
            seus projetos não é enviado a empresas de IA.
          </li>
          <li>
            Antes de qualquer processamento por IA, a plataforma <strong>remove automaticamente e-mails, telefones e números
            de CPF</strong> encontrados no texto e registra que a remoção aconteceu.
          </li>
          <li>
            Para a busca, geramos representações numéricas (“embeddings”) de textos técnicos e as consultamos num serviço de
            busca vetorial (veja a seção 5).
          </li>
          <li>
            O que a IA gera é uma sugestão e pode conter erros. Revise antes de usar ou publicar.
          </li>
        </List>
      </Section>

      <Section id="compartilhamento" title="5. Com quem compartilhamos">
        <List>
          <li>
            <strong>Outros usuários:</strong> seu nome, perfil e os projetos marcados como públicos ficam visíveis para quem
            usa a plataforma. Projetos “privados” só aparecem para você, e projetos “da equipe”, só para os membros
            aprovados.
          </li>
          <li>
            <strong>Fornecedores que operam a plataforma para nós</strong> (operadores), apenas no necessário:
            <List>
              <li>Hostinger: hospedagem do servidor, do banco de dados e dos arquivos enviados;</li>
              <li>Pinecone: busca vetorial usada na pesquisa de projetos e na base técnica da IA;</li>
              <li>Google e GitHub: somente se você usar o login com esses serviços.</li>
            </List>
          </li>
          <li>
            <strong>Autoridades:</strong> quando houver obrigação legal ou ordem judicial.
          </li>
        </List>
      </Section>

      <Section id="transferencia" title="6. Transferência internacional">
        <p>
          Parte da infraestrutura fica fora do Brasil, incluindo servidores nos Estados Unidos. Essas transferências seguem
          o art. 33 da LGPD e são feitas apenas para fornecedores que oferecem garantias de proteção de dados compatíveis
          com a lei brasileira.
        </p>
      </Section>

      <Section id="retencao" title="7. Por quanto tempo guardamos">
        <List>
          <li>Dados da conta e conteúdo: enquanto a sua conta existir.</li>
          <li>
            Depois que você pede a exclusão da conta, apagamos ou anonimizamos seus dados em até 30 dias, exceto o que a lei
            nos obriga a guardar.
          </li>
          <li>Registros de acesso (IP, data e hora): 6 meses, conforme o art. 15 do Marco Civil da Internet.</li>
          <li>
            Cópias de projetos públicos que outros usuários já fizeram (forks) passam a pertencer à conta de quem fez a
            cópia, como explicado nos <Link href="/termos#conteudo">Termos de Uso</Link>.
          </li>
        </List>
      </Section>

      <Section id="cookies" title="8. Cookies">
        <p>
          Usamos <strong>um único cookie, essencial</strong>: o <code className="text-zinc-300">mc_session</code>, que mantém
          você conectado por até 7 dias. Não usamos cookies de análise, de publicidade nem de rastreamento entre sites.
        </p>
      </Section>

      <Section id="seguranca" title="9. Segurança">
        <p>
          Adotamos medidas técnicas e administrativas para proteger seus dados: conexão criptografada (HTTPS), senhas
          guardadas apenas como hash, acesso restrito ao servidor e ao banco de dados, e registro das remoções de dados
          pessoais feitas antes do uso de IA. Nenhum sistema é totalmente imune a falhas; se ocorrer um incidente de
          segurança que possa trazer risco relevante a você, avisaremos você e a Autoridade Nacional de Proteção de Dados
          (ANPD), como determina a LGPD.
        </p>
      </Section>

      <Section id="direitos" title="10. Seus direitos">
        <p>Pela LGPD (art. 18), você pode pedir a qualquer momento:</p>
        <List>
          <li>confirmação de que tratamos seus dados e acesso a eles;</li>
          <li>correção de dados incompletos, inexatos ou desatualizados;</li>
          <li>anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desacordo com a lei;</li>
          <li>portabilidade dos seus dados;</li>
          <li>eliminação dos seus dados e exclusão da conta;</li>
          <li>informação sobre com quem compartilhamos seus dados;</li>
          <li>revisão de decisões tomadas unicamente por meio automatizado;</li>
          <li>oposição a tratamentos feitos com base no legítimo interesse.</li>
        </List>
        <p>
          Boa parte dos dados do perfil e dos projetos você mesmo pode editar na plataforma. Para os demais pedidos,
          inclusive a exclusão da conta, escreva para {mail} a partir do e-mail cadastrado. Respondemos em até 15 dias. Se
          não ficar satisfeito, você pode reclamar à{' '}
          <a href="https://www.gov.br/anpd" target="_blank" rel="noreferrer">
            ANPD
          </a>
          .
        </p>
      </Section>

      <Section id="menores" title="11. Crianças e adolescentes">
        <p>
          A MakerConnect pode ser usada por estudantes de todas as idades, inclusive em equipes de robótica escolar, sempre
          no melhor interesse da criança e do adolescente (LGPD, art. 14):
        </p>
        <List>
          <li>
            <strong>Crianças (até 12 anos incompletos)</strong> só podem ter conta com o consentimento específico de pelo
            menos um dos pais ou do responsável legal, que deve acompanhar o cadastro.
          </li>
          <li>
            <strong>Adolescentes (12 a 17 anos)</strong> devem usar a plataforma com a autorização dos pais ou responsáveis.
          </li>
          <li>
            Recomendamos que perfis de menores não exibam foto, nome completo ou cidade. Professores e técnicos de equipe não
            devem publicar dados ou imagens de alunos sem a autorização dos responsáveis.
          </li>
          <li>
            Se soubermos de uma conta de criança criada sem esse consentimento, ela será suspensa e os dados, apagados. Pais
            e responsáveis podem pedir acesso ou exclusão pelo e-mail {mail}.
          </li>
        </List>
      </Section>

      <Section id="alteracoes" title="12. Alterações desta política">
        <p>
          Podemos atualizar esta política para refletir mudanças na plataforma ou na lei. A data no topo indica a versão em
          vigor, e mudanças relevantes serão avisadas na própria plataforma.
        </p>
      </Section>
    </LegalPage>
  );
}
