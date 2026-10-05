/* ==========================================================
   Éditeur de mondes Karel
   Produit les deux fichiers lus par le simulateur :
   - monde.monde : l'état de départ, puis (après ---) l'état d'arrivée
   - CONSIGNES.md : la consigne, en Markdown
   ========================================================== */
const $=id=>document.getElementById(id);

/* ---------- Markdown (copié du simulateur : script/karel.js) ---------- */
/* Titres #, paragraphes, listes à puces et numérotées, tableaux, blocs ```,
   et en ligne : **gras** et `code`. Le HTML est toujours échappé. */
const escHtml=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function md(src){
  const inline=s=>{
    const codes=[];
    s=escHtml(s).replace(/`([^`]+)`/g,(_,c)=>{codes.push(c);return '\u0000'+(codes.length-1)+'\u0000'});
    s=s.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
    return s.replace(/\u0000(\d+)\u0000/g,(_,i)=>'<code>'+codes[i]+'</code>');
  };
  const cells=r=>r.replace(/^\s*\||\|\s*$/g,'').split('|').map(c=>c.trim());
  const special=/^(#{1,4} |```|\||\d+\. |[-*] )/;
  const lines=src.replace(/\r\n?/g,'\n').split('\n');
  let out='',i=0,m;
  while(i<lines.length){
    const l=lines[i];
    if(/^```/.test(l)){
      const code=[];i++;
      while(i<lines.length&&!/^```/.test(lines[i]))code.push(lines[i++]);
      i++;out+='<pre>'+escHtml(code.join('\n'))+'</pre>';
    }else if(m=l.match(/^(#{1,4}) (.*)/)){
      out+=`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`;i++;
    }else if(/^\|/.test(l)){
      const rows=[];
      while(i<lines.length&&/^\|/.test(lines[i]))rows.push(lines[i++]);
      out+='<table><thead><tr>'+cells(rows[0]).map(c=>`<th>${inline(c)}</th>`).join('')+'</tr></thead><tbody>'
        +rows.slice(2).map(r=>'<tr>'+cells(r).map(c=>`<td>${inline(c)}</td>`).join('')+'</tr>').join('')+'</tbody></table>';
    }else if(/^\d+\. /.test(l)||/^[-*] /.test(l)){
      const ordered=/^\d+\. /.test(l),re=ordered?/^\d+\. /:/^[-*] /,items=[];
      while(i<lines.length&&re.test(lines[i]))items.push(lines[i++].replace(re,''));
      const tag=ordered?'ol':'ul';
      out+=`<${tag}>`+items.map(t=>`<li>${inline(t)}</li>`).join('')+`</${tag}>`;
    }else if(!l.trim()){
      i++;
    }else{
      const p=[];
      while(i<lines.length&&lines[i].trim()&&!special.test(lines[i]))p.push(lines[i++]);
      if(!p.length){p.push(lines[i++])}
      out+='<p>'+inline(p.join(' '))+'</p>';
    }
  }
  return out;
}

/* ---------- Modèle : l'état du monde et les opérations dessus ---------- */
/* Le départ et l'arrivée ont les mêmes dimensions. Les murs n'existent que dans le départ :
   l'arrivée les reprend toujours. Karel (k) est unique dans chaque grille, et une case ne peut
   pas contenir à la fois Karel et des balises (limite du format de monde). */
const FLECHES='^>v<',MAX=40,ICONES=['▲','▶','▼','◀'];
const MSG_MURS='Les murs se modifient dans le départ : ils sont recopiés dans l\u2019arrivée.';
const nouvelEtat=(l,h)=>({w:l,h,
  start:{wall:Array(l*h).fill(false),b:Array(l*h).fill(0),k:null},
  goal:{b:Array(l*h).fill(0),k:null}});
let etat=nouvelEtat(8,5);
etat.start.k={x:0,y:0,d:1};
const meta={titre:'',extra:[],sac:null,sansArrivee:false};
const idx=(x,y)=>y*etat.w+x;
const grille=nom=>nom==='start'?etat.start:etat.goal;
const surKarel=(g,x,y)=>!!g.k&&g.k.x===x&&g.k.y===y;

