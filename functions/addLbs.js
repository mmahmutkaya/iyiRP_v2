exports = async function (request, response) {
  
  objHeader = request.headers
  
  //fonksiyon global değişkenleri
  let hataText;
  
  
  // 1 - Gelen HEADER bilgilerinin analizi yapılıyor
  let kullaniciMail;
  let geciciKey;
  let proje
  
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
    
    // hataText = "gelen istekteki geciciKey sistemdeki ile eşleşmiyor"
    // if(geciciKey !== user.geciciKey.toString()) return ({hata:true,hataTanim:"geciciKod",hataYeri:"FONK // addLbs",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    // // yetki sorgulaması
    // if(!projeData.yetkiler.bloklar[ihaleId].fonksiyonlar.updateMetrajNodesByPozId[tur].okuma.includes(kullaniciMail)) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // updateMetrajNodesByPozId",hataMesaj:"İlgili pozun \"" + tur + "\" metrajlarını görmeye yetkiniz bulunmuyor, ekranda veri varsa güncel olmayabilir."})



    // if (!user.hasOwnProperty("yetkiler")) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // addLbs",hataMesaj:"Bu işleme yetkiniz bulunmuyor"})
    // let sTr = proje + "-" + "lbs"
    // if (!user.yetkiler.hasOwnProperty(sTr)) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // addLbs",hataMesaj:"Bu işleme yetkiniz bulunmuyor"})
    // if (!user.yetkiler[sTr].includes("R")) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // addLbs",hataMesaj:"Bu alanda veri okuma yetkiniz bulunmuyor"})

  } catch(err) {
    return ({hata:true,hataYeri:"FONK // addLbs // MONGO-2",hataMesaj:err.message})
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
  
  
  
  
  // MONGO-4 - gelen veri işlemleri - body kısmında veri var mı?
  let gelenLbs
  
  try{
    gelenLbs = JSON.parse(request.body.text());
  } catch(err){
    return ({hata:true,hataYeri:"FONK // addLbs // MONGO-4",hataMesaj:"Gelen sorguda gövde(body) verisi yok ya da hatalı, MONGO --> " + err.message})
  }
    
  
     
  // MONGO-5 - gelen verilerin kaydı
  FonkGelenVeri: try {
    
    if (gelenLbs.length === 0) break FonkGelenVeri;
    
    // return "11"
    
    if (gelenLbs[0].seviye == 1) break FonkGelenVeri; //parent seviye 1 eklenecek
    
    // return "12"
    
    // let sTr = proje + "-" + "lbs"
    if (!(user.kullaniciMail == "bilgieymen@hotmail.com"  || user.kullaniciMail == "mmahmutkaya@gmail.com"  || user.kullaniciMail == "iyiarpi212@gmail.com" || user.kullaniciMail == "omer.ekizler@gapinsaat.com" || user.kullaniciMail == "serdar.gungor@gapinsaat.com") ) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // addLbs",hataMesaj:"Bu alana veri kaydetme yetkiniz bulunmuyor"})
    
    // database deki collection belirleyelim
    const collectionLbs = context.services.get("mongodb-atlas").db("iyiRP").collection("lbs")
    
    // işlemler için zamanı belli edelim
    const zaman = Date.now()
    
    // eklenecek ve güncellenecek diye gelen object arrayleri ayırlarım
    const gelenLbsNodes_ekle =[];
    const gelenLbsNodes_guncelle =[];
    const gelenLbsNodes_sil =[];
    
    let checkSira_Ekle = false
    let checkSira_Guncelle = false
    let checkIsim_Ekle = false

    gelenLbs.map(item => {
      

      if (item.dbIslem === "sil") {
        
        gelenLbsNodes_sil.push({
          id:item.id,
          isDeleted:zaman,
          deletedAt:zaman,
          deletedBy:kullaniciMail,
        });
        
        
        
      } 
      
      // guncelleme - blokId olduğunda
      if (item.dbIslem === "guncelle" && item.blokId.length > 0){
        
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

        gelenLbsNodes_guncelle.push({
          id:item.id,
          parentId:new BSON.ObjectId(item.parentId),
          blokId:new BSON.ObjectId(item.blokId),
          tur:item.tur,
          sira:parseFloat(item.sira),
          updatedAt:zaman,
          updatedBy:kullaniciMail,
        });
      } 
      
      
      
      // guncelleme - blokId olmadığında
      if (item.dbIslem === "guncelle" && item.blokId.length == 0){
        
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

        gelenLbsNodes_guncelle.push({
          id:item.id,
          parentId:new BSON.ObjectId(item.parentId),
          tur:item.tur,
          sira:parseFloat(item.sira),
          updatedAt:zaman,
          updatedBy:kullaniciMail,
        });
      } 
      
      
      // ekleme - blokId olduğunda
      if (item.dbIslem === "ekle"&& item.blokId.length > 0){
        
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
        
        gelenLbsNodes_ekle.push({
          parentId:new BSON.ObjectId(item.parentId),
          blokId:new BSON.ObjectId(item.blokId),
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
      
      
      
      // ekleme - blokId olmadığında
      if (item.dbIslem === "ekle" && item.blokId.length == 0){
        
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
        
        gelenLbsNodes_ekle.push({
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
    
    if (checkSira_Ekle) return ({hata:true,hataYeri:"FONK // addLbs",hataMesaj:"Sira numarası verilmemiş kayıt eklenemez.."}) 
    if (checkSira_Guncelle) return ({hata:true,hataYeri:"FONK // addLbs",hataMesaj:"Sira numarası silinemez"}) 
    if (checkIsim_Ekle) return ({hata:true,hataYeri:"FONK // addLbs",hataMesaj:"Lbs ismi boş bırakılamaz"}) 
    
    

    
    // ALTINA MAHAL EKLENMİŞSE SİLİNMESİN
    // Silinemeycek dolu MetrajNodes ları tespit etme
    const collectionMahaller = context.services.get("mongodb-atlas").db("iyiRP").collection("mahaller")
    let mahalParentIds = []
    if (gelenLbsNodes_sil.length) {
      mahalParentIds = await collectionMahaller.find(
        {proje,isDeleted:false},
        {parentNodeId:1,'_id': false}
      ).toArray();
    }
    
    let silinemezler = []
    let silinemez
    
    if (gelenLbsNodes_sil.length) {
      await gelenLbsNodes_sil.map(item => {
        silinemez = mahalParentIds.find(x => x.parentNodeId == item.id)
        if(silinemez) silinemezler.push(silinemez)
      })
    }
    
    // return ({mahalParentIds,gelenLbsNodes_sil,silinemezler})
    
    if (silinemezler.length) return ({hata:true,hataYeri:"FONK // addPoz",hataMesaj:"Silmek istediğiniz başlık ya da başlıklar altında tanımlanmış mahal ya da mahaller mevcut, öncelikle ilgili mahalleri silmelisiniz."}) 
    
    
    
    
    
    
    
    // DATABASE - silme
    if (gelenLbsNodes_sil.length) {
      await gelenLbsNodes_sil.map(item =>{
        collectionLbs.findOneAndUpdate(
          {_id:new BSON.ObjectId(item.id)},
          { $set: {isDeleted:zaman}},
          { upsert: true, new: true }
        );
      });
    }
          
    // DATABASE - guncelleme
    if (gelenLbsNodes_guncelle.length) {
      await gelenLbsNodes_guncelle.map(item =>{
        collectionLbs.findOneAndUpdate(
          {_id:new BSON.ObjectId(item.id)},
          { $set: {...item}},
          { upsert: true, new: true }
        );
      });
    }
    
    
    // DATABASE - ekleme
    if (gelenLbsNodes_ekle.length) {
      await collectionLbs.insertMany(gelenLbsNodes_ekle);
    }
    

  } catch(err){
    return ({hata:true,hataYeri:"FONK // addLbs // MONGO-5",hataMesaj:err.message});
  }
  
    
    
    
    
  // MONGO-6 - geseviye 1 - ilk satır kaydı
  Seviye1Ekle: try {

    if (gelenLbs.length === 0) break Seviye1Ekle;
    
    if (gelenLbs[0].seviye !== "1") break Seviye1Ekle;
    
    let sTr = proje + "-" + "lbs"
    if (!user.yetkiler[sTr].includes("W")) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // addLbs",hataMesaj:"Bu alana veri kaydetme yetkiniz bulunmuyor"})
    
    // database deki collection belirleyelim
    const collectionLbs = context.services.get("mongodb-atlas").db("iyiRP").collection("lbs")
    
    // işlemler için zamanı belli edelim
    const zaman = Date.now()
    
    // eklenecek ve güncellenecek diye gelen object arrayleri ayırlarım
    const gelenLbsNodes_ekle =[];

    let checkIsim_Ekle = false
    let checkSira_Ekle = false

    gelenLbs.map(item => {
      

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
        

        gelenLbsNodes_ekle.push({
          parentId:null,
          blokId:null, // burası 1. seviye - ilk node
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
    
    if (checkSira_Ekle) return ({hata:true,hataYeri:"FONK // addLbs",hataMesaj:"Sira numarası verilmemiş kayıt eklenemez.."}) 
    if (checkIsim_Ekle) return ({hata:true,hataYeri:"FONK // addLbs",hataMesaj:"Lbs ismi boş bırakılamaz"}) 
    
    // DATABASE - ekleme
    if (gelenLbsNodes_ekle.length) {
      await collectionLbs.insertMany(gelenLbsNodes_ekle);
    }
    

  } catch(err){
    return ({hata:true,hataYeri:"FONK // addLbs // MONGO-6",hataMesaj:err.message});
  }
    
        
    
    
    
    
    
  // MONGO-7 - VERİLERİ DB DEN ALMAA
  try {
    
    // DATABASEDEKİ VERİLERİ GÖNDERELİM
    const collectionLbs = context.services.get("mongodb-atlas").db("iyiRP").collection("lbs");
    const mongoReply = await collectionLbs.find(
      {isDeleted:false,proje,versiyon},
      {_id:1,parentId:1,seviye:1,sira:1,isim:1,tur:1,blokId:1,createdBy:1,updatedBy:1}
    ).sort( { sira: 1 } ).toArray();
    
    // function sliceIntoChunks(arr, chunkSize) {
    //   const res = [];
    //   for (let i = 0; i < arr.length; i += chunkSize) {
    //       const chunk = arr.slice(i, i + chunkSize);
    //       res.push(chunk);
    //   }
    //   return res;
    // }
    
    
    // const sliceIntoChunks = (arr, chunkSize) => {
    //     const res = [];
    //     for (let i = 0; i < arr.length; i += chunkSize) {
    //         const chunk = arr.slice(i, i + chunkSize);
    //         res.push(chunk);
    //     }
    //     return res;
    // }
    
    // const mongoReplyDivided = await sliceIntoChunks(mongoReply, 100)
    
    return({ok:true,mesaj:"Güncellemeler yapıldı.",mongoReply});
    
  } catch(err){
    return ({hata:true,hataYeri:"FONK // addLbs // MONGO-7",hataMesaj:err.message});
  }        
  
    

    
};