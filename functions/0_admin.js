
exports = async function(arg){
  
  
  const collection = context.services.get("mongodb-atlas").db("iyiRP").collection("pozlar")
  
  // const collection1Items = await context.services.get("mongodb-atlas").db("iyiRP").collection("wbs").find({}).toArray()
  
  // const collection2 = context.services.get("mongodb-atlas").db("iyiRP").collection("wbs2")
  // collection2.insertMany(collection1Items)



  //  SİLMEK  
  // await collection.deleteMany({'seviye': {$ne : "1"}})
  // await collection.deleteMany({})
  
  
  // collection.update(
  //   {pozId:new BSON.ObjectId("63270942789576db73eb74ae")},
  //   { $set: {metrajSatirlari:null}}
  // );

  collection.updateMany(
    {},
    { $set: {metraj:{
      
        hakedisTalep:0,
        kesif:0,
        hakedisOnay:0,
      
    }}}
  );



    // { $pull: { [objArrayName]: {$in : item.silinecekObjeler} } }
    // {$addToSet: { ["metrajSatirlari"]: null }}
    // { $push: { [objArrayName]: {$each : item.objeler} } }
  
  
  
  
  
  
  
  
  
  
  

  // const PozGrupArray = [
  // 	{kod:"01",isim:"Zemin - Şap Altı İmalatlar"},
  //   {kod:"02",isim:"Zemin - Şap İmalatları"},
  //   {kod:"03",isim:"Zemin - Kaplama Altı İmalatlar"},
  //   {kod:"04",isim:"Zemin - Kaplamalar"},
  //   {kod:"05",isim:"Duvar İşleri"},
  //   {kod:"06",isim:"Konstrüktif Duvar İşleri"},
  //   {kod:"07",isim:"Konstrüktif Duvar İşleri"}
  // ]

  // let sira = 0
  // // WBSArray = PozGrupArray.slice(0).reverse().map(isim => {
  // WBSArray = PozGrupArray.map(item => {
  //   sira = sira + 1
  //   return {
  //     tur:"Poz Grup",
  //     proje:"T360",
  //     blok:"386",
  //     versiyon:"2023_v1",
  //     parentNode:"T360-386-INCE",
  //     node:"T360-386-INCE-" + item.kod,
  //     isim:item.isim,
  //     sira,
  //     children:["POZ"]
  //   }
  // })
  // collection.insertMany(WBSArray)
  
    
  // //  GÜNCELLEMEK
  // collection.updateMany(
  //   {proje,blok,tur,parent},
  //   { $set: { children} },
  //   // { $unset: [ "misc1", "misc2" ] }
  // )
    
  
    
    
};