function poserMur(x,y,mur){
  const i=idx(x,y),s=etat.start,g=etat.goal;
  s.wall[i]=mur;
  if(mur){   // un mur ne contient ni balise ni Karel, dans le départ comme dans l'arrivée
    s.b[i]=0;g.b[i]=0;
    if(surKarel(s,x,y))s.k=null;
    if(surKarel(g,x,y))g.k=null;
  }
}
function changerBalise(nom,x,y,delta){   // renvoie un message si l'opération est refusée
  const g=grille(nom),i=idx(x,y);
  if(delta<0){g.b[i]=Math.max(0,g.b[i]-1);return ''}
  if(etat.start.wall[i])return 'Une case-mur ne peut pas contenir de balise.';
  if(surKarel(g,x,y))return 'Karel et une balise ne peuvent pas partager une case (limite du format de monde).';
  g.b[i]=Math.min(9,g.b[i]+1);return '';
}
function placerKarel(nom,x,y,d){
  const g=grille(nom),i=idx(x,y);
  if(etat.start.wall[i])return 'Karel ne peut pas être sur un mur.';
  g.b[i]=0;g.k={x,y,d};return '';   // Karel est unique : l'ancienne position disparaît
}
function effacer(nom,x,y){
  const g=grille(nom),i=idx(x,y);
  if(nom==='goal'&&etat.start.wall[i])return MSG_MURS;
  g.b[i]=0;
  if(surKarel(g,x,y))g.k=null;
  if(nom==='start')etat.start.wall[i]=false;
  return '';
}
function copierDepart(){
  etat.goal.b=[...etat.start.b];
  etat.goal.k=etat.start.k?{...etat.start.k}:null;
}
const arriveeRemplie=()=>!!etat.goal.k||etat.goal.b.some(v=>v>0);

/* --- taille --- */
function elementsPerdus(l,h){   // éléments qui disparaîtraient si le monde passait à l x h
  let n=0;
  for(let y=0;y<etat.h;y++)for(let x=0;x<etat.w;x++){
    if(x<l&&y<h)continue;
    const i=idx(x,y);
    if(etat.start.wall[i]||etat.start.b[i]||etat.goal.b[i])n++;
  }
  for(const g of [etat.start,etat.goal])if(g.k&&(g.k.x>=l||g.k.y>=h))n++;
  return n;
}
function redimensionner(l,h){   // le contenu reste en haut à gauche
  const e=nouvelEtat(l,h);
  for(let y=0;y<Math.min(h,etat.h);y++)for(let x=0;x<Math.min(l,etat.w);x++){
    const i=y*etat.w+x,j=y*l+x;
    e.start.wall[j]=etat.start.wall[i];e.start.b[j]=etat.start.b[i];e.goal.b[j]=etat.goal.b[i];
  }
  for(const nom of ['start','goal']){const k=grille(nom).k;if(k&&k.x<l&&k.y<h)e[nom].k={...k}}
  etat=e;
}

/* --- historique (annuler / rétablir) : instantanés de l'état de la grille --- */
const pile={undo:[],redo:[]};
const instantane=()=>JSON.stringify(etat);
function memoriser(avant){pile.undo.push(avant);if(pile.undo.length>100)pile.undo.shift();pile.redo=[]}
function annulerRetablir(de,vers){
  if(!pile[de].length)return false;
  pile[vers].push(instantane());etat=JSON.parse(pile[de].pop());return true;
}

/* --- avertissements avant l'export du monde --- */
function avertissements(){
  const a=[],s=etat.start,g=etat.goal,total=v=>v.b.reduce((t,n)=>t+n,0);
  if(!s.k)a.push('Karel est absent du départ : le simulateur refusera ce monde.');
  if(!meta.sansArrivee){
    const memeKarel=!g.k||(s.k&&g.k.x===s.k.x&&g.k.y===s.k.y&&g.k.d===s.k.d);
    if(memeKarel&&s.b.every((v,i)=>v===g.b[i]))a.push('L\u2019arrivée est identique au départ : Karel n\u2019a rien à faire.');
    if(meta.sac!==null&&total(g)>total(s)+meta.sac)
      a.push(`L\u2019arrivée contient ${total(g)} balises, mais le monde en contient ${total(s)} et le sac ${meta.sac} : Karel ne pourra pas en poser autant.`);
  }
  return a;
}

