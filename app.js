import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
    getAuth,
    GoogleAuthProvider,
    onAuthStateChanged,
    setPersistence,
    browserLocalPersistence,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

// ==========================================
// AQUAVOID FIREBASE CONFIG
// ==========================================

const firebaseConfig = {
    apiKey: "AIzaSyBlmRBOvrcFDgqjcWVHhSK1yOLs7IInaxI",
    authDomain: "aquavoid-5a443.firebaseapp.com",
    projectId: "aquavoid-5a443",
    storageBucket: "aquavoid-5a443.firebasestorage.app",
    messagingSenderId: "142250543404",
    appId: "1:142250543404:web:5219c5b6ddc7071e590489",
    measurementId: "G-GWC7BJQ363"
};

const firebaseApp = getApps().length
    ? getApp()
    : initializeApp(firebaseConfig);

const auth = getAuth(firebaseApp);
const firestoreDb = getFirestore(firebaseApp);

// Analytics is optional: load it in the background so an ad-blocker
// or a slow network can never stop the game from starting.
import('https://www.gstatic.com/firebasejs/12.17.1/firebase-analytics.js')
    .then(async m => {
        if (await m.isSupported()) m.getAnalytics(firebaseApp);
    })
    .catch(error => console.info('AQUAVOID Analytics unavailable.', error));

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: "select_account"
});

// ==========================================
// THREE.JS GAME
// ==========================================

const R=new THREE.WebGLRenderer({antialias:true});
R.setPixelRatio(Math.min(devicePixelRatio,2));R.setSize(innerWidth,innerHeight);
document.body.prepend(R.domElement);
const S=new THREE.Scene();S.background=new THREE.Color(0x28456e);S.fog=new THREE.Fog(0x28456e,30,60);
const C=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.1,300);
S.add(new THREE.HemisphereLight(0xaed6ff,0x0b2a55,.8));
const sun=new THREE.DirectionalLight(0xffe2b8,1.4);sun.position.set(-25,14,-30);S.add(sun);
// stars
{const g=new THREE.BufferGeometry(),a=[];for(let i=0;i<500;i++){const r=180,u=Math.random()*6.28,v=Math.random()*1.2+.1;a.push(Math.cos(u)*Math.cos(v)*r,Math.sin(v)*r,Math.sin(u)*Math.cos(v)*r)}
g.setAttribute('position',new THREE.Float32BufferAttribute(a,3));window.stars=new THREE.Points(g,new THREE.PointsMaterial({color:0xe8f4ef,size:.5,fog:false}));S.add(window.stars)}

const N=71,G=1.6,H=(N-1)/2,LIM=H*G-1;
let base=1.6,surge=0;
const amp=()=>base*(1+surge);
const h=(x,z,t)=>amp()*(.6*Math.sin(.28*x+1.1*t)+.5*Math.sin(.23*z-.8*t+1)+.4*Math.sin(.2*(x+z)+.6*t)+.22*Math.sin(.55*x-.4*z-1.7*t)+.15*Math.sin(.8*z+x*.3+2.2*t));
const pg0=new THREE.PlaneGeometry((N-1)*G,(N-1)*G,N-1,N-1);pg0.rotateX(-Math.PI/2);pg0.setAttribute('color',new THREE.BufferAttribute(new Float32Array(N*N*3),3));
const mesh=new THREE.Mesh(pg0,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.22,metalness:.1}));mesh.frustumCulled=false;S.add(mesh);
const lo=new THREE.Color(0x06284a),mi=new THREE.Color(0x0f7c8f),hi=new THREE.Color(0x6fd0c8),fo=new THREE.Color(0xf2fbff),col=new THREE.Color(),m4=new THREE.Matrix4(),q=new THREE.Quaternion(),v3=new THREE.Vector3(),sc=new THREE.Vector3();
function grid2(t,cx,cz){const A=amp()*1.5,ox=Math.round(cx/G)*G,oz=Math.round(cz/G)*G,pa=pg0.attributes.position,ca=pg0.attributes.color;
 mesh.position.set(ox,0,oz);let i=0;
 for(let b=0;b<N;b++)for(let a=0;a<N;a++){const lx=(a-H)*G,lz=(b-H)*G,y=h(ox+lx,oz+lz,t);pa.setXYZ(i,lx,y,lz);
  const k=THREE.MathUtils.clamp((y/A+1)/2,0,1);
  if(k<.55)col.copy(lo).lerp(mi,k/.55);else if(k<.88)col.copy(mi).lerp(hi,(k-.55)/.33);else col.copy(hi).lerp(fo,(k-.88)/.12);
  ca.setXYZ(i,col.r,col.g,col.b);i++}
 pa.needsUpdate=true;ca.needsUpdate=true;pg0.computeVertexNormals()}
const P=new THREE.Group();S.add(P);P.scale.setScalar(1.3);let hd=0;
const wood=new THREE.MeshStandardMaterial({color:0x8a5a34,roughness:.8}),cloth=new THREE.MeshStandardMaterial({color:0xf6efe0,roughness:.9,side:THREE.DoubleSide});
const hull=new THREE.Mesh(new THREE.BoxGeometry(1.3,.6,2.6),wood);hull.position.y=.05;
const bg=new THREE.ConeGeometry(.92,1.3,4);bg.rotateY(Math.PI/4);bg.rotateX(-Math.PI/2);const bow=new THREE.Mesh(bg,wood);bow.position.set(0,.05,-1.95);bow.scale.set(1,.46,1);
const mast=new THREE.Mesh(new THREE.CylinderGeometry(.05,.06,3.2,8),wood);mast.position.set(0,1.9,0);
const sail=new THREE.Mesh(new THREE.PlaneGeometry(1.7,2.2),cloth);sail.position.set(0,2.0,-.05);
const flag=new THREE.Mesh(new THREE.PlaneGeometry(.55,.3),new THREE.MeshBasicMaterial({color:0xff6b8a,side:THREE.DoubleSide}));flag.position.set(.3,3.35,0);
P.add(hull,bow,mast,sail,flag);
const X=new THREE.Mesh(new THREE.OctahedronGeometry(.7),new THREE.MeshLambertMaterial({color:0xffc857,emissive:0xffa000,emissiveIntensity:.9}));S.add(X);
const beam=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,60,6),new THREE.MeshBasicMaterial({color:0xffc857,transparent:true,opacity:.35}));S.add(beam);
let teal=false,spawned=0;
function spawn(){spawned++;teal=spawned%5===0;
 const c=teal?0x2ec4b6:0xffc857;X.material.color.setHex(c);X.material.emissive.setHex(teal?0x00a896:0xffa000);beam.material.color.setHex(c);
 const a=Math.random()*6.283,r=14+Math.random()*30,c0=P.position;
 X.position.set(c0.x+Math.cos(a)*r,2+Math.random()*2.5,c0.z+Math.sin(a)*r);beam.position.set(X.position.x,X.position.y,X.position.z)}

