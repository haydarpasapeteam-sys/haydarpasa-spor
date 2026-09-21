import subprocess, os

templates = [
    ("spor_salonu_afis", "KAPALI SPOR SALONU İSG TALİMATI", "#c40018", [
        ("1. GİRİŞ VE KİŞİSEL GÜVENLİK", ["Salona yalnızca Beden Eğitimi Öğretmeni nezaretinde girilir.", "Zemin emniyeti için temiz tabanlı spor ayakkabısı giyilir.", "Yaralanma riskine karşı saat, kolye, yüzük vb. takılar çıkarılır."]),
        ("2. SOYUNMA ODALARI VE MAHREMİYET", ["Soyunma odaları yalnızca giyinme ve hijyen amaçlı kullanılır.", "KVKK gereği soyunma odalarında kamera/telefon kullanımı yasaktır.", "Dolaplar düzenli tutulmalı, kıymetli eşya bırakılmamalıdır."]),
        ("3. ALAN VE ACİL DURUM EMNİYETİ", ["Salona su hariç yiyecek, sakız veya şekerli içecek sokulamaz.", "Potalara asılmak ve koruma panolarına darbe vurmak yasaktır.", "Acil çıkış kapıları ve yangın dolapları daima açık tutulur."]),
        ("4. EKİPMAN VE FİLE KORUMA", ["Toplar ve materyaller öğretmen izniyle teslim alınır.", "Voleybol/badminton filelerine ve direklere asılmak yasaktır.", "Ders sonunda tüm ekipmanlar eksiksiz malzeme odasına teslim edilir."])
    ], "Salonda can güvenliği ve düzen esastır. Kaza riski oluşturacak hareketlerden kaçınınız!"),

    ("yuzme_havuzu_afis", "YÜZME HAVUZU VE ISLAK ALANLAR İSG TALİMATI", "#1e40af", [
        ("1. GİRİŞ VE CANKURTARAN EMNİYETİ", ["Havuz alanına öğretmen, antrenör veya cankurtaran olmadan girilemez.", "Islak zeminlerde kayma riskine karşı havuz çevresinde koşulmaz.", "Havuz kenarından izinsiz atlamak ve tehlikeli şakalar yapmak yasaktır."]),
        ("2. BİYOLOJİK HİJYEN STANDARTLARI", ["Havuzda bone takılması zorunludur; bone ders boyu çıkarılmaz.", "Havuza girmeden önce sabunlu duş alınır ve ayak dezenfeksiyonu kullanılır.", "Açık yara veya bulaşıcı enfeksiyonu olanlar durumu derhal öğretmene bildirir."]),
        ("3. SOYUNMA VE ISLAK ALANLAR", ["Soyunma odaları ve duşlar yalnızca kişisel temizlik amaçlıdır.", "Kişisel mahremiyet gereği ıslak alanlarda kamera/telefon yasaktır.", "Tahsis edilen dolaplar kilitli tutulmalıdır."]),
        ("4. KULVAR VE EKİPMAN DÜZENİ", ["Kulvar emniyet iplerine (seperatörlere) asılmak veya oturmak yasaktır.", "Yüzme tahtası ve materyaller ders bitiminde eksiksiz toplanır.", "Havuz mekanik tesisatına ve basamaklara özen gösterilir."])
    ], "Islak alanlarda can güvenliği ve hijyen önceliklidir. Cankurtaran uyarılarına eksiksiz uyunuz!"),

    ("futbol_sahasi_afis", "FUTBOL / FUTSAL SAHASI İSG TALİMATI", "#065f46", [
        ("1. SAHA GİRİŞİ VE GÜVENLİK", ["Sahaya yalnızca Beden Eğitimi öğretmeni gözetiminde girilir.", "Oyun dışındaki öğrenciler yedek kulübesinde veya emniyet çizgisinde bekler.", "Aşırı kaygan ve buzlu zemin şartlarında çalışma yapılmaz."]),
        ("2. AYAKKABI STANDARDI VE ZEMİN", ["Sentetik sahada halı saha ayakkabısı; kapalı alanda salon ayakkabısı giyilir.", "Metal ve sert çivili krampon kullanımı kesinlikle yasaktır.", "Sahaya su haricinde yiyecek ve sakız sokulamaz."]),
        ("3. KALE DİREKLERİ VE MEKANİK EMNİYET", ["Devrilme riskine karşı kale direklerine ve üst direğe asılmak yasaktır.", "Kale filelerine yüklenmek veya mekanizmalara müdahale etmek yasaktır.", "Toplar ve yelekler ders sonunda eksiksiz teslim edilir."]),
        ("4. TEL ÖRGÜLER VE FAİR-PLAY", ["Sahayı çevreleyen tel örgülere tırmanmak yasaktır.", "İkili mücadelelerde kasıtlı sertlikten kaçınılmalı, fair-play gözetilmelidir.", "Saha içinde çöp bırakılmaz, atıklar kutulara atılır."])
    ], "Devrilme riskine karşı kale direklerine asılmak hayati tehlike taşır ve kesinlikle yasaktır!"),

    ("tenis_kortu_afis", "TENİS KORTU İSG VE KULLANIM TALİMATI", "#b45309", [
        ("1. GİRİŞ KONTROLÜ VE ALAN EMNİYETİ", ["Korta yalnızca yetkili öğretmen izniyle girilir.", "Top kaçmalarını ve çarpmaları önlemek için kort kapısı kapalı tutulur.", "Islak ve kaygan zeminlerde çalışma durdurulur."]),
        ("2. AKRİLİK ZEMİN VE AYAKKABI", ["Korta yalnızca akrilik zemine uygun temiz tenis ayakkabısıyla girilir.", "Krampon, bot veya sokak ayakkabısıyla basılması yasaktır.", "Korta yalnızca kapaklı su/matara alınabilir."]),
        ("3. FİLE VE EKİPMAN EMNİYETİ", ["Tenis filesine yaslanmak ve germe mekanizmalarına dokunmak yasaktır.", "Raketleri yere veya tellere vurmak yasaktır.", "Ders sonunda tüm toplar kovasına toplanır ve raketlerle teslim edilir."]),
        ("4. ÇEVRE DÜZENİ VE TOP TOPLAMA", ["Kortta burkulma riskini önlemek için toplar düzenli toplanır.", "Çevre tellerine tırmanmak yasaktır, atıklar çöp kutusuna atılır.", "Spor ahlakı ve centilmenlik kurallarına tam uyulur."])
    ], "Zemin bütünlüğü, doğru ayakkabı seçimi ve ekipman disiplini sporcu sağlığının temelidir!"),

    ("masa_tenisi_salonu_afis", "MASA TENİSİ SALONU İSG TALİMATI", "#6b21a8", [
        ("1. SALON DİSİPLİNİ VE ZEMİN", ["Salona öğretmen gözetimi olmadan girilemez.", "Zemin kaplamasını korumak için temiz salon ayakkabısı giyilir.", "Salona su haricinde yiyecek ve içecek sokulamaz."]),
        ("2. MASA MEKANİZMALARI VE YÜZEY", ["Masaların üzerine oturmak, yaslanmak veya çanta koymak yasaktır.", "Masaların katlanması ve kilitlenmesi yalnızca görevlilerce yapılır.", "Masa yüzeyine raket vurulmaz, darbeden kaçınılır."]),
        ("3. RAKET VE FİLE KORUMASI", ["Raketlerin lastik yüzeylerine zarar verilmez.", "File demirlerine asılmak veya sökmek yasaktır.", "Yerde kalan toplara basıp kaymayı önlemek için toplar sepete toplanır."]),
        ("4. ALAN EMNİYETİ VE TAHLİYE", ["Masalar arasında emniyet mesafesi korunur.", "Çalışma sonunda raket ve toplar eksiksiz teslim edilir.", "Pencereler ve aydınlatmalar kapatılarak salon temiz teslim edilir."])
    ], "Masaların katlama mekanizmalarına müdahale etmeyiniz; masalara yaslanmak yasaktır!")
]

