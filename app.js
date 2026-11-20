const $ = (s) => document.querySelector(s);
let conferences = [];
const fmt = (iso) => new Intl.DateTimeFormat(undefined,{dateStyle:"medium",timeStyle:"short",timeZone:"UTC"}).format(new Date(iso+"Z"));
const allDeadlines = () => conferences.flatMap(c => c.editions.flatMap(e => e.deadlines.map(d => ({...d,conf:c,edition:e})))).sort((a,b)=>a.deadline.localeCompare(b.deadline));
function daysUntil(value){
  const [year,month,day]=value.slice(0,10).split("-").map(Number), now=new Date();
  return Math.round((Date.UTC(year,month-1,day)-Date.UTC(now.getFullYear(),now.getMonth(),now.getDate()))/86400000);
}
function deadlineInstant(deadline, timezone){
  if(timezone==="UNSPECIFIED"||timezone.toUpperCase()==="AOE") return Date.parse(deadline+"Z")+12*3600000;
  if(/^(UTC|GMT|Z)$/i.test(timezone)) return Date.parse(deadline+"Z");
  const offset=timezone.match(/^(?:UTC|GMT)?([+-])(\d{1,2})(?::?(\d{2}))?$/i);
  if(!offset||Number(offset[2])>23||Number(offset[3]||0)>59) return null;
  const minutes=(Number(offset[2])*60+Number(offset[3]||0))*(offset[1]==="+"?1:-1);
  return Date.parse(deadline+"Z")-minutes*60000;
}
function deadlineState(x, now){
  const instant=deadlineInstant(x.deadline,x.timezone);
  if(instant===null){
    const days=daysUntil(x.deadline), past=days<0;
    return {past, left:`${past?`${Math.abs(days)} days ago`:days===0?"Due today":`in ${days} days`} (date only)`};
  }
  const remaining=instant-now, past=remaining<0, days=Math.floor(Math.abs(remaining)/86400000);
  return {past, left:past?(days?`${days} days ago`:"Less than a day ago"):(days?`in ${Math.ceil(remaining/86400000)} days`:"Due within 24 hours")};
}
function initFilters(){
  const tags=[...new Set(conferences.flatMap(c=>c.tags))].sort();
  tags.forEach(t=>$("#tag").add(new Option(t,t)));
  [...new Set(conferences.flatMap(c=>c.editions.map(e=>e.year)))].sort().forEach(y=>$("#year").add(new Option(y,y)));
}
function deadlineKind(kind){
  const labels={abstract:"Abstract",abstract_registration:"Abstract registration",full_paper:"Full paper",submission:"Submission (type unspecified)"};
  return labels[kind.toLowerCase()]||kind.replace(/[_-]+/g," ");
}
function render(){
  const q=$("#search").value.toLowerCase(), tag=$("#tag").value, year=$("#year").value, status=$("#status").value;
  const now=new Date().getTime();
  const rows=allDeadlines().filter(x=>{
    const c=x.conf, e=x.edition, past=deadlineState(x,now).past;
    return (!q||[e.name,e.description,e.location,c.acronym,...c.tags].join(" ").toLowerCase().includes(q))
      &&(!tag||c.tags.includes(tag))&&(!year||String(e.year)===year)
      &&(status==="all"||(status==="past"?past:!past));
  });
  $("#heading").textContent=status==="past"?"Past deadlines":status==="all"?"All deadlines":"Upcoming deadlines";
  const editions=new Map();
  rows.forEach(x=>{
    if(!editions.has(x.edition)) editions.set(x.edition,{conf:x.conf,deadlines:[]});
    editions.get(x.edition).deadlines.push(x);
  });
  $("#count").textContent=`${editions.size} conference edition${editions.size===1?"":"s"} · ${rows.length} deadline${rows.length===1?"":"s"}`;
  $("#list").innerHTML=rows.length?[...editions].map(([e,group])=>{
    const c=group.conf;
    const name=e.website?`<a class="name" href="${esc(e.website)}" target="_blank" rel="noopener">${esc(e.name)} ↗</a>`:`<span class="name">${esc(e.name)}</span>`;
    return `<article class="card">
      <div>${name}
      <p class="description">${esc(e.description)}</p>
      <div class="meta"><span>${esc(e.conference_dates)}</span><span>·</span><span>${esc(e.location)}</span>${c.tags.map(t=>`<span class="tag">${esc(t)}</span>`).join("")}</div></div>
      <div class="deadlines">${group.deadlines.map(x=>{
        const {past,left}=deadlineState(x,now);
        const timezone=x.timezone==="UNSPECIFIED"?"AoE assumed; source unspecified":x.timezone;
        return `<div class="deadline ${past?"past":""}"><div class="deadline-kind">${esc(deadlineKind(x.kind))} · Round ${x.round}</div><div class="date">${fmt(x.deadline)} (${esc(timezone)})</div><div class="countdown">${left}</div></div>`;
      }).join("")}</div>
    </article>`;
  }).join(""):`<div class="empty">No matching deadlines. Try another filter.</div>`;
}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
fetch("data/conferences.json").then(r=>r.json()).then(data=>{
  conferences=data.conferences; initFilters();
  const count=allDeadlines().length;
  $("#stats").innerHTML=`<div class="stat"><strong>${conferences.length}</strong><span>conferences</span></div><div class="stat"><strong>${count}</strong><span>submission rounds</span></div><div class="stat"><strong>${new Set(conferences.flatMap(c=>c.tags)).size}</strong><span>topics</span></div>`;
  ["search","tag","year","status"].forEach(id=>$("#"+id).addEventListener("input",render));
  render();
}).catch(()=>{$("#list").innerHTML='<div class="empty">Could not load data/conferences.json.</div>';});
