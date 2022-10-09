exports = async function (request, response) {
  
  objHeader = request.headers
  
  //fonksiyon global değişkenleri
  let hataText;
  
  // 1 - Gelen HEADER bilgilerinin analizi yapılıyor
  let kullaniciMail;
  let geciciKey;
  let proje
  let koleksiyon
  let objArrayName;

  try {
    
    hataText = "\"gelen istekte mail adresi bulunamadı\""
    if(!objHeader.hasOwnProperty('Kullanici-Mail')) return ({hata:true,hataYeri:"FONK // addArrayItemsByKey",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    kullaniciMail = objHeader["Kullanici-Mail"][0];
    validateEmail = context.functions.execute("validateEmail", kullaniciMail);
    hataText = "gelen istekteki mail adresi hatalı"
    if(validateEmail == null) return ({hata:true,hataYeri:"FONK // addArrayItemsByKey",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    hataText = "\"gelen istekte geciciKey bulunamadı\""
    if(!objHeader.hasOwnProperty('Gecici-Key')) return ({hata:true,hataYeri:"FONK // addArrayItemsByKey",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    geciciKey = objHeader["Gecici-Key"][0];
    
    if(!objHeader.hasOwnProperty('Proje')) return ({hata:true,hataYeri:"FONK // addArrayItemsByKey",hataMesaj:"Gelen sorguda \"Proje\" HEADER tespit edilemedi, yönetici ile iletişime geçiniz."})
    proje = objHeader["Proje"][0];
    if(proje.length == 0) return ({hata:true,hataYeri:"FONK // addArrayItemsByKey",hataMesaj:"Gelen sorguda \"Proje\" HEADER var fakat boş, yönetici ile iletişime geçiniz."})

    if(!objHeader.hasOwnProperty('Koleksiyon')) return ({hata:true,hataYeri:"FONK // addArrayItemsByKey",hataMesaj:"Gelen sorguda \"Koleksiyon\" HEADER tespit edilemedi, yönetici ile iletişime geçiniz."})
    koleksiyon = objHeader["Koleksiyon"][0];
    if(koleksiyon.length == 0) return ({hata:true,hataYeri:"FONK // addArrayItemsByKey",hataMesaj:"Gelen sorguda \"Koleksiyon\" HEADER var fakat boş, yönetici ile iletişime geçiniz."})

    if(!objHeader.hasOwnProperty('Objects-Array-Name')) return ({hata:true,hataYeri:"FONK // addArrayItemsByKey",hataMesaj:"Gelen sorguda \"Objects-Array-Name\" HEADER tespit edilemedi, yönetici ile iletişime geçiniz."})
    objArrayName = objHeader["Objects-Array-Name"][0];
    if(objArrayName.length == 0) return ({hata:true,hataYeri:"FONK // addArrayItemsByKey",hataMesaj:"Gelen sorguda \"Objects-Array-Name\" HEADER var fakat boş, yönetici ile iletişime geçiniz."})


  } catch (err){
    return ({hata:true,hataYeri:"FONK // addArrayItemsByKey // MONGO-1",hataMesaj:err.message})
  }
  
  
  // 2 - kullanıcının bilgilerini database den alalım
  let user;

  try {
    const collectionUsers = context.services.get("mongodb-atlas").db("iyiRP").collection("users")
    const userArray = await collectionUsers.find({kullaniciMail}).toArray()
    
    hataText = "gelen istekteki mail adresi sistemde kayıtlı değil"
    if(userArray.length === 0) return ({hata:true,hataYeri:"FONK // addArrayItemsByKey",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    user = userArray[0]
    
    if(!user.mailTeyit) return ({hata:true,hataTanim:"mailTeyit",hataYeri:"FONK // addArrayItemsByKey",hataMesaj:"Mail adresi henüz doğrulanmamış."})
    
    if(!user.uyelikOnay) return ({hata:true,hataTanim:"uyelikOnay",hataYeri:"FONK // addArrayItemsByKey",hataMesaj:"Üyeliğiniz onay bekliyor."})
    
    hataText = "gelen istekteki geciciKey sistemdeki ile eşleşmiyor"
    if(geciciKey !== user.geciciKey.toString()) return ({hata:true,hataTanim:"geciciKod",hataYeri:"FONK // addArrayItemsByKey",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    // yetki sorgulaması
    // if (!user.hasOwnProperty("yetkiler")) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // addArrayItemsByKey",hataMesaj:"Bu işleme yetkiniz bulunmuyor"})
    // let sTr = proje + "-" + "koleksiyon"
    // if (!user.yetkiler.hasOwnProperty(sTr)) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // addArrayItemsByKey",hataMesaj:"Bu işleme yetkiniz bulunmuyor"})
    // if (!user.yetkiler[sTr].includes("R")) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // addArrayItemsByKey",hataMesaj:"Bu alanda veri okuma yetkiniz bulunmuyor"})

  } catch(err) {
    return ({hata:true,hataYeri:"FONK // addArrayItemsByKey // MONGO-2",hataMesaj:err.message})
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
  let gelenItems
  
  try{
    gelenItems = JSON.parse(request.body.text());
  } catch(err){
    return ({hata:true,hataYeri:"FONK // addArrayItemsByKey // MONGO-4",hataMesaj:"Gelen sorguda gövde(body) verisi yok ya da hatalı, MONGO --> " + err.message})
  }
    
  
     
  // MONGO-5 - gelen verilerin kaydı
  FonkGelenVeri: try {
    
    if (gelenItems.length === 0) break FonkGelenVeri;
    
    // return "11"
    
    // let sTr = proje + "-" + "lbs"
    // if (!user.yetkiler[sTr].includes("W")) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // addArrayItemsByKey",hataMesaj:"Bu alana veri kaydetme yetkiniz bulunmuyor"})
    
    // database deki collection belirleyelim
    const collection = context.services.get("mongodb-atlas").db("iyiRP").collection(koleksiyon)
    
    
    // DATABASE - guncelleme
    await gelenItems.map(item =>{
      
      
      if (item.eklenecekObjeler.length){
        collection.updateOne(
          {_id:new BSON.ObjectId(item.docId)},
          { $addToSet: { [objArrayName]: {$each : item.eklenecekObjeler} } }
          // { $set: {[objArrayName]:item.objeler}}
          // {$addToSet: { [objArrayName]: item.objeler} }
          // { $push: { [objArrayName]: {$each : item.objeler} } }
        );
      }
      
      
      if (item.silinecekObjeler.length){
        collection.updateOne(
          {_id:new BSON.ObjectId(item.docId)},
          { $pull: { [objArrayName]: {$in : item.silinecekObjeler} } }
          // { $set: {[objArrayName]:item.objeler}}
          // {$addToSet: { [objArrayName]: item.objeler} }
          // { $push: { [objArrayName]: {$each : item.objeler} } }
        );
      }
      
      
    });


    // // işlemler için zamanı belli edelim
    // const zaman = Date.now()
    
    // let checkSira_Ekle = false
    // let checkSira_Guncelle = false
    // let checkIsim_Ekle = false

    // gelenItems.map(item => {
      

    //   if (item.dbIslem === "sil") {
        
    //     gelenLbsNodes_sil.push({
    //       id:item.id,
    //       isDeleted:zaman,
    //       deletedAt:zaman,
    //       deletedBy:kullaniciMail,
    //     });
        
        
        
    //   } else if (item.dbIslem === "guncelle"){
        
    //     if (typeof item.sira === "string") {
    //       if (item.sira.length === 0) {
    //         checkSira_Ekle = true
    //       }
    //     }
        
    //     if (typeof item.sira === "number") {
    //       if (!item.sira > 0) {
    //         checkSira_Ekle = true
    //       }
    //     }

    //     gelenLbsNodes_guncelle.push({
    //       id:item.id,
    //       parentId:new BSON.ObjectId(item.parentId),
    //       children:item.children,
    //       tur:item.tur,
    //       sira:parseFloat(item.sira),
    //       updatedAt:zaman,
    //       updatedBy:kullaniciMail,
    //     });
        
        
    //   } else if (item.dbIslem === "ekle") {
        
    //     if (typeof item.sira === "string") {
    //       if (item.sira.length === 0) {
    //         checkSira_Ekle = true
    //       }
    //     }
        
    //     if (typeof item.sira === "number") {
    //       if (!item.sira > 0) {
    //         checkSira_Ekle = true
    //       }
    //     }

    //     if (typeof item.isim === "string") {
    //       if (item.isim.length === 0) {
    //         checkIsim_Ekle = true
    //       }
    //     }
        
    //     if (typeof item.isim === "string") {
    //       if (item.isim === "...") {
    //         checkIsim_Ekle = true
    //       }
    //     }
        
    //     if (typeof item.isim === "number") {
    //       if (!item.isim > 0) {
    //         checkIsim_Ekle = true
    //       }
    //     }
        
        
        
    //     gelenLbsNodes_ekle.push({
    //       parentId:new BSON.ObjectId(item.parentId),
    //       seviye:item.seviye,
    //       sira:parseFloat(item.sira),
    //       isim:item.isim,
    //       children:item.children,
    //       tur:item.tur,
    //       proje,
    //       versiyon,
    //       isDeleted:false,
    //       createdAt:zaman,
    //       createdBy:kullaniciMail,
    //     });
    //   }
      
    // });
    
    // if (checkSira_Ekle) return ({hata:true,hataYeri:"FONK // addArrayItemsByKey",hataMesaj:"Sira numarası verilmemiş kayıt eklenemez.."}) 
    // if (checkSira_Guncelle) return ({hata:true,hataYeri:"FONK // addArrayItemsByKey",hataMesaj:"Sira numarası silinemez"}) 
    // if (checkIsim_Ekle) return ({hata:true,hataYeri:"FONK // addArrayItemsByKey",hataMesaj:"Lbs ismi boş bırakılamaz"}) 
    
    
    // let checkSilinebilir = true
    // if (gelenLbsNodes_sil.length) {
    //   gelenLbsNodes_sil.map(item =>{
    //     let children = await context.services.get("mongodb-atlas").db("iyiRP").collection("mahaller").find({parentNodeId:new BSON.ObjectId(item.id), isDeleted:false}).toArray()
    //     if (children.length > 0) checkSilinebilir = false
    //   })
    // }
    // if (!checkSilinebilir) return ({hata:true,hataYeri:"FONK // addArrayItemsByKey",hataMesaj:"Silmek istediğiniz başlığ1 bağlı mahaller var, öncelikle onları silmelisiniz"}) 
    
    
    
    // // DATABASE - silme
    // if (gelenLbsNodes_sil.length) {
    //   await gelenLbsNodes_sil.map(item =>{
    //     collectionLbs.findOneAndUpdate(
    //       {_id:new BSON.ObjectId(item.id)},
    //       { $set: {isDeleted:zaman}},
    //       { upsert: true, new: true }
    //     );
    //   });
    // }
          
    // // DATABASE - guncelleme
    // if (gelenLbsNodes_guncelle.length) {
    //   await gelenLbsNodes_guncelle.map(item =>{
    //     collectionLbs.findOneAndUpdate(
    //       {_id:new BSON.ObjectId(item.id)},
    //       { $set: {...item}},
    //       { upsert: true, new: true }
    //     );
    //   });
    // }
    
    
    // // DATABASE - ekleme
    // if (gelenLbsNodes_ekle.length) {
    //   await collectionLbs.insertMany(gelenLbsNodes_ekle);
    // }
    

  } catch(err){
    return ({hata:true,hataYeri:"FONK // addArrayItemsByKey // MONGO-5",hataMesaj:err.message});
  }
  
    
    
    
    
  // MONGO-7 - VERİLERİ DB DEN ALMA
  try {
    
    const obIds = await gelenItems.map(item =>{
        return new BSON.ObjectId(item.docId)
    });

    // DATABASEDEKİ VERİLERİ GÖNDERELİM
    const collection = context.services.get("mongodb-atlas").db("iyiRP").collection(koleksiyon);
    const mongoReply = await collection.find(
      {isDeleted:false,proje,versiyon,_id : {"$in" : obIds}},
      {_id:1,pozlar:1}
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
    
    // mongoReplyDivided en sona koymalısın, çünkü excelde bütün veri text olarak alınıyor mongoReplyDivided dan sonra ve en sondaki işaretler ile veri elde ediliyor
    return({ok:true,mesaj:"Güncellemeler yapıldı.",mongoReply});
    
  } catch(err){
    return ({hata:true,hataYeri:"FONK // addArrayItemsByKey // MONGO-7",hataMesaj:err.message});
  }        
  
    

    
};