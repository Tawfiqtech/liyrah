const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const productData={
 "Sereen Abaya":{
  description:`<p>The Elara Abaya is designed with a wide straight-cut body and statement sleeves for an elegant, flowing silhouette.</p><ul><li>16-inch wide sleeves</li><li>Wide body, straight cut (31–32 inch)</li><li>Press buttons inside sleeves</li><li>1 hidden side pocket</li><li>8-inch zip down the chest</li><li>Our branded Premium Soft Chiffon Hijab included</li><li>Korean Nida fabric</li></ul>`
 },
 "Elara Abaya":{
  description:`<p>Crafted from soft Korean Nida fabric, the Sereen Abaya has a relaxed, modest fit designed for graceful everyday wear.</p><ul><li>Soft Korean Nida fabric</li><li>Relaxed, modest fit</li><li>Side pockets</li><li>Matching chiffon hijab included</li><li>8-inch zip down the chest</li></ul>`
 },
 "Bamboo Hijab":{
  description:`<p>Our Bamboo Jersey hijab combines soft stretch, comfortable coverage and a skin-friendly feel for everyday wear.</p><ul><li>Material: 95% bamboo + 5% spandex</li><li>GSM: 150G/ml</li><li>Texture: soft, good stretch, natural and skin-friendly</li><li>Thickness: thick</li><li>Edge: hem wrapped stitching</li><li>Stock size: 70 × 180 cm</li></ul><h4>Care Information</h4><p>Machine wash cold (30°C) on a gentle cycle. Air dry flat or hang dry.</p>`
 }
};
let cart=JSON.parse(localStorage.getItem("liyrahCart")||"[]"), photos=[], photoIndex=0, current=null;
function candidatePhotos(product,color,base){
 const slug=product.toLowerCase().includes("sereen")?"sereen":product.toLowerCase().includes("elara")?"elara":"hijab";
 const c=color.toLowerCase().replace("dark ","").replace(" blue","").replace(/\s+/g,"-");
 // Add files with these names to /images for a richer slideshow. Missing files automatically fall back to the main photo.
 return [base,`images/${slug}-${c}-45.jpeg`,`images/${slug}-${c}-back.jpeg`,`images/${slug}-${c}-detail.jpeg`,`images/${slug}-${c}-fabric.jpeg`,`images/${slug}-${c}-lifestyle.jpeg`];
}
function validImage(src){return new Promise(res=>{const i=new Image();i.onload=()=>res(src);i.onerror=()=>res(null);i.src=src})}
async function openProduct(card){
 current={name:card.dataset.product,color:card.dataset.color,price:+card.dataset.price,image:card.dataset.image};
 const tested=await Promise.all(candidatePhotos(current.name,current.color,current.image).map(validImage));
 photos=tested.filter(Boolean); if(!photos.length) photos=[current.image]; photoIndex=0;
 $("#detailName").textContent=current.name; $("#detailColor").textContent=current.color; $("#detailPrice").textContent=`$${current.price} CAD`;
 $("#detailDescription").innerHTML=productData[current.name].description; $("#quantity").value="1";
 const isAbaya=current.name==="Sereen Abaya"||current.name==="Elara Abaya";
 $("#sizeLabel").style.display=isAbaya?"block":"none"; if(isAbaya) $("#size").value="52"; renderGallery();
 $("#productBackdrop").classList.add("open"); $("#productModal").classList.add("open"); $("#productModal").setAttribute("aria-hidden","false"); document.body.style.overflow="hidden";
}
function renderGallery(){
 const src=photos[photoIndex]; $("#detailImage").src=src; $("#detailImage").alt=`${current.name} ${current.color}`;
 $("#thumbs").innerHTML=photos.map((p,i)=>`<button class="${i===photoIndex?'active':''}" data-i="${i}"><img src="${p}" alt="Product photo ${i+1}"></button>`).join("");
 $$("#thumbs button").forEach(b=>b.onclick=()=>{photoIndex=+b.dataset.i;renderGallery()});
 $(".prev").style.display=photos.length>1?"block":"none"; $(".next").style.display=photos.length>1?"block":"none";
}
function closeProduct(){ $("#productBackdrop").classList.remove("open");$("#productModal").classList.remove("open");$("#productModal").setAttribute("aria-hidden","true");document.body.style.overflow=""}
function showZoom(){ $("#zoomImage").src=photos[photoIndex];$("#zoomView").classList.add("open")}
function addToCart(){
 const q=+$("#quantity").value;
 const isAbaya=current.name==="Sereen Abaya"||current.name==="Elara Abaya";
 const size=isAbaya?$("#size").value:null;
 const found=cart.find(x=>x.name===current.name&&x.color===current.color&&(x.size||null)===size);
 if(found) found.qty+=q; else cart.push({...current,size,qty:q});
 saveCart(); closeProduct(); openCart();
}
function saveCart(){localStorage.setItem("liyrahCart",JSON.stringify(cart));renderCart()}
function renderCart(){
 $("#cartCount").textContent=cart.reduce((s,x)=>s+x.qty,0);
 $("#cartItems").innerHTML=cart.length?cart.map((x,i)=>`<div class="cart-item"><img src="${x.image}" alt=""><div><strong>${x.name}</strong><p>${x.color}</p>${x.size?`<p>Size: ${x.size}</p>`:""}<p>Qty: ${x.qty}</p></div><div>$${x.price*x.qty}<br><button data-remove="${i}" style="border:0;background:none;text-decoration:underline;cursor:pointer;margin-top:8px">Remove</button></div></div>`).join(""):"<p>Your cart is empty.</p>";
 $("#cartTotal").textContent=`$${cart.reduce((s,x)=>s+x.price*x.qty,0)} CAD`;
 $$("[data-remove]").forEach(b=>b.onclick=()=>{cart.splice(+b.dataset.remove,1);saveCart()});
}
function openCart(){renderCart();$("#cartOverlay").classList.add("open");$("#cartDrawer").classList.add("open")}
function closeCart(){$("#cartOverlay").classList.remove("open");$("#cartDrawer").classList.remove("open")}
$$(".product-card").forEach(card=>{card.tabIndex=0;card.setAttribute("role","button");card.onclick=()=>openProduct(card);card.onkeydown=e=>{if(e.key==="Enter"||e.key===" ")openProduct(card)}});
$("#closeProduct").onclick=closeProduct;$("#productBackdrop").onclick=closeProduct;
$("#prevPhoto").onclick=()=>{photoIndex=(photoIndex-1+photos.length)%photos.length;renderGallery()};
$("#nextPhoto").onclick=()=>{photoIndex=(photoIndex+1)%photos.length;renderGallery()};
$("#detailImage").onclick=showZoom;$("#zoomPhoto").onclick=showZoom;$("#closeZoom").onclick=()=>$("#zoomView").classList.remove("open");$("#zoomView").onclick=e=>{if(e.target.id==="zoomView"||e.target.id==="zoomImage")$("#zoomView").classList.remove("open")};
$("#addCart").onclick=addToCart;$("#bagBtn").onclick=openCart;$("#closeCart").onclick=closeCart;$("#cartOverlay").onclick=closeCart;
const checkoutBtn=$("#checkoutBtn");
checkoutBtn.onclick=async()=>{
 if(!cart.length)return;
 const errorEl=$("#checkoutError"); errorEl.style.display="none";
 const oldText=checkoutBtn.textContent; checkoutBtn.disabled=true; checkoutBtn.textContent="LOADING…";
 try{
  const res=await fetch("/.netlify/functions/create-checkout-session",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({cart:cart.map(({name,color,size,qty})=>({name,color,size,qty}))})});
  const data=await res.json();
  if(!res.ok||!data.url)throw new Error(data.error||"Unable to start checkout.");
  window.location.href=data.url;
 }catch(err){
  errorEl.textContent=err.message+" Please try again."; errorEl.style.display="block";
  checkoutBtn.disabled=false; checkoutBtn.textContent=oldText;
 }
};
$("#menuBtn").onclick=()=>$("#nav").classList.toggle("open"); $$("#nav a").forEach(a=>a.onclick=()=>$("#nav").classList.remove("open"));
document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeProduct();closeCart();$("#zoomView").classList.remove("open")}});
renderCart();