exports = async function (request, response) {
  
  objHeader = request.headers
  
  //fonksiyon global değişkenleri
  let hataText;
  
  // 1 - Gelen HEADER bilgilerinin analizi yapılıyor
  let kullaniciMail;
  let geciciKey;
  let proje
  let pozId

  try {
    
    hataText = "\"gelen istekte mail adresi bulunamadı\""
    if(!objHeader.hasOwnProperty('Kullanici-Mail')) return ({hata:true,hataYeri:"FONK // addMetrajToMahal",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    kullaniciMail = objHeader["Kullanici-Mail"][0];
    validateEmail = context.functions.execute("validateEmail", kullaniciMail);
    hataText = "gelen istekteki mail adresi hatalı"
    if(validateEmail == null) return ({hata:true,hataYeri:"FONK // addMetrajToMahal",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    hataText = "\"gelen istekte geciciKey bulunamadı\""
    if(!objHeader.hasOwnProperty('Gecici-Key')) return ({hata:true,hataYeri:"FONK // addMetrajToMahal",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    geciciKey = objHeader["Gecici-Key"][0];
    
    if(!objHeader.hasOwnProperty('Proje')) return ({hata:true,hataYeri:"FONK // addMetrajToMahal",hataMesaj:"Gelen sorguda \"Proje\" HEADER tespit edilemedi, yönetici ile iletişime geçiniz."})
    proje = objHeader["Proje"][0];
    if(proje.length == 0) return ({hata:true,hataYeri:"FONK // addMetrajToMahal",hataMesaj:"Gelen sorguda \"Proje\" HEADER var fakat boş, yönetici ile iletişime geçiniz."})

    if(!objHeader.hasOwnProperty('Poz-Id')) return ({hata:true,hataYeri:"FONK // addMetrajToMahal",hataMesaj:"Gelen sorguda \"Poz-Id\" HEADER tespit edilemedi, yönetici ile iletişime geçiniz."})
    pozId = objHeader["Poz-Id"][0];
    if(pozId.length == 0) return ({hata:true,hataYeri:"FONK // addMetrajToMahal",hataMesaj:"Gelen sorguda \"Poz-Id\" HEADER var fakat boş, yönetici ile iletişime geçiniz."})

    // if(!objHeader.hasOwnProperty('Koleksiyon')) return ({hata:true,hataYeri:"FONK // addMetrajToMahal",hataMesaj:"Gelen sorguda \"Koleksiyon\" HEADER tespit edilemedi, yönetici ile iletişime geçiniz."})
    // koleksiyon = objHeader["Koleksiyon"][0];
    // if(koleksiyon.length == 0) return ({hata:true,hataYeri:"FONK // addMetrajToMahal",hataMesaj:"Gelen sorguda \"Koleksiyon\" HEADER var fakat boş, yönetici ile iletişime geçiniz."})


  } catch (err){
    return ({hata:true,hataYeri:"FONK // addMetrajToMahal // MONGO-1",hataMesaj:err.message})
  }
  
  
  // 2 - kullanıcının bilgilerini database den alalım
  let user;

  try {
    const collectionUsers = context.services.get("mongodb-atlas").db("iyiRP").collection("users")
    const userArray = await collectionUsers.find({kullaniciMail}).toArray()
    
    hataText = "gelen istekteki mail adresi sistemde kayıtlı değil"
    if(userArray.length === 0) return ({hata:true,hataYeri:"FONK // addMetrajToMahal",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    user = userArray[0]
    
    if(!user.mailTeyit) return ({hata:true,hataTanim:"mailTeyit",hataYeri:"FONK // addMetrajToMahal",hataMesaj:"Mail adresi henüz doğrulanmamış."})
    
    if(!user.uyelikOnay) return ({hata:true,hataTanim:"uyelikOnay",hataYeri:"FONK // addMetrajToMahal",hataMesaj:"Üyeliğiniz onay bekliyor."})
    
    hataText = "gelen istekteki geciciKey sistemdeki ile eşleşmiyor"
    if(geciciKey !== user.geciciKey.toString()) return ({hata:true,hataTanim:"geciciKod",hataYeri:"FONK // addMetrajToMahal",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    // yetki sorgulaması
    // if (!user.hasOwnProperty("yetkiler")) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // addMetrajToMahal",hataMesaj:"Bu işleme yetkiniz bulunmuyor"})
    // let sTr = proje + "-" + "koleksiyon"
    // if (!user.yetkiler.hasOwnProperty(sTr)) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // addMetrajToMahal",hataMesaj:"Bu işleme yetkiniz bulunmuyor"})
    // if (!user.yetkiler[sTr].includes("R")) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // addMetrajToMahal",hataMesaj:"Bu alanda veri okuma yetkiniz bulunmuyor"})

  } catch(err) {
    return ({hata:true,hataYeri:"FONK // addMetrajToMahal // MONGO-2",hataMesaj:err.message})
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
  
  
  
  
  // MONGO-4 - gelen PozId nin mahallerini getirme
  try{
    const colMahaller = context.services.get("mongodb-atlas").db("iyiRP").collection("mahaller")
    const mongoReply = await colMahaller.find({pozlar: {$elemMatch: {pozId}}},{mahalKod:1,isim:1,sira:1}).toArray()
    return({ok:true,mesaj:"Güncellemeler yapıldı.",mongoReply}); 
  } catch(err){
    return ({hata:true,hataYeri:"FONK // addMetrajToMahal // MONGO-4",hataMesaj:"Gelen pozId sorgulanırken hata oluştu, MONGO --> " + err.message})
  }
  
  
    
};