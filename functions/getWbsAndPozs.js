exports = async function (request, response) {
  
  objHeader = request.headers
  
  //fonksiyon global değişkenleri
  let hataText;
  
  
  // 1 - Gelen HEADER bilgilerinin analizi yapılıyor
  let kullaniciMail;
  let geciciKey;
  let proje
  let ihaleId;
  let parentTur
  let tur;
  let sorguTuru;
  
  let projeData
  
  try {
    
    hataText = "\"gelen istekte mail adresi bulunamadı\""
    if(!objHeader.hasOwnProperty('Kullanici-Mail')) return ({hata:true,hataYeri:"FONK // getWbsAndPozs",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    kullaniciMail = objHeader["Kullanici-Mail"][0];
    validateEmail = context.functions.execute("validateEmail", kullaniciMail);
    hataText = "gelen istekteki mail adresi hatalı"
    if(validateEmail == null) return ({hata:true,hataYeri:"FONK // getWbsAndPozs",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    hataText = "\"gelen istekte geciciKey bulunamadı\""
    if(!objHeader.hasOwnProperty('Gecici-Key')) return ({hata:true,hataYeri:"FONK // getWbsAndPozs",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    geciciKey = objHeader["Gecici-Key"][0];
    
    if(!objHeader.hasOwnProperty('Proje')) return ({hata:true,hataYeri:"FONK // getWbsAndPozs",hataMesaj:"Gelen sorguda \"Proje\" HEADER tespit edilemedi, program sorumlusu ile iletişime geçiniz."})
    proje = objHeader["Proje"][0];
    if(proje.length == 0) return ({hata:true,hataYeri:"FONK // getWbsAndPozs",hataMesaj:"Gelen sorguda \"Proje\" HEADER var fakat boş, program sorumlusu ile iletişime geçiniz."})
    
    // proje ismi belli oldu, peojeData verisni alalım, aşağıda bir kaç yerde daha kullanıcaz
    projeData = await context.services.get("mongodb-atlas").db("iyiRP").collection("projeler").findOne({isim:proje})
    
    // projeData mevcut mu kontrol
    if(!projeData) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // getWbsAndPozs",hataMesaj:"(Header) içinde talep ettiğiniz proje bilgisi sistemde bulunamadı, program sorumlusuna bilgi veriniz."})
  
    if(!objHeader.hasOwnProperty('Ihale-Id')) return ({hata:true,hataYeri:"FONK // getWbsAndPozs",hataMesaj:"Gelen sorguda \"Ihale-Id\" HEADER tespit edilemedi, program sorumlusu ile iletişime geçiniz."})
    ihaleId = objHeader["Ihale-Id"][0];
    if(ihaleId.length == 0) return ({hata:true,hataYeri:"FONK // getWbsAndPozs",hataMesaj:"Gelen sorguda \"Ihale-Id\" HEADER var fakat boş, program sorumlusu ile iletişime geçiniz."})

    if(!projeData.yetkiler.ihaleler.hasOwnProperty(ihaleId)) return ({hata:true,hataYeri:"FONK // getWbsAndPozs",hataMesaj:"(HEADER) içinde gelen ihale (id) bilgisi sistemde tespit edilemedi, program sorumlusu ile iletişime geçiniz."})

    if(!objHeader.hasOwnProperty('Tur')) return ({hata:true,hataYeri:"FONK // getWbsAndPozs",hataMesaj:"Gelen sorguda \"Tur\" HEADER tespit edilemedi, program sorumlusu ile iletişime geçiniz."})
    tur = objHeader["Tur"][0];
    if(tur.length == 0) return ({hata:true,hataYeri:"FONK // getWbsAndPozs",hataMesaj:"Gelen sorguda \"Tur\" HEADER var fakat boş, program sorumlusu ile iletişime geçiniz."})

    // ihale Id mevcut mu kontrol
    if(!projeData.yetkiler.ihaleler.hasOwnProperty(ihaleId)) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // getWbsAndPozs",hataMesaj:"(Header) içinde talep ettiğiniz ihale (Id) bilgisi sistemde bulunamadı, program sorumlusuna bilgi veriniz."})

    if(!objHeader.hasOwnProperty('Parent-Tur')) return ({hata:true,hataYeri:"FONK // getWbsAndPozs",hataMesaj:"Gelen sorguda \"Parent-Tur\" HEADER tespit edilemedi, program sorumlusu ile iletişime geçiniz."})
    parentTur = objHeader["Parent-Tur"][0];
    if(parentTur.length == 0) return ({hata:true,hataYeri:"FONK // getWbsAndPozs",hataMesaj:"Gelen sorguda \"Parent-Tur\" HEADER var fakat boş, program sorumlusu ile iletişime geçiniz."})

    if(!objHeader.hasOwnProperty('Tur')) return ({hata:true,hataYeri:"FONK // getWbsAndPozs",hataMesaj:"Gelen sorguda \"Tur\" HEADER tespit edilemedi, program sorumlusu ile iletişime geçiniz."})
    tur = objHeader["Tur"][0];
    if(tur.length == 0) return ({hata:true,hataYeri:"FONK // getWbsAndPozs",hataMesaj:"Gelen sorguda \"Tur\" HEADER var fakat boş, program sorumlusu ile iletişime geçiniz."})

    if(!objHeader.hasOwnProperty('Sorgu-Turu')) return ({hata:true,hataYeri:"FONK // getWbsAndPozs",hataMesaj:"Gelen sorguda \"Sorgu-Turu\" HEADER tespit edilemedi, program sorumlusu ile iletişime geçiniz."})
    sorguTuru = objHeader["Sorgu-Turu"][0];
    if(sorguTuru.length == 0) return ({hata:true,hataYeri:"FONK // getWbsAndPozs",hataMesaj:"Gelen sorguda \"Sorgu-Turu\" HEADER var fakat boş, program sorumlusu ile iletişime geçiniz."})

  } catch (err){
    return ({hata:true,hataYeri:"FONK // getWbsAndPozs // MONGO-1",hataMesaj:err.message})
  }
  
  
  // 2 - kullanıcının bilgilerini database den alalım
  let user;

  try {
    const collectionUsers = context.services.get("mongodb-atlas").db("iyiRP").collection("users")
    const userArray = await collectionUsers.find({kullaniciMail}).toArray()
    
    hataText = "gelen istekteki mail adresi sistemde kayıtlı değil"
    if(userArray.length === 0) return ({hata:true,hataYeri:"FONK // getWbsAndPozs",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    user = userArray[0]
    
    if(!user.mailTeyit) return ({hata:true,hataTanim:"mailTeyit",hataYeri:"FONK // getWbsAndPozs",hataMesaj:"Mail adresi henüz doğrulanmamış."})
    
    if(!user.uyelikOnay) return ({hata:true,hataTanim:"uyelikOnay",hataYeri:"FONK // getWbsAndPozs",hataMesaj:"Üyeliğiniz onay bekliyor."})
    
    hataText = "gelen istekteki geciciKey sistemdeki ile eşleşmiyor"
    if(geciciKey !== user.geciciKey.toString()) return ({hata:true,hataTanim:"geciciKod",hataYeri:"FONK // getWbsAndPozs",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    
    // yetki sorgulaması
    
    if(!projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.addPoz["okuma"].includes(kullaniciMail)) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // getWbsAndPozs",hataMesaj:"İlgili ihalenin pozlarını okuma yetkiniz bulunmuyor, ekranda veri varsa güncel olmayabilir."})

    // if (!user.hasOwnProperty("yetkiler")) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // getWbsAndPozs",hataMesaj:"Bu alanda veri okuma yetkiniz bulunmuyor"})
    // let sTr = proje + "-" + "poz"
    // if (!user.yetkiler.hasOwnProperty(sTr)) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // getWbsAndPozs",hataMesaj:"Bu alanda veri okuma yetkiniz bulunmuyor"})
    // if (!user.yetkiler[sTr].includes("R")) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // getWbsAndPozs",hataMesaj:"Bu alanda veri okuma yetkiniz bulunmuyor"})

  } catch(err) {
    return ({hata:true,hataYeri:"FONK // getWbsAndPozs // MONGO-2",hataMesaj:err.message})
  }
  
  
  
  // MONGO-3 - versiyon tespiti
  let versiyon
  try {
    const collectionVersiyonlar = context.services.get("mongodb-atlas").db("iyiRP").collection("versiyonlar")
    const versiyonArray = await collectionVersiyonlar.find({proje}).toArray()
    versiyon = versiyonArray[0].guncelVersiyon
    
  } catch(err){
    return ({hata:true,hataYeri:"FONK // getWbsAndPozs // MONGO-3",hataMesaj:err.message})
  }
  
  

  // 4 - gelen veri işlemleri - body kısmında veri var mı?
  let gelenPozlar
  
  try{
    gelenPozlar = JSON.parse(request.body.text());
    // return gelenPozlar
  } catch(err){
    return ({hata:true,hataYeri:"FONK // getWbsAndPozs // MONGO-4",hataMesaj:"Gelen sorguda gövde(body) verisi yok ya da hatalı, MONGO --> " + err.message})
  }
  
 // işlemler için zamanı belli edelim
  const zaman = Date.now()
  
  // 5 - gelen verilerin kaydı
  FonkDbGuncelle: try {
    
    if (sorguTuru !== "POST") break FonkDbGuncelle;
    
    if (gelenPozlar.length === 0) break FonkDbGuncelle;

    if(!projeData.yetkiler.ihaleler[ihaleId].fonksiyonlar.addPoz[tur].includes(kullaniciMail)) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // getWbsAndPozs",hataMesaj:"İlgili ihalenin pozlarını değiştirme yetkiniz bulunmuyor, fakat \"YENİLE\" tuşuna basarak güncel pozları görebilirsiniz."})
    
    // database deki collection belirleyelim
    const collectionPozlar = context.services.get("mongodb-atlas").db("iyiRP").collection("pozlar")
    
    // eklenecek ve güncellenecek diye gelen object arrayleri ayırlarım
    const gelenPozlar_ekle =[];
    const gelenPozlar_guncelle =[];
    const gelenPozlar_sil =[];
    
    
    let checkSiraNo_Ekle = false
    let checkPozNo_Ekle = false
    let checkPozTanim_Ekle = false
    let checkPozBirim_Ekle = false
    let checkMetrajTip_Ekle = false
    
    let checkSiraNo_Guncelle = false

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
          
          sira:parseFloat(item.sira),
          // pozNo:String(item.pozNo),
          // pozTanim:String(item.pozTanim),
          // pozBirim:String(item.pozBirim),
          
          updatedAt:zaman,
          updatedBy:kullaniciMail,
        });
        
        
      } else if (item.dbIslem === "ekle") {
        
        item.sira = parseFloat(item.sira)
        if (!item.sira > 0) {
          checkSiraNo_Ekle = true
        }

        
        // poz no - kontrol
        if (typeof item.pozNo === "string") {
          if (item.pozNo.length === 0) {
            checkPozNo_Ekle = true
          }
        }
        
        if (typeof item.pozNo === "number") {
          if (!item.pozNo > 0) {
            checkPozNo_Ekle = true
          }
        }
        
        
        // poz tanım - kontrol
        if (typeof item.pozTanim === "number") {
            checkPozTanim_Ekle = true
        }
        
        if (typeof item.pozTanim === "string") {
          if (item.pozTanim.length < 5) {
            checkPozTanim_Ekle = true
          }
        }
        
        
        // poz birim - kontrol
        if (typeof item.pozBirim === "number") {
          checkPozBirim_Ekle = true
        }
        
        if (typeof item.pozBirim === "string") {
          if (item.pozBirim.length === 0 || item.pozBirim.length > 8) {
            checkPozBirim_Ekle = true
          }
        }
        
        
        // metrajtip - kontrol
        if (item.metrajTip !== "standart"  && item.metrajTip !== "demir" && item.metrajTip !== "mahal_poz") {
          checkMetrajTip_Ekle = true
        }
        

        gelenPozlar_ekle.push({
          
          sira:parseFloat(item.sira),
          pozNo:String(item.pozNo),
          pozTanim:String(item.pozTanim),
          pozBirim:String(item.pozBirim),
          metrajTip:String(item.metrajTip),
          
          metraj:{
            kesif:0,
            hakedisTalep:0,
            hakedisOnay:0
          },
          
          proje,
          ihaleId:new BSON.ObjectId(ihaleId),
          parentNodeId:new BSON.ObjectId(item.parentNodeId),
          versiyon,
          isDeleted:false,
          createdAt:zaman,
          createdBy:kullaniciMail,
        });
        

      }
    });
    
    
    if (checkSiraNo_Guncelle) return ({hata:true,hataYeri:"FONK // getWbsAndPozs",hataMesaj:"Sıra numarası silinemez"}) 
    
    if (checkSiraNo_Ekle) return ({hata:true,hataYeri:"FONK // getWbsAndPozs",hataMesaj:"Sıra numarası verilmemiş kayıt eklenemez.."}) 
    if (checkPozNo_Ekle) return ({hata:true,hataYeri:"FONK // getWbsAndPozs",hataMesaj:"Poz numarası boş bırakılamaz"}) 
    if (checkPozTanim_Ekle) return ({hata:true,hataYeri:"FONK // getWbsAndPozs",hataMesaj:"Poz tanımı 5 karakterden az olamaz"}) 
    if (checkPozBirim_Ekle) return ({hata:true,hataYeri:"FONK // getWbsAndPozs",hataMesaj:"\"Poz Birimi\" rakam olamaz ve 8 karakterden fazla olamaz, kontrol ediniz."}) 
    if (checkMetrajTip_Ekle) return ({hata:true,hataYeri:"FONK // getWbsAndPozs",hataMesaj:"\"Metraj Tipi\"  \"standart\" , \"mahal_poz\" ya da \"demir\" olmalı, kontrol ediniz."}) 
    

    let pozIds
    // Poz eşleştirmesi kontrolü
    if (gelenPozlar_sil.length) {
      const collectionMetrajNodes = context.services.get("mongodb-atlas").db("iyiRP").collection("metrajNodes")
      pozIds = await collectionMetrajNodes.find(
        {proje,ihaleId:new BSON.ObjectId(ihaleId),isDeleted:false},
        {pozId:1,pozNo:1}
      ).toArray();
    }
    
    // return PozIds
    
    let silinemezler = []
    let silinemez
    
    
    if (gelenPozlar_sil.length) {
      gelenPozlar_sil.map(item => {
        silinemez = pozIds.find(x => x.pozId == item.id)
        if(silinemez) silinemezler.push(silinemez)
      })
    }    
    
    // return ({pozIds,gelenPozlar_sil,silinemezler})
    
    if (silinemezler.length) return ({hata:true,hataYeri:"FONK // getWbsAndPozs",hataMesaj:"Silmek istediğiniz - " + silinemezler[0].pozNo + " - numaralı poz ile eşleşen mahaller var, pozu silmek için öncelikle eşleştirmeleri kaldırınız."}) 
    
    


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
    
    
    return({ok:true,mesaj:"Kayıt işlemleri yapıldı."});

    
    } catch(err){
      return ({hata:true,hataYeri:"FONK // getWbsAndPozs // MONGO-5",hataMesaj:err.message});
    }
    
    
    
    // 6 - verileri database den alma 
    FonkDbGet: try {
      
      if (sorguTuru !== "GET") break FonkDbGet;
      
      
      const collectionWbs = context.services.get("mongodb-atlas").db("iyiRP").collection("wbs");
      const ihalePozBaslikLari = await collectionWbs.find({ihaleId:new BSON.ObjectId(ihaleId),tur:parentTur, isDeleted:false},{_id:1,sira:1,isim:1}).toArray()
      const ihalePozBaslikLari2 = ihalePozBaslikLari.map(x=>{
        return {...x,seviye:1}
      })
      const ihalePozBaslikIds = ihalePozBaslikLari.map(x=> x._id)
      
      const collectionPozlar = context.services.get("mongodb-atlas").db("iyiRP").collection("pozlar");
      // let mongoReply = []
      

      const pozlar = await collectionPozlar.find(
        {parentNodeId:{"$in" :ihalePozBaslikIds},isDeleted:false},
        {_id:1,parentNodeId:1,sira:1,pozNo:1,pozTanim:1,pozBirim:1,createdBy:1,updatedBy:1,metraj:1,metrajTip:1}
      ).sort( { sira: 1 } ).toArray();
      
      const pozlar2 = pozlar.map(x=>{
        return{
          ...x,
          siraSev1: ihalePozBaslikLari.find(y=>y._id.toString() == x.parentNodeId).sira,
          seviye:2
        }
      })
      
      
      let mongoReply = [...ihalePozBaslikLari2, ...pozlar2]
      
      mongoReply.sort(x => x.sira)
      
      return({ok:true,mesaj:"Güncellemeler yapıldı.",mongoReply,zaman});
      
    } catch(err){
      return ({hata:true,hataYeri:"FONK // getWbsAndPozs // MONGO-6",hataMesaj:err.message});
    }
    
    
    
};