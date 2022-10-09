exports = async function (request, response) {
  
  objHeader = request.headers
  
  //fonksiyon global değişkenleri
  let hataText;
  
  
  // 1 - Gelen HEADER bilgilerinin analizi yapılıyor
  let kullaniciMail;
  let geciciKey;
  let proje
  let blok;
  let parentNodeId;
  
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
    
    if(!objHeader.hasOwnProperty('Proje')) return ({hata:true,hataYeri:"FONK // addMahal",hataMesaj:"Gelen sorguda \"Proje\" HEADER tespit edilemedi, yönetici ile iletişime geçiniz."})
    proje = objHeader["Proje"][0];
    if(proje.length == 0) return ({hata:true,hataYeri:"FONK // addMahal",hataMesaj:"Gelen sorguda \"Proje\" HEADER var fakat boş, yönetici ile iletişime geçiniz."})

    if(!objHeader.hasOwnProperty('Blok')) return ({hata:true,hataYeri:"FONK // addMahal",hataMesaj:"Gelen sorguda \"Blok\" HEADER tespit edilemedi, yönetici ile iletişime geçiniz."})
    blok = objHeader["Blok"][0];
    if(blok.length == 0) return ({hata:true,hataYeri:"FONK // addMahal",hataMesaj:"Gelen sorguda \"Blok\" HEADER var fakat boş, yönetici ile iletişime geçiniz."})

    if(!objHeader.hasOwnProperty('Parent-Node')) return ({hata:true,hataYeri:"FONK // addMahal",hataMesaj:"Gelen sorguda \"Parent-Node\" HEADER tespit edilemedi, yönetici ile iletişime geçiniz."})
    parentNodeId = objHeader["Parent-Node"][0];
    if(parentNodeId.length == 0) return ({hata:true,hataYeri:"FONK // addMahal",hataMesaj:"Gelen sorguda \"Parent-Node\" HEADER var fakat boş, yönetici ile iletişime geçiniz."})

  } catch (err){
    return ({hata:true,hataYeri:"FONK // addMahal // MONGO-1",hataMesaj:err.message})
  }
  
  
  // 2 - kullanıcının bilgilerini database den alalım
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
    if (!user.hasOwnProperty("yetkiler")) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // addMahal",hataMesaj:"Bu işleme yetkiniz bulunmuyor"})
    let sTr = proje + "-" + blok + "-" + "mahal"
    if (!user.yetkiler.hasOwnProperty(sTr)) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // addMahal",hataMesaj:"Bu işleme yetkiniz bulunmuyor"})
    if (!user.yetkiler[sTr].includes("W")) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // addMahal",hataMesaj:"Bu işleme yetkiniz bulunmuyor"})

  } catch(err) {
    return ({hata:true,hataYeri:"FONK // addMahal // MONGO-2",hataMesaj:err.message})
  }
  
  
  
  // 3 - versiyon tespiti
  let versiyon
  try {
    const collectionVersiyonlar = context.services.get("mongodb-atlas").db("iyiRP").collection("versiyonlar")
    const versiyonArray = await collectionVersiyonlar.find({proje,blok}).toArray()
    versiyon = versiyonArray[0].guncelVersiyon
    
  } catch(err){
    return ({hata:true,hataYeri:"FONK // addMahal // MONGO-3",hataMesaj:err.message})
  }
  


  // 2a - LBS Node kontrolü
  let parentMahalNodes = []
  let parentNodeIsmi = ""
  let parentNodeGuncelleme
  try {
    const collectionLbs = context.services.get("mongodb-atlas").db("iyiRP").collection("lbs")
    const parentMahalNodes = await collectionLbs.find({proje,blok,versiyon,children:"MAHAL"},{node:1,isim:1,lastUpdatedChildMahal:1}).toArray()
    if(parentMahalNodes.length === 0) return ({hata:true,hataYeri:"FONK // addMahal",hataMesaj:"Sistemde mahal eklenecek herhangi bir alan (LBS NODE) bulunamadı."})
    // return parentMahalNodes
    const parentMahalNode = parentMahalNodes.find(item => item._id == parentNodeId)
    if(!parentMahalNode) return ({hata:true,hataYeri:"FONK // addMahal",hataMesaj:"Mahal eklemek istediğiniz alan (LBS NODE) sistemde bulunamadı."})
    
    // const parentMahalNodes = await collectionLbs.find({_id:new BSON.ObjectId(parentNodeId),versiyon,proje,blok,children:"MAHAL"},{node:1,isim:1}).toArray()
    // const LBSNodesArray_filtered = LBSNodesArray.filter(value => typeof value === "object");
    parentNodeIsmi = parentMahalNode.isim
    parentNodeGuncelleme = parentMahalNode.lastUpdatedChildMahal
  } catch(err){
    return ({hata:true,hataYeri:"FONK // addMahal // MONGO-2a",hataMesaj:err.message})
  }
  
  
    
  // 4 - gelen veri işlemleri - body kısmında veri var mı?
  let gelenMahaller
  
  try{
    gelenMahaller = JSON.parse(request.body.text());
    // return gelenMahaller
  } catch(err){
    return ({hata:true,hataYeri:"FONK // addMahal // MONGO-4",hataMesaj:"Gelen sorguda gövde(body) verisi yok ya da hatalı, MONGO --> " + err.message})
  }
  
  
  // 5 - gelen verilerin kaydı
  omgalabel: try {
    
    // işlemler için zamanı belli edelim
    const zaman = Date.now()
    
    // database deki collection belirleyelim
    const collectionMahaller = context.services.get("mongodb-atlas").db("iyiRP").collection("mahaller")
    
    // eklenecek ve güncellenecek diye gelen object arrayleri ayırlarım
    const gelenMahaller_ekle =[];
    const gelenMahaller_guncelle =[];
    const gelenMahaller_sil =[];
    
    let checkSiraNo_Ekle = false
    let checkSiraNo_Guncelle = false
    let checkMahalKod_Ekle = false

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
          id:item.id,
          sira:item.sira,
          kisim:item.kisim,
          mahalTipi:item.mahalTipi,
          odaNo:item.odaNo,
          zeminAlan:item.zeminAlan,
          cevreUzunluk:item.cevreUzunluk,
          isim:item.isim,
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
        
        if (typeof item.mahalKod === "number") {
          if (!item.mahalKod > 0) {
            checkMahalKod_Ekle = true
          }
        }
        
        gelenMahaller_ekle.push({
          ...item,
          proje,
          blok,
          parentNodeId:new BSON.ObjectId(parentNodeId),
          parentNodeIsmi,
          versiyon,
          isDeleted:false,
          createdAt:zaman,
          createdBy:kullaniciMail,
        });
        

      }
    });
    
    if (checkSiraNo_Ekle) return ({hata:true,hataYeri:"FONK // addMahal",hataMesaj:"Sıra numarası verilmemiş kayıt eklenemez.."}) 
    if (checkSiraNo_Guncelle) return ({hata:true,hataYeri:"FONK // addMahal",hataMesaj:"Sıra numarası silinemez"}) 
    if (checkMahalKod_Ekle) return ({hata:true,hataYeri:"FONK // addMahal",hataMesaj:"Mahal kodu boş bırakılamaz"}) 
    
    let x = gelenMahaller_ekle.length;
    let y = gelenMahaller_sil.length;
    let z = gelenMahaller_guncelle.length;
    // if (x+y+z === 0) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // addMahal",hataMesaj:"Herhangi bir güncelleme talebi tespit edilmedi"});
    if (x+y+z === 0) break omgalabel;
    
    
    
    
    // NODE GÜNCELLEME KAYDI - DAHA AZ SORGULAMA İÇİN
    const collectionLbs = context.services.get("mongodb-atlas").db("iyiRP").collection("lbs")
    collectionLbs.findOneAndUpdate(
      {_id:new BSON.ObjectId(parentNodeId)},
      { $set: {lastUpdatedChildMahal:zaman}},
      { upsert: true, new: true }
    );
    
    // AŞAĞIDA SORGU CEVABI OLARAK GÖNDERİLECEK KAYDI DA GÜNCELLİYORUZ
    parentNodeGuncelleme = zaman
    
    
    
    
    
    // push komutu ile yaptığımız için bu kısma gerek kalmadı
    // yukarıdaki map dönüşünden sonra boş object ler oluşuyor onları siliyoruz
    // const gelenMahaller_ekle_filtered = gelenMahaller_ekle.filter(value => typeof value === "object");
    // const gelenMahaller_guncelle_filtered = gelenMahaller_guncelle.filter(value => typeof value === "object");
    
    // return ({1:gelenMahaller_ekle, 2:gelenMahaller_sil, 3:gelenMahaller_guncelle})
    
    
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
          
    // DATABASE - guncelleme
    if (gelenMahaller_guncelle.length) {
      await gelenMahaller_guncelle.map(item =>{
        collectionMahaller.findOneAndUpdate(
          {_id:new BSON.ObjectId(item.id)},
          { $set: {...item}},
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
        {isDeleted:false,proje,blok,versiyon,parentNodeId:new BSON.ObjectId(parentNodeId)},
        {_id:1,parentNodeId,parentNodeIsmi,sira:1,kisim:1,mahalTipi:1,odaNo:1,mahalKod:1,isim:1,cevreUzunluk:1,zeminAlan:1,createdBy:1,updatedBy:1}
      ).sort( { sira: 1 } );

      return({ok:true,mesaj:"Güncellemeler yapıldı.",mongoReply,parentNodeGuncelleme});
      
    } catch(err){
      return ({hata:true,hataYeri:"FONK // addMahal // MONGO-6",hataMesaj:err.message});
    }
    
    
    
};