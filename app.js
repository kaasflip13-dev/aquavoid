
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
    getAuth,
    GoogleAuthProvider,
    onAuthStateChanged,
    setPersistence,
    browserLocalPersistence,
    signInWithPopup,
    signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import {
    getAnalytics,
    isSupported
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-analytics.js";

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

try {
    if (await isSupported()) {
        getAnalytics(firebaseApp);
    }
} catch (error) {
    console.info("AQUAVOID Analytics unavailable.", error);
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: "select_account"
});

// ==========================================
// THREE.JS GAME
// ==========================================

const R = new THREE.WebGLRenderer({
    antialias: true
});

R.setPixelRatio(Math.min(devicePixelRatio, 2));
R.setSize(innerWidth, innerHeight);
document.body.prepend(R.domElement);

const S = new THREE.Scene();
S.background = new THREE.Color(0x28456e);
S.fog = new THREE.Fog(0x28456e, 30, 60);

const C = new THREE.PerspectiveCamera(
    60,
    innerWidth / innerHeight,
    .1,
    300
);

S.add(new THREE.HemisphereLight(
    0xaed6ff,
    0x0b2a55,
    .8
));

const sun = new THREE.DirectionalLight(
    0xffe2b8,
    1.4
);

sun.position.set(-25, 14, -30);
S.add(sun);

// STARS

{
    const g = new THREE.BufferGeometry();
    const a = [];

    for (let i = 0; i < 500; i++) {
        const r = 180;
        const u = Math.random() * 6.28;
        const v = Math.random() * 1.2 + .1;

        a.push(
            Math.cos(u) * Math.cos(v) * r,
            Math.sin(v) * r,
            Math.sin(u) * Math.cos(v) * r
        );
    }

    g.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(a, 3)
    );

    window.stars = new THREE.Points(
        g,
        new THREE.PointsMaterial({
            color: 0xe8f4ef,
            size: .5,
            fog: false
        })
    );

    S.add(window.stars);
}

// OCEAN

const N = 71;
const G = 1.6;
const H = (N - 1) / 2;
const LIM = H * G - 1;

let base = 1.6;
let surge = 0;

const amp = () => base * (1 + surge);

const h = (x, z, t) =>
    amp() * (
        .6 * Math.sin(.28 * x + 1.1 * t) +
        .5 * Math.sin(.23 * z - .8 * t + 1) +
        .4 * Math.sin(.2 * (x + z) + .6 * t) +
        .22 * Math.sin(.55 * x - .4 * z - 1.7 * t) +
        .15 * Math.sin(.8 * z + x * .3 + 2.2 * t)
    );

const pg0 = new THREE.PlaneGeometry(
    (N - 1) * G,
    (N - 1) * G,
    N - 1,
    N - 1
);

pg0.rotateX(-Math.PI / 2);

pg0.setAttribute(
    'color',
    new THREE.BufferAttribute(
        new Float32Array(N * N * 3),
        3
    )
);

const mesh = new THREE.Mesh(
    pg0,
    new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: .22,
        metalness: .1
    })
);

mesh.frustumCulled = false;
S.add(mesh);

const lo = new THREE.Color(0x06284a);
const mi = new THREE.Color(0x0f7c8f);
const hi = new THREE.Color(0x6fd0c8);
const fo = new THREE.Color(0xf2fbff);
const col = new THREE.Color();

const m4 = new THREE.Matrix4();
const q = new THREE.Quaternion();
const v3 = new THREE.Vector3();
const sc = new THREE.Vector3();

function grid2(t, cx, cz) {
    const A = amp() * 1.5;
    const ox = Math.round(cx / G) * G;
    const oz = Math.round(cz / G) * G;

    const pa = pg0.attributes.position;
    const ca = pg0.attributes.color;

    mesh.position.set(ox, 0, oz);

    let i = 0;

    for (let b = 0; b < N; b++) {
        for (let a = 0; a < N; a++) {
            const lx = (a - H) * G;
            const lz = (b - H) * G;
            const y = h(ox + lx, oz + lz, t);

            pa.setXYZ(i, lx, y, lz);

            const k = THREE.MathUtils.clamp(
                (y / A + 1) / 2,
                0,
                1
            );

            if (k < .55) {
                col.copy(lo).lerp(mi, k / .55);
            } else if (k < .88) {
                col.copy(mi).lerp(
                    hi,
                    (k - .55) / .33
                );
            } else {
                col.copy(hi).lerp(
                    fo,
                    (k - .88) / .12
                );
            }

            ca.setXYZ(i, col.r, col.g, col.b);
            i++;
        }
    }

    pa.needsUpdate = true;
    ca.needsUpdate = true;

    pg0.computeVertexNormals();
}

// PLAYER SHIP

const P = new THREE.Group();
S.add(P);
P.scale.setScalar(1.3);

let hd = 0;

