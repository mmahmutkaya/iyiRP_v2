exports = async function (request, response) {
  
  objHeader = request.headers
  
  //npm paketleri
  var PC_objectid = require("objectid")
  
  //fonksiyon global değişkenleri
  let hataText;
  
  
  // 1 - Gelen HEADER bilgilerinin analizi yapılıyor
  let kullaniciMail;
  let geciciKey;
  let proje
  let blok;
  let lbsParent;
  let lbs;
  
  try {
    
    hataText = "\"gelen istekte mail adresi bulunamadı\""
    if(!objHeader.hasOwnProperty('Kullanici-Mail')) return ({hata:true,hataYeri:"FONK // addLbs",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    kullaniciMail = objHeader["Kullanici-Mail"][0];
    validateEmail = context.functions.execute("validateEmail", kullaniciMail);
    hataText = "gelen istekteki mail adresi hatalı"
    if(validateEmail == null) return ({hata:true,hataYeri:"FONK // addLbs",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    hataText = "\"gelen istekte geciciKey bulunamadı\""
    if(!objHeader.hasOwnProperty('Gecici-Key')) return ({hata:true,hataYeri:"FONK // addLbs",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    geciciKey = objHeader["Gecici-Key"][0];
    
    if(!objHeader.hasOwnProperty('Proje')) return ({hata:true,hataYeri:"FONK // addLbs",hataMesaj:"Gelen sorguda \"Proje\" HEADER tespit edilemedi, yönetici ile iletişime geçiniz."})
    proje = objHeader["Proje"][0];
    if(proje.length == 0) return ({hata:true,hataYeri:"FONK // addLbs",hataMesaj:"Gelen sorguda \"Proje\" HEADER var fakat boş, yönetici ile iletişime geçiniz."})

    if(!objHeader.hasOwnProperty('Blok')) return ({hata:true,hataYeri:"FONK // addLbs",hataMesaj:"Gelen sorguda \"Blok\" HEADER tespit edilemedi, yönetici ile iletişime geçiniz."})
    blok = objHeader["Blok"][0];
    if(blok.length == 0) return ({hata:true,hataYeri:"FONK // addLbs",hataMesaj:"Gelen sorguda \"Blok\" HEADER var fakat boş, yönetici ile iletişime geçiniz."})

    if(!objHeader.hasOwnProperty('Lbs-Parent')) return ({hata:true,hataYeri:"FONK // addLbs",hataMesaj:"Gelen sorguda \"Lbs-Parent\" HEADER tespit edilemedi, yönetici ile iletişime geçiniz."})
    lbsParent = objHeader["Lbs-Parent"][0];
    if(lbsParent.length == 0) return ({hata:true,hataYeri:"FONK // addLbs",hataMesaj:"Gelen sorguda \"Lbs-Parent\" HEADER var fakat boş, yönetici ile iletişime geçiniz."})

    if(!objHeader.hasOwnProperty('Lbs')) return ({hata:true,hataYeri:"FONK // addLbs",hataMesaj:"Gelen sorguda \"Lbs\" HEADER tespit edilemedi, yönetici ile iletişime geçiniz."})
    lbs = objHeader["Lbs"][0];
    if(lbs.length == 0) return ({hata:true,hataYeri:"FONK // addLbs",hataMesaj:"Gelen sorguda \"Lbs\" HEADER var fakat boş, yönetici ile iletişime geçiniz."})

  } catch (err){
    return ({hata:true,hataYeri:"FONK // addLbs // MONGO-1",hataMesaj:err.message})
  }
  
  
  // 2 - kullanıcının bilgilerini database den alalım
  let user;

  try {
    const collectionUsers = context.services.get("mongodb-atlas").db("iyiRP").collection("users")
    const userArray = await collectionUsers.find({kullaniciMail}).toArray()
    
    hataText = "gelen istekteki mail adresi sistemde kayıtlı değil"
    if(userArray.length === 0) return ({hata:true,hataYeri:"FONK // addLbs",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    user = userArray[0]
    
    if(!user.mailTeyit) return ({hata:true,hataTanim:"mailTeyit",hataYeri:"FONK // addLbs",hataMesaj:"Mail adresi henüz doğrulanmamış."})
    
    if(!user.uyelikOnay) return ({hata:true,hataTanim:"uyelikOnay",hataYeri:"FONK // addLbs",hataMesaj:"Üyeliğiniz onay bekliyor."})
    
    hataText = "gelen istekteki geciciKey sistemdeki ile eşleşmiyor"
    if(geciciKey !== user.geciciKey.toString()) return ({hata:true,hataTanim:"geciciKod",hataYeri:"FONK // addLbs",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    // yetki sorgulaması
    if (!user.hasOwnProperty("izinliFonksiyonlar")) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // addLbs",hataMesaj:"Bu işleme yetkiniz bulunmuyor"})
    let sTr = "addLbs-" + proje + "-" + blok + "-" + lbs
    if (!user.izinliFonksiyonlar.hasOwnProperty(sTr)) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // addLbs",hataMesaj:"Bu işleme yetkiniz bulunmuyor"})
    if (!user.izinliFonksiyonlar[sTr].includes("W")) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // addLbs",hataMesaj:"Bu işleme yetkiniz bulunmuyor"})
 
  } catch(err) {
    return ({hata:true,hataYeri:"FONK // addLbs // MONGO-2",hataMesaj:err.message})
  }
    
    
  // 3 - versiyon tespiti
  let versiyon
  try {
    const collectionVersiyonlar = context.services.get("mongodb-atlas").db("iyiRP").collection("versiyonlar")
    const versiyonArray = await collectionVersiyonlar.find({proje,blok}).toArray()
    versiyon = versiyonArray[0].guncelVersiyon
    
  } catch(err){
    return ({hata:true,hataYeri:"FONK // addLbs // MONGO-3",hataMesaj:err.message})
  }
  
  
    
  // 4 - gelen veri işlemleri - body kısmında veri var mı?
  let gelenLBS
  
  try{
    gelenLBS = JSON.parse(request.body.text());
    // return gelenLBS
  } catch(err){
    return ({hata:true,hataYeri:"FONK // addLbs // MONGO-4",hataMesaj:"Gelen sorguda gövde(body) verisi yok ya da hatalı, MONGO --> " + err.message})
  }
  
  
  // 5 - gelen verilerin kaydı
  try{
    
    // işlemler için zamanı belli edelim
    const zaman = Date.now()
    
    // database deki collection belirleyelim
    const collectionLbs = context.services.get("mongodb-atlas").db("iyiRP").collection("lbs")
    
    // eklenecek ve güncellenecek diye gelen object arrayleri ayırlarım
    const gelenLBS_ekle =[]
    const gelenLBS_guncelle =[]
    const gelenLBS_sil =[]
    
    gelenLBS.map(item => {
      
      // if (!PC_objectid.isValid(item.ID)) {
      if (item.DBislem === "ekle") {
        gelenLBS_ekle.push({
          ...item,
          proje,
          blok,
          lbsParent,
          versiyon,
          createdAt:zaman,
          isDeleted:false,
          createdBy:kullaniciMail,
        })
        
      } else if (item.DBislem === "sil"){
        gelenLBS_sil.push({
          ID:item.ID,
          isDeleted:true,
          deletedAt:zaman,
          deletedBy:kullaniciMail,
        })
        
      } else if (item.DBislem === "guncelle") {
        gelenLBS_guncelle.push({
          ...item,
          proje,
          blok,
          lbsParent,
          versiyon,
          updatedAt:zaman,
          updatedBy:kullaniciMail,
        });
        
      }
    });
      
    // yukarıdaki map dönüşünden sonra boş object ler oluşuyor onları siliyoruz - push komutu ile yaptığımız için gerek kalmadı
    // const gelenLBS_ekle_filtered = gelenLBS_ekle.filter(value => typeof value === "object");
    // const gelenLBS_guncelle_filtered = gelenLBS_guncelle.filter(value => typeof value === "object");
    
    // return ({1:gelenLBS_ekle, 2:gelenLBS_sil, 3:gelenLBS_guncelle})
    
    // DATABASE - ekleme
    if (gelenLBS_ekle.length) {
      collectionLbs.insertMany(gelenLBS_ekle);
    }
    
    // DATABASE - silme
    if (gelenLBS_sil.length) {
      gelenLBS_sil.map(item =>{
        collectionLbs.findOneAndUpdate(
          {_id:new BSON.ObjectId(item.ID)},
          { $set: {isDeleted:true}},
          { upsert: true, new: true }
        );
      });
    }
          
    // DATABASE - guncelleme
    if (gelenLBS_guncelle.length) {
      gelenLBS_guncelle.map(item =>{
        collectionLbs.findOneAndUpdate(
          {_id:new BSON.ObjectId(item.ID)},
          { $set: {...item}},
          { upsert: true, new: true }
        );
      });
    }
      
    } catch(err){
      return ({hata:true,hataYeri:"FONK // addLbs // MONGO-5",hataMesaj:err.message});
    }
    
    
    
    // 6 - verileri database den alma
    try {
      
      // DATABASEDEKİ VERİLERİ GÖNDERELİM
      const collectionLbs = context.services.get("mongodb-atlas").db("iyiRP").collection("lbs");
      const mongoReply = collectionLbs.find(
        {isDeleted:false,proje,blok,wbsName,versiyon},
        {_id:1,sira:1,kod:1,createdBy:1,updatedBy:1}
      );
      
      
      return({ok:true,mesaj:"Güncellemeler yapıldı.",mongoReply});
      
    } catch(err){
      return ({hata:true,hataYeri:"FONK // addLbs // MONGO-6",hataMesaj:err.message});
    }
    
    
    
};