exports = async function (request, response) {
  
  objHeader = request.headers
  
  //fonksiyon global değişkenleri
  let hataText;
  
  // 1 - Gelen HEADER bilgilerinin analizi yapılıyor
  let kullaniciMail;
  let geciciKey;
  let proje
  let ihaleId
  let tur
  let guncelNo
  
  let projeData
  
  try {
    
    hataText = "\"gelen istekte mail adresi bulunamadı\""
    if(!objHeader.hasOwnProperty('Kullanici-Mail')) return ({hata:true,hataYeri:"FONK // defineMetrajNodes",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    kullaniciMail = objHeader["Kullanici-Mail"][0];
    validateEmail = context.functions.execute("validateEmail", kullaniciMail);
    hataText = "gelen istekteki mail adresi hatalı"
    if(validateEmail == null) return ({hata:true,hataYeri:"FONK // defineMetrajNodes",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    hataText = "\"gelen istekte geciciKey bulunamadı\""
    if(!objHeader.hasOwnProperty('Gecici-Key')) return ({hata:true,hataYeri:"FONK // defineMetrajNodes",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    geciciKey = objHeader["Gecici-Key"][0];
    
    if(!objHeader.hasOwnProperty('Proje')) return ({hata:true,hataYeri:"FONK // defineMetrajNodes",hataMesaj:"Gelen sorguda \"Proje\" HEADER tespit edilemedi, program sorumlusu ile iletişime geçiniz."})
    proje = objHeader["Proje"][0];
    if(proje.length == 0) return ({hata:true,hataYeri:"FONK // defineMetrajNodes",hataMesaj:"Gelen sorguda \"Proje\" HEADER var fakat boş, program sorumlusu ile iletişime geçiniz."})

    projeData = await context.services.get("mongodb-atlas").db("iyiRP").collection("projeler").findOne({isim:proje})
    if(!projeData) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // defineMetrajNodes",hataMesaj:"(Header) içinde talep ettiğiniz proje bilgisi sistemde bulunamadı, program sorumlusuna bilgi veriniz."})
  
    if(!objHeader.hasOwnProperty('Ihale-Id')) return ({hata:true,hataYeri:"FONK // defineMetrajNodes",hataMesaj:"Gelen sorguda \"Ihale-Id\" HEADER tespit edilemedi, program sorumlusu ile iletişime geçiniz."})
    ihaleId = objHeader["Ihale-Id"][0];
    if(ihaleId.length == 0) return ({hata:true,hataYeri:"FONK // defineMetrajNodes",hataMesaj:"Gelen sorguda \"Ihale-Id\" HEADER var fakat boş, program sorumlusu ile iletişime geçiniz."})

    if(!projeData.yetkiler.ihaleler.hasOwnProperty(ihaleId)) return ({hata:true,hataYeri:"FONK // defineMetrajNodes",hataMesaj:"(HEADER) içinde gelen ihale (id) bilgisi sistemde tespit edilemedi, program sorumlusu ile iletişime geçiniz."})

    if(!objHeader.hasOwnProperty('Tur')) return ({hata:true,hataYeri:"FONK // updateMetrajNodesByPozId",hataMesaj:"Gelen sorguda \"Tur\" HEADER tespit edilemedi, yönetici ile iletişime geçiniz."})
    tur = objHeader["Tur"][0];
    if(tur.length == 0) return ({hata:true,hataYeri:"FONK // updateMetrajNodesByPozId",hataMesaj:"Gelen sorguda \"Tur\" HEADER var fakat boş, yönetici ile iletişime geçiniz."})
    if(!(tur == "tanimla" || tur == "kesif" || tur == "hakedisTalep" || tur == "hakedisOnay")) return ({hata:true,hataYeri:"FONK // defineMetrajNodes",hataMesaj:"Gelen sorguda \"Tur\" HEADER var fakat hatalı, program sorumlusu ile iletişime geçiniz."})

    // if(!objHeader.hasOwnProperty('Objects-Array-Name')) return ({hata:true,hataYeri:"FONK // defineMetrajNodes",hataMesaj:"Gelen sorguda \"Objects-Array-Name\" HEADER tespit edilemedi, program sorumlusu ile iletişime geçiniz."})
    // objArrayName = objHeader["Objects-Array-Name"][0];
    // if(objArrayName.length == 0) return ({hata:true,hataYeri:"FONK // defineMetrajNodes",hataMesaj:"Gelen sorguda \"Objects-Array-Name\" HEADER var fakat boş, program sorumlusu ile iletişime geçiniz."})


  } catch (err){
    return ({hata:true,hataYeri:"FONK // defineMetrajNodes // MONGO-1",hataMesaj:err.message})
  }
  
  
  // 2 - kullanıcının bilgilerini database den alalım
  let user;

  try {
    const collectionUsers = context.services.get("mongodb-atlas").db("iyiRP").collection("users")
    const userArray = await collectionUsers.find({kullaniciMail}).toArray()
    
    hataText = "gelen istekteki mail adresi sistemde kayıtlı değil"
    if(userArray.length === 0) return ({hata:true,hataYeri:"FONK // defineMetrajNodes",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    user = userArray[0]
    
    if(!user.mailTeyit) return ({hata:true,hataTanim:"mailTeyit",hataYeri:"FONK // defineMetrajNodes",hataMesaj:"Mail adresi henüz doğrulanmamış."})
    
    if(!user.uyelikOnay) return ({hata:true,hataTanim:"uyelikOnay",hataYeri:"FONK // defineMetrajNodes",hataMesaj:"Üyeliğiniz onay bekliyor."})
    
    hataText = "gelen istekteki geciciKey sistemdeki ile eşleşmiyor"
    if(geciciKey !== user.geciciKey.toString()) return ({hata:true,hataTanim:"geciciKod",hataYeri:"FONK // defineMetrajNodes",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    // kontroller
    if(tur == "tanimla" && !projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.defineMetrajNodes["okuma"].includes(kullaniciMail)) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // defineMetrajNodes",hataMesaj:"İlgili ihalenin mahal-poz eşleşmelerini görmeye yetkiniz bulunmuyor, ekranda veri varsa güncel olmayabilir."})
    if(tur !== "tanimla" && !projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.updateMetrajNodesByPozId[tur].okuma.includes(kullaniciMail)) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // defineMetrajNodes",hataMesaj:"İlgili pozun \"" + tur + "\" metrajlarını görmeye yetkiniz bulunmuyor, ekranda veri varsa güncel olmayabilir."})
    if(tur !== "tanimla" && !projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.updateMetrajNodesByPozId[tur].guncelNo > 0) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // defineMetrajNodes",hataMesaj:"İlgili iş paketi \""+ tur +"\" metrajı girmek için kapalı durumda, program sorumlusu ile iletişime geçebilirsiniz."})
    if (tur !== "tanimla") {
      guncelNo = projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.updateMetrajNodesByPozId[tur].guncelNo
    }




  } catch(err) {
    return ({hata:true,hataYeri:"FONK // defineMetrajNodes // MONGO-2",hataMesaj:err.message})
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
  
  
  
  
  // MONGO-4a - gelen veri işlemleri - body kısmında veri var mı?
  let gelenItems
  
  try{
    gelenItems = JSON.parse(request.body.text());
  } catch(err){
    return ({hata:true,hataYeri:"FONK // defineMetrajNodes // MONGO-4a",hataMesaj:"Gelen sorguda gövde(body) verisi yok ya da hatalı, MONGO --> " + err.message})
  }
    
  

  
  
  // MONGO 4b - sorgu yaparken kullanacağız, yukarıda okuma yetkisine bakılmıştı
  let mahalIds = [] 
  try {
    
    if (gelenItems.length === 0) return ({hata:true,hataTanim:"bosSorgu",hataYeri:"FONK // defineMetrajNodes",hataMesaj:"Mahal poz elşetirmesi için en az bir mahal adı vermeniz gerekiyor fakat sorgunuz herhangi bir mahal adı içermiyor, ekranınızda mahal olduğu halde bu uyarıyı alıyorsanız program sorumlusu ile irtibata geçiniz."})
    
    await gelenItems.map(item => {
      if (item.dbIslem === "tumMahaller") {
          mahalIds.push(
          new BSON.ObjectId(item.mahalId)
        );
      }
    })
    
  } catch(err){
    return ({hata:true,hataYeri:"FONK // addWbs // MONGO-4b",hataMesaj:err.message})
  }
  
  
  
  let zaman = Date.now()

  // MONGO-5 - gelen verilerin kaydı
  FonkDbVeriGuncelle: try {
    
    if (gelenItems.length === 0) break FonkDbVeriGuncelle; // bir üstte bakıldı ama genelde burda olur, usulen kalsın
    
    // return "11"
    
    const collectionPozlar = context.services.get("mongodb-atlas").db("iyiRP").collection("pozlar")
    const mahal_poz_pozIds = await collectionPozlar.find({ihaleId:new BSON.ObjectId(ihaleId),metrajTip:"mahal_poz",isDeleted:false},{"_id":1}).toArray()


    let yazmaYetkisiProblemi_define = false
    let yazmaYetkisiProblemi_tur = false
    let isKayitYapilabilirProblemi = false
    
    
    // database deki collection belirleyelim
    const collection = context.services.get("mongodb-atlas").db("iyiRP").collection("metrajNodes")
    
    let gelenItems_sil = []
    let gelenItems_ekle = []
    let gelenItems_sil_mahal_poz = []
    let gelenItems_ekle_mahal_poz = []
    
    await gelenItems.map(item => {
      
      
      if (item.tur == "tanimla" && item.dbIslem === "sil") {
        
        // madem yazma yapıcaz yetki var mı? 
        if(!projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.defineMetrajNodes["yazma"].includes(kullaniciMail)) {
          yazmaYetkisiProblemi = true;
        }
        
        // genel olarak kayıt izni var mı?
        if(!projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.defineMetrajNodes.isKayitYapilabilir) {
          isKayitYapilabilirProblemi = true
        }
        
        gelenItems_sil.push({
          mahalId:item.mahalId,
          pozId:item.pozId,
          isDeleted:zaman,
          deletedAt:zaman,
          deletedBy:kullaniciMail,
        });
        
      }
      
      
      if (item.tur == "tanimla" && item.dbIslem === "ekle") {
        
        // madem yazma yapıcaz yetki var mı? 
        if(!projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.defineMetrajNodes["yazma"].includes(kullaniciMail)) {
          yazmaYetkisiProblemi_define = true
        }
        

        // if (typeof item.sira === "string") {
        //   if (item.sira.length === 0) {
        //     checkSira_Ekle = true
        //   }
        // }
        
        // if (typeof item.sira === "number") {
        //   if (!item.sira > 0) {
        //     checkSira_Ekle = true
        //   }
        // }

        // if (typeof item.isim === "string") {
        //   if (item.isim.length === 0) {
        //     checkIsim_Ekle = true
        //   }
        // }
        
        // if (typeof item.isim === "string") {
        //   if (item.isim === "...") {
        //     checkIsim_Ekle = true
        //   }
        // }
        
        // if (typeof item.isim === "number") {
        //   if (!item.isim > 0) {
        //     checkIsim_Ekle = true
        //   }
        // }
        
        
        gelenItems_ekle.push({
          ...item,
          mahalId:new BSON.ObjectId(item.mahalId),
          pozId:new BSON.ObjectId(item.pozId),
          ihaleId:new BSON.ObjectId(ihaleId),
          kesif:{mevcutVersiyonlar:[],nodeMetraj:0}, //silinemezler sorgusunda bu object properties var mı yok mu diye bakıyoruz
          hakedisTalep:{mevcutVersiyonlar:[],nodeMetraj:0},  //silinemezler sorgusunda bu object properties var mı yok mu diye bakıyoruz
          hakedisOnay:{mevcutVersiyonlar:[],nodeMetraj:0},  //silinemezler sorgusunda bu object properties var mı yok mu diye bakıyoruz
          proje,
          versiyon,
          isDeleted:false,
          createdAt:zaman,
          createdBy:kullaniciMail,
        });

      }
      
      
      
      if (item.tur == tur && item.dbIslem === "sil") {
        
        // madem yazma yapıcaz yetki var mı? 
        if(!projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.updateMetrajNodesByPozId[tur]["yazma"].includes(kullaniciMail)) {
          yazmaYetkisiProblemi_tur = true
        }
        
        // madem yazma yapıcaz yetki var mı? 
        if(!projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.updateMetrajNodesByPozId[tur].isKayitYapilabilir) {
          isKayitYapilabilirProblemi = true
        }
        
        gelenItems_ekle_mahal_poz.push({
          mahalId:new BSON.ObjectId(item.mahalId),
          pozId:new BSON.ObjectId(item.pozId),
          ihaleId:new BSON.ObjectId(ihaleId),
        });

      }
      
      
      
      
      if (item.tur == tur && item.dbIslem === "ekle") {
        
        // madem yazma yapıcaz yetki var mı? 
        if(!projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.updateMetrajNodesByPozId[tur]["yazma"].includes(kullaniciMail)) {
          yazmaYetkisiProblemi_tur = true
        }
        
        // madem yazma yapıcaz yetki var mı? 
        if(!projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.updateMetrajNodesByPozId[tur].isKayitYapilabilir) {
          isKayitYapilabilirProblemi = true
        }
        
        gelenItems_ekle_mahal_poz.push({
          mahalId:new BSON.ObjectId(item.mahalId),
          pozId:new BSON.ObjectId(item.pozId),
          ihaleId:new BSON.ObjectId(ihaleId),
        });

      }
      
      
      
    });
    
    
    // MONGO 5
    if (yazmaYetkisiProblemi_define) return ({hata:true,hataYeri:"FONK // defineMetrajNodes // MONGO-5",hataMesaj:"Bu iş paketine ait metraj poz eşleştirmesi eşleştirme yetkiniz bulunmuyor fakat ekrandaki verileri güncelleyebilirsiniz."});
    if (yazmaYetkisiProblemi_tur) return ({hata:true,hataYeri:"FONK // defineMetrajNodes // MONGO-5",hataMesaj:"İlgili alana keşif metraj kaydetme yetkiniz bulunmuyor."});
    if (isKayitYapilabilirProblemi) return ({hata:true,hataYeri:"FONK // defineMetrajNodes // MONGO-5",hataMesaj:"İlgili ihalenin şu anda mahal-poz eşleştirmesi veri güncellemesine açık değil fakat \"YENİLE\" tuşuna basarak mevcut eşleştirmeleri görebilirsiniz."});


    let eklenemez_mahal_pozIds = []
    if (gelenItems_ekle_mahal_poz.length) {
      gelenItems_ekle_mahal_poz.map(item => {
        if (!mahal_poz_pozIds.find(x => x._id.toString() == item.pozId )) {
          eklenemez_mahal_pozIds.push(item)
        }
      })
    }
    

    if (eklenemez_mahal_pozIds.length) {
      return ({hata:true,hataYeri:"FONK // defineMetrajNodes",hataMesaj:eklenemez_mahal_pozIds[0].pozNo + " - numaralı poza metraj eklemek için \"standart\" metraj sayfalarını kullanmalısınız."}) 
    }
    
    
    
    // METRAJ SATIRI VARSA SİLİNMESİN
    // Silinemeycek dolu MetrajNodes ları tespit etme
    const collectionMetrajNodes = context.services.get("mongodb-atlas").db("iyiRP").collection("metrajNodes")
    let silinebilecekler = []
    if (gelenItems_sil.length) {
      silinebilecekler = await collectionMetrajNodes.find(
        // {ihaleId:new BSON.ObjectId(ihaleId),isDeleted:false },
        // {ihaleId:new BSON.ObjectId(ihaleId),isDeleted:false,["hakedisTalep.mevcutVersiyonlar"]:{$ne: []},["hakedisOnay.mevcutVersiyonlar"]:{$ne: []},["kesif.mevcutVersiyonlar"]:{$ne: []} },
        {ihaleId:new BSON.ObjectId(ihaleId),"hakedisTalep.mevcutVersiyonlar": { $eq: [] },"hakedisOnay.mevcutVersiyonlar": { $eq: [] },"kesif.mevcutVersiyonlar": { $eq: [] } },
        {pozId:1,mahalId:1,mahalParentName:1,mahalKod:1,pozNo:1,'_id': false}
      ).toArray();
    }
    
    let silinemezler =[]
    if (gelenItems_sil.length) {
      await gelenItems_sil.map(item => {
        if (!silinebilecekler.find(x => x.mahalId == item.mahalId && x.pozId == item.pozId)) {
          silinemezler.push(item)
        }
      })
    }
    // return silinemezler
    // örnek olarak db bir tane silinemez bilgileri alalım
    
    if (silinemezler.length) {
      const silinemez = await collectionMetrajNodes.findOne({mahalId:new BSON.ObjectId(silinemezler[0].mahalId),pozId:new BSON.ObjectId(silinemezler[0].pozId)})
      return ({hata:true,hataYeri:"FONK // defineMetrajNodes",hataMesaj:silinemez.pozNo + " - numaralı poz ile " + silinemez.mahalParentName + " - " + silinemez.mahalKod + " nolu mahalin eşleştirmesini kaldırmak için öncelikle bu eşleşmeye ait mevcut metrajları silmelisiniz."}) 
    }

    // if (checkSira_Ekle) return ({hata:true,hataYeri:"FONK // defineMetrajNodes",hataMesaj:"Sira numarası verilmemiş kayıt eklenemez.."}) 
    // if (checkSira_Guncelle) return ({hata:true,hataYeri:"FONK // defineMetrajNodes",hataMesaj:"Sira numarası silinemez"}) 
    // if (checkIsim_Ekle) return ({hata:true,hataYeri:"FONK // defineMetrajNodes",hataMesaj:"Lbs ismi boş bırakılamaz"}) 
    
    
    
    // çalışmadığını düşünüyorum - çünkü map içinde collection sorgusu çalıştıramadım bir türlü başka yerde - değer alarak yani yoksa - geri dönen şeyi kullanmayacaksak çalışıyor
    // let children
    // let checkSilinebilir = true
    // if (gelenLbsNodes_sil.length) {
    //   gelenLbsNodes_sil.map(item =>{
    //     children = context.services.get("mongodb-atlas").db("iyiRP").collection("mahaller").find({parentNodeId:new BSON.ObjectId(item.id), isDeleted:false}).toArray()
    //     if (children.length > 0) checkSilinebilir = false
    //   })
    // }
    // if (!checkSilinebilir) return ({hata:true,hataYeri:"FONK // defineMetrajNodes",hataMesaj:"Silmek istediğiniz başlığ1 bağlı mahaller var, öncelikle onları silmelisiniz"}) 
    
    
    

    
    // DATABASE - silme - "tanimla"
    if (gelenItems_sil.length) {
      await gelenItems_sil.map(item =>{
        collection.findOneAndUpdate(
          {mahalId:new BSON.ObjectId(item.mahalId),pozId:new BSON.ObjectId(item.pozId)},
          { $set: {isDeleted:zaman, isDeletedBy:user.kullaniciMail}},
          { upsert: false, new: true }
        );
      });
    }
    
     
    // DATABASE - ekleme - "tanimla"
    if (gelenItems_ekle.length) {
      await gelenItems_ekle.map(item =>{
        collection.findOneAndUpdate(
          {mahalId:item.mahalId,pozId:item.pozId},
          { $set: {...item}}, // içeriği yukarıda ayarlandı
          { upsert: true, new: true }
        );
      });
    }
    
    
          
    // DATABASE - silme - tur metrajları
    if (gelenItems_sil_mahal_poz.length) {
      await gelenItems_sil_mahal_poz.map(item =>{
        collection.findOneAndUpdate(
            {mahalId:new BSON.ObjectId(item.mahalId), pozId:new BSON.ObjectId(item.PozId),ihaleId:new BSON.ObjectId(ihaleId)},
            { $unset: { [tur + "." + guncelNo] :""}, $set: { [tur + ".nodeMetraj"]:item.nodeMetraj},$pull:{[tur +".mevcutVersiyonlar"]: guncelNo  } },
          );
      });
    }
          
          
         
          
          
    // DATABASE - ekleme - tur metrajları
    if (gelenItems_ekle_mahal_poz.length) {
        collectionMetrajNodes.updateOne(
          {mahalId:new BSON.ObjectId(item.mahalId), pozId:new BSON.ObjectId(item.pozId),ihaleId:new BSON.ObjectId(ihaleId)},
          // { $set: { [tur + "." + guncelNo] : item.eklenecekObjeler}, $push:{[tur +".mevcutVersiyonlar"]: guncelNo }
          { $set: { [tur + "." + guncelNo] : item.nodeMetraj, [tur + ".nodeMetraj"]:item.nodeMetraj}, $push:{[tur +".mevcutVersiyonlar"]: guncelNo }}
          // {upsert:true}
          // { $addToSet: { ["metrajSatirlari"]: {$each : eklenecekObjeler2} } }
          // { $set: {[objArrayName]:item.objeler}}
          // {$addToSet: { [objArrayName]: item.objeler} }
          // { $push: { [objArrayName]: {$each : item.objeler} } }
        )
    }
    
    
          
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
    // if (gelenItems_ekle.length) {
    //   await collection.insertMany(gelenItems_ekle);
    // }
    

  } catch(err){
    return ({hata:true,hataYeri:"FONK // defineMetrajNodes // MONGO-5",hataMesaj:err.message});
  }
  
  

    
    
    
  // MONGO-7 - VERİLERİ DB DEN ALMA
  try {
    
    // return mahalIds
    
    // boş objelerden arındırmak için
    // var mahalIds2 = await mahalIds.filter(value => Object.keys(value).length !== 0);
    // var mahalIds2 = await mahalIds.filter(value => JSON.stringify(value) !== '{}');
    
    // const mahalIds2 = [
    //     new BSON.ObjectId("63270b97935be48edfa00744"),
    //     new BSON.ObjectId("63270b97935be48edfa00743"),
    // ]
    
    // DATABASEDEKİ VERİLERİ GÖNDERELİM
    const collection = context.services.get("mongodb-atlas").db("iyiRP").collection("metrajNodes");
    const mongoReply = await collection.find(
      {isDeleted:false,proje,versiyon,mahalId : {"$in" : mahalIds}}, // mahalIds - yukarıda gelen sorgu analiz edilirken yapıldı
      {_id:1,pozId:1,mahalId:1,"kesif.nodeMetraj":1,"hakedisTalep.nodeMetraj":1,"hakedisOnay.nodeMetraj":1}
    ).toArray();
    
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
    return ({hata:true,hataYeri:"FONK // defineMetrajNodes // MONGO-7",hataMesaj:err.message});
  }        
  
    

    
};