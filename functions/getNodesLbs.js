exports = async function (request, response) {
  
  objHeader = request.headers
  
  //fonksiyon global değişkenleri
  let hataText;
  
  
  // 1 - Gelen HEADER bilgilerinin analizi yapılıyor
  let kullaniciMail;
  let geciciKey;
  let proje;
  // let parentNode;
  // let child;
  let koleksiyon;
  let blokId;
  let parentTur;
  // let tur;

  try {
    
    hataText = "\"gelen istekte mail adresi bulunamadı\""
    if(!objHeader.hasOwnProperty('Kullanici-Mail')) return ({hata:true,hataYeri:"FONK // getNodes",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    kullaniciMail = objHeader["Kullanici-Mail"][0];
    validateEmail = context.functions.execute("validateEmail", kullaniciMail);
    hataText = "gelen istekteki mail adresi hatalı"
    if(validateEmail == null) return ({hata:true,hataYeri:"FONK // getNodes",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    if(!objHeader.hasOwnProperty('Proje')) return ({hata:true,hataYeri:"FONK // addMahal",hataMesaj:"Gelen sorguda \"Proje\" HEADER tespit edilemedi, yönetici ile iletişime geçiniz."})
    proje = objHeader["Proje"][0];
    if(proje.length == 0) return ({hata:true,hataYeri:"FONK // addMahal",hataMesaj:"Gelen sorguda \"Proje\" HEADER var fakat boş, yönetici ile iletişime geçiniz."})

    hataText = "\"gelen istekte geciciKey bulunamadı\""
    if(!objHeader.hasOwnProperty('Gecici-Key')) return ({hata:true,hataYeri:"FONK // getNodes",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    geciciKey = objHeader["Gecici-Key"][0];
    
    // if(!objHeader.hasOwnProperty('Parent-Node')) return ({hata:true,hataYeri:"FONK // getNodes",hataMesaj:"Gelen sorguda \"Parent-Node\" HEADER tespit edilemedi, yönetici ile iletişime geçiniz."})
    // parentNode = objHeader["Parent-Node"][0];
    // if(parentNode.length == 0) return ({hata:true,hataYeri:"FONK // getNodes",hataMesaj:"Gelen sorguda \"Parent-Node\" HEADER var fakat boş, yönetici ile iletişime geçiniz."})

    // if(!objHeader.hasOwnProperty('Child')) return ({hata:true,hataYeri:"FONK // getNodes",hataMesaj:"Gelen sorguda \"Child\" HEADER tespit edilemedi, yönetici ile iletişime geçiniz."})
    // child = objHeader["Child"][0];
    // if(child.length == 0) return ({hata:true,hataYeri:"FONK // getNodes",hataMesaj:"Gelen sorguda \"Child\" HEADER var fakat boş, yönetici ile iletişime geçiniz."})

    if(!objHeader.hasOwnProperty('Koleksiyon')) return ({hata:true,hataYeri:"FONK // getNodes",hataMesaj:"Gelen sorguda \"Koleksiyon\" HEADER tespit edilemedi, yönetici ile iletişime geçiniz."})
    koleksiyon = objHeader["Koleksiyon"][0];
    if(koleksiyon.length == 0) return ({hata:true,hataYeri:"FONK // getNodes",hataMesaj:"Gelen sorguda \"Koleksiyon\" HEADER var fakat boş, yönetici ile iletişime geçiniz."})

    if(!objHeader.hasOwnProperty('Blok-Id')) return ({hata:true,hataYeri:"FONK // getNodesLbs",hataMesaj:"Gelen sorguda \"Blok-Id\" HEADER tespit edilemedi, yönetici ile iletişime geçiniz."})
    blokId = objHeader["Blok-Id"][0];
    if(blokId.length == 0) return ({hata:true,hataYeri:"FONK // getNodesLbs",hataMesaj:"Gelen sorguda \"Blok-Id\" HEADER var fakat boş, yönetici ile iletişime geçiniz."})

    if(!objHeader.hasOwnProperty('Parent-Tur')) return ({hata:true,hataYeri:"FONK // getNodesLbs",hataMesaj:"Gelen sorguda \"Parent-Tur\" HEADER tespit edilemedi, yönetici ile iletişime geçiniz."})
    parentTur = objHeader["Parent-Tur"][0];
    if(parentTur.length == 0) return ({hata:true,hataYeri:"FONK // getNodesLbs",hataMesaj:"Gelen sorguda \"Parent-Tur\" HEADER var fakat boş, yönetici ile iletişime geçiniz."})

    // if(!objHeader.hasOwnProperty('Tur')) return ({hata:true,hataYeri:"FONK // getNodesLbs",hataMesaj:"Gelen sorguda \"Tur\" HEADER tespit edilemedi, yönetici ile iletişime geçiniz."})
    // tur = objHeader["Tur"][0];
    // if(tur.length == 0) return ({hata:true,hataYeri:"FONK // getNodesLbs",hataMesaj:"Gelen sorguda \"Tur\" HEADER var fakat boş, yönetici ile iletişime geçiniz."})
    
    
    
  } catch (err){
    return ({hata:true,hataYeri:"FONK // getNodes // MONGO-1",hataMesaj:err.message})
  }
  
  
  // 2 - kullanıcının bilgilerini database den alalım
  let user;

  try {
    const collectionUsers = context.services.get("mongodb-atlas").db("iyiRP").collection("users")
    const userArray = await collectionUsers.find({kullaniciMail}).toArray()
    
    hataText = "gelen istekteki mail adresi sistemde kayıtlı değil"
    if(userArray.length === 0) return ({hata:true,hataYeri:"FONK // getNodes",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    user = userArray[0]
    
    if(!user.mailTeyit) return ({hata:true,hataTanim:"mailTeyit",hataYeri:"FONK // getNodes",hataMesaj:"Mail adresi henüz doğrulanmamış."})
    
    if(!user.uyelikOnay) return ({hata:true,hataTanim:"uyelikOnay",hataYeri:"FONK // getNodes",hataMesaj:"Üyeliğiniz onay bekliyor."})
    
    hataText = "gelen istekteki geciciKey sistemdeki ile eşleşmiyor"
    if(geciciKey !== user.geciciKey.toString()) return ({hata:true,hataTanim:"geciciKod",hataYeri:"FONK // getNodes",hataMesaj:"Tekrar giriş yapmanız gerekiyor, (" + hataText +")"})
    
    // yetki sorgulaması
    // if (!user.hasOwnProperty("yetkiler")) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // getNodes",hataMesaj:"Bu işleme yetkiniz bulunmuyor"})
    // let sTr = parentNode + "-" + child
    // if (!user.yetkiler.hasOwnProperty(sTr)) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // getNodes",hataMesaj:"Bu işleme yetkiniz bulunmuyor"})
    // if (!user.yetkiler[sTr].includes("R")) return ({hata:true,hataTanim:"yetki",hataYeri:"FONK // getNodes",hataMesaj:"Bu işleme yetkiniz bulunmuyor"})

  } catch(err) {
    return ({hata:true,hataYeri:"FONK // getNodes // MONGO-2",hataMesaj:err.message})
  }
  

  // MONGO-3 - versiyon tespiti
  let versiyon
  try {
    const collectionVersiyonlar = context.services.get("mongodb-atlas").db("iyiRP").collection("versiyonlar")
    const versiyonArray = await collectionVersiyonlar.find({proje}).toArray()
    versiyon = versiyonArray[0].guncelVersiyon
    
  } catch(err){
    return ({hata:true,hataYeri:"FONK // getNodes // MONGO-3",hataMesaj:err.message})
  }
  
  

  // 2a - Nodeları alalım
  // let kat = ""
  try {
    const collection = context.services.get("mongodb-atlas").db("iyiRP").collection(koleksiyon)
    const NodesArray = await collection.find({blokId:new BSON.ObjectId(blokId),isDeleted:false,tur:parentTur},{sira:1,isim:1,lastUpdatedChild:1}).sort({sira: 1}).toArray()
    if(NodesArray.length === 0) return ({hata:true,hataYeri:"FONK // getNodes",hataMesaj:"Sistemde kayıtlı alan \"Node\" alan bulunamadı"})
    return({ok:true,mesaj:"Mahal \"Nodes alındı\"",mongoReply:NodesArray});
  } catch(err){
    return ({hata:true,hataYeri:"FONK // getNodes // MONGO-2a",hataMesaj:err.message})
  }
  
  
  
};