/* --- texte du fichier .monde --- */
function texteGrille(g){
  const lignes=[];
  for(let y=0;y<etat.h;y++){
    const r=[];
    for(let x=0;x<etat.w;x++){
      const i=idx(x,y);
      r.push(surKarel(g,x,y)?FLECHES[g.k.d]:etat.start.wall[i]?'#':g.b[i]>0?String(g.b[i]):'.');
    }
    lignes.push(r.join(' '));
  }
  return lignes.join('\n');
}
function serialiser(){
  const out=[];
  if(meta.titre.trim())out.push('; '+meta.titre.trim());
  for(const c of meta.extra)out.push('; '+c);
  if(meta.sac!==null)out.push('sac '+meta.sac);
  out.push(texteGrille(etat.start));
  if(!meta.sansArrivee){out.push('---');out.push(texteGrille(etat.goal))}
  return out.join('\n')+'\n';
}

/* --- lecture d'un fichier .monde (mêmes règles que le simulateur) --- */
function parseMonde(texte){
  const avert=[],parties=[[]],coms=[];
  for(const brut of texte.replace(/\r\n?/g,'\n').split('\n')){
    const l=brut.trim();
    if(/^-{3,}$/.test(l)){parties.push([]);continue}
    if(l[0]===';'){coms.push(l.slice(1).trim());continue}
    if(l)parties[parties.length-1].push(l);
  }
  if(parties.length>2)avert.push('Plus de deux parties séparées par --- : les suivantes sont ignorées.');
  const lire=(lignes,nom)=>{
    let sac=null,karels=0;const rows=[];
    for(const l of lignes){const m=l.match(/^sac\s+(\d+)/i);if(m)sac=+m[1];else rows.push(l.replace(/\s+/g,''))}
    if(!rows.length)throw new Error(`${nom} : aucune rangée de cases.`);
    const w=rows[0].length,h=rows.length;
    if(w>MAX||h>MAX)throw new Error(`${nom} : ${w} × ${h} cases, l\u2019éditeur accepte au plus ${MAX} × ${MAX}.`);
    const g={w,h,sac,wall:[],b:[],k:null};
    rows.forEach((r,y)=>{
      if(r.length!==w)throw new Error(`${nom} : la rangée ${y+1} n\u2019a pas la même largeur que la première.`);
      [...r].forEach((c,x)=>{
        const i=y*w+x,d=FLECHES.indexOf(c);
        g.wall[i]=c==='#';g.b[i]=/[1-9]/.test(c)?+c:0;
        if(d>=0){g.k={x,y,d};karels++}   // comme le simulateur : le dernier Karel rencontré l'emporte
        else if(!'.#123456789'.includes(c))throw new Error(`${nom} : caractère « ${c} » inconnu (rangée ${y+1}).`);
      });
    });
    if(karels>1)avert.push(`${nom} : ${karels} Karel trouvés, seul le dernier est conservé.`);
    return g;
  };
  const dep=lire(parties[0],'Départ'),e=nouvelEtat(dep.w,dep.h);
  e.start.wall=dep.wall;e.start.b=dep.b;e.start.k=dep.k;
  if(parties[1]){
    const arr=lire(parties[1],'Arrivée');
    if(arr.w!==dep.w||arr.h!==dep.h)avert.push(`L\u2019arrivée fait ${arr.w} × ${arr.h} et le départ ${dep.w} × ${dep.h} : l\u2019arrivée a été ajustée.`);
    let mursDiff=false;
    for(let y=0;y<dep.h;y++)for(let x=0;x<dep.w;x++){
      const i=y*dep.w+x;
      const mur=x<arr.w&&y<arr.h&&arr.wall[y*arr.w+x];
      if(!!mur!==dep.wall[i])mursDiff=true;
      if(x<arr.w&&y<arr.h&&!dep.wall[i])e.goal.b[i]=arr.b[y*arr.w+x];
    }
    if(mursDiff)avert.push('Les murs de l\u2019arrivée diffèrent de ceux du départ : ceux du départ ont été conservés.');
    if(arr.k&&arr.k.x<dep.w&&arr.k.y<dep.h&&!dep.wall[arr.k.y*dep.w+arr.k.x]){e.goal.k=arr.k;e.goal.b[arr.k.y*dep.w+arr.k.x]=0}
  }
  return {etat:e,
    meta:{titre:coms[0]||'',extra:coms.slice(1),sac:dep.sac,sansArrivee:!parties[1]},
    avertissements:avert};
}

