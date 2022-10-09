exports = async function (request, response) {
  
  // let user;
  
  // try{
  //   user = await context.functions.execute("login", request, response);
  //   if(user.hasOwnProperty('hataLogin')) return (user);
  // } catch(err){
  //   return ({hataAddPozlar:true,message:"Sisteme girişinizde problem gözüküyor, tekrar giriş yapınız. Hata kodu - Sunucu / FUNC addPozlar / 001"});
  // }
  
  
  // // 1. Parse the incoming request
  // const pozlar = JSON.parse(request.body.text());
  
  // 'excelden olmayan veri girişleri için ilave kontrol'
  // const pozlarValidate = pozlar.map((poz) => {
  //   return {
  //     tanim: typeof poz.tanim === "string" && poz.tanim.length > 5,
  //     birim: typeof poz.birim === "string" && poz.birim.length > 0
  //   };
  // });
  
  // if(pozlarValidate.find(poz => poz.item === false)) return({hataAddPozlar:true,message:"Poz isimlerinden yazı olmayan ya da 5 karakterden kısa olan var. Hata kodu - Sunucu / FUNC addPozlar / 002"});
  // if(pozlarValidate.find(poz => poz.birim === false)) return({hataAddPozlar:true,message:"Birimlerden yazı olmayan ya da boş olan var. Hata kodu - Sunucu / FUNC addPozlar / 003"});
  
  
  // const pozlarModified = pozlar.map((poz) => {
  //   return {
  //     tanim:poz.tanim,
  //     birim:poz.birim,
  //     firma:user.firma,
  //     updated:[{}],
  //     isDeleted: false
  //   }
  // })
  
  // const collection = context.services.get("mongodb-atlas").db("iyiRP").collection("pozlar")
  
  // try {
  //   collection.insertMany( pozlarModified );
  //   return({ok:true,message:"Pozlar sisteme yüklendi"});
  // } catch (err) {
  //   return ({hataAddPozlar:true,message:err.message});
  // }
  
}