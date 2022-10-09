exports = async function (request, response) {
  
  
  const response2 = await context.http.get({
    url: "https://us-east-1.aws.data.mongodb-api.com/app/iyirp-laumu/endpoint/deneme",
  })
  const response3 = await JSON.parse(response2.body.text())
  
  
  return response3
  
  // const collection = context.services.get("mongodb-atlas").db("iyiRP").collection("users")
  
  // collection.insertMany(response2)
  
  
  
  
  // return "bağlantı başarılı"
  
  // const collectionMahaller = context.services.get("mongodb-atlas").db("iyiRP").collection("mahaller");
  // const collectionMetrajNodes = context.services.get("mongodb-atlas").db("iyiRP").collection("metrajNodes");
  
  // // const collectionMahaller = context.services.get("mongodb-atlas").db("iyiRP").collection("mahaller");
  
  // const mahalData = await collectionMahaller.find({},{mahalIsim:1}).toArray()
  
  // // return mahalData
  
  // mahalData.map(x =>{
    
  //   collectionMetrajNodes.updateOne(
  //     {mahalId:x._id},
  //     { $set: {mahalIsim:x.mahalIsim }
  //     }
  //   );
    
  // })
  
  
  
    
  //   collectionMahaller.updateMany(
  //   {},
  //   { $set: {metraj:{
      
  //       hakedisTalep:0,
  //       kesif:0,
  //       hakedisOnay:0,
      
  //   }}}
  // );
    
  
    
//   await collection.deleteMany({})
  
//   await collection.insertMany( [
//   { _id: "Books", path: null },
//   { _id: "Programming", path: ",Books," },
//   { _id: "Databases", path: ",Books,Programming," },
//   { _id: "Languages", path: ",Books,Programming," },
//   { _id: "MongoDB", path: ",Books,Programming,Databases," },
//   { _id: "dbm", path: ",Books,Programming,Databases," }
// ] )

  
  // const mongoReply = await collection.find( { path: /,Programming,/ } )
  // const mongoReply = collection.find().sort( { path: 1 } )


  // const mongoReply = collectionMahaller.find(
  //   {isDeleted:false,proje,blok,lbsNode:new BSON.ObjectId(lbsNode),versiyon},
  //   {_id:1,kat:1,sira:1,kisim:1,mahal_tipi:1,oda_no:1,kod:1,isim:1,createdBy:1,updatedBy:1}
  // );

  // return(mongoReply); 
  // return({ok:true,mesaj:"Güncellemeler yapıldı.",mongoReply}); 
  

}; 