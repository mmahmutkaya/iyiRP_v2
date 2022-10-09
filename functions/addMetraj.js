exports = async function (request, response) {
  
  objHeader = request.headers
  
  //fonksiyon global değişkenleri
  let hataText;
  
  
  // 1 - Gelen HEADER bilgilerinin analizi yapılıyor
  let kullaniciMail;
  let geciciKey;
  let proje
  let tur;
  let parentNodeId;

  try {
    
    hataText = "\"gelen istekte mail adresi bulunamadı\""
    if(!objHeader.hasOwnProperty('Kullanici-Mail')) return ({hata:true,hataYeri:"FONK // addPoz",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    kullaniciMail = objHeader["Kullanici-Mail"][0];
    validateEmail = context.functions.execute("validateEmail", kullaniciMail);
    hataText = "gelen istekteki mail adresi hatalı"
    if(validateEmail == null) return ({hata:true,hataYeri:"FONK // addPoz",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    hataText = "\"gelen istekte geciciKey bulunamadı\""
    if(!objHeader.hasOwnProperty('Gecici-Key')) return ({hata:true,hataYeri:"FONK // addPoz",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    geciciKey = objHeader["Gecici-Key"][0];
    
    if(!objHeader.hasOwnProperty('Proje')) return ({hata:true,hataYeri:"FONK // addPoz",hataMesaj:"Gelen sorguda \"Proje\" HEADER tespit edilemedi, yönetici ile iletişime geçiniz."})
    proje = objHeader["Proje"][0];
    if(proje.length == 0) return ({hata:true,hataYeri:"FONK // addPoz",hataMesaj:"Gelen sorguda \"Proje\" HEADER var fakat boş, yönetici ile iletişime geçiniz."})

    if(!objHeader.hasOwnProperty('Tur')) return ({hata:true,hataYeri:"FONK // addPoz",hataMesaj:"Gelen sorguda \"Tur\" HEADER tespit edilemedi, yönetici ile iletişime geçiniz."})
    tur = objHeader["Tur"][0];
    if(tur.length == 0) return ({hata:true,hataYeri:"FONK // addPoz",hataMesaj:"Gelen sorguda \"Tur\" HEADER var fakat boş, yönetici ile iletişime geçiniz."})

    if(!objHeader.hasOwnProperty('Parent-Node-Id')) return ({hata:true,hataYeri:"FONK // addPoz",hataMesaj:"Gelen sorguda \"Parent-Node-Id\" HEADER tespit edilemedi, yönetici ile iletişime geçiniz."})
    parentNodeId = objHeader["Parent-Node-Id"][0];
    if(parentNodeId.length == 0) return ({hata:true,hataYeri:"FONK // addPoz",hataMesaj:"Gelen sorguda \"Parent-Node-Id\" HEADER var fakat boş, yönetici ile iletişime geçiniz."})

  } catch (err){
    return ({hata:true,hataYeri:"FONK // addPoz // MONGO-1",hataMesaj:err.message})
  }
  
  
  // 2 - kullanıcının bilgilerini database den alalım
  let user;

  try {
    const collectionUsers = context.services.get("mongodb-atlas").db("iyiRP").collection("users")
    const userArray = await collectionUsers.find({kullaniciMail}).toArray()
    
    hataText = "gelen istekteki mail adresi sistemde kayıtlı değil"
    if(userArray.length === 0) return ({hata:true,hataYeri:"FONK // addPoz",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    user = userArray[0]
    
    if(!user.mailTeyit) return ({hata:true,hataTanim:"mailTeyit",hataYeri:"FONK // addPoz",hataMesaj:"Mail adresi henüz doğrulanmamış."})
    
    if(!user.uyelikOnay) return ({hata:true,hataTanim:"uyelikOnay",hataYeri:"FONK // addPoz",hataMesaj:"Üyeliğiniz onay bekliyor."})
    
    hataText = "gelen istekteki geciciKey sistemdeki ile eşleşmiyor"
    if(geciciKey !== user.geciciKey.toString()) return ({hata:true,hataTanim:"geciciKod",hataYeri:"FONK // addPoz",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    // yetki sorgulaması
    if (!user.hasOwnProperty("yetkiler")) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // addPoz",hataMesaj:"Bu alanda veri okuma yetkiniz bulunmuyor"})
    let sTr = proje + "-" + "poz"
    if (!user.yetkiler.hasOwnProperty(sTr)) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // addPoz",hataMesaj:"Bu alanda veri okuma yetkiniz bulunmuyor"})
    if (!user.yetkiler[sTr].includes("R")) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // addPoz",hataMesaj:"Bu alanda veri okuma yetkiniz bulunmuyor"})

  } catch(err) {
    return ({hata:true,hataYeri:"FONK // addPoz // MONGO-2",hataMesaj:err.message})
  }
  
  
  
  // MONGO-3 - versiyon tespiti
  let versiyon
  try {
    const collectionVersiyonlar = context.services.get("mongodb-atlas").db("iyiRP").collection("versiyonlar")
    const versiyonArray = await collectionVersiyonlar.find({proje}).toArray()
    versiyon = versiyonArray[0].guncelVersiyon
    
  } catch(err){
    return ({hata:true,hataYeri:"FONK // addPoz // MONGO-3",hataMesaj:err.message})
  }
  
  


  // // 2a - LBS Node kontrolü
  // let parentNodes = []
  // let parentNodeIsmi = ""
  // let parentNodeGuncelleme
  // try {
  //   const collectionWbs = context.services.get("mongodb-atlas").db("iyiRP").collection("wbs")
  //   const parentNodes = await collectionWbs.find({_id:new BSON.ObjectId(parentNodeId)},{lastUpdatedChildPoz:1}).toArray()
  //   if(parentNodes.length === 0) return ({hata:true,hataYeri:"FONK // addPoz",hataMesaj:"Sistemde poz eklenecek herhangi bir alan (WBS NODE) bulunamadı."})
  //   // return parentNodes
  //   // const parentNode = parentNodes.find(item => item._id == parentNodeId)
  //   const parentNode = parentNodes[0]
  //   // if(!parentNode) return ({hata:true,hataYeri:"FONK // addPoz",hataMesaj:"Poz eklemek istediğiniz alan (WBS NODE) sistemde bulunamadı."})
  //   parentNodeGuncelleme = parentNode.lastUpdatedChildPoz
  // } catch(err){
  //   return ({hata:true,hataYeri:"FONK // addPoz // MONGO-2a",hataMesaj:err.message})
  // }
  
  
    
  // 4 - gelen veri işlemleri - body kısmında veri var mı?
  let gelenPozlar
  
  try{
    gelenPozlar = JSON.parse(request.body.text());
    // return gelenPozlar
  } catch(err){
    return ({hata:true,hataYeri:"FONK // addPoz // MONGO-4",hataMesaj:"Gelen sorguda gövde(body) verisi yok ya da hatalı, MONGO --> " + err.message})
  }
  
 // işlemler için zamanı belli edelim
  const zaman = Date.now()
  
  // 5 - gelen verilerin kaydı
  FonkDbGuncelle: try {
    
    if (gelenPozlar.length === 0) break FonkDbGuncelle;

    let sTr = proje + "-" + "poz"
    if (!user.yetkiler[sTr].includes("W")) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // addPoz",hataMesaj:"Bu alanda veri kaydetme yetkiniz bulunmuyor"})
    
    // database deki collection belirleyelim
    const collectionPozlar = context.services.get("mongodb-atlas").db("iyiRP").collection("pozlar")
    
    // eklenecek ve güncellenecek diye gelen object arrayleri ayırlarım
    const gelenPozlar_ekle =[];
    const gelenPozlar_guncelle =[];
    const gelenPozlar_sil =[];
    
    let checkSiraNo_Ekle = false
    let checkSiraNo_Guncelle = false
    let checkPozKod_Ekle = false

    gelenPozlar.map(item => {
      
      if (item.dbIslem === "sil") {
        
        gelenPozlar_sil.push({
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

        gelenPozlar_guncelle.push({
          id:item.id,
          sira:item.sira,
          
          updatedAt:zaman,
          updatedBy:kullaniciMail,
        });
        
        
      } else if (item.dbIslem === "ekle") {
        item.sira = parseFloat(item.sira)
        if (!item.sira > 0) {
          checkSiraNo_Ekle = true
        }

        if (typeof item.pozNo === "string") {
          if (item.pozNo.length === 0) {
            checkPozKod_Ekle = true
          }
        }
        
        if (typeof item.pozNo === "number") {
          if (!item.pozNo > 0) {
            checkPozKod_Ekle = true
          }
        }
        
        gelenPozlar_ekle.push({
          ...item,
          proje,
          parentNodeId:new BSON.ObjectId(parentNodeId),
          versiyon,
          isDeleted:false,
          createdAt:zaman,
          createdBy:kullaniciMail,
        });
        

      }
    });
    
    if (checkSiraNo_Ekle) return ({hata:true,hataYeri:"FONK // addPoz",hataMesaj:"Sıra numarası verilmemiş kayıt eklenemez.."}) 
    if (checkSiraNo_Guncelle) return ({hata:true,hataYeri:"FONK // addPoz",hataMesaj:"Sıra numarası silinemez"}) 
    if (checkPozKod_Ekle) return ({hata:true,hataYeri:"FONK // addPoz",hataMesaj:"Poz numarası boş bırakılamaz"}) 
    

    
    // NODE GÜNCELLEME KAYDI - DAHA AZ SORGULAMA İÇİN
    const collectionWbs = context.services.get("mongodb-atlas").db("iyiRP").collection("wbs")
    collectionWbs.findOneAndUpdate(
      {_id:new BSON.ObjectId(parentNodeId)},
      { $set: {lastUpdatedChild:zaman}},
      { upsert: true, new: true }
    );
    
    
    
    // DATABASE - silme
    if (gelenPozlar_sil.length) {
      await gelenPozlar_sil.map(item =>{
        collectionPozlar.findOneAndUpdate(
          {_id:new BSON.ObjectId(item.id)},
          { $set: {isDeleted:zaman}},
          { upsert: true, new: true }
        );
      });
    }
          
    // DATABASE - guncelleme
    if (gelenPozlar_guncelle.length) {
      await gelenPozlar_guncelle.map(item =>{
        collectionPozlar.findOneAndUpdate(
          {_id:new BSON.ObjectId(item.id)},
          { $set: {...item}},
          { upsert: true, new: true }
        );
      });
    }
    
    
    // DATABASE - ekleme
    if (gelenPozlar_ekle.length) {
      await collectionPozlar.insertMany(gelenPozlar_ekle);
    }
    
    } catch(err){
      return ({hata:true,hataYeri:"FONK // addPoz // MONGO-5",hataMesaj:err.message});
    }
    
    
    
    // 6 - verileri database den alma 
    try {
      
      // DATABASEDEKİ VERİLERİ GÖNDERELİM
      const collectionPozlar = context.services.get("mongodb-atlas").db("iyiRP").collection("pozlar");
      const mongoReply = await collectionPozlar.find(
        {isDeleted:false,parentNodeId:new BSON.ObjectId(parentNodeId)},
        {_id:1,parentNodeId,sira:1,pozNo:1,pozTanim:1,pozBirim:1,createdBy:1,updatedBy:1}
      ).sort( { sira: 1 } );

      return({ok:true,mesaj:"Güncellemeler yapıldı.",mongoReply,zaman});
      
    } catch(err){
      return ({hata:true,hataYeri:"FONK // addPoz // MONGO-6",hataMesaj:err.message});
    }
    
    
    
};