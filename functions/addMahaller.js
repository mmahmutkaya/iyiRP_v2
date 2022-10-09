exports = async function (request, response) {
  
  objHeader = request.headers
  
  let kullaniciMail;
  let geciciKey;
  let adaSifre;
  let mahaller;
  
  let user;
  let ada;
  let hataText;

  // 1 - gelen HEADER bilgilerin analizi yapılıyor
  try {
    
    hataText = "\"gelen istekte mail adresi bulunamadı\""
    if(!objHeader.hasOwnProperty('Kullanici-Mail')) return ({hata:true,hataYeri:"FONK // addMahaller",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    kullaniciMail = objHeader["Kullanici-Mail"][0];
    validateEmail = context.functions.execute("validateEmail", kullaniciMail);
    hataText = "gelen istekteki mail adresi hatalı"
    if(validateEmail == null) return ({hata:true,hataYeri:"FONK // addMahaller",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    hataText = "\"gelen istekte geciciKey bulunamadı\""
    if(!objHeader.hasOwnProperty('Gecici-Key')) return ({hata:true,hataYeri:"FONK // addMahaller",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    geciciKey = objHeader["Gecici-Key"][0];
    
    if(!objHeader.hasOwnProperty('Ada-Sifre')) return ({hata:true,hataYeri:"FONK // addMahaller",hataMesaj:"Gelen sorguda \"Ada-Sifresi\" HEADER tespit edilemedi, yönetici ile iletişime geçiniz."})
    const gelenAdaSİfre = objHeader["Ada-Sifre"][0];
    if(gelenAdaSİfre.length == 0) return ({hata:true,hataYeri:"FONK // addMahaller",hataMesaj:"Gelen sorguda \"Ada-Sifresi\" HEADER var fakat boş, yönetici ile iletişime geçiniz."})
    ada = context.values.get("T360_AdalarSifre")[gelenAdaSİfre]
    if(!ada) return ({hata:true,hataYeri:"FONK // addMahaller",hataMesaj:"Gelen sorgudaki \"ada şifresi\" ile sistemdeki şifre uyuşmadı, yönetici ile iletişime geçiniz."})
    
  } catch (err){
    return ({hata:true,hataYeri:"FONK // addMahaller // MONGO-1",hataMesaj:err.message})
  }
  
  
  // 2 - kullanıcının bilgilerini database den alalım
  try {
    const collectionUsers = context.services.get("mongodb-atlas").db("iyiRP").collection("users")
    const userArray = await collectionUsers.find({kullaniciMail:kullaniciMail}).toArray()
    
    hataText = "gelen istekteki mail adresi sistemde kayıtlı değil"
    
    if(userArray.length === 0) return ({hata:true,hataYeri:"FONK // addMahaller",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    user = userArray[0]
    
    if(!user.mailTeyit) return ({hata:true,hataTanim:"mailTeyit",hataYeri:"FONK // addMahaller",hataMesaj:"Mail adresi henüz doğrulanmamış."})
    
    if(!user.uyelikOnay) return ({hata:true,hataTanim:"uyelikOnay",hataYeri:"FONK // addMahaller",hataMesaj:"Üyeliğiniz onay bekliyor."})
    
    hataText = "gelen istekteki geciciKey sistemdeki ile eşleşmiyor"
    if(geciciKey !== user.geciciKey.toString()) return ({hata:true,hataTanim:"geciciKod",hataYeri:"FONK // addMahaller",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    if (!user.hasOwnProperty("izinliFonksiyonlar")) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // addMahaller",hataMesaj:"Bu işleme yetkiniz bulunmuyor"})
    if (!user.izinliFonksiyonlar.hasOwnProperty("addMahaller-" + ada)) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // addMahaller",hataMesaj:"Bu işleme yetkiniz bulunmuyor"})
    if (!user.izinliFonksiyonlar["addMahaller-" + ada].includes("W")) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // addMahaller",hataMesaj:"Bu işleme yetkiniz bulunmuyor"})
 
  } catch(err) {
    return ({hata:true,hataYeri:"FONK // addMahaller // MONGO-2",hataMesaj:err.message})
  }
    

 
  // 3 - gelen veri işlemleri - body kısmında veri var mı?
  try{
    mahaller = JSON.parse(request.body.text());
  } catch(err){
    return ({hata:true,hataYeri:"FONK // addMahaller // MONGO-3",hataMesaj:"Gelen sorguda gövde(body) verisi yok ya da hatalı, MONGO --> " + err.message})
  }
  
  
  // 4 - gelen veri işlemleri - zorunlu verilerden eksik olanlar veya farklı adaya ait veri var mı?
  try{
    
    // const adalar = ["386","387"]
    // const mahallerChecked= mahaller.filter(function(item) {
    //     if (item.ada === undefined || adalar.indexOf(item.ada) === -1 )
    //       return true;
    //   return false;
    // });  

    const mahallerChecked= mahaller.filter(function(item) {
        if (item.blok === undefined || item.blok !== ada )
          return true;
      return false;
    });  

    if (mahallerChecked.length > 0) return ({hata:true,hataVeri:mahallerChecked,hataTanim:"Ada",hataYeri:"FONK // addMahaller",hataMesaj:"Kaydetmeye çalıştığınız mahallerin tümü " + ada+ " adaya ait değil"})
  } catch(err){
    return ({hata:true,hataYeri:"FONK // addMahaller // MONGO-4",hataMesaj:err.message})
  }
  
  
  // 5 - gelen veri işlemleri - modifikasyon ve database e kaydetme
  try{

    mahallerModified = mahaller.map((mahal) => {
      return {
        ada:ada.toString(),
        kod:mahal.kod,
        updated:[{}],
        createdBy:kullaniciMail,
        createdAt:Date.now(),
        isDeleted: false
      }
    })
    
    const collection = context.services.get("mongodb-atlas").db("iyiRP").collection("mahaller")
    collection.insertMany( mahallerModified );
    return({ok:true,mesaj:"Mahaller sisteme yüklendi"});

  } catch(err){
    return ({hata:true,hataYeri:"FONK // addMahaller // MONGO-4",hataMesaj:err.message})
  }
  
  
  
  
  // // 1. Parse the incoming request
  // const mahaller = JSON.parse(request.body.text());
  
  // // 'excelden olmayan veri girişleri için ilave kontrol'
  // // const pozlarValidate = pozlar.map((mahal) => {
  // //   return {
  // //     tanim: typeof mahal.tanim === "string" && mahal.tanim.length > 5,
  // //     birim: typeof mahal.birim === "string" && mahal.birim.length > 0
  // //   };
  // // });
  
  // // if(pozlarValidate.find(mahal => mahal.item === false)) return({hataAddPozlar:true,message:"Poz isimlerinden yazı olmayan ya da 5 karakterden kısa olan var. Hata kodu - Sunucu / FUNC addPozlar / 002"});
  // // if(pozlarValidate.find(mahal => mahal.birim === false)) return({hataAddPozlar:true,message:"Birimlerden yazı olmayan ya da boş olan var. Hata kodu - Sunucu / FUNC addPozlar / 003"});
  
  
  // const collection = context.services.get("mongodb-atlas").db("iyiRP").collection("mahaller")
  
  // try {
  //   collection.insertMany( mahallerModified );
  //   return({ok:true,mesaj:"Mahaller sisteme yüklendi"});
  // } catch (err) {
  //   return ({hata:true,hataYeri:"addMahaller",hataMesaj:err.message});
  // }
  
}