// particles
const PN=400,pp=new Float32Array(PN*3),pv=new Float32Array(PN*3),pl=new Float32Array(PN),pc=new Float32Array(PN*3);let pi=0;
const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(pp,3));pg.setAttribute('color',new THREE.BufferAttribute(pc,3));
const pts=new THREE.Points(pg,new THREE.PointsMaterial({size:.35,vertexColors:true,transparent:true,opacity:.9,depthWrite:false}));pts.frustumCulled=false;S.add(pts);
for(let i=0;i<PN;i++)pp[i*3+1]=-99;
function emit(p,hex,n,sp){const c=new THREE.Color(hex);for(let k=0;k<n;k++){const i=pi++%PN;pp.set([p.x,p.y,p.z],i*3);pv.set([(Math.random()-.5)*sp,(Math.random()-.3)*sp,(Math.random()-.5)*sp],i*3);pl[i]=.7+Math.random()*.5;pc.set([c.r,c.g,c.b],i*3)}}
function parts(dt){for(let i=0;i<PN;i++){if(pl[i]>0){pl[i]-=dt;pv[i*3+1]-=9*dt;for(let a=0;a<3;a++)pp[i*3+a]+=pv[i*3+a]*dt;if(pl[i]<=0)pp[i*3+1]=-99}}pg.attributes.position.needsUpdate=true;pg.attributes.color.needsUpdate=true}

// audio
let AC;function beep(f,d=.12,ty='sine',v=.15){if(!AC)return;try{const o=AC.createOscillator(),g=AC.createGain();o.type=ty;o.frequency.value=f;g.gain.setValueAtTime(v,AC.currentTime);g.gain.exponentialRampToValueAtTime(.001,AC.currentTime+d);o.connect(g).connect(AC.destination);o.start();o.stop(AC.currentTime+d)}catch(e){}}

// input
const K={};addEventListener('keydown',e=>{if(e.target&&e.target.tagName==='INPUT')return;K[e.code]=1;if(e.code==='Space'||e.code==='ShiftLeft')e.preventDefault()});addEventListener('keyup',e=>{K[e.code]=0});
let yaw=0,pitch=.55,drag=false,jx=0,jz=0,tj=null,tl=null,tlx=0,tly=0,tsx=0,tsy=0;
const look=(dx,dy)=>{yaw-=dx*.006;pitch=THREE.MathUtils.clamp(pitch+dy*.005,.05,1.4)};
let lx=0,ly=0;
addEventListener('mousemove',e=>{const lk=!!document.pointerLockElement,dx=lk?e.movementX:e.clientX-lx,dy=lk?e.movementY:e.clientY-ly;lx=e.clientX;ly=e.clientY;if(lk||(e.buttons&1))look(dx,dy)});
R.domElement.addEventListener('click',()=>{try{R.domElement.requestPointerLock()}catch(e){}});
addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')drag=true;else if(e.clientX<innerWidth/2&&tj===null){tj=e.pointerId;tsx=e.clientX;tsy=e.clientY}else if(e.clientX>=innerWidth/2&&tl===null){tl=e.pointerId;tlx=e.clientX;tly=e.clientY}});
addEventListener('pointerup',e=>{drag=false;if(e.pointerId===tj){tj=null;jx=jz=0}if(e.pointerId===tl)tl=null;});
addEventListener('pointermove',e=>{if(e.pointerId===tl){look(e.clientX-tlx,e.clientY-tly);tlx=e.clientX;tly=e.clientY}if(e.pointerId===tj){jx=THREE.MathUtils.clamp((e.clientX-tsx)/50,-1,1);jz=THREE.MathUtils.clamp((e.clientY-tsy)/50,-1,1)}});
const jb=document.getElementById('jb'),db=document.getElementById('db');
jb.onpointerdown=e=>{e.stopPropagation();K.Space=1};jb.onpointerup=()=>K.Space=0;
db.onpointerdown=e=>{e.stopPropagation();K.ShiftLeft=1};db.onpointerup=()=>K.ShiftLeft=0;
addEventListener('resize',()=>{R.setSize(innerWidth,innerHeight);C.aspect=innerWidth/innerHeight;C.updateProjectionMatrix()});

const $=id=>document.getElementById(id);
const SKINS=[{n:'Sloop',p:0,hull:0x8a5a34,sail:0xf6efe0,flag:0xff6b8a},{n:'Galleon',p:30,hull:0xc4455f,sail:0xffe3d9,flag:0xffc857},{n:'Catamaran',p:60,hull:0x1b2540,sail:0x8fb8ff,flag:0xe8f4ef},{n:'Longship',p:100,hull:0x1f6b4f,sail:0xd8f5e6,flag:0xffc857},{n:'Steamer',p:200,hull:0xb8860b,sail:0xfff4c2,flag:0xc9184a},{n:'Ghost Ship',p:350,hull:0xdfe9f0,sail:0xaee7ff,flag:0x2ec4b6}];
let coins=0,owned=[0],sel=0,unlocked=0,bestWave=0,wown=[0],wsel=0;
let playerName='Captain'+(100+Math.floor(Math.random()*900)),nameSet=false;
// ==========================================
// FIREBASE CLOUD SAVE SYSTEM
// ==========================================

