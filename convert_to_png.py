import os
from pathlib import Path
import subprocess

svg_dir = "assets/logos"
logos = ["node-connect", "circuit-community"]
variants = ["base", "horizontal", "square", "favicon", "monochrome", "dark-bg"]

os.chdir(svg_dir)

for logo in logos:
    logo_dir = logo
    if not os.path.exists(logo_dir):
        continue
    
    for variant in variants:
        svg_file = f"{logo_dir}/{variant}.svg"
        
        if not os.path.exists(svg_file):
            continue
        
        # Determinar tamanho output baseado no tipo
        if variant == "favicon":
            size = "512x512"  # Favicon em alta resolução
        elif variant == "horizontal":
            size = "1920x640"  # Horizontal
        else:
            size = "1024x1024"  # Square/base
        
        png_file = f"{logo_dir}/{variant}.png"
        
        # Usar inkscape ou rsvg-convert para converter
        try:
            cmd = f"rsvg-convert -w {size.split('x')[0]} -h {size.split('x')[1]} {svg_file} -o {png_file}"
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            
            if result.returncode == 0:
                print(f"✓ {logo}/{variant}.png criado")
            else:
                print(f"✗ Erro ao criar {logo}/{variant}.png")
        except Exception as e:
            print(f"✗ Erro: {e}")

print("\n✓ Todas as conversões PNG completadas!")
