# Nodo — plano de controle e conversa

**Decisões:** o celular controla o robô por Wi-Fi, numa página servida pelo próprio ESP32-S3. A conversa é processada por um **servidor no notebook**, que transcreve a fala, gera a resposta com IA e devolve em voz. Tudo roda **sem internet** durante o evento.

---

## 1. Rede no evento

```
                 Hotspot do Windows "NodoNet"  (notebook = 192.168.137.1)
                 ┌──────────────────────────────────────────────┐
 Celular ──Wi-Fi─┤                                              │
  (página de     │   Notebook: servidor Nodo (porta 8765)       │
   controle)     │     voz→texto · IA · texto→voz               │
                 │                                              │
 Robô ESP32-S3 ──┤   página do robô: http://nodo.local          │
                 └──────────────────────────────────────────────┘
 Sem o notebook → o robô cria a própria rede "Nodo-MakerConnect" (só controle + falas prontas)
```

- **Hotspot do Windows:** Configurações → Rede e Internet → Hotspot móvel. Nome **NodoNet**, senha **makerconnect2026**, banda **2,4 GHz** (o ESP32-S3 não usa 5 GHz). O notebook vira o roteador, com IP fixo **192.168.137.1**.
- O robô tenta a NodoNet por 8 s ao ligar. Se não achar, cria a rede própria. **A tela mostra a rede e o endereço para abrir no celular.**
- O celular entra na NodoNet e abre `http://nodo.local`. Se o celular não resolver `.local`, use o IP mostrado na tela.

---

## 2. Etapas

| # | Etapa | Status |
|---|---|---|
| 1 | **Controle pelo celular**: joystick, modos manual/autônomo, gestos, rosto, telemetria, parada de segurança | ✅ firmware `firmware/nodo_s3` |
| 2 | **Alto-falante + falas prontas**: tocar WAV da memória flash com a boca sincronizada ao volume | próxima |
| 3 | **Microfone**: gravar e tocar de volta (teste de qualidade e ruído dos motores) | |
| 4 | **Servidor no notebook + conversa** "segurar para falar" | |
| 5 | Polimento: personalidade, respostas sobre a MakerConnect, falas automáticas no modo autônomo | |

---

## 3. Servidor de conversa (notebook)

### Componentes (todos locais, gratuitos e em português)

| Função | Ferramenta | Por quê |
|---|---|---|
| Voz → texto | **faster-whisper**, modelo `small` (ou `medium` se o notebook tiver GPU NVIDIA), `language="pt"` | roda offline; o `small` em CPU transcreve uma frase curta em ~1 s |
| Resposta | **Ollama** com modelo leve: `qwen2.5:3b` ou `llama3.2:3b` (CPU); `qwen2.5:7b` / `llama3.1:8b` com GPU | você já usa Ollama na MakerConnect; respostas curtas são rápidas |
| Texto → voz | **Piper**, voz `pt_BR-faber-medium` | voz brasileira offline, gera em fração de segundo |
| Comunicação | **Python + FastAPI + WebSocket** (porta 8765) | streaming de áudio nos dois sentidos |

### Estrutura proposta

```
nodo-robot/servidor/
├── nodo_server.py        # WebSocket: recebe áudio, chama STT → LLM → TTS, devolve áudio
├── persona.md            # quem é o Nodo, tom de voz, regras (respostas curtas!)
├── conhecimento/         # textos sobre a MakerConnect (opcional: RAG simples)
├── frases.yaml           # falas prontas da etapa 2
├── gerar_frases.py       # usa o Piper para gerar os WAV das falas prontas
├── teste_microfone.py    # testa o servidor usando o microfone do notebook
└── requirements.txt      # faster-whisper, fastapi, uvicorn, websockets, piper-tts, ollama, numpy
```

### Fluxo de uma conversa