html_template = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page {{ size: A4 portrait; margin: 15mm; }}
  body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 0; }}
  .header {{ text-align: center; border-bottom: 2px solid {color}; padding-bottom: 8px; margin-bottom: 12px; }}
  .school-title {{ font-size: 18px; font-weight: 900; letter-spacing: 1px; margin: 0; }}
  .sub-title {{ font-size: 12px; font-weight: 600; color: #64748b; margin: 2px 0 6px 0; }}
  .doc-title {{ background: {color}; color: white; padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 800; display: inline-block; }}
  .section {{ background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid {color}; border-radius: 6px; padding: 8px 12px; margin-bottom: 8px; }}
  .sec-h {{ font-size: 11px; font-weight: 800; color: {color}; margin: 0 0 4px 0; text-transform: uppercase; }}
  ul {{ margin: 0; padding-left: 16px; font-size: 10px; line-height: 1.35; color: #334155; }}
  li {{ margin-bottom: 2px; }}
  .warn-box {{ background: #fee2e2; border: 1px solid #f87171; border-radius: 6px; padding: 8px; text-align: center; font-size: 10px; font-weight: 800; color: #991b1b; margin-top: 10px; }}
  .footer {{ margin-top: 16px; display: flex; justify-content: space-between; font-size: 10px; font-weight: 700; border-top: 1px solid #e2e8f0; padding-top: 8px; }}
</style>
</head>
<body>
  <div class="header">
    <h1 class="school-title">HAYDARPAŞA LİSESİ</h1>
    <div class="sub-title">Beden Eğitimi ve Spor Bölümü | İSG Rehberi</div>
    <div class="doc-title">{title}</div>
  </div>
  {sections_html}
  <div class="warn-box">⚠️ DİKKAT / İSG UYARISI: {warning}</div>
  <div class="footer">
    <div>Beden Eğitimi ve Spor Zümresi</div>
    <div style="text-align: right;">İbrahim SÜSLÜ<br><span style="font-weight: normal; font-size: 9px;">Okul Müdürü</span></div>
  </div>
</body>
</html>"""

for filename, title, color, secs, warn in templates:
    sec_html = ""
    for stitle, sitems in secs:
        lis = "".join([f"<li>{it}</li>" for it in sitems])
        sec_html += f'<div class="section"><div class="sec-h">{stitle}</div><ul>{lis}</ul></div>'
    
    full_html = html_template.format(title=title, color=color, sections_html=sec_html, warning=warn)
    with open(f"{filename}.html", "w", encoding="utf-8") as f:
        f.write(full_html)

    # macOS WebKit HTML-to-PDF / Cups motoruyla anında temiz PDF oluştur
    os.system(f"/System/Library/Printers/Libraries/convert -f {filename}.html -o {filename}.pdf 2>/dev/null || cupsfilter {filename}.html > {filename}.pdf 2>/dev/null || python3 -c \"import pdfkit; pdfkit.from_file('{filename}.html', '{filename}.pdf')\" 2>/dev/null")
    
    # Eğer convert bulunamazsa Safari headless ile PDF yap
    if not os.path.exists(f"{filename}.pdf") or os.path.getsize(f"{filename}.pdf") == 0:
        os.system(f"qlmanage -p -o . {filename}.html 2>/dev/null && mv {filename}.html.pdf {filename}.pdf 2>/dev/null || true")

print("Tüm İSG afişleri hazırlandı.")
