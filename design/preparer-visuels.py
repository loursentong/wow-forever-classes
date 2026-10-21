#!/usr/bin/env python3
"""Régénère les images web de assets/img à partir des originaux du kit de presse de WoW Forever.

Usage : python3 design/preparer-visuels.py DOSSIER_DES_ORIGINAUX [DOSSIER_DE_SORTIE]

  Originaux : https://blizzard.gamespress.com/fr/wowforeverreveal
  Sortie par défaut : assets/img du dépôt
  Dépendance : Pillow (pip install Pillow)

Les icônes ne passent pas par ce script : elles sont reprises telles quelles du
serveur d'icônes de Blizzard (voir assets/README.md). img/grain.png est une
création du projet.
"""
import sys
from pathlib import Path

from PIL import Image

QUALITE_WEBP = 78  # suffisant pour ces plans sombres et doux, sans artefact visible

# Les plans ont déjà le format voulu : on réduit sans recadrer.
PLANS = [
    ("WoW_Forever_Cinematic_Still_5.jpeg", "hero-arbre-monde.webp", (2400, 1000)),
    ("WoW_Forever_Cinematic_Still_2.jpeg", "hero-vallee-nuit.webp", (2400, 1000)),
    ("WoW_Forever_Cinematic_Still_11.jpeg", "bandeau-gantelet.webp", (1920, 800)),
    ("WoW_Forever_Announce_BG_DarkspearIslands_090.jpg", "bandeau-darkspear.webp", (1920, 1080)),
]
LOGO = ("WoW_Forever_Logo.png", "logo-wow-forever.webp", 520)


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    source = Path(sys.argv[1])
    sortie = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(__file__).resolve().parents[1] / "assets" / "img"
    sortie.mkdir(parents=True, exist_ok=True)

    for original, nom, (largeur, hauteur) in PLANS:
        image = Image.open(source / original).convert("RGB")
        if abs(image.width / image.height - largeur / hauteur) > 0.01:
            sys.exit(f"{original} : format {image.width} × {image.height} inattendu, un recadrage serait nécessaire")
        image.resize((largeur, hauteur), Image.Resampling.LANCZOS).save(
            sortie / nom, "WEBP", quality=QUALITE_WEBP, method=6)
        print(f"{nom} : {largeur} × {hauteur}")

    original, nom, largeur = LOGO
    logo = Image.open(source / original).convert("RGBA")
    logo = logo.crop(logo.getchannel("A").getbbox())  # retire les marges transparentes
    hauteur = round(largeur * logo.height / logo.width)
    logo.resize((largeur, hauteur), Image.Resampling.LANCZOS).save(
        sortie / nom, "WEBP", quality=88, method=6)
    print(f"{nom} : {largeur} × {hauteur}")


if __name__ == "__main__":
    main()
