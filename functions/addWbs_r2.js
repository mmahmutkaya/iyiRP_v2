exports = async function (request, response) {
  
  objHeader = request.headers
  
  //fonksiyon global değişkenleri
  let hataText;
  
  
  // 1 - Gelen HEADER bilgilerinin analizi yapılıyor
  let kullaniciMail;
  let geciciKey;
  let proje
  let blok;
  let parentId;
  
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

    if(!objHeader.hasOwnProperty('Blok')) return ({hata:true,hataYeri:"FONK // addWbs",hataMesaj:"Gelen sorguda \"Blok\" HEADER tespit edilemedi, yönetici ile iletişime geçiniz."})
    blok = objHeader["Blok"][0];
    if(blok.length == 0) return ({hata:true,hataYeri:"FONK // addWbs",hataMesaj:"Gelen sorguda \"Blok\" HEADER var fakat boş, yönetici ile iletişime geçiniz."})

    if(!objHeader.hasOwnProperty('Parent-Id')) return ({hata:true,hataYeri:"FONK // addWbs",hataMesaj:"Gelen sorguda \"Parent-Id\" HEADER tespit edilemedi, yönetici ile iletişime geçiniz."})
    parentId = objHeader["Parent-Id"][0];
    if(parentId.length == 0) return ({hata:true,hataYeri:"FONK // addWbs",hataMesaj:"Gelen sorguda \"Parent-Id\" HEADER var fakat boş, yönetici ile iletişime geçiniz."})

  } catch (err){
    return ({hata:true,hataYeri:"FONK // addWbs // MONGO-1",hataMesaj:err.message})
  }
  
  
  // 2 - kullanıcının bilgilerini database den alalım
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
    if (!user.hasOwnProperty("yetkiler")) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // addWbs",hataMesaj:"Bu işleme yetkiniz bulunmuyor"})
    let sTr = proje + "-" + blok + "-" + "mahal"
    if (!user.yetkiler.hasOwnProperty(sTr)) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // addWbs",hataMesaj:"Bu işleme yetkiniz bulunmuyor"})
    if (!user.yetkiler[sTr].includes("W")) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // addWbs",hataMesaj:"Bu işleme yetkiniz bulunmuyor"})

  } catch(err) {
    return ({hata:true,hataYeri:"FONK // addWbs // MONGO-2",hataMesaj:err.message})
  }
  
  
  
  // 3 - versiyon tespiti
  let versiyon
  try {
    const collectionVersiyonlar = context.services.get("mongodb-atlas").db("iyiRP").collection("versiyonlar")
    const versiyonArray = await collectionVersiyonlar.find({proje,blok}).toArray()
    versiyon = versiyonArray[0].guncelVersiyon
    
  } catch(err){
    return ({hata:true,hataYeri:"FONK // addWbs // MONGO-3",hataMesaj:err.message})
  }
  


  // 3a - WBS Node kontrolü

  FonkNodeKontrol: try {
    if (parentId === "null") {
      parentId = null
      break FonkNodeKontrol;
    }
    const isParentIdExist = await context.services.get("mongodb-atlas").db("iyiRP").collection("wbs").find({_id:new BSON.ObjectId(parentId)}).toArray()
    if(isParentIdExist.length === 0) return ({hata:true,hataYeri:"FONK // addWbs",hataMesaj:"Kayıt yapılmak istenen üst seviye tespit edilemedi, program sorumlusu ile iletişime geçiniz."})
  } catch(err){
    return ({hata:true,hataYeri:"FONK // addWbs // MONGO-3a",hataMesaj:err.message})
  }
  
  
    
  // 4 - gelen veri işlemleri - body kısmında veri var mı?
  let gelenWbsNodes
  
  try{
    gelenWbsNodes = JSON.parse(request.body.text());
    // return gelenWbsNodes
  } catch(err){
    return ({hata:true,hataYeri:"FONK // addWbs // MONGO-4",hataMesaj:"Gelen sorguda gövde(body) verisi yok ya da hatalı, MONGO --> " + err.message})
  }
  
  
  
  
  // 5 - gelen verilerin kaydı
  FonkGelenVeri: try {
    
    if (parentId === null) {
        break FonkGelenVeri;
      }
      
    return ({hata:true,hataYeri:"FONK // addWbs // MONGO-4",hataMesaj:"buraya gelmemeliydi"})
    
    // işlemler için zamanı belli edelim
    const zaman = Date.now()
    
    // eklenecek ve güncellenecek diye gelen object arrayleri ayırlarım
    const gelenWbsNodes_ekle =[];
    const gelenWbsNodes_guncelle =[];
    const gelenWbsNodes_sil =[];
    
    let checkSiraNo_Ekle = false
    let checkSiraNo_Guncelle = false
    let checkIsim_Ekle = false

    gelenWbsNodes.map(item => {
      

      if (item.dbIslem === "sil") {
        
        gelenWbsNodes_sil.push({
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

        gelenWbsNodes_guncelle.push({
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

        if (typeof item.isim === "string") {
          if (item.isim.length === 0) {
            checkIsim_Ekle = true
          }
        }
        
        if (typeof item.isim === "number") {
          if (!item.isim > 0) {
            checkIsim_Ekle = true
          }
        }
        
        gelenWbsNodes_ekle.push({
          ...item,
          proje,
          blok,
          parentId:new BSON.ObjectId(parentId),
          versiyon,
          isDeleted:false,
          createdAt:zaman,
          createdBy:kullaniciMail,
        });
        

      }
    });
    
    if (checkSiraNo_Ekle) return ({hata:true,hataYeri:"FONK // addWbs",hataMesaj:"Sıra numarası verilmemiş kayıt eklenemez.."}) 
    if (checkSiraNo_Guncelle) return ({hata:true,hataYeri:"FONK // addWbs",hataMesaj:"Sıra numarası silinemez"}) 
    if (checkIsim_Ekle) return ({hata:true,hataYeri:"FONK // addWbs",hataMesaj:"Mahal kodu boş bırakılamaz"}) 
    
    let x = gelenWbsNodes_ekle.length;
    let y = gelenWbsNodes_sil.length;
    let z = gelenWbsNodes_guncelle.length;
    // if (x+y+z === 0) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // addWbs",hataMesaj:"Herhangi bir güncelleme talebi tespit edilmedi"});
    if (x+y+z === 0) break FonkGelenVeri;
    
    
    
    
    
    // bu kısmı mahal eklerken kullanıyoruz daha az sorgu yapmak için sistem kurduk, excel dictionary 256 kısıtı için
    // // NODE GÜNCELLEME KAYDI - DAHA AZ SORGULAMA İÇİN
    // const collectionWbs = context.services.get("mongodb-atlas").db("iyiRP").collection("wbs")
    // collectionWbs.findOneAndUpdate(
    //   {_id:new BSON.ObjectId(parentId)},
    //   { $set: {lastUpdatedChildMahal:zaman}},
    //   { upsert: true, new: true }
    // );
    
    // // AŞAĞIDA SORGU CEVABI OLARAK GÖNDERİLECEK KAYDI DA GÜNCELLİYORUZ
    // parentNodeGuncelleme = zaman
    
    
    
    
    // push komutu ile yaptığımız için bu kısma gerek kalmadı
    // yukarıdaki map dönüşünden sonra boş object ler oluşuyor onları siliyoruz
    // const gelenWbsNodes_ekle_filtered = gelenWbsNodes_ekle.filter(value => typeof value === "object");
    // const gelenWbsNodes_guncelle_filtered = gelenWbsNodes_guncelle.filter(value => typeof value === "object");
    
    // return ({1:gelenWbsNodes_ekle, 2:gelenWbsNodes_sil, 3:gelenWbsNodes_guncelle})
    
    
    
    
    
    
    // database deki collection belirleyelim
    const collectionWbs = context.services.get("mongodb-atlas").db("iyiRP").collection("wbs")
    

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
    
    

  
  
  // MONGO - 6 - gelen verilerin kaydı
  FonkGelenVeri2: try {
    
    if (parentId !== null) {
        break FonkGelenVeri2;
      }
    
    // işlemler için zamanı belli edelim
    const zaman = Date.now()
    
    // eklenecek ve güncellenecek diye gelen object arrayleri ayırlarım
    const gelenWbsNodes_ekle =[];
    const gelenWbsNodes_guncelle =[];
    const gelenWbsNodes_sil =[];
    
    let checkSiraNo_Ekle = false
    let checkSiraNo_Guncelle = false
    let checkIsim_Ekle = false

    gelenWbsNodes.map(item => {
      

      if (item.dbIslem === "sil") {
        
        gelenWbsNodes_sil.push({
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

        gelenWbsNodes_guncelle.push({
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

        if (typeof item.isim === "string") {
          if (item.isim.length === 0) {
            checkIsim_Ekle = true
          }
        }
        
        if (typeof item.isim === "number") {
          if (!item.isim > 0) {
            checkIsim_Ekle = true
          }
        }
        
        gelenWbsNodes_ekle.push({
          excel_id:item.excel_id,
          sira:item.sira,
          seviye:item.seviye,
          isim:item.isim,
          proje,
          blok,
          parentId:null,
          versiyon,
          isDeleted:false,
          createdAt:zaman,
          createdBy:kullaniciMail,
        });
        

      }
    });
    
    if (checkSiraNo_Ekle) return ({hata:true,hataYeri:"FONK // addWbs",hataMesaj:"Sıra numarası verilmemiş kayıt eklenemez.."}) 
    if (checkSiraNo_Guncelle) return ({hata:true,hataYeri:"FONK // addWbs",hataMesaj:"Sıra numarası silinemez"}) 
    if (checkIsim_Ekle) return ({hata:true,hataYeri:"FONK // addWbs",hataMesaj:"Mahal kodu boş bırakılamaz"}) 
    
    let x = gelenWbsNodes_ekle.length;
    let y = gelenWbsNodes_sil.length;
    let z = gelenWbsNodes_guncelle.length;
    // if (x+y+z === 0) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // addWbs",hataMesaj:"Herhangi bir güncelleme talebi tespit edilmedi"});
    if (x+y+z === 0) break FonkGelenVeri2;
    
    
    
    
    
    // bu kısmı mahal eklerken kullanıyoruz daha az sorgu yapmak için sistem kurduk, excel dictionary 256 kısıtı için
    // // NODE GÜNCELLEME KAYDI - DAHA AZ SORGULAMA İÇİN
    // const collectionWbs = context.services.get("mongodb-atlas").db("iyiRP").collection("wbs")
    // collectionWbs.findOneAndUpdate(
    //   {_id:new BSON.ObjectId(parentId)},
    //   { $set: {lastUpdatedChildMahal:zaman}},
    //   { upsert: true, new: true }
    // );
    
    // // AŞAĞIDA SORGU CEVABI OLARAK GÖNDERİLECEK KAYDI DA GÜNCELLİYORUZ
    // parentNodeGuncelleme = zaman
    
    
    
    
    // push komutu ile yaptığımız için bu kısma gerek kalmadı
    // yukarıdaki map dönüşünden sonra boş object ler oluşuyor onları siliyoruz
    // const gelenWbsNodes_ekle_filtered = gelenWbsNodes_ekle.filter(value => typeof value === "object");
    // const gelenWbsNodes_guncelle_filtered = gelenWbsNodes_guncelle.filter(value => typeof value === "object");
    
    // return ({1:gelenWbsNodes_ekle, 2:gelenWbsNodes_sil, 3:gelenWbsNodes_guncelle})
    
    
    
    
    
    
    // database deki collection belirleyelim
    const collectionWbs = context.services.get("mongodb-atlas").db("iyiRP").collection("wbs")
    

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
      return ({hata:true,hataYeri:"FONK // addWbs // MONGO-6",hataMesaj:err.message});
    }
    
    

    
    // MONGO - 7 - VERİLERİ DB DEN ALMA
    FonkGet_1: try {
      
      if (parentId === null) {
        break FonkGet_1
      }
      
      // DATABASEDEKİ VERİLERİ GÖNDERELİM
      const collectionWbs = context.services.get("mongodb-atlas").db("iyiRP").collection("wbs");
      const mongoReply = await collectionWbs.find(
        {isDeleted:false,proje,blok,versiyon,parentId:new BSON.ObjectId(parentId)},
        {_id:1,parentId,excel_id:1,sira:1,isim:1,createdBy:1,updatedBy:1}
      ).sort( { sira: 1 } );

      return({ok:true,mesaj:"Güncellemeler yapıldı.",mongoReply});
      
    } catch(err){
      return ({hata:true,hataYeri:"FONK // addWbs // MONGO-7",hataMesaj:err.message});
    }
    
    
    
    // MONGO - 8 - VERİLERİ DB DEN ALMA
    FonkGet_2: try {
      
      if (parentId !== null) {
        break FonkGet_2
      }
      
      // DATABASEDEKİ VERİLERİ GÖNDERELİM
      const collectionWbs = context.services.get("mongodb-atlas").db("iyiRP").collection("wbs");
      const mongoReply = await collectionWbs.find(
        {isDeleted:false,proje,blok,versiyon,parentId:null},
        {_id:1,parentId,excel_id:1,sira:1,isim:1,createdBy:1,updatedBy:1}
      ).sort( { sira: 1 } );

      return({ok:true,mesaj:"Güncellemeler yapıldı.",mongoReply});
      
    } catch(err){
      return ({hata:true,hataYeri:"FONK // addWbs // MONGO-8",hataMesaj:err.message});
    }
    
    
    
};