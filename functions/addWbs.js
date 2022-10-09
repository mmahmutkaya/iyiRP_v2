exports = async function (request, response) {
  
  objHeader = request.headers
  
  //fonksiyon global değişkenleri
  let hataText;
  

  
  // MONGO-1 - Gelen HEADER bilgilerinin analizi yapılıyor
  let kullaniciMail;
  let geciciKey;
  let proje

  
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

  } catch (err){
    return ({hata:true,hataYeri:"FONK // addWbs // MONGO-1",hataMesaj:err.message})
  }
  
  
  // MONGO-2 - kullanıcının bilgilerini database den alalım
  let user;
  

  try {
    const collectionUsers = context.services.get("mongodb-atlas").db("iyiRP").collection("users")
    const userArray = await collectionUsers.find({kullaniciMail}).toArray()
    
    hataText = "gelen istekteki mail adresi sistemde kayıtlı değil"
    if(userArray.length === 0) return ({hata:true,hataYeri:"FONK // addWbs",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    user = userArray[0]
    
    if(!user.mailTeyit) return ({hata:true,hataTanim:"mailTeyit",hataYeri:"FONK // addWbs",hataMesaj:"Mail adresi henüz doğrulanmamış."})
    
    if(!user.uyelikOnay) return ({hata:true,hataTanim:"uyelikOnay",hataYeri:"FONK // addWbs",hataMesaj:"Üyeliğiniz onay bekliyor."})
    
    hataText = "gelen istekteki geciciKey sistemdeki ile eşleşmiyor"
    if(geciciKey !== user.geciciKey.toString()) return ({hata:true,hataTanim:"geciciKod",hataYeri:"FONK // addWbs",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    // yetki sorgulaması
    // if (!user.hasOwnProperty("yetkiler")) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // addWbs",hataMesaj:"Bu işleme yetkiniz bulunmuyor"})
    // let sTr = proje + "-" + "wbs"
    // if (!user.yetkiler.hasOwnProperty(sTr)) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // addWbs",hataMesaj:"Bu işleme yetkiniz bulunmuyor"})
    // if (!user.yetkiler[sTr].includes("R")) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // addWbs",hataMesaj:"Bu alanda veri okuma yetkiniz bulunmuyor"})

  } catch(err) {
    return ({hata:true,hataYeri:"FONK // addWbs // MONGO-2",hataMesaj:err.message})
  }
  
  
  
  // MONGO-3 - versiyon tespiti
  let versiyon
  try {
    const collectionVersiyonlar = context.services.get("mongodb-atlas").db("iyiRP").collection("versiyonlar")
    const versiyonArray = await collectionVersiyonlar.find({proje}).toArray()
    versiyon = versiyonArray[0].guncelVersiyon
    
  } catch(err){
    return ({hata:true,hataYeri:"FONK // addWbs // MONGO-3",hataMesaj:err.message})
  }
  


  // 3a - WBS Node kontrolü
  // WBS / WBS - ilk parentleri db de ya da kontrollü başka bir şekilde manuel oluşturuyoruz, daha sonra tüm sorgularda parent id HEADER kısmında olmalı
  // try {
  //   const isParentIdExist = await context.services.get("mongodb-atlas").db("iyiRP").collection("wbs").find({_id:new BSON.ObjectId(parentId)}).toArray()
  //   if(isParentIdExist.length === 0) return ({hata:true,hataYeri:"FONK // addWbs",hataMesaj:"Kayıt yapılmak istenen üst seviye DB de tespit edilemedi, program sorumlusu ile iletişime geçiniz."})
  // } catch(err){
  //   return ({hata:true,hataYeri:"FONK // addWbs // MONGO-3a",hataMesaj:err.message})
  // }
  
  
    
  // MONGO-4 - gelen veri işlemleri - body kısmında veri var mı?
  let gelenWbs
  
  try{
    gelenWbs = JSON.parse(request.body.text());
    // return gelenWbs
  } catch(err){
    return ({hata:true,hataYeri:"FONK // addWbs // MONGO-4",hataMesaj:"Gelen sorguda gövde(body) verisi yok ya da hatalı, MONGO --> " + err.message})
  }
  
  
  
  
  // MONGO-5 - gelen verilerin kaydı
  FonkGelenVeri: try {
    
    if (gelenWbs.length === 0) break FonkGelenVeri;
    
    if (gelenWbs[0].seviye == 1) break FonkGelenVeri; //parent seviye 1 eklenecek
    
    if (!(user.kullaniciMail == "bilgieymen@hotmail.com"  || user.kullaniciMail == "mmahmutkaya@gmail.com"  || user.kullaniciMail == "iyiarpi212@gmail.com" || user.kullaniciMail == "omer.ekizler@gapinsaat.com" || user.kullaniciMail == "serdar.gungor@gapinsaat.com") ) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // addWbs",hataMesaj:"Bu alana veri kaydetme yetkiniz bulunmuyor"})
    
    // database deki collection belirleyelim
    const collectionWbs = context.services.get("mongodb-atlas").db("iyiRP").collection("wbs")
    
    // işlemler için zamanı belli edelim
    const zaman = Date.now()
    
    // eklenecek ve güncellenecek diye gelen object arrayleri ayırlarım
    const gelenWbsNodes_ekle =[];
    const gelenWbsNodes_guncelle =[];
    const gelenWbsNodes_sil =[];
    
    let checkSira_Ekle = false
    let checkSira_Guncelle = false
    let checkIsim_Ekle = false

    gelenWbs.map(item => {
      

      if (item.dbIslem === "sil") {
        gelenWbsNodes_sil.push({
          id:item.id,
          isDeleted:zaman,
          deletedAt:zaman,
          deletedBy:kullaniciMail,
        });
      }
      
      
      // ihale Id olan güncelleme
      if (item.dbIslem === "guncelle" && item.ihaleId.length > 0){
        
        if (typeof item.sira === "string") {
          if (item.sira.length === 0) {
            checkSira_Ekle = true
          }
        }
        
        if (typeof item.sira === "number") {
          if (!item.sira > 0) {
            checkSira_Ekle = true
          }
        }
        
        gelenWbsNodes_guncelle.push({
          id:item.id,
          parentId:new BSON.ObjectId(item.parentId),
          ihaleId:new BSON.ObjectId(item.ihaleId),
          tur:item.tur,
          sira:parseFloat(item.sira),
          updatedAt:zaman,
          updatedBy:kullaniciMail,
        });
      }
      
      
      // ihale Id olmayan güncelleme
      if (item.dbIslem === "guncelle" && item.ihaleId.length == 0){
        
        if (typeof item.sira === "string") {
          if (item.sira.length === 0) {
            checkSira_Ekle = true
          }
        }
        
        if (typeof item.sira === "number") {
          if (!item.sira > 0) {
            checkSira_Ekle = true
          }
        }
        
        gelenWbsNodes_guncelle.push({
          id:item.id,
          parentId:new BSON.ObjectId(item.parentId),
          tur:item.tur,
          sira:parseFloat(item.sira),
          updatedAt:zaman,
          updatedBy:kullaniciMail,
        });
      }
      
      
      
      // ihale ıd olan ekleme
      if (item.dbIslem === "ekle" && item.ihaleId.length > 0){
        
        if (typeof item.sira === "string") {
          if (item.sira.length === 0) {
            checkSira_Ekle = true
          }
        }
        
        if (typeof item.sira === "number") {
          if (!item.sira > 0) {
            checkSira_Ekle = true
          }
        }

        if (typeof item.isim === "string") {
          if (item.isim.length === 0) {
            checkIsim_Ekle = true
          }
        }
        
        if (typeof item.isim === "string") {
          if (item.isim === "...") {
            checkIsim_Ekle = true
          }
        }
        
        if (typeof item.isim === "number") {
          if (!item.isim > 0) {
            checkIsim_Ekle = true
          }
        }
        
        gelenWbsNodes_ekle.push({
          parentId:new BSON.ObjectId(item.parentId),
          ihaleId:new BSON.ObjectId(item.ihaleId),
          seviye:item.seviye,
          sira:parseFloat(item.sira),
          isim:item.isim,
          tur:item.tur,
          proje,
          versiyon,
          isDeleted:false,
          createdAt:zaman,
          createdBy:kullaniciMail,
        });
      }
      
      
      // ihale ıd olmayan ekleme
      if (item.dbIslem === "ekle"  && item.ihaleId.length == 0){
        
        if (typeof item.sira === "string") {
          if (item.sira.length === 0) {
            checkSira_Ekle = true
          }
        }
        
        if (typeof item.sira === "number") {
          if (!item.sira > 0) {
            checkSira_Ekle = true
          }
        }

        if (typeof item.isim === "string") {
          if (item.isim.length === 0) {
            checkIsim_Ekle = true
          }
        }
        
        if (typeof item.isim === "string") {
          if (item.isim === "...") {
            checkIsim_Ekle = true
          }
        }
        
        if (typeof item.isim === "number") {
          if (!item.isim > 0) {
            checkIsim_Ekle = true
          }
        }
        
        gelenWbsNodes_ekle.push({
          parentId:new BSON.ObjectId(item.parentId),
          seviye:item.seviye,
          sira:parseFloat(item.sira),
          isim:item.isim,
          tur:item.tur,
          proje,
          versiyon,
          isDeleted:false,
          createdAt:zaman,
          createdBy:kullaniciMail,
        });
      }
      
    });
    
    
    
    
    if (checkSira_Ekle) return ({hata:true,hataYeri:"FONK // addWbs",hataMesaj:"Sira numarası verilmemiş kayıt eklenemez.."}) 
    if (checkSira_Guncelle) return ({hata:true,hataYeri:"FONK // addWbs",hataMesaj:"Sira numarası silinemez"}) 
    if (checkIsim_Ekle) return ({hata:true,hataYeri:"FONK // addWbs",hataMesaj:"Wbs ismi boş bırakılamaz"}) 
    
    
    
    
    
    // ALTINA POZ EKLENMİŞSE SİLİNMESİN
    // Silinemeycek dolu MetrajNodes ları tespit etme
    const collectionPozlar = context.services.get("mongodb-atlas").db("iyiRP").collection("pozlar")
    let pozParentIds = []
    if (gelenWbsNodes_sil.length) {
      pozParentIds = await collectionPozlar.find(
        {proje,isDeleted:false},
        {parentNodeId:1,'_id': false}
      ).toArray();
    }
    
    let silinemezler = []
    let silinemez
    
    if (gelenWbsNodes_sil.length) {
      await gelenWbsNodes_sil.map(item => {
        silinemez = pozParentIds.find(x => x.parentNodeId == item.id)
        if(silinemez) silinemezler.push(silinemez)
      })
    }
    
    // return ({pozParentIds,gelenWbsNodes_sil,silinemezler})
    
    if (silinemezler.length) return ({hata:true,hataYeri:"FONK // addPoz",hataMesaj:"Silmek istediğiniz başlık ya da başlıklar altında tanımlanmış poz ya da pozlar mevcut, öncelikle ilgili pozları silmelisiniz."}) 
    

    

    // DATABASE - silme
    if (gelenWbsNodes_sil.length) {
      await gelenWbsNodes_sil.map(item =>{
        collectionWbs.findOneAndUpdate(
          {_id:new BSON.ObjectId(item.id)},
          { $set: {isDeleted:zaman}},
          { upsert: true, new: true }
        );
      });
    }
          
    // DATABASE - guncelleme
    if (gelenWbsNodes_guncelle.length) {
      await gelenWbsNodes_guncelle.map(item =>{
        collectionWbs.findOneAndUpdate(
          {_id:new BSON.ObjectId(item.id)},
          { $set: {...item}},
          { upsert: true, new: true }
        );
      });
    }
    
    
    // DATABASE - ekleme
    if (gelenWbsNodes_ekle.length) {
      await collectionWbs.insertMany(gelenWbsNodes_ekle);
    }
    

    } catch(err){
      return ({hata:true,hataYeri:"FONK // addWbs // MONGO-5",hataMesaj:err.message});
    }
    
    
    
    
    
    
    
  // MONGO-6 - geseviye 1 - ilk satır kaydı
  Seviye1Ekle: try {

    if (gelenWbs.length === 0) break Seviye1Ekle;
    
    if (gelenWbs[0].seviye !== "1") break Seviye1Ekle;
    
    let sTr = proje + "-" + "wbs"
    if (!user.yetkiler[sTr].includes("W")) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // addWbs",hataMesaj:"Bu alana veri kaydetme yetkiniz bulunmuyor"})
    
    // database deki collection belirleyelim
    const collectionWbs = context.services.get("mongodb-atlas").db("iyiRP").collection("wbs")
    
    // işlemler için zamanı belli edelim
    const zaman = Date.now()
    
    // eklenecek ve güncellenecek diye gelen object arrayleri ayırlarım
    const gelenWbsNodes_ekle =[];

    let checkIsim_Ekle = false
    let checkSira_Ekle = false

    gelenWbs.map(item => {
      

      if (item.dbIslem === "ekle") {
        
        if (typeof item.sira === "string") {
          if (item.sira.length === 0) {
            checkSira_Ekle = true
          }
        }
        
        if (typeof item.sira === "number") {
          if (!item.sira > 0) {
            checkSira_Ekle = true
          }
        }

        if (typeof item.isim === "string") {
          if (item.isim.length === 0) {
            checkIsim_Ekle = true
          }
        }
        
        if (typeof item.isim === "string") {
          if (item.isim === "...") {
            checkIsim_Ekle = true
          }
        }
        
        if (typeof item.isim === "number") {
          if (!item.isim > 0) {
            checkIsim_Ekle = true
          }
        }
        

        gelenWbsNodes_ekle.push({
          parentId:null,
          ihaleId:null, // burası 1. seviye - ilk node
          seviye:item.seviye,
          sira:parseInt(item.sira),
          isim:item.isim,
          tur:item.tur,
          proje,
          versiyon,
          isDeleted:false,
          createdAt:zaman,
          createdBy:kullaniciMail,
        });
      }
      
    });
    
    if (checkSira_Ekle) return ({hata:true,hataYeri:"FONK // addWbs",hataMesaj:"Sira numarası verilmemiş kayıt eklenemez.."}) 
    if (checkIsim_Ekle) return ({hata:true,hataYeri:"FONK // addWbs",hataMesaj:"Wbs ismi boş bırakılamaz"}) 
    
    // DATABASE - ekleme
    if (gelenWbsNodes_ekle.length) {
      await collectionWbs.insertMany(gelenWbsNodes_ekle);
    }
    

  } catch(err){
    return ({hata:true,hataYeri:"FONK // addWbs // MONGO-6",hataMesaj:err.message});
  }
    
            
    
    
    // MONGO-7 - VERİLERİ DB DEN ALMA
    try {
      
      // DATABASEDEKİ VERİLERİ GÖNDERELİM
      const collectionWbs = context.services.get("mongodb-atlas").db("iyiRP").collection("wbs");
      const mongoReply = await collectionWbs.find(
        {isDeleted:false,proje,versiyon},
        {_id:1,parentId:1,seviye:1,sira:1,isim:1,tur:1,ihaleId:1,createdBy:1,updatedBy:1}
      ).sort( { sira: 1 } ).toArray();
      
      return({ok:true,mesaj:"Güncellemeler yapıldı.",mongoReply});
      
    } catch(err){
      return ({hata:true,hataYeri:"FONK // addWbs // MONGO-7",hataMesaj:err.message});
    }        
    
    
    
    
};