```
Celular: aperta "Segurar p/ falar"  →  robô (comando T,1)
Robô:    rosto "Atento", antena azul, grava o microfone (16 kHz, 16 bits, mono)
         e envia blocos de 20 ms pelo WebSocket para ws://192.168.137.1:8765/robo
Celular: solta o botão  →  robô (T,0)  →  servidor {"tipo":"fim"}
Servidor: 1) corta o silêncio  2) Whisper → texto  3) Ollama com a persona + últimas 6 falas
          4) resposta curta + etiqueta de rosto, ex.: "[feliz] Oi! Eu sou o Nodo..."
          5) Piper → áudio 16 kHz, enviado em blocos assim que a 1ª frase fica pronta
Robô:    rosto da etiqueta + boca seguindo o volume, toca no MAX98357A
         mostra o texto reconhecido na página do celular (ajuda a depurar)
```

**Tempo de resposta esperado** (frase curta, notebook comum sem GPU): transcrição ~1 s, IA ~1–2 s, voz ~0,3 s. Dá **~2–3,5 s** após soltar o botão. Para encurtar, o servidor fala a primeira frase enquanto gera o resto.

### Personalidade (`persona.md`, rascunho)

- Nodo é o mascote da MakerConnect, a rede social dos makers. É curioso, animado e gosta de robótica, impressão 3D e eletrônica.
- Responde em **português do Brasil**, em **1 ou 2 frases curtas** (fala longa num robô cansa o público).
- Começa cada resposta com uma etiqueta de rosto: `[feliz] [ideia] [festa] [atento]`.
- Se não souber, diz que vai perguntar para a comunidade maker. Não inventa dados.
- Pode explicar a MakerConnect: documentação automática de projetos, arena de robôs com ranking ELO, comunidades.

### Protocolo robô ↔ servidor

| Direção | Mensagem | Conteúdo |
|---|---|---|
| robô → servidor | binário | áudio PCM 16 kHz, 16 bits, mono (640 bytes = 20 ms) |
| robô → servidor | `{"tipo":"fim"}` | terminou de falar |
| robô → servidor | `{"tipo":"frase","id":"ola"}` | pede uma fala pronta gerada na hora (opcional) |
| servidor → robô | `{"tipo":"ouvi","texto":"..."}` | o que o Whisper entendeu |
| servidor → robô | `{"tipo":"resposta","texto":"...","rosto":"feliz"}` | antes do áudio |
| servidor → robô | binário | áudio PCM 16 kHz da resposta |
| servidor → robô | `{"tipo":"fim_audio"}` | robô volta ao rosto normal |

### Se o servidor cair

O robô detecta que o WebSocket fechou ou que não houve resposta em 8 s. Então toca uma fala pronta da memória ("Ops, perdi a conexão com o meu cérebro!") e segue funcionando no controle e nas falas prontas.

---

## 4. Memória do robô

- **PSRAM de 8 MB** (precisa estar **ativada** na IDE: PSRAM → OPI PSRAM): buffer de até 15 s de gravação (480 KB) e de resposta.
- **Flash de 16 MB:** partição LittleFS de ~8 MB para as falas prontas. 40 frases de ~3 s a 16 kHz/16 bits dão ~4 MB.
- Na IDE: **Flash Size 16MB** e **Partition Scheme: 16M Flash (3MB APP/9.9MB FATFS)** ou equivalente com LittleFS.

---

## 5. Checklist do dia do evento

- [ ] Notebook na tomada, hotspot **NodoNet** ligado, servidor rodando (`python nodo_server.py`)
- [ ] Modelos já baixados **antes** (Whisper, Ollama, voz Piper): não dependa da internet do local
- [ ] Teste rápido: "Oi Nodo, o que é a MakerConnect?"
- [ ] Baterias carregadas (2S cheia = 8,4 V; a página mostra a tensão)
- [ ] Plano B: sem notebook, o robô funciona com a rede própria, falas prontas e modo autônomo
- [ ] Volume ajustado ao ambiente (barulho de evento pede GAIN 12 dB no MAX98357A)
- [ ] Microfone apontado para quem fala, longe do alto-falante (evita eco)

---

## 6. Referências

- Piper, voz pt_BR-faber-medium: https://huggingface.co/rhasspy/piper-voices/tree/main/pt/pt_BR/faber
- faster-whisper: https://github.com/SYSTRAN/faster-whisper
- Ollama: https://ollama.com
