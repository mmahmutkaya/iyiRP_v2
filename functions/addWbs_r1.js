exports = async function (request, response) {
  
  objHeader = request.headers
  
  var PC_objectid = require("objectid")
  let hataText;
  
  
  // 1 - Gelen HEADER bilgilerinin analizi yapılıyor
  let kullaniciMail;
  let geciciKey;
  let proje
  let projeData
  let blok;
  let wbsName
  
  try {
    
    hataText = "\"gelen istekte mail adresi bulunamadı\""
    if(!objHeader.hasOwnProperty('Kullanici-Mail')) return ({hata:true,hataYeri:"FONK // addWbs",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    kullaniciMail = objHeader["Kullanici-Mail"][0];
    validateEmail = context.functions.execute("validateEmail", kullaniciMail);
    hataText = "gelen istekteki mail adresi hatalı"
    if(validateEmail == null) return ({hata:true,hataYeri:"FONK // addWbs",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    hataText = "\"gelen istekte geciciKey bulunamadı\""
    if(!objHeader.hasOwnProperty('Gecici-Key')) return ({hata:true,hataYeri:"FONK // addWbs",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    geciciKey = objHeader["Gecici-Key"][0];
    
    if(!objHeader.hasOwnProperty('Proje')) return ({hata:true,hataYeri:"FONK // addWbs",hataMesaj:"Gelen sorguda \"Proje\" HEADER tespit edilemedi, yönetici ile iletişime geçiniz."})
    proje = objHeader["Proje"][0];
    if(proje.length == 0) return ({hata:true,hataYeri:"FONK // addWbs",hataMesaj:"Gelen sorguda \"Proje\" HEADER var fakat boş, yönetici ile iletişime geçiniz."})
    projeData = context.values.get(proje)

    if(!objHeader.hasOwnProperty('Blok')) return ({hata:true,hataYeri:"FONK // addWbs",hataMesaj:"Gelen sorguda \"Blok\" HEADER tespit edilemedi, yönetici ile iletişime geçiniz."})
    blok = objHeader["Blok"][0];
    if(blok.length == 0) return ({hata:true,hataYeri:"FONK // addWbs",hataMesaj:"Gelen sorguda \"Blok\" HEADER var fakat boş, yönetici ile iletişime geçiniz."})

    if(!objHeader.hasOwnProperty('Wbs-Name')) return ({hata:true,hataYeri:"FONK // addWbs",hataMesaj:"Gelen sorguda \"Wbs-Name\" HEADER tespit edilemedi, yönetici ile iletişime geçiniz."})
    wbsName = objHeader["Wbs-Name"][0];
    if(wbsName.length == 0) return ({hata:true,hataYeri:"FONK // addWbs",hataMesaj:"Gelen sorguda \"Wbs-Name\" HEADER var fakat boş, yönetici ile iletişime geçiniz."})

  } catch (err){
    return ({hata:true,hataYeri:"FONK // addWbs // MONGO-1",hataMesaj:err.message})
  }
  
  
  // 2 - kullanıcının bilgilerini database den alalım
  let wbsArray;
  let user;

  try {
    const collectionUsers = context.services.get("mongodb-atlas").db("iyiRP").collection("users")
    const userArray = await collectionUsers.find({kullaniciMail:kullaniciMail}).toArray()
    
    hataText = "gelen istekteki mail adresi sistemde kayıtlı değil"
    if(userArray.length === 0) return ({hata:true,hataYeri:"FONK // addWbs",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    user = userArray[0]
    
    if(!user.mailTeyit) return ({hata:true,hataTanim:"mailTeyit",hataYeri:"FONK // addWbs",hataMesaj:"Mail adresi henüz doğrulanmamış."})
    
    if(!user.uyelikOnay) return ({hata:true,hataTanim:"uyelikOnay",hataYeri:"FONK // addWbs",hataMesaj:"Üyeliğiniz onay bekliyor."})
    
    hataText = "gelen istekteki geciciKey sistemdeki ile eşleşmiyor"
    if(geciciKey !== user.geciciKey.toString()) return ({hata:true,hataTanim:"geciciKod",hataYeri:"FONK // addWbs",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    // yetki sorgulaması
    if (!user.hasOwnProperty("izinliFonksiyonlar")) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // addWbs",hataMesaj:"Bu işleme yetkiniz bulunmuyor"})
    if (!user.izinliFonksiyonlar.hasOwnProperty("addWbs-" + proje + "-" + blok)) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // addWbs",hataMesaj:"Bu işleme yetkiniz bulunmuyor"})
    if (!user.izinliFonksiyonlar["addWbs-" + proje + "-" + blok].includes("W")) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // addWbs",hataMesaj:"Bu işleme yetkiniz bulunmuyor"})
 
  } catch(err) {
    return ({hata:true,hataYeri:"FONK // addWbs // MONGO-2",hataMesaj:err.message})
  }
    
    
    
  // 3 - gelen veri işlemleri - body kısmında veri var mı?
  let gelenWBS
  
  try{
    gelenWBS = JSON.parse(request.body.text());
    // return gelenWBS
  } catch(err){
    return ({hata:true,hataYeri:"FONK // addWbs // MONGO-3",hataMesaj:"Gelen sorguda gövde(body) verisi yok ya da hatalı, MONGO --> " + err.message})
  }
  
  
  
  
  // // 4 - gelen veri işlemleri - modifikasyon ve database e kaydetme
  let versiyon;
  
  try{
    
    // işlemler için önce verisyonu belli edelim
    versiyon = projeData.Versiyonlar[blok]
    
    // işlemler için zamanı belli edelim
    const zaman = Date.now()
    
    // database deki collection belirleyelim
    const collectionWbs = context.services.get("mongodb-atlas").db("iyiRP").collection("wbs")
    
    // // eklenecek ve güncellenecek diye gelen object arrayleri ayırlarım
    // const gelenWBS_ekle =[]
    // const gelenWBS_guncelle =[]
    // const gelenWBS_sil =[]
    
    //   // hepsinin ID properties var kabul ettik, yoksa hata verecek
    //   gelenWBS.map(item => {
        
    //     if (!PC_objectid.isValid(item.ID)) {
    //       gelenWBS_ekle.push({
    //         ...item,
    //         proje,
    //         blok,
    //         wbsName,
    //         versiyon,
    //         createdAt:zaman,
    //         isDeleted:false,
    //         createdBy:kullaniciMail,
    //       })
          
    //     } else if (item.DBislem === "silinecek"){
    //       gelenWBS_sil.push({
    //         ID:item.ID,
    //         isDeleted:true,
    //         deletedAt:zaman,
    //         deletedBy:kullaniciMail,
    //       })
          
    //     } else {
    //       gelenWBS_guncelle.push({
    //         ...item,
    //         proje,
    //         blok,
    //         wbsName,
    //         versiyon,
    //         updatedAt:zaman,
    //         updatedBy:kullaniciMail,
    //       })
          
    //     }
    //   })
    //   // yukarıdaki map dönüşünden sonra boş object ler oluşuyor onları siliyoruz
    //   // const gelenWBS_ekle_filtered = gelenWBS_ekle.filter(value => typeof value === "object");
    //   // const gelenWBS_guncelle_filtered = gelenWBS_guncelle.filter(value => typeof value === "object");
      
    //   // return ({1:gelenWBS_ekle, 2:gelenWBS_sil, 3:gelenWBS_guncelle})
      
    //   // DATABASE - ekleme
    //   if (gelenWBS_ekle.length) {
    //     collectionWbs.insertMany(gelenWBS_ekle)
    //   }
      
    //   // DATABASE - silme
    //   if (gelenWBS_sil.length) {
    //     gelenWBS_sil.map(item =>{
    //       collectionWbs.findOneAndUpdate(
    //         {_id:new BSON.ObjectId(item.ID)},
    //         { $set: {isDeleted:true}},
    //         { upsert: true, new: true }
    //       );
    //     });
    //   }
            
    //   // DATABASE - guncelleme
    //   if (gelenWBS_guncelle.length) {
    //     gelenWBS_guncelle.map(item =>{
    //       collectionWbs.findOneAndUpdate(
    //         {_id:new BSON.ObjectId(item.ID)},
    //         { $set: {...item}},
    //         { upsert: true, new: true }
    //       );
    //     });
    //   }
      
    } catch(err){
      return ({hata:true,hataYeri:"FONK // addWbs // MONGO-4",hataMesaj:err.message})
    }
    
    
    
    // 5 - verileri database den alma
    try {
      
      // DATABASEDEKİ VERİLERİ GÖNDERELİM
      const collectionWbs = context.services.get("mongodb-atlas").db("iyiRP").collection("wbs")
      const mongoReply = collectionWbs.find(
        {isDeleted:false,proje,blok,wbsName,versiyon},
        {_id:1,sira:1,kod:1,createdBy:1,updatedBy:1}
      )
      
      
      return({ok:true,mesaj:"Güncellemeler yapıldı.",mongoReply});
      
    } catch(err){
      return ({hata:true,hataYeri:"FONK // addWbs // MONGO-5",hataMesaj:err.message})
    }
    
}