const LEGACY_SAVE_KEY = 'swell-save';
const LEGACY_MIGRATED_KEY = 'aquavoid-legacy-save-migrated';

let currentUser = null;
let cloudReady = false;
let cloudSaveTimer = null;
let cloudSaveInProgress = false;
let cloudSaveAgain = false;

function readLocalSave(key = LEGACY_SAVE_KEY) {
    try {
        const raw = localStorage.getItem(key);

        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        console.warn('Could not read local save:', error);
        return null;
    }
}

function currentSaveData() {
    return {
        coins,
        owned: [...owned],
        sel,
        unlocked,
        bestWave,
        wown: [...wown],
        wsel,
        name: playerName,
        nameSet
    };
}

function applySaveData(data) {
    if (!data || typeof data !== 'object') return;

    coins = Math.max(0, Number(data.coins) || 0);
    owned = Array.isArray(data.owned) ? data.owned.map(Number) : [0];
    wown = Array.isArray(data.wown) ? data.wown.map(Number) : [0];
    sel = Math.max(0, Number(data.sel) || 0);
    wsel = Math.max(0, Number(data.wsel) || 0);
    unlocked = Math.min(4, Math.max(0, Number(data.unlocked) || 0));
    bestWave = Math.max(0, Number(data.bestWave) || 0);

    if (!owned.includes(0)) owned.unshift(0);
    if (!wown.includes(0)) wown.unshift(0);

    // never equip something that is not owned or does not exist
    if (sel >= SKINS.length || !owned.includes(sel)) sel = 0;
    if (wsel > 4 || !wown.includes(wsel)) wsel = 0;

    if (typeof data.name === 'string' && cleanName(data.name).length >= 2) {
        playerName = cleanName(data.name);
        nameSet = !!data.nameSet;
    }

    const nameBox = $('nameInput');
    if (nameBox) nameBox.value = playerName;

    applySkin(sel);
    showCoins();
}

function save() {
    const data = currentSaveData();

    try {
        localStorage.setItem(
            'aquavoid-save',
            JSON.stringify(data)
        );
    } catch (error) {
        console.warn('Local save failed:', error);
    }

    if (currentUser && cloudReady) {
        scheduleCloudSave();
    }
}

async function saveCloudNow() {
    await saveCloudMain();
    await saveLeaderboardEntry();
}

async function saveCloudMain() {
    if (!currentUser || !cloudReady) return;

    const userAtStart = currentUser;
    const saveRef = doc(
        firestoreDb,
        'players',
        userAtStart.uid
    );

    try {
        await setDoc(saveRef, {
            ...currentSaveData(),
            displayName: userAtStart.displayName || '',
            email: userAtStart.email || '',
            photoURL: userAtStart.photoURL || '',
            updatedAt: serverTimestamp()
        }, { merge: true });

    } catch (error) {
        console.error('Cloud save failed:', error);

        if ($('authStatus')) {
            $('authStatus').textContent =
                'Cloud save failed: ' + error.message;
        }
    }
}

function scheduleCloudSave() {
    clearTimeout(cloudSaveTimer);

    cloudSaveTimer = setTimeout(async () => {
        if (cloudSaveInProgress) {
            cloudSaveAgain = true;
            return;
        }

        cloudSaveInProgress = true;

        await saveCloudNow();

        cloudSaveInProgress = false;

        if (cloudSaveAgain) {
            cloudSaveAgain = false;
            scheduleCloudSave();
        }
    }, 800);
}

async function loadCloudSave(user) {
    const saveRef = doc(
        firestoreDb,
        'players',
        user.uid
    );

    const snapshot = await getDoc(saveRef);

    if (snapshot.exists()) {
        applySaveData(snapshot.data());
        cloudReady = true;
        save();
        return;
    }

    const localData =
        readLocalSave('aquavoid-save') ||
        readLocalSave(LEGACY_SAVE_KEY);

    if (localData) {
        applySaveData(localData);
    }

    cloudReady = true;

    await saveCloudNow();

    try {
        localStorage.setItem(LEGACY_MIGRATED_KEY, 'true');
    } catch (error) {}
}