/* ---------- Affichage des grilles (même aspect que dans le simulateur) ---------- */
let outil='mur',kdir=1,trait=null,survol=null;
const canvasDe=nom=>nom==='start'?$('cvA'):$('cvB');
function dessiner(nom){
  const cv=canvasDe(nom),g=grille(nom),{w,h}=etat;
  const zone=cv.parentElement.clientWidth||480;
  const cs=Math.max(20,Math.min(56,Math.floor(zone/w))),dpr=devicePixelRatio||1;
  cv._cs=cs;
  cv.width=w*cs*dpr;cv.height=h*cs*dpr;cv.style.width=w*cs+'px';cv.style.height=h*cs+'px';
  const c=cv.getContext('2d'),css=getComputedStyle(document.documentElement),col=n=>css.getPropertyValue(n);
  c.scale(dpr,dpr);c.font=`bold ${cs*.38}px sans-serif`;c.textAlign='center';c.textBaseline='middle';
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=idx(x,y);
    c.strokeStyle=col('--grid');c.strokeRect(x*cs,y*cs,cs,cs);
    if(etat.start.wall[i]){c.fillStyle=col('--wall');c.fillRect(x*cs+1,y*cs+1,cs-2,cs-2)}
    if(g.b[i]){
      c.beginPath();c.arc((x+.5)*cs,(y+.5)*cs,cs*.28,0,7);c.fillStyle=col('--bp');c.fill();
      c.fillStyle='#000';c.fillText(g.b[i],(x+.5)*cs,(y+.55)*cs);
    }
  }
  if(g.k){
    c.save();c.translate((g.k.x+.5)*cs,(g.k.y+.5)*cs);c.rotate(g.k.d*Math.PI/2);
    c.beginPath();c.moveTo(0,-cs*.36);c.lineTo(cs*.3,cs*.3);c.lineTo(0,cs*.15);c.lineTo(-cs*.3,cs*.3);c.closePath();
    c.fillStyle=col('--acc');c.fill();c.restore();
  }
  if(survol&&survol.nom===nom){   // contour de la case sous la souris
    c.strokeStyle=col('--acc');c.lineWidth=2;c.strokeRect(survol.x*cs+1,survol.y*cs+1,cs-2,cs-2);c.lineWidth=1;
  }
}
const dessinerTout=()=>{dessiner('start');dessiner('goal')};

/* ---------- Messages, champs, palette ---------- */
function msg(t,err){$('msg').textContent=t;$('msg').className=err?'err':''}
function synchroniserChamps(){
  $('titre').value=meta.titre;$('sac').value=meta.sac===null?'':meta.sac;
  $('larg').value=etat.w;$('haut').value=etat.h;
  $('sansArrivee').checked=meta.sansArrivee;
  $('blocArrivee').classList.toggle('inactive',meta.sansArrivee);
}
function majBoutons(){$('annuler').disabled=!pile.undo.length;$('retablir').disabled=!pile.redo.length}
function majPalette(){
  for(const b of document.querySelectorAll('.outil')){
    const actif=b.dataset.outil===outil;
    b.classList.toggle('actif',actif);b.setAttribute('aria-pressed',actif?'true':'false');
  }
  $('icoKarel').textContent=ICONES[kdir];
}
function apresChangement(){synchroniserChamps();majBoutons();dessinerTout()}
function choisirOutil(o){
  if(o==='karel'&&outil==='karel')kdir=(kdir+1)%4;   // re-cliquer sur Karel change son orientation
  outil=o;majPalette();
}