const wood = new THREE.MeshStandardMaterial({
    color: 0x8a5a34,
    roughness: .8
});

const cloth = new THREE.MeshStandardMaterial({
    color: 0xf6efe0,
    roughness: .9,
    side: THREE.DoubleSide
});

const hull = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, .6, 2.6),
    wood
);

hull.position.y = .05;

const bg = new THREE.ConeGeometry(.92, 1.3, 4);
bg.rotateY(Math.PI / 4);
bg.rotateX(-Math.PI / 2);

const bow = new THREE.Mesh(bg, wood);
bow.position.set(0, .05, -1.95);
bow.scale.set(1, .46, 1);

const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(.05, .06, 3.2, 8),
    wood
);

mast.position.set(0, 1.9, 0);

const sail = new THREE.Mesh(
    new THREE.PlaneGeometry(1.7, 2.2),
    cloth
);

sail.position.set(0, 2.0, -.05);

const flag = new THREE.Mesh(
    new THREE.PlaneGeometry(.55, .3),
    new THREE.MeshBasicMaterial({
        color: 0xff6b8a,
        side: THREE.DoubleSide
    })
);

flag.position.set(.3, 3.35, 0);

P.add(hull, bow, mast, sail, flag);

// CRYSTAL

const X = new THREE.Mesh(
    new THREE.OctahedronGeometry(.7),
    new THREE.MeshLambertMaterial({
        color: 0xffc857,
        emissive: 0xffa000,
        emissiveIntensity: .9
    })
);

S.add(X);

const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(.06, .06, 60, 6),
    new THREE.MeshBasicMaterial({
        color: 0xffc857,
        transparent: true,
        opacity: .35
    })
);

S.add(beam);

let teal = false;
let spawned = 0;

function spawn() {
    spawned++;

    teal = spawned % 5 === 0;

    const c = teal ? 0x2ec4b6 : 0xffc857;

    X.material.color.setHex(c);

    X.material.emissive.setHex(
        teal ? 0x00a896 : 0xffa000
    );

    beam.material.color.setHex(c);

    const a = Math.random() * 6.283;
    const r = 14 + Math.random() * 30;
    const c0 = P.position;

    X.position.set(
        c0.x + Math.cos(a) * r,
        2 + Math.random() * 2.5,
        c0.z + Math.sin(a) * r
    );

    beam.position.set(
        X.position.x,
        X.position.y,
        X.position.z
    );
}

// PARTICLES

const PN = 400;

const pp = new Float32Array(PN * 3);
const pv = new Float32Array(PN * 3);
const pl = new Float32Array(PN);
const pc = new Float32Array(PN * 3);

let pi = 0;

const pg = new THREE.BufferGeometry();

pg.setAttribute(
    'position',
    new THREE.BufferAttribute(pp, 3)
);

pg.setAttribute(
    'color',
    new THREE.BufferAttribute(pc, 3)
);

const pts = new THREE.Points(
    pg,
    new THREE.PointsMaterial({
        size: .35,
        vertexColors: true,
        transparent: true,
        opacity: .9,
        depthWrite: false
    })
);

pts.frustumCulled = false;
S.add(pts);

for (let i = 0; i < PN; i++) {
    pp[i * 3 + 1] = -99;
}

function emit(p, hex, n, sp) {
    const c = new THREE.Color(hex);

    for (let k = 0; k < n; k++) {
        const i = pi++ % PN;

        pp.set([p.x, p.y, p.z], i * 3);

        pv.set([
            (Math.random() - .5) * sp,
            (Math.random() - .3) * sp,
            (Math.random() - .5) * sp
        ], i * 3);

        pl[i] = .7 + Math.random() * .5;

        pc.set([c.r, c.g, c.b], i * 3);
    }
}

function parts(dt) {
    for (let i = 0; i < PN; i++) {
        if (pl[i] > 0) {
            pl[i] -= dt;

            pv[i * 3 + 1] -= 9 * dt;

            for (let a = 0; a < 3; a++) {
                pp[i * 3 + a] += pv[i * 3 + a] * dt;
            }

            if (pl[i] <= 0) {
                pp[i * 3 + 1] = -99;
            }
        }
    }

    pg.attributes.position.needsUpdate = true;
    pg.attributes.color.needsUpdate = true;
}

// AUDIO

let AC;

function beep(f, d = .12, ty = 'sine', v = .15) {
    if (!AC) return;

    try {
        const o = AC.createOscillator();
        const g = AC.createGain();

        o.type = ty;
        o.frequency.value = f;

        g.gain.setValueAtTime(v, AC.currentTime);

        g.gain.exponentialRampToValueAtTime(
            .001,
            AC.currentTime + d
        );

        o.connect(g).connect(AC.destination);

        o.start();
        o.stop(AC.currentTime + d);
    } catch (e) {}
}

// INPUT

const K = {};

