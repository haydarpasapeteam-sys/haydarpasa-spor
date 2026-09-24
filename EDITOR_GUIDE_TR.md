# Haydarpaşa Lisesi Spor Sitesi — Düzenleyici Rehberi (Öğretmenler İçin)

Bu rehber, kod bilgisi gerektirmeden web sitesini nasıl güncelleyeceğinizi
adım adım açıklar. Herhangi bir teknik bilgiye ihtiyacınız yoktur.

## 1. Pages CMS'e nasıl giriş yapılır?

1. Tarayıcınızdan **https://app.pagescms.org/** adresine gidin.
2. "Sign in with GitHub" (GitHub ile giriş yap) butonuna tıklayın.
3. Size verilmiş olan GitHub hesabı bilgilerinizle giriş yapın.
4. İlk kez giriş yapıyorsanız, GitHub sizden Pages CMS uygulamasına bu
   depoya erişim izni vermenizi isteyebilir — "Authorize" (Yetkilendir)
   butonuna tıklayın.

> Not: Yalnızca okul yönetimi tarafından bu depoya erişim yetkisi verilmiş
> GitHub hesapları içerik düzenleyebilir. Şifreniz veya jetonunuz (token)
> hiçbir zaman siteye veya bu belgeye girilmez.

## 2. Depo nasıl seçilir?

Giriş yaptıktan sonra karşınıza depo listesi gelir. Listeden
**haydarpasapeteam-sys/haydarpasa-spor** deposunu seçin. Sol tarafta
Türkçe başlıklarla düzenleyebileceğiniz bölümler görünür: Duyurular,
Maçlar, Turnuvalar, Takımlar, Branşlar, Belgeler, Galeriler ve Site
Ayarları.

## 3. Nasıl duyuru oluşturulur?

1. Sol menüden **Duyurular**'a tıklayın.
2. Sağ üstteki **"Yeni Duyuru"** (+ / New) butonuna tıklayın.
3. **Başlık**, **Özet**, **Kategori** ve **Durum** alanlarını doldurun.
4. **Yayın Tarihi**'ni seçin (duyurunun ne zaman görüneceği).
5. İsteğe bağlı olarak **Yayından Kalkma Tarihi** girin — bu tarih
   geldiğinde duyuru otomatik olarak aktif listeden kalkar.
6. Görsel eklemek istiyorsanız **Kapak Görseli** alanına yükleyin ve
   **Görsel Açıklaması** alanını doldurun (bkz. madde 8 — bu alan
   zorunludur).
7. Alt kısımdaki **İçerik** kutusuna duyurunun tam metnini yazın.
8. **Kaydet** (Save) butonuna basın.

## 4. Nasıl maç sonucu girilir?

1. Sol menüden **Maçlar**'a tıklayın → **Yeni** (+).
2. **Branş**, **Müsabaka/Lig**, **Sezon**, **Ev Sahibi Takım**,
   **Konuk Takım**, **Maç Tarihi ve Saati**, **Mekân** alanlarını
   doldurun.
3. **Maç Sonucu/Durumu** olarak *Tamamlandı* seçin.
4. **Ev Sahibi Skoru** ve **Konuk Skoru** alanlarına sayıları girin
   (ikisi de zorunludur — biri boş kalırsa kayıt reddedilir).
5. **Kaydet**'e basın. Kazanan takım otomatik olarak hesaplanır, ayrıca
   girmenize gerek yoktur.

## 5. Nasıl gelecekteki bir maç eklenir?

Aynı adımları izleyin ama **Maç Sonucu/Durumu** olarak *Planlandı*
seçin ve skor alanlarını boş bırakın. Maç günü geldiğinde durumu
*Tamamlandı* yapıp skorları girerek güncelleyebilirsiniz.

## 6. Nasıl turnuva oluşturulur?

1. Sol menüden **Turnuvalar** → **Yeni**.
2. **Başlık**, **Branş**, **Sezon**, **Durum** (örn. *Başvurular Açık*),
   **Özet** alanlarını doldurun.
3. Tarihler kesinleşmediyse **Başlangıç/Bitiş Tarihi** alanlarını boş
   bırakabilirsiniz — zorunlu değildir.
4. Varsa **Başvuru Formu Bağlantısı** (Google Form vb.) ekleyin.
5. **Kaydet**'e basın.

## 7. Görsel nasıl yüklenir?

Herhangi bir "Kapak Görseli" alanına tıkladığınızda bir yükleme penceresi
açılır. Bilgisayarınızdan bir PNG, JPG veya WEBP dosyası seçip yükleyin.
Site, yüklediğiniz görseli otomatik olarak küçük ve hızlı yüklenen
sürümlere dönüştürür — siz orijinal, yüksek kaliteli fotoğrafı
yükleyebilirsiniz, boyutunu küçültmeniz gerekmez.

## 8. Görsel açıklaması (alt metni) neden zorunludur?

"Görsel Açıklaması" alanı, görseli **göremeyen** ziyaretçiler için
(görme engelli öğrenciler/veliler, ekran okuyucu kullananlar, veya
internet bağlantısı zayıf olup görseli yükleyemeyenler) görselin ne
anlattığını yazılı olarak anlatır. Örnek: "Basketbol okul takımı
seçmeleri afişi". Bir Kapak Görseli yüklediğinizde bu alanı boş
bırakırsanız kayıt kaydedilmez.

## 9. Boş bir PDF şablonu nasıl yüklenir?