/* ---------- Peinture à la souris ---------- */
function celleSous(nom,e){
  const cv=canvasDe(nom),r=cv.getBoundingClientRect(),cs=cv._cs||40;
  const x=Math.floor((e.clientX-r.left)/cs),y=Math.floor((e.clientY-r.top)/cs);
  return x>=0&&y>=0&&x<etat.w&&y<etat.h?{x,y}:null;
}
function appuyer(nom,e){
  if(e.button!==0&&e.button!==2)return;
  if(nom==='goal'&&meta.sansArrivee)return;
  const c=celleSous(nom,e);if(!c)return;
  const droit=e.button===2;
  trait={nom,avant:instantane(),vus:new Set(),message:'',
         outil:droit?(outil==='balise'?'moins':'gomme'):outil,
         effacerMurs:etat.start.wall[idx(c.x,c.y)]};   // le 1er mur touché décide : on pose ou on retire
  msg('');
  peindre(c);
}
function peindre({x,y}){
  const t=trait,i=idx(x,y);
  if(t.vus.has(i))return;
  t.vus.add(i);
  let m='';
  switch(t.outil){
    case 'mur':    if(t.nom==='goal')m=MSG_MURS;else poserMur(x,y,!t.effacerMurs);break;
    case 'balise': m=changerBalise(t.nom,x,y,1);break;
    case 'moins':  m=changerBalise(t.nom,x,y,-1);break;
    case 'gomme':  m=effacer(t.nom,x,y);break;
    case 'karel':
      if(t.vus.size>1)break;   // Karel se pose d'un seul clic, pas en glissant
      if(surKarel(grille(t.nom),x,y)){const k=grille(t.nom).k;k.d=(k.d+1)%4;kdir=k.d;majPalette()}
      else m=placerKarel(t.nom,x,y,kdir);
      break;
  }
  if(m&&!t.message){t.message=m;msg(m,1)}
  dessinerTout();
}
function deplacer(nom,e){
  const c=celleSous(nom,e);
  survol=c?{nom,...c}:null;
  if(trait&&trait.nom===nom&&c&&(e.buttons&3))peindre(c);
  else dessiner(nom);
}
function relacher(){
  if(!trait)return;
  if(instantane()!==trait.avant){memoriser(trait.avant);majBoutons()}   // un trait = une seule étape d'historique
  trait=null;
}
function quitter(){survol=null;dessinerTout()}
for(const nom of ['start','goal']){
  const cv=canvasDe(nom);
  cv.addEventListener('pointerdown',e=>{appuyer(nom,e);if(cv.setPointerCapture&&e.pointerId!==undefined)cv.setPointerCapture(e.pointerId)});
  cv.addEventListener('pointermove',e=>deplacer(nom,e));
  cv.addEventListener('pointerup',relacher);
  cv.addEventListener('pointercancel',relacher);
  cv.addEventListener('pointerleave',quitter);
  cv.addEventListener('contextmenu',e=>e.preventDefault());
}
for(const b of document.querySelectorAll('.outil'))b.addEventListener('click',()=>choisirOutil(b.dataset.outil));

