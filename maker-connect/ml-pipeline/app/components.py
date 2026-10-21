"""Normalizador de componentes maker (nome canonico <- apelidos EN/PT).

As BOMs reais chegam em portugues e texto livre ("Valvula solenoide 12V", "Diodo 1N4007"),
enquanto as regras externas (estagio 2) foram mineradas de artigos em ingles. Este modulo
leva os dois para o mesmo nome canonico, para que as regras possam ser comparadas.
O texto e normalizado (minusculas, sem acento) antes do match, entao os apelidos PT
sao escritos sem acento.
"""
import re
import unicodedata

# nome canonico -> (nome exibido em PT, regex de apelidos)
COMPONENTS: dict[str, tuple[str, str]] = {
    "esp32": ("ESP32", r"\besp[- ]?32\b|\bnodemcu[- ]?32"),
    "esp8266": ("ESP8266", r"\besp[- ]?8266\b|\bnodemcu\b(?![- ]?32)|\bwemos d1\b|\besp-01\b"),
    "arduino uno": ("Arduino Uno", r"\barduino uno\b"),
    "arduino nano": ("Arduino Nano", r"\barduino nano\b"),
    "arduino pro mini": ("Arduino Pro Mini", r"\bpro mini\b"),
    "arduino mega": ("Arduino Mega", r"\barduino mega\b"),
    "raspberry pi pico": ("Raspberry Pi Pico", r"\bpi pico\b|\brp2040\b"),
    "raspberry pi": ("Raspberry Pi", r"\braspberry pi\b(?! pico)"),
    "attiny": ("ATtiny", r"\battiny\d*\b"),
    "stm32": ("STM32", r"\bstm32\w*\b"),
    "teensy": ("Teensy", r"\bteensy\b"),
    "servo": ("servo motor", r"\bservos?\b|\bservomotor(?:es)?\b|\bsg90\b|\bmg996r?\b"),
    "stepper motor": ("motor de passo", r"\bstepper(?: motor)?s?\b|\bnema ?17\b|\bmotor(?:es)? de passo\b"),
    "dc motor": ("motor DC", r"\bdc motors?\b|\bgear ?motors?\b|\bn20\b|\bmotor(?:es)? (?:dc|cc)\b|\bmotorredutor(?:es)?\b"),
    "brushless motor": ("motor brushless", r"\bbrushless\b|\bbldc\b|\bmotor(?:es)? sem escovas\b"),
    "motor driver": (
        "driver de motor (ponte H)",
        r"\bmotor drivers?\b|\bh[- ]bridge\b|\bponte h\b|\bdriver de motor\b|\bl298n?\b|\btb6612\w*\b|\bdrv8833\b|\ba4988\b|\btmc2209\b",
    ),
    "esc": ("ESC (controlador de velocidade)", r"\bescs?\b|\belectronic speed control|\bcontrolador(?:es)? de velocidade\b"),
    "relay": ("rele", r"\brelays?\b|\brele(?:s)?\b"),
    "mosfet": ("MOSFET", r"\bmosfets?\b"),
    "flyback diode": ("diodo de protecao (flyback)", r"\bflyback diode\b|\bdiodo(?:s)? (?:de )?(?:protecao|roda livre|flyback)\b|\b1n400[1-7]\b"),
    "transistor": ("transistor", r"\btransistor(?:s|es)?\b|\b2n2222\b|\b2n3904\b|\bbc548\b"),
    "voltage regulator": (
        "regulador de tensao",
        r"\bvoltage regulators?\b|\bregulador(?:es)? de tensao\b|\blm2596\b|\bams1117\b|\blm7805\b|\b7805\b|\bbuck(?: converter)?\b|\bboost converter\b|\bstep[- ]?(?:down|up)\b|\bconversor(?:es)? (?:buck|boost|dc[- ]dc)\b|\bfonte(?:s)?(?: de alimentacao)?\b|\bhlk-pm\d+\b",
    ),
    "lipo battery": ("bateria LiPo", r"\blipo\b|\bli-po\b|\blithium polymer\b|\bpolimero de litio\b"),
    "18650 battery": ("bateria 18650", r"\b18650s?\b"),
    "battery charger": ("carregador de bateria", r"\btp4056\b|\bcharging (?:board|module|circuit)\b|\b(?:modulo |circuito )?carregador(?:es)?\b"),
    "solar panel": ("painel solar", r"\bsolar (?:panel|cell)s?\b|\bpain(?:el|eis) solar(?:es)?\b|\bcelula(?:s)? solar(?:es)?\b"),
    "oled display": ("display OLED", r"\boled\b|\bssd1306\b"),
    "lcd display": ("display LCD", r"\blcd\b|\b16x2\b|\bhd44780\b"),
    "e-paper display": ("display e-paper", r"\be-?paper\b|\be-?ink\b"),
    "tft display": ("display TFT", r"\btft\b|\bili9341\b|\bst7789\b"),
    "led strip": ("fita de LED enderecavel", r"\bws2812b?\b|\bneopixels?\b|\bled strips?\b|\bapa102\b|\bfita(?:s)? de led\b"),
    "led matrix": ("matriz de LED", r"\bled matrix\b|\bmax7219\b|\bmatriz de led\b"),
    "temperature sensor": (
        "sensor de temperatura",
        r"\bds18b20\b|\bdht ?(?:11|22)\b|\bthermistor\b|\btermistor\b|\bthermocouple\b|\btermopar\b|\bbme280\b|\bbmp280\b|\bsensor(?:es)? de temperatura\b",
    ),
    "imu": ("IMU (acelerometro/giroscopio)", r"\bimu\b|\bmpu[- ]?6050\b|\baccelerometer\b|\bacelerometro\b|\bgyroscope\b|\bgiroscopio\b|\bbno055\b"),
    "ultrasonic sensor": ("sensor ultrassonico", r"\bultrasonic (?:sensor|rangefinder)s?\b|\bhc-sr04\b|\bultrassonico\b"),
    "lidar / tof sensor": ("sensor LiDAR / ToF", r"\blidar\b|\bvl53l0x\b|\btime[- ]of[- ]flight\b"),
    "pir sensor": ("sensor PIR", r"\bpir\b"),
    "ir sensor": ("sensor infravermelho", r"\binfrared sensors?\b|\bir sensors?\b|\bqtr\b|\bsensor(?:es)? (?:infravermelho|ir)\b"),
    "hall sensor": ("sensor de efeito Hall", r"\bhall (?:effect )?sensors?\b|\bsensor(?:es)? (?:de efeito )?hall\b"),
    "current sensor": ("sensor de corrente", r"\bcurrent sensors?\b|\bina219\b|\bacs712\b|\bpzem\b|\bsensor(?:es)? de corrente\b|\bsct-?013\b"),
    "load cell": ("celula de carga", r"\bload cells?\b|\bhx711\b|\bcelula(?:s)? de carga\b"),
    "soil moisture sensor": ("sensor de umidade do solo", r"\bsoil moisture\b|\bumidade (?:do )?solo\b"),
    "air quality sensor": ("sensor de qualidade do ar", r"\bpms5003\b|\bsds011\b|\bparticulate\b|\bco2 sensor\b|\bscd30\b|\bccs811\b|\bmaterial particulado\b"),
    "gps module": ("modulo GPS", r"\bgps (?:module|receiver)\b|\bneo-6m\b|\bmodulo gps\b"),
    "camera module": ("modulo de camera", r"\bcamera modules?\b|\besp32-cam\b|\bov2640\b|\bmodulo de camera\b"),
    "microphone": ("microfone", r"\bmicrophones?\b|\bmems mic\b|\bmicrofone(?:s)?\b"),
    "speaker": ("alto-falante", r"\bspeakers?\b|\balto-?falante(?:s)?\b"),
    "amplifier": ("amplificador", r"\bamplifiers?\b|\bamplificador(?:es)?\b|\bpam8403\b|\bmax98357\b"),
    "buzzer": ("buzzer", r"\bbuzzers?\b|\bpiezo\b"),
    "rotary encoder": ("encoder rotativo", r"\brotary encoders?\b|\bencoder(?:es)? rotativo"),
    "potentiometer": ("potenciometro", r"\bpotentiometers?\b|\bpots?\b|\bpotenciometro(?:s)?\b"),
    "push button": ("botao", r"\bpush ?buttons?\b|\btactile switch\b|\bbotao\b|\bbotoes\b|\bpush ?button\b"),
    "bluetooth module": ("modulo Bluetooth", r"\bhc-0[56]\b|\bbluetooth module\b|\bmodulo bluetooth\b|\bble\b"),
    "lora module": ("modulo LoRa", r"\blora(?:wan)?\b|\bsx127\d\b|\brfm9[05]\b"),
    "nrf24": ("radio nRF24", r"\bnrf24l01\b|\bnrf24\b"),
    "rtc module": ("RTC (relogio de tempo real)", r"\brtc\b|\bds3231\b|\bds1307\b"),
    "sd card": ("cartao SD", r"\bsd card\b|\bmicro ?sd\b|\bcartao (?:micro ?)?sd\b"),
    "pcb": ("placa de circuito (PCB)", r"\bpcbs?\b|\bprinted circuit board\b|\bplaca de circuito\b"),
    "breadboard": ("protoboard", r"\bbreadboard\b|\bprotoboard\b"),
    "pla filament": ("filamento PLA", r"\bpla\+?(?!\w)"),
    "petg filament": ("filamento PETG", r"\bpetg\b"),
    "tpu filament": ("filamento TPU", r"\btpu\b"),
    "resin": ("resina", r"\bresin\b|\bresina\b"),
    "heat-set insert": ("inserto roscado", r"\bheat[- ]set inserts?\b|\bthreaded inserts?\b|\binserto(?:s)?(?: roscado(?:s)?)?\b"),
    "bearing": ("rolamento", r"\bbearings?\b|\b608zz?\b|\brolamento(?:s)?\b"),
    "linear rail": (
        "guia linear",
        r"\blinear rails?\b|\blinear bearings?\b|\bv-slot\b|\b2020 extrusion\b|\baluminum extrusion\b|\bguia(?:s)? linear(?:es)?\b|\btrilho(?:s)? linear(?:es)?\b|\bperfil de aluminio\b",
    ),
    "lead screw": ("fuso", r"\blead ?screws?\b|\bthreaded rod\b|\bfuso(?:s)?\b|\bbarra roscada\b"),
    "timing belt": ("correia GT2", r"\bgt2\b|\btiming belts?\b|\bcorreia(?:s)?(?: dentada)?\b"),
    "plywood": ("compensado", r"\bplywood\b|\bcompensado\b"),
    "mdf": ("MDF", r"\bmdf\b"),
    "dowel": ("cavilha", r"\bdowels?\b|\bcavilha(?:s)?\b"),
    "wood glue": ("cola de madeira", r"\bwood glue\b|\bcola (?:de|para) madeira\b|\bcola pva\b"),
    "magnet": ("ima", r"\bmagnets?\b|\bneodymium\b|\bima(?:s)? de neodimio\b|\bima(?:s)?\b"),
}

_COMPILED = {name: re.compile(rx) for name, (_, rx) in COMPONENTS.items()}


def normalize_text(text: str) -> str:
    decomposed = unicodedata.normalize("NFKD", text or "")
    return "".join(c for c in decomposed if not unicodedata.combining(c)).lower()


def components_in(text: str) -> set[str]:
    """Nomes canonicos citados em um texto livre (titulo, descricao, artigo)."""
    norm = normalize_text(text)
    return {name for name, rx in _COMPILED.items() if rx.search(norm)}


def canonical_items(items: list[str]) -> set[str]:
    """Nomes canonicos presentes em uma BOM (lista de itens em texto livre)."""
    found: set[str] = set()
    for item in items:
        found |= components_in(item)
    return found


def display_name(canonical: str) -> str:
    return COMPONENTS[canonical][0] if canonical in COMPONENTS else canonical