function showCoins(){$('coins').textContent='Coins: '+coins;$('coins2').textContent=$('coins3').textContent='Coins: '+coins}
const SHAPE_OF=['sloop','galleon','cat','long','steam','ghost'],SHAPES={};
{
const M=(g,m,x,y,z)=>{const o=new THREE.Mesh(g,m);o.position.set(x,y,z);P.add(o);return o};
const bx=(w,h,l)=>new THREE.BoxGeometry(w,h,l),cy=(r,h)=>new THREE.CylinderGeometry(r,r,h,10),pl=(w,h)=>{const g=new THREE.PlaneGeometry(w,h,8,8),a=g.attributes.position;for(let i=0;i<a.count;i++)a.setZ(i,Math.sin((a.getX(i)/w+.5)*Math.PI)*.32*(1-(a.getY(i)/h+.5)*.4));g.computeVertexNormals();return g};
const tip=(w,l,d)=>{const g=new THREE.ConeGeometry(w*.7071,l,4);g.rotateY(Math.PI/4);g.rotateX(d*Math.PI/2);return g};
const bow=(x,w,h,l,y,zc,d)=>{M(tip(w,l,d),wood,x,y,zc).scale.y=h/w};
SHAPES.sloop=()=>{M(bx(1.3,.6,2.6),wood,0,.05,0);bow(0,1.3,.6,1.3,.05,-1.95,-1);M(cy(.06,3.2),wood,0,1.9,0);M(pl(1.7,2.2),cloth,0,2,-.05);flag.position.set(.3,3.35,0);P.add(flag)};
SHAPES.galleon=()=>{M(bx(1.8,.8,3),wood,0,.1,0);bow(0,1.8,.8,1.4,.1,-2.2,-1);M(bx(1.6,.7,1),wood,0,.85,1.1);M(cy(.06,3.6),wood,0,2.1,-.5);M(cy(.05,2.6),wood,0,1.6,.9);M(pl(1.9,2.2),cloth,0,2.3,-.55);M(pl(1.4,1.6),cloth,0,1.9,.85);flag.position.set(.3,3.75,-.5);P.add(flag)};
SHAPES.cat=()=>{for(const s of[-1,1]){M(bx(.45,.45,3),wood,s*.8,0,0);bow(s*.8,.45,.45,1,0,-2,-1)}M(bx(2.1,.15,1.8),wood,0,.45,.1);M(cy(.05,3.4),wood,0,2.1,-.2);M(pl(1.2,2.8),cloth,0,2.1,-.25);flag.position.set(.25,3.8,-.2);P.add(flag)};
SHAPES.long=()=>{M(bx(1.1,.5,3.2),wood,0,0,0);bow(0,1.1,.5,1.6,0,-2.4,-1);bow(0,1.1,.5,1.6,0,2.4,1);M(new THREE.ConeGeometry(.2,.8,6),wood,0,.6,-3.1);M(cy(.05,3),wood,0,1.7,0);M(pl(2.3,1.5),cloth,0,2.3,-.05);const sm=[new THREE.MeshStandardMaterial({color:0xffc857}),new THREE.MeshStandardMaterial({color:0xc4455f})];for(let k=0;k<6;k++)for(const s of[-1,1]){M(cy(.22,.06),sm[k%2],s*.58,.2,-1.2+k*.48).rotation.z=Math.PI/2}flag.position.set(.3,3.4,0);P.add(flag)};
SHAPES.steam=()=>{M(bx(1.5,.7,3),wood,0,.1,0);bow(0,1.5,.7,1.3,.1,-2.15,-1);M(bx(1.1,.8,1.2),cloth,0,.85,.4);M(cy(.28,1.1),new THREE.MeshStandardMaterial({color:0xc9184a}),0,1.7,.4);for(const s of[-1,1])M(cy(.5,.2),wood,s*.85,.1,.6).rotation.z=Math.PI/2;flag.position.set(0,2.5,.4);P.add(flag)};
SHAPES.ghost=()=>{M(bx(1,.45,3),wood,0,0,0);bow(0,1,.45,1.5,0,-2.25,-1);M(bx(1,.5,.8),wood,0,.4,1.3);[[-.9,3.2,1.6],[.2,3.8,1.9],[1.1,2.8,1.4]].forEach(([z,hh,w],n)=>{M(cy(.05,hh),wood,0,hh/2+.2,z);M(pl(w,hh*.7),cloth,0,hh*.6+.2,z).rotation.z=(n-1)*.06});M(new THREE.SphereGeometry(.12,10,8),new THREE.MeshBasicMaterial({color:0xaee7ff}),0,.6,-1.7);flag.position.set(.3,3.9,.2);P.add(flag)};
}
const HW=[.65,.9,1.0,.55,.75,.5],metal=new THREE.MeshStandardMaterial({color:0x2b2b30,roughness:.4,metalness:.7}),trim=new THREE.MeshStandardMaterial({color:0xd9b45a,roughness:.4,metalness:.5}),deckM=new THREE.MeshStandardMaterial({color:0xb98a5a,roughness:.9});
function detail(i){const w=HW[i],add=(g,m,x,y,z,rz)=>{const o=new THREE.Mesh(g,m);o.position.set(x,y,z);if(rz)o.rotation.z=rz;P.add(o);return o};
 for(const s of[-1,1]){add(new THREE.BoxGeometry(.04,.07,2.5),trim,s*(w+.01),.14,0);add(new THREE.BoxGeometry(.05,.2,2.2),trim,s*(w-.02),.42,0);
  for(const z of[-.5,.4])add(new THREE.CylinderGeometry(.09,.11,.75,8),metal,s*(w+.1),.34,z,Math.PI/2)}
 add(new THREE.BoxGeometry(w*1.6,.05,2.2),deckM,0,.36,0);
 add(new THREE.SphereGeometry(.1,8,6),new THREE.MeshBasicMaterial({color:0xffd27a}),0,.55,1.2)}
function applySkin(i){const s=SKINS[i];wood.color.setHex(s.hull);cloth.color.setHex(s.sail);flag.material.color.setHex(s.flag);while(P.children.length)P.remove(P.children[0]);SHAPES[SHAPE_OF[i]]();detail(i)}
const hx=n=>'#'+n.toString(16).padStart(6,'0');
function drawShop(){const g=$('grid');g.innerHTML='';SKINS.forEach((s,i)=>{const b=document.createElement('button'),own=owned.includes(i);b.className='sk'+(i===sel?' on':'');
 b.innerHTML='<i style="background:'+hx(s.hull)+'"></i><i style="background:'+hx(s.sail)+'"></i><span>'+s.n+'</span><small>'+(i===sel?'Equipped':own?'Equip':s.p+' coins')+'</small>';
 b.onclick=()=>{applySkin(i);if(own){sel=i;$('note').textContent=s.n+' equipped.'}else if(coins>=s.p){coins-=s.p;owned.push(i);sel=i;$('note').textContent='Bought '+s.n+'!'}else{$('note').textContent='You need '+(s.p-coins)+' more coins for '+s.n+'. Play a round to earn some.'}save();showCoins();drawShop()};g.appendChild(b)})}