/* ---------- Boutons et champs ---------- */
function annuler(){if(annulerRetablir('undo','redo')){msg('');apresChangement()}}
function retablir(){if(annulerRetablir('redo','undo')){msg('');apresChangement()}}
$('annuler').addEventListener('click',annuler);
$('retablir').addEventListener('click',retablir);
document.addEventListener('keydown',e=>{
  if(!(e.ctrlKey||e.metaKey)||/^(INPUT|TEXTAREA)$/.test((e.target&&e.target.tagName)||''))return;   // dans un champ de texte, le navigateur gère
  const k=(e.key||'').toLowerCase();
  if(k==='z'&&!e.shiftKey){e.preventDefault();annuler()}
  else if(k==='y'||(k==='z'&&e.shiftKey)){e.preventDefault();retablir()}
});
$('copier').addEventListener('click',()=>{
  if(meta.sansArrivee)return;
  if(arriveeRemplie()&&!confirm('Remplacer l\u2019arrivée actuelle par une copie du départ ?'))return;
  const avant=instantane();copierDepart();memoriser(avant);apresChangement();
  msg('Arrivée recopiée depuis le départ : retirez ce que Karel doit avoir ramassé, ajoutez ce qu\u2019il doit avoir posé.');
});
$('sansArrivee').addEventListener('change',e=>{meta.sansArrivee=e.target.checked;apresChangement()});
$('titre').addEventListener('input',e=>{meta.titre=e.target.value});
$('sac').addEventListener('change',e=>{
  const v=e.target.value.trim();
  meta.sac=v===''?null:Math.max(0,Math.round(+v)||0);
  synchroniserChamps();
});
function changerTaille(){
  let l=Math.round(+$('larg').value),h=Math.round(+$('haut').value);
  if(!(l>=1&&h>=1)){synchroniserChamps();msg(`La largeur et la hauteur doivent être comprises entre 1 et ${MAX}.`,1);return}
  l=Math.min(l,MAX);h=Math.min(h,MAX);
  if(l===etat.w&&h===etat.h){synchroniserChamps();return}
  const n=elementsPerdus(l,h);
  if(n&&!confirm(`Cette réduction supprime ${n} élément${n>1?'s':''} (murs, balises ou Karel). Continuer ?`)){synchroniserChamps();return}
  const avant=instantane();redimensionner(l,h);memoriser(avant);apresChangement();msg('');
}
$('larg').addEventListener('change',changerTaille);
$('haut').addEventListener('change',changerTaille);

/* ---------- Ouvrir et exporter ---------- */
async function ouvrirMonde(f){
  try{
    const r=parseMonde(await f.text()),avant=instantane();
    etat=r.etat;Object.assign(meta,r.meta);
    memoriser(avant);$('nomMonde').value=f.name;apresChangement();
    msg('Monde « '+f.name+' » ouvert.'+(r.avertissements.length?' '+r.avertissements.join(' '):''));
  }catch(e){msg(e.message,1)}
}
async function ouvrirConsigne(f){
  try{$('md').value=await f.text();$('nomConsigne').value=f.name;apercu();msg('Consigne « '+f.name+' » ouverte.')}
  catch(e){msg(e.message,1)}
}
function choisirFichier(input,traiter){
  input.onchange=()=>{const f=input.files[0];input.value='';if(f)traiter(f)};
  input.click();
}
$('ouvrirMonde').addEventListener('click',()=>choisirFichier($('fichierMonde'),ouvrirMonde));
$('ouvrirConsigne').addEventListener('click',()=>choisirFichier($('fichierConsigne'),ouvrirConsigne));

const nomFichier=(v,defaut)=>v.replace(/[\\/:*?"<>|]/g,'_').trim()||defaut;
function telecharger(nom,texte){
  const url=URL.createObjectURL(new Blob([texte],{type:'text/plain;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download=nom;
  document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function exporterMonde(){
  const a=avertissements();
  if(a.length&&!confirm(a.map(t=>'• '+t).join('\n')+'\n\nExporter quand même ?'))return;
  const nom=nomFichier($('nomMonde').value,'monde.monde');
  telecharger(nom,serialiser());msg('Monde exporté : '+nom);
}
function exporterConsigne(){
  const t=$('md').value;
  if(!t.trim()&&!confirm('La consigne est vide. Exporter quand même ?'))return;
  const nom=nomFichier($('nomConsigne').value,'CONSIGNES.md');
  telecharger(nom,t.replace(/\r\n?/g,'\n').replace(/\s*$/,'\n'));msg('Consigne exportée : '+nom);
}
$('exporterMonde').addEventListener('click',exporterMonde);
$('exporterConsigne').addEventListener('click',exporterConsigne);

/* ---------- Aperçu Markdown ---------- */
function apercu(){
  const t=$('md').value;
  $('apercu').innerHTML=t.trim()?md(t):'<p class="vide">L\u2019aperçu de la consigne apparaît ici.</p>';
}
$('md').addEventListener('input',apercu);

/* ---------- Démarrage ---------- */
addEventListener('resize',dessinerTout);
majPalette();synchroniserChamps();majBoutons();apercu();dessinerTout();
