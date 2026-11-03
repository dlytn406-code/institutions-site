const S={token:null,email:null,roles:[],tab:null,caseNo:null};
try{const t=sessionStorage.getItem("tk");if(t){S.token=t}}catch(e){}
const $=s=>document.querySelector(s),app=()=>$("#app");
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
async function api(body){
  const r=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(Object.assign({token:S.token},body))});
  const j=await r.json();if(!j.ok){if(/כניסה מחדש/.test(j.error||"")){logout(true)}throw new Error(j.error||"שגיאה")}return j}
function msg(t,ok){let m=$("#pm");if(!m){app().insertAdjacentHTML("afterbegin",'<div id="pm"></div>');m=$("#pm")}m.className=ok?"note":"note";m.style.background=ok?"#e6f2e9":"#f8e6e6";m.textContent=t;window.scrollTo({top:0,behavior:"smooth"})}
function logout(silent){S.token=null;S.email=null;try{sessionStorage.removeItem("tk")}catch(e){}if(!silent)loginView()}
function loginView(note){
  app().innerHTML=`<form class="f" id="lf"><p>הכניסה בקוד חד-פעמי שנשלח לדוא"ל. הדוא"ל חייב להיות משויך לתיק, לחבר או לדיין.</p>${note?`<p class="note">${esc(note)}</p>`:""}
  <label>דוא"ל</label><input id="em" type="email" required><div id="codebox" style="display:none"><label>קוד שנשלח אליך</label><input id="cd" inputmode="numeric"></div>
  <button class="btn" type="submit" id="lb">שליחת קוד</button><div id="lm" style="margin-top:14px"></div></form>`;
  let step=1;$("#lf").onsubmit=async e=>{e.preventDefault();$("#lm").textContent="";
    try{if(step===1){await api({action:"login_request",email:$("#em").value});step=2;$("#codebox").style.display="block";$("#lb").textContent="כניסה";$("#lm").textContent="נשלח קוד לדוא\"ל"}
    else{const j=await api({action:"login_verify",email:$("#em").value,code:$("#cd").value});S.token=j.token;S.email=j.email;S.roles=j.roles;try{sessionStorage.setItem("tk",j.token)}catch(e){}home()}}
    catch(err){$("#lm").style.color="#9b2c2c";$("#lm").textContent=err.message}}}
async function home(){
  try{const m=await api({action:"me"});S.email=m.email;S.roles=m.roles}catch(e){return loginView()}
  const tabs=[];if(S.roles.includes("admin"))tabs.push(["admin","ניהול"]);if(S.roles.some(r=>r==="party"||r==="judge"))tabs.push(["cases","התיקים שלי"]);if(S.roles.includes("judge"))tabs.push(["profile","פרופיל דיין"]);if(S.roles.includes("member"))tabs.push(["member","חברות"]);
  S.tab=S.tab||(tabs[0]&&tabs[0][0]);
  app().innerHTML=`<p>מחובר: <b>${esc(S.email)}</b> · <a href="#" id="lo">יציאה</a></p><div class="tabs">${tabs.map(t=>`<button data-t="${t[0]}" class="${S.tab===t[0]?"on":""}">${t[1]}</button>`).join("")}</div><div id="view"></div>`;
  $("#lo").onclick=e=>{e.preventDefault();logout()};
  app().querySelectorAll(".tabs button").forEach(b=>b.onclick=()=>{S.tab=b.dataset.t;S.caseNo=null;home()});
  try{({admin:adminView,cases:casesView,profile:profileView,member:memberView}[S.tab]||(()=>{}))()}catch(e){msg(e.message)}}
function memberView(){$("#view").innerHTML='<div class="card"><h3>חברות בעמותה</h3><p>הדוא"ל שלך רשום כחבר. סטטוס החברות מתעדכן אוטומטית לאחר אימות הזהות הממשלתי.</p></div>'}
async function casesView(){
  if(S.caseNo)return caseView();
  const j=await api({action:"my_cases"});
  $("#view").innerHTML=j.cases.length?`<table><tr><th>תיק</th><th>תובע</th><th>נתבע</th><th>מסלול</th><th>סטטוס</th><th>תפקידך</th><th></th></tr>${j.cases.map(c=>`<tr><td>${esc(c.caseNo)}</td><td>${esc(c.plaintiff)}</td><td>${esc(c.defendant)}</td><td>${esc(c.route)}</td><td><span class="pill">${esc(c.status)}</span></td><td>${esc(c.youAre)}</td><td><button class="btn sm" data-c="${esc(c.caseNo)}">פתיחה</button></td></tr>`).join("")}</table>`:"<p>אין תיקים להצגה.</p>";
  app().querySelectorAll("[data-c]").forEach(b=>b.onclick=()=>{S.caseNo=b.dataset.c;casesView()})}