$('shopb').onclick=()=>{$('card').style.display='none';$('shop').style.display='flex';$('note').textContent='';drawShop()};
$('back').onclick=()=>{applySkin(sel);$('shop').style.display='none';$('card').style.display='flex'};
applySaveData(readLocalSave('aquavoid-save')||readLocalSave(LEGACY_SAVE_KEY));
applySkin(sel);showCoins();$('nameInput').value=playerName;
let best=0;try{best=+localStorage.getItem('swell-best')||0}catch(e){}
let run=false,t=0,left=90,score=0,combo=0,comboT=0,vx=0,vz=0,vy=0,grounded=false,dashCd=0,shake=0,nextSurge=30,last=performance.now(),spd=0;
function banner(s){const b=$('ban');b.textContent=s;b.style.opacity=1;setTimeout(()=>b.style.opacity=0,1100)}
function start(m,li){mode=m;lvi=li||0;LV=LEVELS[lvi];try{AC=AC||new (window.AudioContext||window.webkitAudioContext)()}catch(e){}
 run=true;left=mode==='level'?LV.t:0;el=0;score=0;caught=0;combo=0;comboT=0;t=0;base=mode==='level'?LV.a:1.3;surge=0;nextSurge=30;spawned=0;hp=maxhp;wave=0;queue=0;waveCool=2;killed=0;hurtT=0;fireT=1;spT=3;mons.forEach(m=>S.remove(m.o));mons.length=0;shots.forEach(b=>{b.on=false;b.o.visible=false});P.position.set(0,3,0);vx=vz=vy=0;spawn();hideAll();$('res').textContent='';$('sl').textContent=mode==='level'?'Crystals':'Score';$('s').textContent=mode==='level'?'0/'+LV.g:0;$('tl').textContent=mode==='level'?'Time':'Wave';$('t').textContent=mode==='level'?LV.t:0;$('hpb').style.display='block';$('cb').textContent='';beep(440,.2,'triangle')}
const LEVELS=[{g:8,t:80,m:2,a:1.2},{g:12,t:80,m:3,a:1.4},{g:16,t:75,m:4,a:1.6},{g:20,t:75,m:5,a:1.8},{g:25,t:70,m:6,a:2}];
const MT=[{hp:2,sp:5,dm:8,sc:1,c:0x2f7d4f,r:1.1},{hp:5,sp:6.5,dm:12,sc:1.35,c:0x5b3f8c,r:1.5},{hp:16,sp:3.6,dm:25,sc:2.6,c:0x8c2f3f,r:2.8}];
const WEAPONS=[{n:'Cannon',p:0,dm:1,rate:.9,sp:34,rng:34,n1:1,sz:.25},{n:'Twin Cannon',p:80,dm:1,rate:.7,sp:36,rng:36,n1:2,sz:.25},{n:'Harpoon',p:150,dm:5,rate:1.5,sp:50,rng:48,n1:1,sz:.2,pierce:1},{n:'Gatling',p:250,dm:.6,rate:.14,sp:44,rng:32,n1:1,sz:.14},{n:'Storm Mortar',p:400,dm:3,rate:1.8,sp:28,rng:40,n1:1,sz:.45,aoe:4}];
let mons=[],mode='level',LV=LEVELS[0],lvi=0,hp=100,maxhp=100,hurtT=0,wave=0,queue=0,qT=0,waveCool=0,killed=0,caught=0,el=0,spT=0,fireT=0;
const shots=[];for(let i=0;i<40;i++){const o=new THREE.Mesh(new THREE.SphereGeometry(.25,8,6),new THREE.MeshBasicMaterial({color:0xffd27a}));o.visible=false;S.add(o);shots.push({o,on:false,vx:0,vy:0,vz:0,life:0,hit:[]})}
function mkMon(k){const T=MT[k],g=new THREE.Group(),mat=new THREE.MeshStandardMaterial({color:T.c,roughness:.6,emissive:0});
 const b=new THREE.Mesh(new THREE.SphereGeometry(.9,14,10),mat);b.scale.set(1,.8,1.4);g.add(b);
 for(const s of[-1,1]){const e=new THREE.Mesh(new THREE.SphereGeometry(.16,8,6),new THREE.MeshBasicMaterial({color:0xffe14d}));e.position.set(s*.4,.35,-.95);g.add(e)}
 const f=new THREE.Mesh(new THREE.ConeGeometry(.3,.9,4),mat);f.position.set(0,.8,.1);g.add(f);
 for(let i=1;i<=3;i++){const q2=new THREE.Mesh(new THREE.SphereGeometry(.55-i*.1,10,8),mat);q2.position.set(0,.1,.9+i*.8);g.add(q2)}
 if(k===2)for(let i=0;i<6;i++){const a=i*1.047,c2=new THREE.Mesh(new THREE.CylinderGeometry(.08,.14,1.8,6),mat);c2.position.set(Math.cos(a)*.8,.9,Math.sin(a)*.8);c2.rotation.set(Math.sin(a)*.5,0,-Math.cos(a)*.5);g.add(c2)}
 g.scale.setScalar(T.sc);S.add(g);return{o:g,mat,k,hp:T.hp,T,hit:0,back:0,ph:Math.random()*6}}
