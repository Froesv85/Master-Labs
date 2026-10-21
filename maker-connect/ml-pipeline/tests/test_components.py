from app.components import canonical_items, components_in, display_name


def test_portuguese_bom_items_map_to_canonical_names():
    bom = ["Válvula solenoide 12V", "Módulo relé 5V", "Diodo 1N4007", "Motor de passo NEMA17", "Ponte H TB6612FNG"]
    assert canonical_items(bom) == {"relay", "flyback diode", "stepper motor", "motor driver"}


def test_english_and_portuguese_aliases_agree():
    assert components_in("brushless motor with a 30A ESC") == components_in("motor brushless com ESC 30A")


def test_placa_is_not_pla_filament():
    # "placa" (PT) nao pode virar filamento PLA
    assert "pla filament" not in components_in("Placa ESP32 DevKit")
    assert "pla filament" in components_in("Filamento PLA+ 1kg")


def test_nodemcu32_is_esp32_not_esp8266():
    assert components_in("NodeMCU-32S") == {"esp32"}


def test_display_name_falls_back_to_canonical():
    assert display_name("esc") == "ESC (controlador de velocidade)"
    assert display_name("desconhecido") == "desconhecido"
