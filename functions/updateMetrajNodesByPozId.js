exports = async function (request, response) {
  
  objHeader = request.headers
  
  //fonksiyon global değişkenleri
  let hataText;
  
  // 1 - Gelen HEADER bilgilerinin analizi yapılıyor
  let kullaniciMail;
  let geciciKey;
  let proje
  let ihaleId
  let pozId
  let tur
  let guncelNo
  let projeData
  
  try {
    
    hataText = "\"gelen istekte mail adresi bulunamadı\""
    if(!objHeader.hasOwnProperty('Kullanici-Mail')) return ({hata:true,hataYeri:"FONK // updateMetrajNodesByPozId",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    kullaniciMail = objHeader["Kullanici-Mail"][0];
    validateEmail = context.functions.execute("validateEmail", kullaniciMail);
    hataText = "gelen istekteki mail adresi hatalı"
    if(validateEmail == null) return ({hata:true,hataYeri:"FONK // updateMetrajNodesByPozId",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    
    hataText = "\"gelen istekte geciciKey bulunamadı\""
    if(!objHeader.hasOwnProperty('Gecici-Key')) return ({hata:true,hataYeri:"FONK // updateMetrajNodesByPozId",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    geciciKey = objHeader["Gecici-Key"][0];
    
    
    if(!objHeader.hasOwnProperty('Proje')) return ({hata:true,hataYeri:"FONK // updateMetrajNodesByPozId",hataMesaj:"Gelen sorguda \"Proje\" HEADER tespit edilemedi, yönetici ile iletişime geçiniz."})
    proje = objHeader["Proje"][0];
    if(proje.length == 0) return ({hata:true,hataYeri:"FONK // updateMetrajNodesByPozId",hataMesaj:"Gelen sorguda \"Proje\" HEADER var fakat boş, yönetici ile iletişime geçiniz."})
    
    projeData = await context.services.get("mongodb-atlas").db("iyiRP").collection("projeler").findOne({isim:proje})
    if(!projeData) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // updateMetrajNodesByPozId",hataMesaj:"(Header) içinde talep ettiğiniz proje bilgisi sistemde bulunamadı, program sorumlusuna bilgi veriniz."})
  

    if(!objHeader.hasOwnProperty('Ihale-Id')) return ({hata:true,hataYeri:"FONK // updateMetrajNodesByPozId",hataMesaj:"Gelen sorguda \"Ihale-Id\" HEADER tespit edilemedi, yönetici ile iletişime geçiniz."})
    ihaleId = objHeader["Ihale-Id"][0];
    if(ihaleId.length == 0) return ({hata:true,hataYeri:"FONK // updateMetrajNodesByPozId",hataMesaj:"Gelen sorguda \"Ihale-Id\" HEADER var fakat boş, yönetici ile iletişime geçiniz."})

    if(!projeData.yetkiler.ihaleler.hasOwnProperty(ihaleId)) return ({hata:true,hataYeri:"FONK // updateMetrajNodesByPozId",hataMesaj:"(HEADER) içinde gelen ihale (id) bilgisi sistemde tespit edilemedi, program sorumlusu ile iletişime geçiniz."})
  
  
    if(!objHeader.hasOwnProperty('Poz-Id')) return ({hata:true,hataYeri:"FONK // updateMetrajNodesByPozId",hataMesaj:"Gelen sorguda \"Poz-Id\" HEADER tespit edilemedi, yönetici ile iletişime geçiniz."})
    pozId = objHeader["Poz-Id"][0];
    if(pozId.length == 0) return ({hata:true,hataYeri:"FONK // updateMetrajNodesByPozId",hataMesaj:"Gelen sorguda \"Poz-Id\" HEADER var fakat boş, yönetici ile iletişime geçiniz."})
    
    const collectionPozlar = context.services.get("mongodb-atlas").db("iyiRP").collection("pozlar")
    const isPozExist = collectionPozlar.find({_id:new BSON.ObjectId(pozId),ihaleId:new BSON.ObjectId(ihaleId),isDeleted:false})
    if(!isPozExist) return ({hata:true,hataYeri:"FONK // updateMetrajNodesByPozId",hataMesaj:"(HEADER) içinde gelen ihale (id) ye ait poz (id) tespit edilemedi, program sorumlusu ile iletişime geçiniz."})
    
    
    if(!objHeader.hasOwnProperty('Tur')) return ({hata:true,hataYeri:"FONK // updateMetrajNodesByPozId",hataMesaj:"Gelen sorguda \"Tur\" HEADER tespit edilemedi, yönetici ile iletişime geçiniz."})
    tur = objHeader["Tur"][0];
    if(tur.length == 0) return ({hata:true,hataYeri:"FONK // updateMetrajNodesByPozId",hataMesaj:"Gelen sorguda \"Tur\" HEADER var fakat boş, yönetici ile iletişime geçiniz."})

    guncelNo = projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.updateMetrajNodesByPozId[tur].guncelNo
    if(!guncelNo) return ({hata:true,hataYeri:"FONK // updateMetrajNodesByPozId",hataMesaj:"Sistemde ihalenin "+ tur +" fonksiyonuna ait güncel veri kaydı numarası bulunamadı, program sorumlusu ile iletişime geçiniz."})

  } catch (err){
    return ({hata:true,hataYeri:"FONK // updateMetrajNodesByPozId // MONGO-1",hataMesaj:err.message})
  }
  
  
  // 2 - kullanıcının bilgilerini database den alalım
  let user;

  try {
    const collectionUsers = context.services.get("mongodb-atlas").db("iyiRP").collection("users")
    const userArray = await collectionUsers.find({kullaniciMail}).toArray()
    
    hataText = "gelen istekteki mail adresi sistemde kayıtlı değil"
    if(userArray.length === 0) return ({hata:true,hataYeri:"FONK // updateMetrajNodesByPozId",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    user = userArray[0]
    
    if(!user.mailTeyit) return ({hata:true,hataTanim:"mailTeyit",hataYeri:"FONK // updateMetrajNodesByPozId",hataMesaj:"Mail adresi henüz doğrulanmamış."})
    
    if(!user.uyelikOnay) return ({hata:true,hataTanim:"uyelikOnay",hataYeri:"FONK // updateMetrajNodesByPozId",hataMesaj:"Üyeliğiniz onay bekliyor."})
    
    hataText = "gelen istekteki geciciKey sistemdeki ile eşleşmiyor"
    if(geciciKey !== user.geciciKey.toString()) return ({hata:true,hataTanim:"geciciKod",hataYeri:"FONK // updateMetrajNodesByPozId",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    
    // yetki sorgulaması
    
    if(!projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.updateMetrajNodesByPozId[tur].okuma.includes(kullaniciMail)) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // updateMetrajNodesByPozId",hataMesaj:"İlgili pozun \"" + tur + "\" metrajlarını görmeye yetkiniz bulunmuyor, ekranda veri varsa güncel olmayabilir."})
    
    // if (!user.hasOwnProperty("yetkiler")) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // updateMetrajNodesByPozId",hataMesaj:"Bu işleme yetkiniz bulunmuyor"})
    // let sTr = proje + "-" + "ihaleId" - ihaleId + "-" + "fonksiyon" - "updateMetrajNodesByPozId"
    // if (!user.yetkiler.hasOwnProperty(sTr)) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // updateMetrajNodesByPozId",hataMesaj:"Bu işleme yetkiniz bulunmuyor"})
    // if (!user.yetkiler[sTr].includes("R")) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // updateMetrajNodesByPozId",hataMesaj:"Bu alanda veri okuma yetkiniz bulunmuyor"})

  } catch(err) {
    return ({hata:true,hataYeri:"FONK // updateMetrajNodesByPozId // MONGO-2",hataMesaj:err.message})
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
    return ({hata:true,hataYeri:"FONK // updateMetrajNodesByPozId // MONGO-4",hataMesaj:"Gelen sorguda gövde(body) verisi yok ya da hatalı, MONGO --> " + err.message})
  }
    
  
  // MONGO-5 - gelen verilerin kaydı
  FonkGelenVeri: try {
    
    if (gelenItems.length === 0) break FonkGelenVeri;
    
    
    // madem yazma yapıcaz yetki var mı? 
    if(!projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.updateMetrajNodesByPozId[tur].yazma.includes(kullaniciMail)) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // updateMetrajNodesByPozId",hataMesaj:"İlgili pozun \"" + tur + "\" metrajlarını güncelleme yetkiniz bulunmuyor fakat \"YENİLE\" tuşuna basarak güncel \"" + tur + "\" metrajlarını görebilirsiniz."})
    
    
    // guncelNo ya kayıt izni var mı?
    if(!projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.updateMetrajNodesByPozId[tur].isKayitYapilabilir) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // updateMetrajNodesByPozId",hataMesaj:"İlgili ihalenin \"" + tur + "\" metrajları için şu anda kayıt yapılacak bir versiyon yok fakat \"YENİLE\" tuşuna basarak mevcut \"" + tur + "\" metrajlarını görebilirsiniz."})


    // database deki collection belirleyelim
    const collectionMetrajNodes = context.services.get("mongodb-atlas").db("iyiRP").collection("metrajNodes")
    
    
    // işlemler için zamanı belli edelim
    const zaman = Date.now()
    

    // DATABASE - guncelleme
    gelenItems.map(item =>{
      
      
      // poz metraj bilgisi güncelleme
      if(item.hasOwnProperty('pozMetraj')){
        const collectionPozlar = context.services.get("mongodb-atlas").db("iyiRP").collection("pozlar")
        collectionPozlar.findOneAndUpdate(
          {_id:new BSON.ObjectId(pozId),ihaleId:new BSON.ObjectId(ihaleId)},
          { $set: { ["metraj." + tur ]: item.pozMetraj } }
          // {upsert:true} - bu poz zaten var olmalı
          // { $addToSet: { ["metrajSatirlari"]: {$each : eklenecekObjeler2} } }
          // { $set: {[objArrayName]:item.objeler}}
          // {$addToSet: { [objArrayName]: item.objeler} }
          // { $push: { [objArrayName]: {$each : item.objeler} } }
        );
      }
      
      // metrajNode güncelleme
      if(item.hasOwnProperty('eklenecekObjeler')){
        
        if (item.eklenecekObjeler.length) {
          collectionMetrajNodes.updateOne(
            {mahalId:new BSON.ObjectId(item.mahalId), pozId:new BSON.ObjectId(pozId),ihaleId:new BSON.ObjectId(ihaleId)},
            // { $set: { [tur + "." + guncelNo] : item.eklenecekObjeler}, $push:{[tur +".mevcutVersiyonlar"]: guncelNo }
            { $set: { [tur + "." + guncelNo] : item.eklenecekObjeler, [tur + ".nodeMetraj"]:item.nodeMetraj}, $push:{[tur +".mevcutVersiyonlar"]: guncelNo }}
            // {upsert:true}
            // { $addToSet: { ["metrajSatirlari"]: {$each : eklenecekObjeler2} } }
            // { $set: {[objArrayName]:item.objeler}}
            // {$addToSet: { [objArrayName]: item.objeler} }
            // { $push: { [objArrayName]: {$each : item.objeler} } }
          )
        }
        
        if (!item.eklenecekObjeler.length) {
          collectionMetrajNodes.findOneAndUpdate(
            {mahalId:new BSON.ObjectId(item.mahalId), pozId:new BSON.ObjectId(pozId),ihaleId:new BSON.ObjectId(ihaleId)},
            { $unset: { [tur + "." + guncelNo] :""}, $set: { [tur + ".nodeMetraj"]:item.nodeMetraj},$pull:{[tur +".mevcutVersiyonlar"]: guncelNo  } },
          );
        }
        
      }
      
      
    }) // GELEN ITEMS MAP BİTİŞİ
    
    
    // // silinmiş mahalleri devre dışı bırakma
    // collectionMahaller = context.services.get("mongodb-atlas").db("iyiRP").collection("mahaller");
    // const mahalIds_exist = await collectionMahaller.find(
    //   {isDeleted:false,mahalId : {"$in" : mahalIds}}, // mahalIds - yukarıda gelen sorgu analiz edilirken yapıldı
    //   {mahalId:1}
    // ).toArray();
    
    // let mahalIds_deleted = []
    // mahalIds.map(item=>{
    //   if item
    // })
    
      // mahalIds.map(item =>{
          
      //     collectionMahaller = context.services.get("mongodb-atlas").db("iyiRP").collection("mahaller")
      //     collection.find(
      //       {mahalId:new BSON.ObjectId(item.mahalId), pozId:new BSON.ObjectId(pozId),ihaleId:new BSON.ObjectId(ihaleId)},
      //       { $set: { metrajSatirlari: item.eklenecekObjeler, nodeMetraj:item.nodeMetraj } },
      //       {upsert:true}
      //       // { $addToSet: { ["metrajSatirlari"]: {$each : eklenecekObjeler2} } }
      //       // { $set: {[objArrayName]:item.objeler}}
      //       // {$addToSet: { [objArrayName]: item.objeler} }
      //       // { $push: { [objArrayName]: {$each : item.objeler} } }
      //     );


  } catch(err){
    return ({hata:true,hataYeri:"FONK // updateMetrajNodesByPozId // MONGO-5",hataMesaj:err.message});
  }
  
    
    
  // MONGO-4 - db den verileri alma
  try{
    
    const collectionMetrajNodes = context.services.get("mongodb-atlas").db("iyiRP").collection("metrajNodes")
    const collectionMahaller = context.services.get("mongodb-atlas").db("iyiRP").collection("mahaller");
    
    // önce nodeMetrajdaki ilgili mahalIdleri tespit edelim, bir sonraki sorguda mahaller collection dan silinmişler varsa burdan da silelim
    const mahalIds_inModeMetraj = await collectionMetrajNodes.find(
      {ihaleId:new BSON.ObjectId(ihaleId),pozId:new BSON.ObjectId(pozId), isDeleted:false },
      {mahalId:1,'_id':false}
    ).sort({mahalSiraNo:1}).toArray()
    
    // objeyi array e çevirme
    mahalIds_inModeMetraj2 = mahalIds_inModeMetraj.map(item=>{
      return item.mahalId
    })
    
    const mahalIds_exist = await collectionMahaller.find(
      {isDeleted:false,_id : {"$in" : mahalIds_inModeMetraj2}},
      {_id:1}
    ).toArray();
    
    // objeyi array e çevirme
    mahalIds_exist2 = mahalIds_exist.map(item=>{
      return item._id
    })

    const mongoReply = await collectionMetrajNodes.find(
      {ihaleId:new BSON.ObjectId(ihaleId),pozId:new BSON.ObjectId(pozId), isDeleted:false,mahalId : {"$in" : mahalIds_exist2} },
      {pozId:1,mahalId:1,mahalParentName:1,mahalParentSiraNo:1, mahalKod:1,mahalSiraNo:1,[tur]:1,mahalIsim:1}
    ).sort({mahalSiraNo:1}).toArray()
    
    return({ok:true,mesaj:"Güncellemeler yapıldı.",guncelNo,mongoReply}); 
  } catch(err){
    return ({hata:true,hataYeri:"FONK // updateMetrajNodesByPozId // MONGO-4",hataMesaj:"Database verisi alırken hata hata oluştu." + err.message})
  }
  
  
    
};