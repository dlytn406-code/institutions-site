// כתובת הסקריפט (Apps Script web app). מוחלפת בפריסה.
const API_URL = "https://script.google.com/macros/s/AKfycbzrNAx-21uMnAaOrTpXoWH2-XvUwbUFaFTLsqB2cMDc4GG9JD317UNAwqoTXl9Z2moc/exec";
const MAX_FILE = 4 * 1024 * 1024;
function toB64(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result).split(",")[1]);r.onerror=rej;r.readAsDataURL(file)})}
async function submitForm(form, kind){
  const msg=document.getElementById("msg");msg.className="";msg.style.display="none";
  const btn=form.querySelector("button[type=submit]");btn.disabled=true;
  try{
    const data={kind};
    for(const el of form.elements){
      if(!el.name||el.type==="submit"||el.type==="hidden")continue;
      if(el.type==="file"){
        data[el.name]=[];
        for(const f of el.files){if(f.size>MAX_FILE)throw new Error("קובץ גדול מדי: "+f.name+" (עד 4MB)");data[el.name].push({name:f.name,type:f.type,b64:await toB64(f)})}
      }else if(el.type==="checkbox"&&el.dataset.group){if(el.checked)data[el.dataset.group]=(data[el.dataset.group]?data[el.dataset.group]+", ":"")+el.value}else if(el.type==="checkbox"){data[el.name]=el.checked}
      else if(el.type==="radio"){if(el.checked)data[el.name]=el.value}
      else data[el.name]=el.value;
    }
    for(const g of new Set([...form.querySelectorAll("[data-group]")].map(x=>x.dataset.group)))if(!data[g])throw new Error("יש לסמן לפחות פריט אחד בכל רשימה");
    if(API_URL.startsWith("REPLACE"))throw new Error("האתר במצב ניסוי: החיבור לשרת טרם הוגדר.");
    const r=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(data)});
    const j=await r.json();
    if(!j.ok)throw new Error(j.error||"שגיאה");
    msg.className="ok";msg.textContent=j.message||"התקבל. נשלח אליך דוא\"ל לאימות.";form.reset();
  }catch(e){msg.className="err";msg.textContent=e.message}
  btn.disabled=false;msg.scrollIntoView({behavior:"smooth",block:"center"});
}
document.querySelectorAll("form[data-kind]").forEach(f=>f.addEventListener("submit",e=>{e.preventDefault();submitForm(f,f.dataset.kind)}));
