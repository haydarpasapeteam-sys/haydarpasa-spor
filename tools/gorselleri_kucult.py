"""Sitedeki büyük görsellerin hafif WebP kopyalarını üretir.

Kullanım:  python3 tools/gorselleri_kucult.py
- Duyuru afişleri (duyurular.json'daki 'resim' alanları) için:
    kucuk/<yol>.webp  -> kart görseli (600 px genişlik)
    buyuk/<yol>.webp  -> büyütülmüş görünüm (en fazla 1600 px)
- Sayfa görselleri (SAYFA_GORSELLERI) için: buyuk/<ad>.webp
Orijinal dosyalara dokunulmaz. Kopyası olmayan görselde site otomatik olarak orijinali gösterir.
"""
import json, os
from PIL import Image, ImageOps

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAYFA_GORSELLERI = ["anasayfa.png", "vizyonumuz.png", "degerlerimiz.png",
                    "hareket_bilimi.png", "brans_rehberimiz.png",
                    "haydarpasabedenegitimivespor.png"]

def webp_yolu(klasor, yol):
    return os.path.join(KOK, klasor, os.path.splitext(yol)[0] + ".webp")

def kaydet(kaynak, hedef, max_gen=None, max_yuk=None, kalite=80):
    im = Image.open(kaynak)
    im = ImageOps.exif_transpose(im).convert("RGB")
    w, h = im.size
    oran = 1.0
    if max_gen: oran = min(oran, max_gen / w)
    if max_yuk: oran = min(oran, max_yuk / h)
    if oran < 1:
        im = im.resize((round(w * oran), round(h * oran)), Image.LANCZOS)
    os.makedirs(os.path.dirname(hedef), exist_ok=True)
    im.save(hedef, "WEBP", quality=kalite, method=6)
    print(f"{os.path.relpath(hedef, KOK)}  {im.size}  {os.path.getsize(hedef)//1024} KB")

def main():
    with open(os.path.join(KOK, "duyurular.json"), encoding="utf-8") as f:
        liste = json.load(f).get("liste", [])
    for d in liste:
        r = d.get("resim")
        if not r or not os.path.exists(os.path.join(KOK, r)):
            continue
        src = os.path.join(KOK, r)
        kaydet(src, webp_yolu("kucuk", r), max_gen=600, kalite=78)
        kaydet(src, webp_yolu("buyuk", r), max_gen=1600, max_yuk=1600, kalite=82)
    for r in SAYFA_GORSELLERI:
        src = os.path.join(KOK, r)
        if os.path.exists(src):
            kaydet(src, webp_yolu("buyuk", r), max_gen=1366, kalite=82)

if __name__ == "__main__":
    main()
