const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const pub=async b=>{const r=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(b)});const j=await r.json();if(!j.ok)throw new Error(j.error||"שגיאה");return j};
const av=j=>j.photo?`<img class="jph" src="${esc(j.photo)}" alt="${esc(j.name)}" loading="lazy">`:`<div class="jph jph0">${esc((j.name||"?").trim().charAt(0))}</div>`;
async function list(){const v=document.getElementById("jv");v.innerHTML="טוען...";
 try{const q=(location.hash.match(/id=([a-f0-9]+)/)||[])[1];if(q)return one(q);
 const r=await pub({action:"judges_public"});
 v.innerHTML=r.judges.length?`<div class="grid">${r.judges.map(j=>`<a class="card jc" href="#id=${esc(j.id)}">${av(j)}<h3>${esc(j.name)}</h3><p><span class="pill">${esc(j.role)}</span></p><p><small>${esc(j.fields)}</small></p><p>${esc(j.bio)}</p></a>`).join("")}</div>`:"<p>עדיין אין דיינים מאושרים להצגה.</p>"}catch(e){v.textContent=e.message}}
async function one(id){const v=document.getElementById("jv");try{const j=(await pub({action:"judge_public_get",id})).judge;
 v.innerHTML=`<p><a href="#" id="bk">&larr; כל הדיינים</a></p><div class="card jone">${av(j)}<div><h3>${esc(j.name)} <span class="pill">${esc(j.role)}</span></h3><p><b>התמחויות:</b> ${esc(j.fields)}</p><p><b>כישורים:</b> ${esc(j.quals)}</p><p><b>זמינות:</b> ${esc(j.avail)}</p><p style="white-space:pre-wrap">${esc(j.bio)||"טרם נוסף תיאור."}</p></div></div>`;
 document.getElementById("bk").onclick=e=>{e.preventDefault();location.hash="";list()}}catch(e){v.textContent=e.message}}
window.addEventListener("hashchange",list);list();
