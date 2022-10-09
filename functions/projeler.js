exports = async function (request, response) {
  
  objHeader = request.headers
  
  if(!objHeader.hasOwnProperty('Sorgu-Tipi')) return ({hata:true,hataYeri:"FONK // addPoz",hataMesaj:"Sorgu tipi belirtilmeli."})
  let sorguTipi = objHeader["Sorgu-Tipi"][0];

  if (sorguTipi == "POST") {
    
    try{
      
      let projeData = JSON.parse(request.body.text())[0];
      
      const collectionProjeler = context.services.get("mongodb-atlas").db("iyiRP").collection("projeler")
      await collectionProjeler.replaceOne({isim:"T360"},projeData)

    } catch(err){
      return ({hata:true,hataYeri:"FONK // projeler // MONGO-4",hataMesaj:"POST KISMINDA HATA, MONGO --> " + err.message})
    }

  }
    
    
  if (sorguTipi == "GET") {
    
    try{
      
      const collectionProjeler = context.services.get("mongodb-atlas").db("iyiRP").collection("projeler")
      const projeData = collectionProjeler.find({isim:"T360"})
      
      return projeData
      
    } catch(err){
      return ({hata:true,hataYeri:"FONK // projeler // MONGO-4",hataMesaj:"GET KISMINDA HATA, MONGO --> " + err.message})
    }

  }
    
    
};