async function caseView(){
  const j=await api({action:"case_get",caseNo:S.caseNo}),c=j.case,party=c.youAre==="תובע"||c.youAre==="נתבע",judge=c.youAre==="דיין",admin=c.youAre==="מנהל";
  const mine=c.youAre==="תובע"?c.rankedP:c.rankedD,noPanel=!c.panel.length;
  $("#view").innerHTML=`<p><a href="#" id="bk">&larr; חזרה לרשימה</a></p><div class="card"><h3>תיק ${esc(c.caseNo)} <span class="pill">${esc(c.status)}</span></h3>
  <p>תובע: ${esc(c.plaintiff)} · נתבע: ${esc(c.defendant)}<br>מסלול: ${esc(c.route)} · סכום: ${esc(c.amount||"לא צוין")}<br>סעד: ${esc(c.relief)}</p>
  <p><b>מותב:</b> ${c.panel.length?c.panel.map(p=>esc(p.name)+" ("+esc(p.role)+")").join(", "):"טרם מונה"}</p></div>
  ${party&&noPanel?`<div class="card" style="margin-top:16px"><h3>בחירת דיינים</h3>${mine?"<p>הגשת כבר רשימה. המותב ימונה אוטומטית כששני הצדדים יגישו רשימה.</p>":`<p>דרג עד 10 דיינים (1 = מועדף ביותר). דיין המופיע ברשימות שני הצדדים מקבל קדימות. המינוי אוטומטי.</p><div id="rk">${(c.candidates||[]).map(d=>`<div class="rankrow"><input type="number" min="1" max="10" data-e="${esc(d.email)}"><span>${esc(d.name)} · ${esc(d.role)} · ${esc(d.fields)}</span></div>`).join("")||"<p>אין כרגע דיינים זמינים.</p>"}</div><button class="btn" id="rb">שליחת דירוג</button>`}</div>`:""}
  ${admin&&noPanel?'<p><button class="btn" id="runsel">הרצת בחירת מותב</button></p>':""}
  <h3 style="margin-top:24px">יומן התיק</h3>${j.events.map(e=>`<div class="ev"><small>${esc(new Date(e.time).toLocaleString("he-IL"))} · ${esc(e.role)} · ${esc(e.type)}</small><div>${esc(e.text)}</div>${e.links?`<div>${String(e.links).split(" ").filter(Boolean).map((u,i)=>`<a href="${esc(u)}" target="_blank" rel="noopener">מסמך ${i+1}</a>`).join(" · ")}</div>`:""}</div>`).join("")||"<p>אין אירועים.</p>"}
  <form class="f" id="mf" style="margin-top:20px"><label>${judge?"החלטה / הודעה":"הודעה לתיק"}</label><textarea name="text" required></textarea>${judge?'<div class="chk"><input type="checkbox" id="isd"><span>סמן כהחלטה</span></div>':""}<label>צירוף מסמכים</label><input type="file" id="mfile" multiple><button class="btn" type="submit">שליחה</button></form>
  ${admin?`<div class="card"><h3>ניהול תיק</h3><select id="st"><option>הוגשה</option><option>ממתין לתגובת נתבע</option><option>מותב מונה</option><option>בדיון</option><option>ממתין לפסק</option><option>ניתן פסק דין</option><option>נסגר</option></select> <button class="btn sm" id="sb">עדכון סטטוס</button></div>`:""}`;
  $("#bk").onclick=e=>{e.preventDefault();S.caseNo=null;casesView()};
  if($("#rb"))$("#rb").onclick=async()=>{const l=[...document.querySelectorAll("#rk input")].filter(i=>i.value).sort((a,b)=>a.value-b.value).map(i=>i.dataset.e);try{await api({action:"rank",caseNo:S.caseNo,list:l});await caseView();msg("הרשימה נשמרה",true)}catch(e){msg(e.message)}};
  if($("#runsel"))$("#runsel").onclick=async()=>{try{const r=await api({action:"admin_run_selection",caseNo:S.caseNo});await caseView();msg(r.message,true)}catch(e){msg(e.message)}};
  if($("#sb"))$("#sb").onclick=async()=>{try{await api({action:"admin_case_status",caseNo:S.caseNo,status:$("#st").value});await caseView();msg("עודכן",true)}catch(e){msg(e.message)}};
  $("#mf").onsubmit=async e=>{e.preventDefault();const files=[];for(const f of $("#mfile").files){if(f.size>4e6)return msg("קובץ גדול מדי");files.push({name:f.name,type:f.type,b64:await toB64(f)})}
    try{await api({action:"message",caseNo:S.caseNo,text:e.target.text.value,type:$("#isd")&&$("#isd").checked?"decision":"msg",files});await caseView();msg("נשלח",true)}catch(er){msg(er.message)}}}