function pickType(){const r=Math.random();if(mode==='endless'){if(wave>=5&&r<.12)return 2;if(wave>=3&&r<.45)return 1;return 0}if(lvi>=4&&r<.06)return 2;if(lvi>=2&&r<.35)return 1;return 0}
function spawnMon(k){const m=mkMon(k===undefined?pickType():k),a=Math.random()*6.283,d=30+Math.random()*10,p=P.position;m.o.position.set(p.x+Math.cos(a)*d,0,p.z+Math.sin(a)*d);m.hp=Math.ceil(m.T.hp*(mode==='endless'?1+wave*.12:1+lvi*.1));mons.push(m)}
function dmg(m,d){m.hp-=d;m.hit=.12}
function battle(dt){const p=P.position;hurtT-=dt;
 if(mode==='endless'){if(queue>0){qT-=dt;if(qT<=0){spawnMon(wave%5===0&&queue===1?2:undefined);queue--;qT=.7}}
  else if(!mons.length){waveCool-=dt;if(waveCool<=0){wave++;queue=Math.min(3+wave*2,26);qT=.5;waveCool=3;banner('Wave '+wave);beep(220,.4,'sawtooth',.15);if(wave>1)hp=Math.min(maxhp,hp+15)}}}
 else{spT-=dt;if(spT<=0&&mons.length<LV.m){spawnMon();spT=5}}
 for(const m of mons){const o=m.o,dx=p.x-o.position.x,dz=p.z-o.position.z,d=Math.hypot(dx,dz)||1,sp=m.T.sp*(1+(mode==='endless'?wave*.03:lvi*.05));
  let bk=1;if(m.back>0){m.back-=dt;bk=-1.6}
  const sw=Math.sin(el*2+m.ph)*.5;
  o.position.x+=(dx/d+(-dz/d)*sw)*sp*dt*bk;o.position.z+=(dz/d+(dx/d)*sw)*sp*dt*bk;
  o.position.y=h(o.position.x,o.position.z,t)-.1;o.rotation.y=Math.atan2(-dx,-dz);
  if(m.hit>0){m.hit-=dt;m.mat.emissive.setHex(m.hit>0?0xff3030:0)}
  if(d<m.T.r+1.3&&hurtT<=0){hp-=m.T.dm;hurtT=1;m.back=.6;vx-=dx/d*14;vz-=dz/d*14;shake=.6;emit(p,0xff5050,20,7);beep(120,.25,'sawtooth',.2)}}
 fireT-=dt;const W=WEAPONS[wsel];
 if(fireT<=0&&mons.length){let b=null,bd=W.rng;for(const m of mons){const d=Math.hypot(m.o.position.x-p.x,m.o.position.z-p.z);if(d<bd){bd=d;b=m}}
  if(b){fireT=W.rate;for(let n=0;n<W.n1;n++){const s=shots.find(q=>!q.on);if(!s)break;
   const off=(n-(W.n1-1)/2)*1.3,tx=b.o.position.x-p.x,tz=b.o.position.z-p.z,ty=b.o.position.y+.5-(p.y+1.4),hl=Math.hypot(tx,tz)||1,l=Math.hypot(tx,ty,tz)||1;
   s.o.position.set(p.x-tz/hl*off,p.y+1.4,p.z+tx/hl*off);s.vx=tx/l*W.sp;s.vy=ty/l*W.sp;s.vz=tz/l*W.sp;s.life=W.rng/W.sp+.4;s.on=true;s.hit=[];s.o.visible=true;s.o.scale.setScalar(W.sz/.25);beep(160+n*30,.08,'square',.06)}}}
 for(const s of shots){if(!s.on)continue;s.life-=dt;s.o.position.x+=s.vx*dt;s.o.position.y+=s.vy*dt;s.o.position.z+=s.vz*dt;
  if(s.life<=0){s.on=false;s.o.visible=false;continue}
  for(const m of mons){if(s.hit.includes(m))continue;const mp=m.o.position,dd=Math.hypot(mp.x-s.o.position.x,mp.y+.5-s.o.position.y,mp.z-s.o.position.z);
   if(dd<m.T.r*.9+W.sz){dmg(m,W.dm);s.hit.push(m);emit(s.o.position,0xffd27a,6,5);
    if(W.aoe){for(const o2 of mons)if(o2!==m&&Math.hypot(o2.o.position.x-mp.x,o2.o.position.z-mp.z)<W.aoe)dmg(o2,W.dm*.7);emit(s.o.position,0xff9040,30,10);beep(90,.3,'sawtooth',.15)}
    if(!W.pierce){s.on=false;s.o.visible=false}break}}}
 for(let i=mons.length-1;i>=0;i--)if(mons[i].hp<=0){const m=mons[i];emit(m.o.position,m.T.c,40,10);S.remove(m.o);mons.splice(i,1);killed++;score+=m.k+1;beep(260,.2,'triangle',.12)}
 $('hpf').style.width=Math.max(hp,0)/maxhp*100+'%'}
function endRound(win){run=false;$('hpb').style.display='none';mons.forEach(m=>S.remove(m.o));mons.length=0;shots.forEach(b=>{b.on=false;b.o.visible=false});
 let earn=score+killed*2,msg;
 if(mode==='level'){if(win){earn+=20*(lvi+1);if(lvi+1>unlocked)unlocked=Math.min(lvi+1,LEVELS.length-1);msg='Level '+(lvi+1)+' cleared! '}else msg='Level failed. '}
 else{earn+=wave*10;const nb=wave>bestWave;if(nb)bestWave=wave;msg='You reached wave '+wave+(nb?' - a new record! ':'. Record: wave '+bestWave+'. ')}
 coins+=earn;save();showCoins();$('res').textContent=msg+'+'+earn+' coins.';$('card').style.display='flex';beep(win?700:200,.6,'sine',.2)}
const hideAll=()=>{for(const id of['card','shop','wp','lv','lb'])$(id).style.display='none'};
const showOnly=id=>{hideAll();$(id).style.display='flex'};
function drawL(){const g=$('lgrid');g.innerHTML='';LEVELS.forEach((l,i)=>{const b=document.createElement('button'),ok=i<=unlocked;b.className='sk';b.innerHTML='<span>Level '+(i+1)+'</span><small>'+(ok?'Catch '+l.g+' in '+l.t+'s':'Locked')+'</small>';b.disabled=!ok;b.style.opacity=ok?1:.45;b.onclick=()=>start('level',i);g.appendChild(b)})}
function drawW(){const g=$('wgrid');g.innerHTML='';WEAPONS.forEach((w,i)=>{const b=document.createElement('button'),own=wown.includes(i);b.className='sk'+(i===wsel?' on':'');
 b.innerHTML='<span>'+w.n+'</span><small>Dmg '+(w.dm*w.n1)+' | '+(1/w.rate).toFixed(1)+' shots/s</small><small>'+(i===wsel?'Equipped':own?'Equip':w.p+' coins')+'</small>';
 b.onclick=()=>{if(own){wsel=i;$('wnote').textContent=w.n+' equipped.'}else if(coins>=w.p){coins-=w.p;wown.push(i);wsel=i;$('wnote').textContent='Bought '+w.n+'!'}else $('wnote').textContent='You need '+(w.p-coins)+' more coins for '+w.n+'.';save();showCoins();drawW()};g.appendChild(b)})}
