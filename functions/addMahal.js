exports = async function (request, response) {
  
  objHeader = request.headers
  
  //fonksiyon global değişkenleri
  let hataText;
  
  
  // 1 - Gelen HEADER bilgilerinin analizi yapılıyor
  let kullaniciMail;
  let geciciKey;
  let proje
  let blokId;
  let parentTur;
  let tur;
  let parentNodeId

  let projeData
  
  try {
    
    hataText = "\"gelen istekte mail adresi bulunamadı\""
    if(!objHeader.hasOwnProperty('Kullanici-Mail')) return ({hata:true,hataYeri:"FONK // addMahal",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    kullaniciMail = objHeader["Kullanici-Mail"][0];
    validateEmail = context.functions.execute("validateEmail", kullaniciMail);
    hataText = "gelen istekteki mail adresi hatalı"
    if(validateEmail == null) return ({hata:true,hataYeri:"FONK // addMahal",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    hataText = "\"gelen istekte geciciKey bulunamadı\""
    if(!objHeader.hasOwnProperty('Gecici-Key')) return ({hata:true,hataYeri:"FONK // addMahal",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    geciciKey = objHeader["Gecici-Key"][0];
    
    if(!objHeader.hasOwnProperty('Proje')) return ({hata:true,hataYeri:"FONK // addMahal",hataMesaj:"Gelen sorguda \"Proje\" HEADER tespit edilemedi, program sorumlusu ile iletişime geçiniz."})
    proje = objHeader["Proje"][0];
    if(proje.length == 0) return ({hata:true,hataYeri:"FONK // addMahal",hataMesaj:"Gelen sorguda \"Proje\" HEADER var fakat boş, program sorumlusu ile iletişime geçiniz."})
    
    // proje ismi belli oldu, peojeData verisni alalım, aşağıda bir kaç yerde daha kullanıcaz
    projeData = await context.services.get("mongodb-atlas").db("iyiRP").collection("projeler").findOne({isim:proje})
    
    // projeData ile ilk kontrol
    if(!projeData) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // addMahal",hataMesaj:"(Header) içinde talep ettiğiniz \"" + proje + "\" projesine ait projeData verisi bilgisi sistemde bulunamadı, program sorumlusuna bilgi veriniz."})
  
    if(!objHeader.hasOwnProperty('Blok-Id')) return ({hata:true,hataYeri:"FONK // addMahal",hataMesaj:"Gelen sorguda \"Blok-Id\" HEADER tespit edilemedi, program sorumlusu ile iletişime geçiniz."})
    blokId = objHeader["Blok-Id"][0];
    if(blokId.length == 0) return ({hata:true,hataYeri:"FONK // addMahal",hataMesaj:"Gelen sorguda \"Blok-Id\" HEADER var fakat boş, program sorumlusu ile iletişime geçiniz."})
    
    if(!projeData.yetkiler.bloklar.hasOwnProperty(blokId)) return ({hata:true,hataYeri:"FONK // addMahal",hataMesaj:"(HEADER) içinde gelen blok (id) bilgisi sistemdeki projeData verisi içinde tespit edilemedi, program sorumlusu ile iletişime geçiniz."})

    if(!objHeader.hasOwnProperty('Parent-Tur')) return ({hata:true,hataYeri:"FONK // addMahal",hataMesaj:"Gelen sorguda \"Parent-Tur\" HEADER tespit edilemedi, program sorumlusu ile iletişime geçiniz."})
    parentTur = objHeader["Parent-Tur"][0];
    if(parentTur.length == 0) return ({hata:true,hataYeri:"FONK // addMahal",hataMesaj:"Gelen sorguda \"Parent-Tur\" HEADER var fakat boş, program sorumlusu ile iletişime geçiniz."})

    if(!objHeader.hasOwnProperty('Tur')) return ({hata:true,hataYeri:"FONK // addMahal",hataMesaj:"Gelen sorguda \"Tur\" HEADER tespit edilemedi, program sorumlusu ile iletişime geçiniz."})
    tur = objHeader["Tur"][0];
    if(tur.length == 0) return ({hata:true,hataYeri:"FONK // addMahal",hataMesaj:"Gelen sorguda \"Tur\" HEADER var fakat boş, program sorumlusu ile iletişime geçiniz."})

    if(!objHeader.hasOwnProperty('Parent-Node-Id')) return ({hata:true,hataYeri:"FONK // addMahal",hataMesaj:"Gelen sorguda \"Parent-Node-Id\" HEADER tespit edilemedi, program sorumlusu ile iletişime geçiniz."})
    parentNodeId = objHeader["Parent-Node-Id"][0];
    if(tur.parentNodeId == 0) return ({hata:true,hataYeri:"FONK // addMahal",hataMesaj:"Gelen sorguda \"Parent-Node-Id\" HEADER var fakat boş, program sorumlusu ile iletişime geçiniz."})


  } catch (err){
    return ({hata:true,hataYeri:"FONK // addMahal // MONGO-1",hataMesaj:err.message})
  }
  
  
  // MONGO 2 - kullanıcının bilgilerini database den alalım
  let user;

  try {
    const collectionUsers = context.services.get("mongodb-atlas").db("iyiRP").collection("users")
    const userArray = await collectionUsers.find({kullaniciMail}).toArray()
    
    hataText = "gelen istekteki mail adresi sistemde kayıtlı değil"
    if(userArray.length === 0) return ({hata:true,hataYeri:"FONK // addMahal",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    user = userArray[0]
    
    if(!user.mailTeyit) return ({hata:true,hataTanim:"mailTeyit",hataYeri:"FONK // addMahal",hataMesaj:"Mail adresi henüz doğrulanmamış."})
    
    if(!user.uyelikOnay) return ({hata:true,hataTanim:"uyelikOnay",hataYeri:"FONK // addMahal",hataMesaj:"Üyeliğiniz onay bekliyor."})
    
    hataText = "gelen istekteki geciciKey sistemdeki ile eşleşmiyor"
    if(geciciKey !== user.geciciKey.toString()) return ({hata:true,hataTanim:"geciciKod",hataYeri:"FONK // addMahal",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    
    // yetki sorgulaması
    
    if(!projeData.yetkiler.bloklar[blokId].fonksiyonlar.addMahal["okuma"].includes(kullaniciMail)) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // addMahal",hataMesaj:"İlgili bloğun mahallerini okuma yetkiniz bulunmuyor, ekranda veri varsa güncel olmayabilir."})

    // if (!user.hasOwnProperty("yetkiler")) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // addMahal",hataMesaj:"Bu alanda veri okuma yetkiniz bulunmuyor"})
    // let sTr = proje + "-" + "mahal"
    // if (!user.yetkiler.hasOwnProperty(sTr)) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // addMahal",hataMesaj:"Bu alanda veri okuma yetkiniz bulunmuyor"})
    // if (!user.yetkiler[sTr].includes("R")) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // addMahal",hataMesaj:"Bu alanda veri okuma yetkiniz bulunmuyor"})

  } catch(err) {
    return ({hata:true,hataYeri:"FONK // addMahal // MONGO-2",hataMesaj:err.message})
  }
  
  
  
  // MONGO-3 - versiyon tespiti
  let versiyon
  try {
    const collectionVersiyonlar = context.services.get("mongodb-atlas").db("iyiRP").collection("versiyonlar")
    const versiyonArray = await collectionVersiyonlar.find({proje}).toArray()
    versiyon = versiyonArray[0].guncelVersiyon
    
  } catch(err){
    return ({hata:true,hataYeri:"FONK // addMahal // MONGO-3",hataMesaj:err.message})
  }
  

 
  // MONGO 4 - gelen veri işlemleri - body kısmında veri var mı?
  let gelenMahaller
  
  try{
    gelenMahaller = JSON.parse(request.body.text());
    // return gelenMahaller
  } catch(err){
    return ({hata:true,hataYeri:"FONK // addMahal // MONGO-4",hataMesaj:"Gelen sorguda gövde(body) verisi yok ya da hatalı, MONGO --> " + err.message})
  }
  
  
  const zaman = Date.now()

  // MONGO 5 - gelen verilerin kaydı
  FonkDbGuncelle: try {
    
    if (gelenMahaller.length === 0) break FonkDbGuncelle;
    
    // yetki sorgulaması
    if(!projeData.yetkiler.bloklar[blokId].fonksiyonlar.addMahal[tur].includes(kullaniciMail)) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // addMahal",hataMesaj:"İlgili bloğun mahallerini değiştirme yetkiniz bulunmuyor, fakat \"YENİLE\" tuşuna basarak güncel mahalleri görebilirsiniz."})

    // database deki collection belirleyelim
    const collectionMahaller = context.services.get("mongodb-atlas").db("iyiRP").collection("mahaller")
    
    // eklenecek ve güncellenecek diye gelen object arrayleri ayırlarım
    const gelenMahaller_ekle =[];
    const gelenMahaller_guncelle =[];
    const gelenMahaller_sil =[];
    
    let checkSiraNo_Ekle = false
    let checkSiraNo_Guncelle = false
    let checkMahalKod_Ekle = false
    let checkMahalIsim_Ekle = false


    gelenMahaller.map(item => {
      
      if (item.dbIslem === "sil") {
        
        gelenMahaller_sil.push({
          id:item.id,
          isDeleted:zaman,
          deletedAt:zaman,
          deletedBy:kullaniciMail,
        });
        
        
      } else if (item.dbIslem === "guncelle"){
        
        item.sira = parseFloat(item.sira)
        if (!item.sira > 0) {
          checkSiraNo_Guncelle = true
        }

        gelenMahaller_guncelle.push({
          id:new BSON.ObjectId(item.id),
          
          sira:parseFloat(item.sira),
          
          mahalKisim:String(item.mahalKisim),
          odaNo:String(item.odaNo),
          mahalTip:String(item.mahalTip),
          // mahalIsim:String(item.mahalIsim), - değiştirilemesin
          // mahalKod:String(item.mahalKod) - değiştirilemesin
          cevreUzunluk:String(item.cevreUzunluk),
          zeminAlan:String(item.zeminAlan),

          updatedAt:zaman,
          updatedBy:kullaniciMail,
        });
        
        
      } else if (item.dbIslem === "ekle") {
        
        item.sira = parseFloat(item.sira)
        if (!item.sira > 0) {
          checkSiraNo_Ekle = true
        }

        if (typeof item.mahalKod === "string") {
          if (item.mahalKod.length === 0) {
            checkMahalKod_Ekle = true
          }
        }
        
        if (item.mahalIsim.length === 0) {
          checkMahalIsim_Ekle = true
        }
        
        if (typeof item.mahalKod === "number") {
          if (!item.mahalKod > 0) {
            checkMahalKod_Ekle = true
          }
        }
        
        gelenMahaller_ekle.push({
          
          sira:parseFloat(item.sira),
          
          mahalKisim:String(item.mahalKisim),
          odaNo:String(item.odaNo),
          mahalTip:String(item.mahalTip),
          mahalIsim:String(item.mahalIsim),
          mahalKod:String(item.mahalKod),
          cevreUzunluk:String(item.cevreUzunluk),
          zeminAlan:String(item.zeminAlan),
          
          blokId:new BSON.ObjectId(blokId),
          parentTur,
          tur,
          
          proje,
          parentNodeId:new BSON.ObjectId(parentNodeId),
          versiyon,
          isDeleted:false,
          createdAt:zaman,
          createdBy:kullaniciMail,
        });

      }
    });
    
    if (checkSiraNo_Ekle) return ({hata:true,hataYeri:"FONK // addMahal",hataMesaj:"Sıra numarası verilmemiş kayıt eklenemez.."}) 
    if (checkSiraNo_Guncelle) return ({hata:true,hataYeri:"FONK // addMahal",hataMesaj:"Sıra numarası silinemez"}) 
    if (checkMahalKod_Ekle) return ({hata:true,hataYeri:"FONK // addMahal",hataMesaj:"Mahal kod boş bırakılamaz"}) 
    if (checkMahalIsim_Ekle) return ({hata:true,hataYeri:"FONK // addMahal",hataMesaj:"Mahal ismi boş bırakılamaz"}) 
    

    
    // Poz eşleştirmesi kontrolü - eşleştirilmiş poz varsa silinemesin
    let mahalIds
    if (gelenMahaller_sil.length) {
      const collectionMetrajNodes = context.services.get("mongodb-atlas").db("iyiRP").collection("metrajNodes")
      mahalIds = await collectionMetrajNodes.find(
        {proje,isDeleted:false},
        {mahalId:1}
      ).toArray();
    }
    
    // return mahalIds
    
    let isMahalNodeExist = []
    let silinecekItem
    
    
    if (gelenMahaller_sil.length) {
      gelenMahaller_sil.map(item => {
        silinecekItem = mahalIds.find(x => x.mahalId == item.id)
        if(silinecekItem) isMahalNodeExist.push(silinecekItem)
      })
    }
    
    // return ({"1":mahalIds,"2":isMahalNodeExist,"3":gelenMahaller_sil})
    
    if (isMahalNodeExist.length) return ({hata:true,hataYeri:"FONK // addMahal",hataMesaj:"Silmeye çalıştığınız mahalie poz eşleştirmesi yapılmış, önce eşleştirmeyi kaldırınız."}) 


    // DATABASE - silme
    if (gelenMahaller_sil.length) {
      await gelenMahaller_sil.map(item =>{
        collectionMahaller.findOneAndUpdate(
          {_id:new BSON.ObjectId(item.id)},
          { $set: {isDeleted:zaman}},
          { upsert: true, new: true }
        );
      });
    }
          
   
    
    // PARENT ID ZAMAN GÜNCELLEME KAYDI YENİLEME - DAHA AZ SORGULAMA İÇİN
    const collectionWbs = context.services.get("mongodb-atlas").db("iyiRP").collection("lbs")
    collectionWbs.findOneAndUpdate(
      {_id:new BSON.ObjectId(parentNodeId)},
      { $set: {lastUpdatedChild:zaman}},
      { upsert: true, new: true }
    );
    
    
          
          
    // DATABASE - guncelleme
    if (gelenMahaller_guncelle.length) {
      await gelenMahaller_guncelle.map(item =>{
        collectionMahaller.findOneAndUpdate(
          {_id:item.id},
          { $set: {...item}},
          { upsert: true, new: true }
        );
      });
    }
    
    
    // MetrajNode - verilerini güncelleme
    const collectionMetrajNodes = context.services.get("mongodb-atlas").db("iyiRP").collection("metrajNodes")
    if (gelenMahaller_guncelle.length) {
      await gelenMahaller_guncelle.map(item =>{
        collectionMetrajNodes.findOneAndUpdate(
          {mahalId:item.id},
          { $set: {mahalSiraNo:item.sira}},
          { upsert: true, new: true }
        );
      });
    }
    
    
    // DATABASE - ekleme
    if (gelenMahaller_ekle.length) {
      await collectionMahaller.insertMany(gelenMahaller_ekle);
    }
    
    } catch(err){
      return ({hata:true,hataYeri:"FONK // addMahal // MONGO-5",hataMesaj:err.message});
    }
    
    
    
    // 6 - verileri database den alma
    try {
      
      // DATABASEDEKİ VERİLERİ GÖNDERELİM
      const collectionMahaller = context.services.get("mongodb-atlas").db("iyiRP").collection("mahaller");
      const mongoReply = await collectionMahaller.find(
        {blokId:new BSON.ObjectId(blokId),parentNodeId:new BSON.ObjectId(parentNodeId),parentTur,tur,isDeleted:false},
        {_id:1,parentNodeId:1,sira:1,mahalKisim:1,mahalTip:1,mahalIsim:1,odaNo:1,mahalKod:1,cevreUzunluk:1,zeminAlan:1,createdBy:1,updatedBy:1}
      ).sort( { sira: 1 } );

      return({ok:true,mesaj:"Güncellemeler yapıldı.",mongoReply,zaman});
      
    } catch(err){
      return ({hata:true,hataYeri:"FONK // addMahal // MONGO-6",hataMesaj:err.message});
    }
    
    
    
};