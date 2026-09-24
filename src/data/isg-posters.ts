/** Shared dataset for the 5 İSG (workplace health & safety) poster pages under src/pages/belgeler/. */
export interface IsgPoster {
  slug: string;
  title: string;
  color: string;
  sections: [string, string[]][];
  warning: string;
}

export const ISG_POSTERS: IsgPoster[] = [
  {
    slug: 'spor-salonu-isg-talimati',
    title: 'KAPALI SPOR SALONU İSG TALİMATI',
    color: '#c40018',
    sections: [
      ['1. GİRİŞ VE KİŞİSEL GÜVENLİK', ['Salona yalnızca Beden Eğitimi Öğretmeni nezaretinde girilir.', 'Zemin emniyeti için temiz tabanlı spor ayakkabısı giyilir.', 'Yaralanma riskine karşı saat, kolye, yüzük vb. takılar çıkarılır.']],
      ['2. SOYUNMA ODALARI VE MAHREMİYET', ['Soyunma odaları yalnızca giyinme ve hijyen amaçlı kullanılır.', 'KVKK gereği soyunma odalarında kamera/telefon kullanımı yasaktır.', 'Dolaplar düzenli tutulmalı, kıymetli eşya bırakılmamalıdır.']],
      ['3. ALAN VE ACİL DURUM EMNİYETİ', ['Salona su hariç yiyecek, sakız veya şekerli içecek sokulamaz.', 'Potalara asılmak ve koruma panolarına darbe vurmak yasaktır.', 'Acil çıkış kapıları ve yangın dolapları daima açık tutulur.']],
      ['4. EKİPMAN VE FİLE KORUMA', ['Toplar ve materyaller öğretmen izniyle teslim alınır.', 'Voleybol/badminton filelerine ve direklere asılmak yasaktır.', 'Ders sonunda tüm ekipmanlar eksiksiz malzeme odasına teslim edilir.']],
    ],
    warning: 'DİKKAT / İSG UYARISI: Salonda can güvenliği ve düzen esastır. Kaza riski oluşturacak hareketlerden kaçınınız!',
  },
  {
    slug: 'yuzme-havuzu-isg-talimati',
    title: 'YÜZME HAVUZU VE ISLAK ALANLAR İSG TALİMATI',
    color: '#1e40af',
    sections: [
      ['1. GİRİŞ VE CANKURTARAN EMNİYETİ', ['Havuz alanına öğretmen, antrenör veya cankurtaran olmadan girilemez.', 'Islak zeminlerde kayma riskine karşı havuz çevresinde koşulmaz.', 'Havuz kenarından izinsiz atlamak ve tehlikeli şakalar yapmak yasaktır.']],
      ['2. BİYOLOJİK HİJYEN STANDARTLARI', ['Havuzda bone takılması zorunludur; bone ders boyu çıkarılmaz.', 'Havuza girmeden önce sabunlu duş alınır ve ayak dezenfeksiyonu kullanılır.', 'Açık yara veya bulaşıcı enfeksiyonu olanlar durumu derhal öğretmene bildirir.']],
      ['3. SOYUNMA VE ISLAK ALANLAR', ['Soyunma odaları ve duşlar yalnızca kişisel temizlik amaçlıdır.', 'Kişisel mahremiyet gereği ıslak alanlarda kamera/telefon yasaktır.', 'Tahsis edilen dolaplar kilitli tutulmalıdır.']],
      ['4. KULVAR VE EKİPMAN DÜZENİ', ['Kulvar emniyet iplerine (seperatörlere) asılmak veya oturmak yasaktır.', 'Yüzme tahtası ve materyaller ders bitiminde eksiksiz toplanır.', 'Havuz mekanik tesisatına ve basamaklara özen gösterilir.']],
    ],
    warning: 'DİKKAT / İSG UYARISI: Islak alanlarda can güvenliği ve hijyen önceliklidir. Cankurtaran uyarılarına eksiksiz uyunuz!',
  },
  {
    slug: 'futbol-sahasi-isg-talimati',
    title: 'FUTBOL / FUTSAL SAHASI İSG TALİMATI',
    color: '#065f46',
    sections: [
      ['1. SAHA GİRİŞİ VE GÜVENLİK', ['Sahaya yalnızca Beden Eğitimi öğretmeni gözetiminde girilir.', 'Oyun dışındaki öğrenciler yedek kulübesinde veya emniyet çizgisinde bekler.', 'Aşırı kaygan ve buzlu zemin şartlarında çalışma yapılmaz.']],
      ['2. AYAKKABI STANDARDI VE ZEMİN', ['Sentetik sahada halı saha ayakkabısı; kapalı alanda salon ayakkabısı giyilir.', 'Metal ve sert çivili krampon kullanımı kesinlikle yasaktır.', 'Sahaya su haricinde yiyecek ve sakız sokulamaz.']],
      ['3. KALE DİREKLERİ VE MEKANİK EMNİYET', ['Devrilme riskine karşı kale direklerine ve üst direğe asılmak yasaktır.', 'Kale filelerine yüklenmek veya mekanizmalara müdahale etmek yasaktır.', 'Toplar ve yelekler ders sonunda eksiksiz teslim edilir.']],
      ['4. TEL ÖRGÜLER VE FAİR-PLAY', ['Sahayı çevreleyen tel örgülere tırmanmak yasaktır.', 'İkili mücadelelerde kasıtlı sertlikten kaçınılmalı, fair-play gözetilmelidir.', 'Saha içinde çöp bırakılmaz, atıklar kutulara atılır.']],
    ],
    warning: 'DİKKAT / İSG UYARISI: Devrilme riskine karşı kale direklerine asılmak hayati tehlike taşır ve kesinlikle yasaktır!',
  },
  {
    slug: 'tenis-kortu-isg-talimati',
    title: 'TENİS KORTU İSG VE KULLANIM TALİMATI',
    color: '#b45309',
    sections: [
      ['1. GİRİŞ KONTROLÜ VE ALAN EMNİYETİ', ['Korta yalnızca yetkili öğretmen izniyle girilir.', 'Top kaçmalarını ve çarpmaları önlemek için kort kapısı kapalı tutulur.', 'Islak ve kaygan zeminlerde çalışma durdurulur.']],
      ['2. AKRİLİK ZEMİN VE AYAKKABI', ['Korta yalnızca akrilik zemine uygun temiz tenis ayakkabısıyla girilir.', 'Krampon, bot veya sokak ayakkabısıyla basılması yasaktır.', 'Korta yalnızca kapaklı su/matara alınabilir.']],
      ['3. FİLE VE EKİPMAN EMNİYETİ', ['Tenis filesine yaslanmak ve germe mekanizmalarına dokunmak yasaktır.', 'Raketleri yere veya tellere vurmak yasaktır.', 'Ders sonunda tüm toplar kovasına toplanır ve raketlerle teslim edilir.']],
      ['4. ÇEVRE DÜZENİ VE TOP TOPLAMA', ['Kortta burkulma riskini önlemek için toplar düzenli toplanır.', 'Çevre tellerine tırmanmak yasaktır, atıklar çöp kutusuna atılır.', 'Spor ahlakı ve centilmenlik kurallarına tam uyulur.']],
    ],
    warning: 'DİKKAT / İSG UYARISI: Zemin bütünlüğü, doğru ayakkabı seçimi ve ekipman disiplini sporcu sağlığının temelidir!',
  },
  {
    slug: 'masa-tenisi-salonu-isg-talimati',
    title: 'MASA TENİSİ SALONU İSG TALİMATI',
    color: '#6b21a8',
    sections: [
      ['1. SALON DİSİPLİNİ VE ZEMİN', ['Salona öğretmen gözetimi olmadan girilemez.', 'Zemin kaplamasını korumak için temiz salon ayakkabısı giyilir.', 'Salona su haricinde yiyecek ve içecek sokulamaz.']],
      ['2. MASA MEKANİZMALARI VE YÜZEY', ['Masaların üzerine oturmak, yaslanmak veya çanta koymak yasaktır.', 'Masaların katlanması ve kilitlenmesi yalnızca görevlilerce yapılır.', 'Masa yüzeyine raket vurulmaz, darbeden kaçınılır.']],
      ['3. RAKET VE FİLE KORUMASI', ['Raketlerin lastik yüzeylerine zarar verilmez.', 'File demirlerine asılmak veya sökmek yasaktır.', 'Yerde kalan toplara basıp kaymayı önlemek için toplar sepete toplanır.']],
      ['4. ALAN EMNİYETİ VE TAHLİYE', ['Masalar arasında emniyet mesafesi korunur.', 'Çalışma sonunda raket ve toplar eksiksiz teslim edilir.', 'Pencereler ve aydınlatmalar kapatılarak salon temiz teslim edilir.']],
    ],
    warning: 'DİKKAT / İSG UYARISI: Masaların katlama mekanizmalarına müdahale etmeyiniz; masalara yaslanmak yasaktır!',
  },
];