$('lvb').onclick=()=>{drawL();showOnly('lv')};
$('endb').onclick=()=>start('endless',0);
$('wpb').onclick=()=>{$('wnote').textContent='';drawW();showOnly('wp')};
$('wback').onclick=()=>showOnly('card');$('lback').onclick=()=>showOnly('card');

// ==========================================
// CAPTAIN NAME + LEADERBOARD
// ==========================================

function cleanName(s) {
    return String(s || '')
        .replace(/[^\p{L}\p{N} _.\-]/gu, '')
        .replace(/\s+/g, ' ')
        .slice(0, 16)
        .trim();
}

function saveName() {
    const n = cleanName($('nameInput').value);

    if (n.length < 2) {
        $('nameNote').textContent = 'Use 2 to 16 letters, numbers, spaces, _ . or -';
        return;
    }

    playerName = n;
    nameSet = true;
    $('nameInput').value = n;
    save();
    $('nameNote').textContent = currentUser
        ? 'Name saved! It will show on the leaderboard.'
        : 'Name saved! Sign in with Google to use it on the leaderboard.';
}

function adoptGoogleName(user) {
    if (nameSet) return;

    const n = cleanName((user.displayName || '').split(' ')[0]);

    if (n.length >= 2) {
        playerName = n;
        $('nameInput').value = n;
        save();
    }
}

async function saveLeaderboardEntry() {
    if (!currentUser || !cloudReady || bestWave < 1) return;

    try {
        await setDoc(doc(firestoreDb, 'leaderboard', currentUser.uid), {
            name: playerName,
            bestWave,
            level: unlocked + 1,
            updatedAt: serverTimestamp()
        }, { merge: true });
    } catch (error) {
        console.warn('Leaderboard update failed:', error);
    }
}

async function showLeaderboard() {
    showOnly('lb');
    $('lbNote').textContent = 'Loading...';
    $('lbMine').textContent = '';
    $('lbList').textContent = '';

    try {
        const snap = await getDocs(query(
            collection(firestoreDb, 'leaderboard'),
            where('bestWave', '>', 0),
            orderBy('bestWave', 'desc'),
            limit(10)
        ));

        const list = $('lbList');
        list.textContent = '';

        // names come from other players: always use textContent, never innerHTML
        snap.forEach(d => {
            const v = d.data();
            const li = document.createElement('li');
            const nm = document.createElement('span');
            const sc = document.createElement('span');

            if (currentUser && d.id === currentUser.uid) li.className = 'me';

            nm.className = 'nm';
            nm.textContent = cleanName(v.name) || 'Captain';

            sc.className = 'sc';
            sc.textContent = 'Wave ' + (Number(v.bestWave) || 0) +
                ' | Level ' + (Number(v.level) || 1);

            li.appendChild(nm);
            li.appendChild(sc);
            list.appendChild(li);
        });

        if (snap.empty) {
            $('lbNote').textContent = 'No scores yet. Be the first to finish an Endless run!';
        } else if (!currentUser) {
            $('lbNote').textContent = 'Sign in with Google to put your own score on the board.';
        } else {
            $('lbNote').textContent = 'Top captains by best Endless wave.';
        }

        if (bestWave > 0) {
            $('lbMine').textContent = 'Your best: wave ' + bestWave;
        }
    } catch (error) {
        console.error('Leaderboard failed:', error);
        $('lbNote').textContent = 'Could not load the leaderboard: ' + error.message;
    }
}

