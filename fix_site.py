import os, re, subprocess

folder = os.path.expanduser("~/Desktop/haydarpasa-spor")
os.chdir(folder)

# Temiz standart isim haritası
name_map = {
    "ana_sayfa": "ana_sayfa.png",
    "basari": "basarilarimiz.png",
    "brans": "brans_rehberimiz.png",
    "degerler": "degerlerimiz_ve_hedeflerimiz.png",
    "duyuru": "duyurular.png",
    "fikst": "fiksturler.png",
    "hareket": "hareket_bilimi_ve_saglikli_yasam.png",
    "ileti": "iletisim.png",
    "okul": "okul_ici_spor_faaliyetleri.png",
    "faaliyet": "okul_ici_spor_faaliyetleri.png",
    "sporfest": "sporfest.png",
    "takim": "takimlarimiz.png",
    "vizyon": "vizyonumuz.png"
}

# 1. Dosyaları standart isimlere kopyala/yeniden adlandır
for fname in os.listdir("."):
    low = fname.lower()
    if low.endswith(".png"):
        for key, target in name_map.items():
            if key in low:
                # -2 veya yedekli dosyalarda günceli koru
                with open(fname, 'rb') as f_src:
                    data = f_src.read()
                with open(target, 'wb') as f_dst:
                    f_dst.write(data)

# 2. index.html içindeki tüm resim yollarını güncelle
if os.path.exists("index.html"):
    with open("index.html", "r", encoding="utf-8", errors="ignore") as f:
        html = f.read()

    html = re.sub(r'src=["\'][^"\']*Ana[^"\']*\.png["\']', 'src="ana_sayfa.png"', html, flags=re.IGNORECASE)
    html = re.sub(r'src=["\'][^"\']*Ba[sş]ar[ıi][^"\']*\.png["\']', 'src="basarilarimiz.png"', html, flags=re.IGNORECASE)
    html = re.sub(r'src=["\'][^"\']*Bran[sş][^"\']*\.png["\']', 'src="brans_rehberimiz.png"', html, flags=re.IGNORECASE)
    html = re.sub(r'src=["\'][^"\']*De[gğ]erler[^"\']*\.png["\']', 'src="degerlerimiz_ve_hedeflerimiz.png"', html, flags=re.IGNORECASE)
    html = re.sub(r'src=["\'][^"\']*Duyuru[^"\']*\.png["\']', 'src="duyurular.png"', html, flags=re.IGNORECASE)
    html = re.sub(r'src=["\'][^"\']*Fikst[^"\']*\.png["\']', 'src="fiksturler.png"', html, flags=re.IGNORECASE)
    html = re.sub(r'src=["\'][^"\']*Hareket[^"\']*\.png["\']', 'src="hareket_bilimi_ve_saglikli_yasam.png"', html, flags=re.IGNORECASE)
    html = re.sub(r'src=["\'][^"\']*[İI]leti[sş]im[^"\']*\.png["\']', 'src="iletisim.png"', html, flags=re.IGNORECASE)
    html = re.sub(r'src=["\'][^"\']*Okul[^"\']*\.png["\']', 'src="okul_ici_spor_faaliyetleri.png"', html, flags=re.IGNORECASE)
    html = re.sub(r'src=["\'][^"\']*Sporfest[^"\']*\.png["\']', 'src="sporfest.png"', html, flags=re.IGNORECASE)
    html = re.sub(r'src=["\'][^"\']*Tak[ıi]m[^"\']*\.png["\']', 'src="takimlarimiz.png"', html, flags=re.IGNORECASE)
    html = re.sub(r'src=["\'][^"\']*Vizyon[^"\']*\.png["\']', 'src="vizyonumuz.png"', html, flags=re.IGNORECASE)

    with open("index.html", "w", encoding="utf-8") as f:
        f.write(html)

print("Tüm isimler ve kodlar standartlaştırıldı. Canlıya aktarılıyor...")
subprocess.run(["npx", "--yes", "netlify-cli", "deploy", "--prod", "--dir=."])