addEventListener('keydown', e => {
    K[e.code] = 1;

    if (
        e.code === 'Space' ||
        e.code === 'ShiftLeft'
    ) {
        e.preventDefault();
    }
});

addEventListener('keyup', e => {
    K[e.code] = 0;
});

let yaw = 0;
let pitch = .55;
let drag = false;

let jx = 0;
let jz = 0;

let tj = null;
let tl = null;

let tlx = 0;
let tly = 0;

let tsx = 0;
let tsy = 0;

const look = (dx, dy) => {
    yaw -= dx * .006;

    pitch = THREE.MathUtils.clamp(
        pitch + dy * .005,
        .05,
        1.4
    );
};

let lx = 0;
let ly = 0;

addEventListener('mousemove', e => {
    const lk = !!document.pointerLockElement;

    const dx = lk
        ? e.movementX
        : e.clientX - lx;

    const dy = lk
        ? e.movementY
        : e.clientY - ly;

    lx = e.clientX;
    ly = e.clientY;

    if (lk || (e.buttons & 1)) {
        look(dx, dy);
    }
});

R.domElement.addEventListener('click', () => {
    try {
        R.domElement.requestPointerLock();
    } catch (e) {}
});

addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse') {
        drag = true;
    } else if (
        e.clientX < innerWidth / 2 &&
        tj === null
    ) {
        tj = e.pointerId;
        tsx = e.clientX;
        tsy = e.clientY;
    } else if (
        e.clientX >= innerWidth / 2 &&
        tl === null
    ) {
        tl = e.pointerId;
        tlx = e.clientX;
        tly = e.clientY;
    }
});

addEventListener('pointerup', e => {
    drag = false;

    if (e.pointerId === tj) {
        tj = null;
        jx = jz = 0;
    }

    if (e.pointerId === tl) {
        tl = null;
    }
});

addEventListener('pointermove', e => {
    if (e.pointerId === tl) {
        look(
            e.clientX - tlx,
            e.clientY - tly
        );

        tlx = e.clientX;
        tly = e.clientY;
    }

    if (e.pointerId === tj) {
        jx = THREE.MathUtils.clamp(
            (e.clientX - tsx) / 50,
            -1,
            1
        );

        jz = THREE.MathUtils.clamp(
            (e.clientY - tsy) / 50,
            -1,
            1
        );
    }
});

const jb = document.getElementById('jb');
const db = document.getElementById('db');

jb.onpointerdown = e => {
    e.stopPropagation();
    K.Space = 1;
};

jb.onpointerup = () => K.Space = 0;

db.onpointerdown = e => {
    e.stopPropagation();
    K.ShiftLeft = 1;
};

db.onpointerup = () => K.ShiftLeft = 0;

addEventListener('resize', () => {
    R.setSize(innerWidth, innerHeight);

    C.aspect = innerWidth / innerHeight;
    C.updateProjectionMatrix();
});

const $ = id => document.getElementById(id);

// SHIPS

const SKINS = [
    {
        n: 'Sloop',
        p: 0,
        hull: 0x8a5a34,
        sail: 0xf6efe0,
        flag: 0xff6b8a
    },
    {
        n: 'Galleon',
        p: 30,
        hull: 0xc4455f,
        sail: 0xffe3d9,
        flag: 0xffc857
    },
    {
        n: 'Catamaran',
        p: 60,
        hull: 0x1b2540,
        sail: 0x8fb8ff,
        flag: 0xe8f4ef
    },
    {
        n: 'Longship',
        p: 100,
        hull: 0x1f6b4f,
        sail: 0xd8f5e6,
        flag: 0xffc857
    },
    {
        n: 'Steamer',
        p: 200,
        hull: 0xb8860b,
        sail: 0xfff4c2,
        flag: 0xc9184a
    },
    {
        n: 'Ghost Ship',
        p: 350,
        hull: 0xdfe9f0,
        sail: 0xaee7ff,
        flag: 0x2ec4b6
    }
];

// ==========================================
// PLAYER SAVE DATA
// ==========================================

let coins = 0;
let owned = [0];
let sel = 0;
let unlocked = 0;
let bestWave = 0;
let wown = [0];
let wsel = 0;

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
        wsel
    };
}

function applySaveData(data) {
    if (!data || typeof data !== 'object') return;

    coins = Math.max(0, Number(data.coins) || 0);
    owned = Array.isArray(data.owned) ? data.owned : [0];
    sel = Math.max(0, Number(data.sel) || 0);
    unlocked = Math.max(0, Number(data.unlocked) || 0);
    bestWave = Math.max(0, Number(data.bestWave) || 0);
    wown = Array.isArray(data.wown) ? data.wown : [0];
    wsel = Math.max(0, Number(data.wsel) || 0);

    if (!owned.includes(0)) owned.unshift(0);
    if (!wown.includes(0)) wown.unshift(0);

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

            $('authStatus').textContent =
                'Login failed: ' + error.message;

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
