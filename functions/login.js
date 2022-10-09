exports = async function (request, response) {
  
  objHeader = request.headers
  
  let firma;
  let kullaniciMail;
  let sifre;
  
  
  // gelen sorguda header kısmına firma, kullanici mail, sifre eklenmişmi diye kontrol ediyoruz, yoksa ilgili hata dönüşünü yapıyoruz
  try {
    if(!objHeader.hasOwnProperty('Firma')) return ({hata:true,hataYeri:"Login",hataMesaj:"Firma ismi girilmemiş"})
    if(!objHeader.hasOwnProperty('Kullanici-Mail')) return ({hata:true,hataYeri:"Login",hataMesaj:"Mail adresi girilmemiş"})
    if(!objHeader.hasOwnProperty('Sifre')) return ({hata:true,hataYeri:"Login",hataMesaj:"Şifre girilmemiş"})
    firma = objHeader["Firma"][0]
    kullaniciMail = objHeader["Kullanici-Mail"][0];
    sifre = objHeader["Sifre"][0];
  } catch (err){
    return ({hata:true,hataYeri:"Login",hataMesaj:"excel dosyasında bir problem olablir, orjinal dosya ile çalıştığınızdan emin olun,  sunucu hatası - function(login) 001 / header"})
  }
  
  const collectionUsers = context.services.get("mongodb-atlas").db("iyiRP").collection("users")

  try {
    const userArray = await collectionUsers.find({kullaniciMail}).toArray()
    if(userArray.length === 0) return ({hata:true,hataYeri:"Login",hataMesaj:"mail adresi hatalı"})
    if(!userArray.find(user => user.firma === firma)) return ({hata:true,hataYeri:"Login",hataMesaj:"firma adı hatalı"})
    if((userArray.find(user => user.firma === firma).sifre) === sifre) return (userArray.find(user => user.firma === firma))
    return ({hata:true,hataYeri:"Login",hataMesaj:"Şifre hatalı!", hataMesaj2:"NOT: Bu mail adresi birden fazla firma için kullanılıyorsa firmaya ait şifreyi girdiğinizden emin olun."})
  } catch (err){
    return ({hata:true,hataYeri:"Login",hataMesaj:"sunucu hatası - function(login) 002"})
  }

}