async function profileView(){
  const j=await api({action:"judge_profile"}),p=j.profile;
  $("#view").innerHTML=`<div class="card"><h3>${esc(p.name)} · ${esc(p.role)}</h3><p>התמחויות: ${esc(p.fields)}<br>כישורים: ${esc(p.quals)}</p></div><form class="f" id="pf" style="margin-top:16px"><label>זמינות</label><input name="a" value="${esc(p.avail)}"><button class="btn" type="submit">עדכון זמינות</button></form>`;
  $("#pf").onsubmit=async e=>{e.preventDefault();try{await api({action:"judge_profile",avail:e.target.a.value});msg("עודכן",true)}catch(er){msg(er.message)}}}
async function adminView(){
  const j=await api({action:"admin_overview"});
  const sel=(opts,cur)=>opts.map(o=>`<option ${o===cur?"selected":""}>${o}</option>`).join("");
  $("#view").innerHTML=`<h3>תיקים (${j.cases.length})</h3><table><tr><th>תיק</th><th>תובע</th><th>נתבע</th><th>מסלול</th><th>סטטוס</th><th>מותב</th><th>דוא"ל אומת</th><th></th></tr>${j.cases.map(c=>`<tr><td>${esc(c.caseNo)}</td><td>${esc(c.plaintiff)}<br><small>${esc(c.pEmail)}</small></td><td>${esc(c.defendant)}<br><small>${esc(c.dEmail||"אין דוא\"ל")}</small></td><td>${esc(c.route)}</td><td><span class="pill">${esc(c.status)}</span></td><td>${esc(c.panel.join(", "))}</td><td>${c.verified?"כן":"לא"}</td><td><button class="btn sm" data-c="${esc(c.caseNo)}">פתיחה</button></td></tr>`).join("")}</table>
  <h3 style="margin-top:28px">דיינים ובוררים (${j.judges.length})</h3><table><tr><th>שם</th><th>דוא"ל</th><th>תפקיד</th><th>התמחויות</th><th>ניגוד עניינים</th><th>סטטוס</th></tr>${j.judges.map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.email)}</td><td>${esc(x.role)}</td><td>${esc(x.fields)}</td><td>${esc(x.conflicts)}</td><td><select data-j="${esc(x.email)}">${sel(["ממתין לבדיקת כשירות","מאושר","נדחה","מושעה"],x.status)}</select></td></tr>`).join("")}</table>
  <h3 style="margin-top:28px">חברים (${j.members.length})</h3><table><tr><th>שם</th><th>דוא"ל</th><th>דוא"ל אומת</th><th>זהות ממשלתית</th><th>סטטוס</th></tr>${j.members.map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.email)}</td><td>${x.emailOk?"כן":"לא"}</td><td>${x.govId?"אושרה":"טרם"}</td><td><select data-m="${esc(x.email)}">${sel(["ממתין","פעיל","מושעה"],x.status)}</select></td></tr>`).join("")}</table>
  <h3 style="margin-top:28px">יומן פעולות אחרון</h3><table><tr><th>זמן</th><th>פעולה</th><th>פרטים</th></tr>${j.log.map(x=>`<tr><td>${esc(new Date(x.time).toLocaleString("he-IL"))}</td><td>${esc(x.action)}</td><td>${esc(x.details)}</td></tr>`).join("")}</table>`;
  app().querySelectorAll("[data-c]").forEach(b=>b.onclick=()=>{S.tab="cases";S.caseNo=b.dataset.c;home()});
  app().querySelectorAll("[data-j]").forEach(s=>s.onchange=async()=>{try{await api({action:"admin_judge_status",email:s.dataset.j,status:s.value});msg("עודכן",true)}catch(e){msg(e.message)}});
  app().querySelectorAll("[data-m]").forEach(s=>s.onchange=async()=>{try{await api({action:"admin_member_status",email:s.dataset.m,status:s.value});msg("עודכן",true)}catch(e){msg(e.message)}})}
if(S.token)home();else loginView();