$('lbb').onclick = showLeaderboard;
$('lbBack').onclick = () => showOnly('card');
$('nameSave').onclick = saveName;
$('nameInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') saveName();
});
function frame(now){
 const dt=Math.min((now-last)/1000,.05);last=now;t+=dt*1.4;
 const p=P.position;
 if(run){
  el+=dt;if(mode==='level')left-=dt;base=(mode==='level'?LV.a:1.3)+Math.min(el*.01,1.8);
  if(el>nextSurge){surge=.4;nextSurge+=30;banner('Surge!');beep(110,.5,'sawtooth',.2)}
  surge=Math.max(0,surge-dt*.12);
  if(K.KeyQ||K.ArrowLeft)yaw+=2*dt;if(K.KeyE||K.ArrowRight)yaw-=2*dt;if(K.ArrowUp)pitch=Math.max(.05,pitch-1.5*dt);if(K.ArrowDown)pitch=Math.min(1.4,pitch+1.5*dt);
  const ix=(K.KeyD?1:0)-(K.KeyA?1:0)+jx,iz=(K.KeyS?1:0)-(K.KeyW?1:0)+jz;
  const c=Math.cos(yaw),s=Math.sin(yaw);
  vx+=(ix*c+iz*s)*50*dt;vz+=(-ix*s+iz*c)*50*dt;
  if(K.ShiftLeft&&dashCd<=0&&(ix||iz)){const l=Math.hypot(ix,iz);vx+=(ix*c+iz*s)/l*16;vz+=(-ix*s+iz*c)/l*16;dashCd=1.5;shake=.25;beep(300,.15,'square',.08);emit(p,0xe8f4ef,25,6)}
  dashCd-=dt;
  const d=Math.exp(-3*dt);vx*=d;vz*=d;
  p.x+=vx*dt;p.z+=vz*dt;
  vy-=13*dt;p.y+=vy*dt;
  const g=h(p.x,p.z,t)+.6,gv=(h(p.x,p.z,t+.02)-h(p.x,p.z,t))/.02;
  const was=grounded;grounded=false;
  if(p.y<=g){if(!was&&vy<-4){emit(p,0xff6b8a,10,4)}p.y=g;vy=Math.max(vy,gv*1.3);grounded=true}
  if(K.Space&&grounded){vy=11+Math.max(gv,0);beep(520,.1,'triangle',.08)}
  if(!grounded&&Math.hypot(vx,vz)>3&&Math.random()<.6)emit(p,0x6fd6c4,1,1.5);
  const sp=Math.hypot(vx,vz);if(sp>1.5){const tg=Math.atan2(-vx,-vz);let dd=tg-hd;dd=Math.atan2(Math.sin(dd),Math.cos(dd));hd+=dd*Math.min(1,dt*5)}
  const e=.6,sx=h(p.x+e,p.z,t)-h(p.x-e,p.z,t),sz=h(p.x,p.z+e,t)-h(p.x,p.z-e,t);
  const sF=(-sx*Math.sin(hd)-sz*Math.cos(hd))/(2*e),sR=(sx*Math.cos(hd)-sz*Math.sin(hd))/(2*e);
  P.rotation.set(grounded?Math.atan(sF):THREE.MathUtils.clamp(vy*.04,-.5,.5),hd,Math.atan(sR),'YXZ');
  if(grounded&&sp>3&&Math.random()<.5)emit(p,0xf2fbff,1,2);
  X.rotation.y+=dt*2;X.rotation.x+=dt;beam.position.set(X.position.x,X.position.y,X.position.z);
  comboT-=dt;if(comboT<=0&&combo){combo=0;$('cb').textContent=''}
  if(p.distanceTo(X.position)<2.6){
   combo=comboT>0?Math.min(combo+1,9):1;comboT=7;
   if(teal){if(mode==='level'){left+=5;banner('+5 seconds')}else{hp=Math.min(maxhp,hp+30);banner('+30 health')}}if(mode==='endless')hp=Math.min(maxhp,hp+10);caught++;
   score+=combo;shake=.5;emit(X.position,teal?0x2ec4b6:0xffc857,50,9);beep(500+combo*70,.2,'triangle',.18);
   $('s').textContent=mode==='level'?caught+'/'+LV.g:score;$('cb').textContent=combo>1?'x'+combo:'';spawn()}
  battle(dt);if(mode==='endless')$('s').textContent=score;$('t').textContent=mode==='level'?Math.ceil(Math.max(left,0)):wave;
  if(mode==='level'&&caught>=LV.g)endRound(true);else if(hp<=0||(mode==='level'&&left<=0))endRound(false);
 }
 if(!run){hd+=dt*.5;p.y=h(p.x,p.z,t)+.6;P.rotation.set(0,hd,0)}
 parts(dt);grid2(t,p.x,p.z);
 spd+=(Math.hypot(vx,vz)-spd)*.1;C.fov=60+spd*.9;C.updateProjectionMatrix();
 const sh=shake;shake=Math.max(0,shake-dt*1.5);
 const cd=15,ch=Math.cos(pitch)*cd;C.position.set(p.x+Math.sin(yaw)*ch+(Math.random()-.5)*sh,p.y+Math.sin(pitch)*cd+(Math.random()-.5)*sh,p.z+Math.cos(yaw)*ch);C.position.y=Math.max(C.position.y,h(C.position.x,C.position.z,t)+2);C.lookAt(p.x,p.y,p.z);
 stars.position.set(p.x,0,p.z);
 R.render(S,C);requestAnimationFrame(frame)}
P.position.set(0,3,0);spawn();requestAnimationFrame(frame);

// ==========================================
// GOOGLE LOGIN
// ==========================================

const googleSignInButton = $('googleSignIn');
const googleSignOutButton = $('googleSignOut');

if (googleSignInButton) {
    googleSignInButton.addEventListener('click', async () => {
        googleSignInButton.disabled = true;

        try {
            await setPersistence(
                auth,
                browserLocalPersistence
            );

            await signInWithPopup(auth, googleProvider);

        } catch (error) {
            console.error('Google sign-in failed:', error);

            if (error.code === 'auth/popup-blocked' ||
                error.code === 'auth/operation-not-supported-in-this-environment') {
                $('authStatus').textContent = 'Popup blocked, redirecting to Google...';
                await signInWithRedirect(auth, googleProvider);
                return;
            }

            const hints = {
                'auth/unauthorized-domain':
                    'This website is not allowed yet. In Firebase Console go to Authentication > Settings > Authorized domains and add it.',
                'auth/popup-closed-by-user': 'Login window was closed. Try again.',
                'auth/cancelled-popup-request': 'Login window was closed. Try again.',
                'auth/operation-not-allowed':
                    'Google sign-in is switched off. Enable it in Firebase Console > Authentication > Sign-in method.'
            };

            $('authStatus').textContent =
                hints[error.code] || ('Login failed: ' + error.message);

        } finally {
            googleSignInButton.disabled = false;
        }
    });
}

if (googleSignOutButton) {
    googleSignOutButton.addEventListener('click', async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error(error);
        }
    });
}

onAuthStateChanged(auth, async user => {
    currentUser = user;
    cloudReady = false;

    if (user) {
        $('authStatus').textContent =
            'Signed in successfully! Loading cloud save...';

        $('authUser').hidden = false;
        $('authUser').textContent =
            user.displayName || user.email;

        $('googleSignIn').hidden = true;
        $('googleSignOut').hidden = false;

        try {
            await loadCloudSave(user);
            adoptGoogleName(user);

            $('authStatus').textContent =
                'Cloud save connected successfully!';

        } catch (error) {
            console.error('Cloud load failed:', error);

            $('authStatus').textContent =
                'Cloud save error: ' + error.message;
        }

    } else {
        $('authStatus').textContent =
            'Sign in with Google to enable cloud saves.';

        $('authUser').hidden = true;
        $('googleSignIn').hidden = false;
        $('googleSignOut').hidden = true;
    }
});

// finish a redirect sign-in (used when popups are blocked)
getRedirectResult(auth).catch(error => console.warn('Redirect sign-in failed:', error));