1. Sol menüden **Belgeler** → **Yeni**.
2. **Belge Adı**, **Kategori**, **Özet** alanlarını doldurun.
3. **PDF Dosyası** alanına yalnızca **boş/doldurulmamış** şablon PDF'i
   yükleyin — hiçbir öğrencinin doldurduğu, imzaladığı veya kişisel
   bilgi içeren dosyayı ASLA buraya yüklemeyin (bkz. madde 15).
4. **Belge Sürüm Tarihi**, **Eğitim-Öğretim Yılı** alanlarını doldurun.
5. **Durum**'u *Aktif* yapın ve **Onaylandı** kutusunu işaretleyin —
   ikisi birlikte olmadan belge sitede görünmez.

## 10. Taslak nasıl kaydedilir?

Herhangi bir Duyuru için **Durum** alanını **Taslak** seçin ve kaydedin.
Taslak durumundaki içerikler sitede asla görünmez — yalnızca siz
görebilirsiniz (ve teknik olarak GitHub'a erişimi olan biri de dosyayı
görebilir, bu yüzden taslaklara gizli/hassas bilgi yazmayın).

## 11. Nasıl yayınlanır?

Bir Duyuru hazır olduğunda **Durum**'u **Yayınlandı** yapın ve
**Yayın Tarihi**'ni ayarlayıp kaydedin. Siteye yansıması birkaç dakika
sürebilir (bkz. madde 16).

## 12. Nasıl arşivlenir?

Bir duyuru artık güncel değilse ama kaydını silmek istemiyorsanız,
**Durum**'u **Arşivlendi** yapın. Arşivlenen içerik aktif listede
görünmez ama geçmiş kayıtlar arasında saklanır. **İçeriği silmek yerine
her zaman arşivlemeyi tercih edin.**

## 13. Bir hata nasıl düzeltilir?

İlgili kaydı (duyuru, maç, takım vb.) tekrar açın, hatalı alanı
düzeltin ve **Kaydet**'e basın. Bu, otomatik olarak yeni bir kayıt
(commit) oluşturur; eski hatalı hali GitHub geçmişinde saklanır ama
sitede artık görünmez.

## 14. Git geçmişini kullanarak geri alma (rollback) nasıl yapılır?

Bir değişikliği tamamen geri almanız gerekiyorsa (örneğin yanlış bilgi
yayınlandıysa), bir geliştiriciden veya GitHub'a aşina birinden
`git revert` ile ilgili commit'i geri almasını isteyin — teknik
ayrıntılar `README.md`'nin "Rollback using Git" bölümündedir. Acil
durumlarda ilgili kaydı Pages CMS üzerinden elle eski haline getirip
tekrar kaydetmek de bir çözümdür.

## 15. Asla yüklenmemesi gerekenler

Bu depo **herkese açık**tır. Aşağıdakileri KESİNLİKLE hiçbir zaman
yüklemeyin veya yazmayın (Taslak olarak dahi):

- Doldurulmuş/imzalanmış sağlık beyanı veya izin belgeleri
- T.C. Kimlik Numarası
- Öğrenciye ait doğum tarihi, kan grubu, sağlık raporu/teşhis bilgisi
- Veli imzaları
- Öğrenci veya veli özel telefon numaraları
- Doldurulmuş herhangi bir öğrenci formu
- İzin onayı teyit edilmemiş özel öğrenci fotoğrafları

Bu sitede yalnızca **boş, doldurulmamış** belge şablonları
yayınlanabilir.

## 16. Yayınlama neden birkaç dakika sürebilir?

Kaydettiğinizde önce GitHub otomatik kontroller (doğrulama, tip
kontrolü, testler) çalıştırır, sonra siteyi yeniden derler ve son olarak
GitHub Pages'e yayınlar. Bu süreç genellikle 2-5 dakika sürer. Ayrıca,
ileri tarihli veya süresi dolan duyurular yalnızca her 30 dakikada bir
çalışan otomatik yeniden derleme sırasında güncellenir — yani bir
duyurunun tam yayın saatinde değil, en fazla 30 dakika gecikmeyle
görünmesi normaldir.

## 17. Bir GitHub Actions kontrolü başarısız olursa ne yapmalı?

GitHub'da "Actions" sekmesinde kırmızı bir ✗ işareti görürseniz,
kaydettiğiniz içerikte bir sorun var demektir (örnek: bir zorunlu alan
boş kalmış, bir tarih geçersiz, ya da bir maçta skor eksik). Hata mesajı
Türkçe olarak hangi alanın sorunlu olduğunu söyler. İlgili kaydı Pages
CMS'te açıp belirtilen alanı düzeltip yeniden kaydedin. Sorunu
çözemiyorsanız bir geliştiriciden yardım isteyin — mevcut site
değişmeden kalır, hiçbir hata canlı siteye yansımaz.

## 18. Eksik öğrenci taahhütnamesi PDF'i nasıl sağlanır?

Okulun onayladığı, gerçek "Öğrenci Taahhütnamesi" PDF'i elinize
geçtiğinde:

1. Sol menüden **Belgeler** → **Yeni**.
2. Belge Adı: "Öğrenci Taahhütnamesi" yazın.
3. **PDF Dosyası** alanına okulun onayladığı gerçek PDF'i yükleyin
   (boş veya 0 bayt bir dosya sistem tarafından otomatik reddedilir).
4. Diğer alanları doldurup **Durum**'u *Aktif*, **Onaylandı**'yı
   işaretli yapın ve kaydedin.

Bu adım tamamlanana kadar `/belgeler/` sayfasında bu belgenin
"Dosya Bekleniyor" olarak göründüğünü hatırlatırız — bu normaldir ve
kasıtlıdır.
