<?php
// Monsterprøven – musikkteori-spill. Første nivå i hver delprøve er gratis, resten krever VIP (FEIDE-brukere får VIP via portalen).
// ?delprove=<slug> viser bare én delprøve (toner, notelesing, intervaller, akkorder, skalaer, noteverdier, pauser).
// ?embed=1 skjuler topplinjen, for innbygging i artikler (iframe).
require_once $_SERVER['DOCUMENT_ROOT'] . '/members/config.php';
header('Cache-Control: private, no-store');
$user = current_user();
if (function_exists('has_rockeskolen_access')) { $isPro = has_rockeskolen_access($user); }
elseif (function_exists('has_chordlink_access')) { $isPro = has_chordlink_access($user); }
elseif (function_exists('is_pro_user')) { $isPro = is_pro_user($user); }
else { $isPro = false; }
if (($_GET['demo'] ?? '') === '1') { $isPro = false; }
$embed = !empty($_GET['embed']);
$loginUrl = '/members/login.php?redirect=' . rawurlencode($_SERVER['REQUEST_URI'] ?? '/tools/games/monsterproven/');
$titles = ['toner'=>'Toner','notelesing'=>'Notelesing','intervaller'=>'Intervaller','akkorder'=>'Akkorder','skalaer'=>'Skalaer','noteverdier'=>'Noteverdier','pauser'=>'Pauser'];
$slug = strtolower((string)($_GET['delprove'] ?? $_GET['delspill'] ?? ''));
$pageTitle = isset($titles[$slug]) ? $titles[$slug] . ' – Monsterprøven' : 'Monsterprøven';
?><!doctype html>
<html lang="no">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="Lær toner, notelesing, intervaller, akkorder, skalaer, noteverdier og pauser ved å spille.">
<meta property="og:title" content="<?= htmlspecialchars($pageTitle, ENT_QUOTES) ?> | Rockeskolen">
<meta property="og:description" content="Et musikkteori-spill fra Rockeskolen. Klarer du å slå meg?">
<meta property="og:url" content="https://rockeskolen.com/tools/games/monsterproven/<?= isset($titles[$slug]) ? '?delprove=' . $slug : '' ?>">
<script>window.CL_IS_PRO=<?= $isPro ? 'true' : 'false' ?>;window.CL_IS_LOGGED_IN=<?= $user ? 'true' : 'false' ?>;window.CL_UPGRADE_URL="/members/upgrade.php";window.RS_SHARE_BASE="https://rockeskolen.com/tools/games/monsterproven/";</script>
<title><?= htmlspecialchars($pageTitle, ENT_QUOTES) ?></title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Figtree:wght@400;600;800&display=swap">
<style>
/* Layout: one-screen arcade – HUD on top, a rock stage where chord monsters fall, piano keyboard as the controller. Single dark stage look by choice. */
:root{
  --ink:#120e1c; --stage:#1a1428; --panel:#251d38; --line:#3a2f55;
  --fg:#f5f0fb; --muted:#a99dc4;
  --maj:#ffb03a; --min:#5ec8ff; --sev:#ff5fa8; --note:#3ee6b0; --rhy:#c3a6ff; --int:#8fe388; --scl:#ff9f6e; --read:#efe9fb; --bad:#ff4d5e;
  --ivory:#f6f1e4; --ebony:#17131f;
  --display:"Archivo Black", "Arial Black", Impact, sans-serif;
  --body:"Figtree", "Segoe UI", system-ui, sans-serif;
  color-scheme:dark;
}
html,body{height:100%}
[hidden]{display:none!important}
body{background:var(--ink);color:var(--fg);font-family:var(--body);font-size:15px;overflow:hidden;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}
button{font:inherit;color:inherit;cursor:pointer;border:0;background:none}
button:focus-visible{outline:2px solid var(--maj);outline-offset:2px}
.app{height:100%;display:flex;flex-direction:column;gap:8px;max-width:760px;margin:0 auto;padding-block:8px 10px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));box-sizing:border-box}

/* HUD */
.hud{display:flex;align-items:center;gap:10px}
.hud .menu-btn{padding:7px 12px;border-radius:999px;background:var(--panel);font-weight:600;font-size:13px}
.hud .lvl{flex:1;min-width:0;font-family:var(--display);font-size:14px;letter-spacing:.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hud .score{font-family:var(--display);font-size:18px;font-variant-numeric:tabular-nums}
.lives{display:flex;gap:3px}
.lives svg{width:16px;height:18px;fill:var(--sev);transition:opacity .3s,transform .3s}
.lives svg.lost{opacity:.18;transform:scale(.8)}
.prog{height:4px;border-radius:4px;background:var(--panel);overflow:hidden}
.prog i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--note),var(--maj));transition:width .3s}

/* Stage */
.stage{position:relative;flex:1;min-height:0;overflow:hidden;border-radius:18px 18px 4px 4px;
  background:
   radial-gradient(ellipse 35% 80% at 18% -12%, rgba(255,176,58,.17), transparent 70%),
   radial-gradient(ellipse 35% 80% at 82% -12%, rgba(94,200,255,.15), transparent 70%),
   radial-gradient(ellipse 30% 70% at 50% -15%, rgba(255,95,168,.10), transparent 70%),
   var(--stage)}
.stage.shake{animation:shake .35s}
.stage.flash::after{content:"";position:absolute;inset:0;background:var(--bad);opacity:.18;pointer-events:none}
.edge{position:absolute;left:0;right:0;bottom:0;height:4px;background:linear-gradient(90deg,var(--maj),var(--sev),var(--min));box-shadow:0 0 18px var(--sev)}
.edge-label{position:absolute;right:10px;bottom:9px;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);opacity:.7}
.combo{position:absolute;left:12px;top:10px;font-family:var(--display);font-size:15px;color:var(--maj);opacity:0;transition:opacity .2s,transform .2s}
.combo.show{opacity:1}
.combo.bump{transform:scale(1.25)}
.toast{position:absolute;left:50%;top:12px;transform:translate(-50%,-8px);max-width:calc(100% - 24px);background:rgba(18,14,28,.92);border:1px solid var(--line);padding:8px 14px;border-radius:12px;font-weight:600;font-size:14px;text-align:center;opacity:0;transition:.25s;pointer-events:none;z-index:5}
.toast.show{opacity:1;transform:translate(-50%,0)}
.toast b{font-family:var(--display);font-weight:400}

.mon{position:absolute;left:0;top:0;width:78px;height:78px;will-change:transform;z-index:2;touch-action:manipulation}
.mon .body{position:relative;width:100%;height:100%;display:grid;place-items:center;
  border-radius:46% 54% 50% 50% / 56% 50% 50% 44%;
  background:radial-gradient(circle at 34% 28%, color-mix(in srgb,var(--c) 45%, white), var(--c) 52%, color-mix(in srgb,var(--c) 55%, black));
  box-shadow:0 0 26px color-mix(in srgb,var(--c) 45%, transparent);animation:wob 1.7s ease-in-out infinite}
.mon .eyes{position:absolute;top:13px;left:50%;transform:translateX(-50%);display:flex;gap:9px}
.mon .eyes i{width:12px;height:12px;border-radius:50%;background:#fff;position:relative;animation:blink 4s infinite}
.mon .eyes i::after{content:"";position:absolute;width:5px;height:5px;border-radius:50%;background:#1a1020;left:4px;top:5px}
.mon b{font-family:var(--display);font-weight:400;font-size:19px;color:#1a1020;margin-top:16px;letter-spacing:-.01em}
.mon b.long{font-size:15px}
.mon.wide{width:124px}
.mon .fig{display:flex;align-items:flex-end;gap:1px;margin-top:20px;color:#1a1020}
.mon .fig svg{width:19px;height:33px}
.mon .fig .q{font-family:var(--display);font-size:18px;margin:0 0 1px 5px}
.mon.q-rhy{--c:var(--rhy)} .mon.q-int{--c:var(--int)} .mon.q-scl{--c:var(--scl)} .mon.q-read{--c:var(--read)}
.mon .staff{width:84px;height:50px;color:#1a1020;margin-top:24px}
.ex .big .staff{width:120px;height:72px}
.mon .iv{display:flex;flex-direction:column;align-items:center;margin-top:16px;color:#1a1020;line-height:1}
.mon .iv b{margin:0}
.mon .iv small{font-size:11px;font-weight:800;margin-top:2px;white-space:nowrap}
.pads{display:grid;grid-template-columns:repeat(auto-fit,minmax(54px,1fr));gap:6px;height:clamp(110px,20vh,160px);touch-action:none}
.pad{background:var(--panel);border:1px solid var(--line);border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;position:relative}
.pad b{font-family:var(--display);font-weight:400;font-size:28px;color:var(--rhy)}
.pad span{font-size:11px;color:var(--muted)}
.pad.hit{background:var(--line)}
.pad.hint{outline:3px solid var(--note);outline-offset:-3px}
.game{display:flex;flex-direction:column;gap:8px}
.ghead{display:flex;flex-direction:column;gap:2px}
.gtop{display:flex;align-items:center;justify-content:space-between;gap:8px}
.share{padding:6px 12px;border-radius:999px;border:1px solid var(--line);font-size:13px;font-weight:700;color:var(--fg)}
.share:hover{background:var(--line)}
.chal{background:var(--stage);border:1px solid var(--maj);border-radius:14px;padding:12px 14px;font-weight:600}
.shimg{width:100%;max-width:340px;align-self:center;border-radius:14px;aspect-ratio:4/5;background:var(--stage)}
.sel{user-select:text;-webkit-user-select:text;word-break:break-word}
a.tg{text-decoration:none}
h3{font-family:var(--display);font-weight:400;font-size:22px;margin:0}
.ex .big svg{width:26px;height:44px}
.mon.q-maj{--c:var(--maj)} .mon.q-min{--c:var(--min)} .mon.q-sev{--c:var(--sev)} .mon.q-note{--c:var(--note)} .mon.q-ear{--c:#b7a8d8}
.mon.near .body{outline:3px solid var(--bad);outline-offset:3px}
.mon.pop .body{animation:pop .32s forwards}
.mon.fall{transition:opacity .4s;opacity:0}
.beam{position:absolute;bottom:0;width:8px;margin-left:-4px;border-radius:8px;background:linear-gradient(to top,transparent,#fff 30%,var(--c));box-shadow:0 0 18px var(--c);animation:beam .35s forwards;pointer-events:none;z-index:3}
.spark{position:absolute;width:9px;height:9px;border-radius:50%;background:var(--c);pointer-events:none;animation:spark .55s ease-out forwards;z-index:3}
.pts{position:absolute;font-family:var(--display);font-size:16px;color:var(--fg);pointer-events:none;animation:rise .9s ease-out forwards;z-index:4;white-space:nowrap;transform:translateX(-50%)}

/* Selection bar */
.selbar{display:flex;align-items:center;gap:8px;min-height:38px}
.chips{flex:1;display:flex;gap:6px;flex-wrap:wrap;min-width:0}
.chips .ph{color:var(--muted);font-size:13px}
.chip{font-family:var(--display);font-size:14px;padding:5px 10px;border-radius:10px;background:var(--panel);border:1px solid var(--line)}
.tool{padding:8px 12px;border-radius:999px;background:var(--panel);font-weight:600;font-size:13px}
.tool.hint{color:var(--maj)}

/* Keyboard */
.kb{position:relative;height:clamp(120px,24vh,190px);display:flex;gap:3px;touch-action:none}
.kw{flex:1;background:var(--ivory);border-radius:0 0 10px 10px;position:relative;box-shadow:inset 0 -6px 0 #d9d0bb;display:flex;align-items:flex-end;justify-content:center;padding-bottom:12px;color:#5a5168;font-weight:800;font-size:14px;transition:background .08s}
.kbk{position:absolute;top:0;height:60%;background:var(--ebony);border-radius:0 0 7px 7px;z-index:2;box-shadow:inset 0 -5px 0 #000,0 3px 6px rgba(0,0,0,.4);display:flex;align-items:flex-end;justify-content:center;padding-bottom:8px;color:#bfb4d6;font-size:10px;font-weight:600;line-height:1.15;text-align:center}
.kw.on{background:#ffd88a;box-shadow:inset 0 -6px 0 var(--maj);color:#3d2700}
.kbk.on{background:#a8611a;box-shadow:inset 0 -5px 0 var(--maj);color:#fff}
.kw.hit{background:#fff}
.kbk.hit{background:#3c3350}
.kw.hint::after,.kbk.hint::after{content:"";position:absolute;left:50%;top:38%;width:14px;height:14px;margin-left:-7px;border-radius:50%;background:var(--note);box-shadow:0 0 12px var(--note);animation:pulse .5s infinite alternate}
.kb.two .kw{font-size:11px;padding-bottom:8px}
.kb.two .kbk{font-size:8px;padding-bottom:5px;line-height:1.2;letter-spacing:-.02em}
.kb.nolabels .kw span,.kb.nolabels .kbk span{visibility:hidden}

/* Overlays */
.ov{position:fixed;inset:0;z-index:20;background:rgba(10,8,16,.86);backdrop-filter:blur(6px);overflow-y:auto;padding-block:max(20px,env(safe-area-inset-top,0px)) max(20px,env(safe-area-inset-bottom,0px));padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));box-sizing:border-box}
.card{max-width:560px;margin:0 auto;background:var(--panel);border:1px solid var(--line);border-radius:22px;padding:22px;display:flex;flex-direction:column;gap:14px}
.eyebrow{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);font-weight:600}
h1,h2{font-family:var(--display);font-weight:400;margin:0;text-wrap:balance;line-height:1.05}
h1{font-size:clamp(34px,10vw,58px);background:linear-gradient(100deg,var(--maj),var(--sev) 55%,var(--min));-webkit-background-clip:text;background-clip:text;color:transparent}
h2{font-size:26px}
p{margin:0;line-height:1.5;max-width:62ch}
.lead{color:var(--muted)}
.btn{padding:13px 20px;border-radius:14px;font-weight:800;font-size:16px;background:var(--maj);color:#2a1700}
.btn.alt{background:var(--line);color:var(--fg)}
.row{display:flex;gap:10px;flex-wrap:wrap}
.how{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.how div{background:var(--stage);border-radius:14px;padding:10px;font-size:13px;line-height:1.35;color:var(--muted)}
.how b{display:block;font-family:var(--display);font-weight:400;color:var(--fg);font-size:18px;margin-bottom:2px}
.levels{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
.lv{text-align:left;background:var(--stage);border:1px solid var(--line);border-radius:14px;padding:11px 12px;display:flex;flex-direction:column;gap:3px;min-width:0}
.lv .n{font-family:var(--display);font-size:12px;color:var(--muted)}
.lv .t{font-weight:800;font-size:15px}
.lv .l{font-size:12px;color:var(--muted)}
.lv .st{font-size:13px;letter-spacing:2px;color:var(--maj)}
.lv .st .e{color:var(--line)}
.lv[disabled]{opacity:.38;cursor:not-allowed}
.lv.vip{opacity:.7}
.lv.vip .n{color:var(--maj)}
a.btn{text-decoration:none;display:inline-block}
.lv .sw{width:22px;height:5px;border-radius:3px;background:var(--c);margin-bottom:2px}
.settings{display:flex;gap:6px;flex-wrap:wrap}
.tg{padding:7px 12px;border-radius:999px;border:1px solid var(--line);font-size:13px;font-weight:600;color:var(--muted)}
.tg[aria-pressed="true"]{background:var(--fg);color:var(--ink);border-color:var(--fg)}
.legend{display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:var(--muted)}
.legend span{display:inline-flex;align-items:center;gap:5px}
.legend i{width:10px;height:10px;border-radius:50%;background:var(--c)}
.ex{display:flex;align-items:center;gap:14px;background:var(--stage);border-radius:16px;padding:14px;flex-wrap:wrap}
.ex .big{font-family:var(--display);font-size:38px;color:var(--c)}
.ex .notes{display:flex;gap:6px;flex-wrap:wrap}
.ex .formula{font-size:13px;color:var(--muted);width:100%}
.stars{font-size:40px;letter-spacing:6px;color:var(--maj)}
.stars .e{color:var(--line)}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.stats div{background:var(--stage);border-radius:12px;padding:10px;text-align:center}
.stats b{display:block;font-family:var(--display);font-weight:400;font-size:20px;font-variant-numeric:tabular-nums}
.stats span{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em}
.practice{display:flex;flex-direction:column;gap:6px}
.practice div{background:var(--stage);border-radius:10px;padding:8px 12px;font-size:14px}
.practice b{font-family:var(--display);font-weight:400}
@media (max-width:420px){.levels{grid-template-columns:1fr 1fr}.stats{grid-template-columns:repeat(2,1fr)}.how{grid-template-columns:1fr}.card{padding:18px}}

@keyframes wob{0%,100%{border-radius:46% 54% 50% 50% / 56% 50% 50% 44%;transform:rotate(-3deg)}50%{border-radius:54% 46% 52% 48% / 48% 56% 44% 52%;transform:rotate(3deg)}}
@keyframes blink{0%,94%,100%{transform:scaleY(1)}97%{transform:scaleY(.1)}}
@keyframes pop{to{transform:scale(1.6);opacity:0}}
@keyframes beam{0%{opacity:1}100%{opacity:0;width:2px}}
@keyframes spark{to{transform:translate(var(--dx),var(--dy)) scale(.2);opacity:0}}
@keyframes rise{to{margin-top:-60px;opacity:0}}
@keyframes shake{0%,100%{transform:none}25%{transform:translateX(-7px)}75%{transform:translateX(7px)}}
@keyframes pulse{to{transform:scale(1.3)}}
@media (prefers-reduced-motion:reduce){.mon .body,.mon .eyes i{animation:none}.stage.shake{animation:none}}
</style>
<style>
*,*::before,*::after{box-sizing:border-box}
body{margin:0;display:flex;flex-direction:column;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
.app{height:auto;flex:1;min-height:0;width:100%}
.rs-bar{display:flex;align-items:center;gap:14px;max-width:760px;width:100%;margin:0 auto;padding:10px max(16px,env(safe-area-inset-right,0px)) 0 max(16px,env(safe-area-inset-left,0px));font-size:13px;font-weight:600}
.rs-bar a{color:var(--muted);text-decoration:none}
.rs-bar a:first-child{color:var(--fg);margin-right:auto;font-family:var(--display)}
</style>
</head>
<body>
<?php if (!$embed): ?><header class="rs-bar"><a href="/">Rockeskolen</a><a href="/tools/">Verktøy</a><a href="https://portal.rockeskolen.com">Portal</a><a href="<?= htmlspecialchars($user ? '/members/account.php' : $loginUrl, ENT_QUOTES) ?>"><?= $user ? 'Min konto' : 'Logg inn' ?></a></header><?php endif; ?>


<div class="app">
  <div class="hud">
    <button class="menu-btn" id="menuBtn">Meny</button>
    <div class="lvl" id="lvlName">Monsterprøven</div>
    <div class="lives" id="lives"></div>
    <div class="score" id="score">0</div>
  </div>
  <div class="prog"><i id="prog"></i></div>
  <div class="stage" id="stage">
    <div class="combo" id="combo"></div>
    <div class="toast" id="toast"></div>
    <div class="edge"></div><div class="edge-label">Scenekanten</div>
  </div>
  <div class="selbar">
    <div class="chips" id="chips"></div>
    <button class="tool hint" id="hintBtn">Hint</button>
    <button class="tool" id="clearBtn">Tøm</button>
  </div>
  <div class="kb" id="kb"></div>
  <div class="pads" id="pads" hidden></div>
</div>

<!-- Menu -->
<div class="ov" id="menu">
  <div class="card">
    <div class="eyebrow">Rockeskolen · musikkteori-spill</div>
    <h1>Monster&shy;prøven</h1>
    <div class="chal" id="chal" hidden></div>
    <p class="lead">Monstrene stiller spørsmålene. Svar riktig før de når scenekanten. Hvert treff blir musikk.</p>
    <div class="how" id="how">
      <div><b>1</b>Les monsteret. Trykk på det for å høre hvordan det låter.</div>
      <div><b>2</b>Svar på pianoet, eller med slag-knappene i Noteverdier.</div>
      <div><b>3</b>Feil tone bryter kombo. Når et monster når scenekanten, mister du et plekter.</div>
    </div>
    <div class="legend" id="legend">
      <span style="--c:var(--note)"><i></i>Enkelttone</span>
      <span style="--c:var(--maj)"><i></i>Dur</span>
      <span style="--c:var(--min)"><i></i>Moll</span>
      <span style="--c:var(--sev)"><i></i>Septim</span>
      <span style="--c:var(--rhy)"><i></i>Noteverdi</span>
      <span style="--c:var(--int)"><i></i>Intervall</span>
      <span style="--c:var(--scl)"><i></i>Skala</span>
      <span style="--c:var(--read)"><i></i>Notelesing</span>
    </div>
    <div id="games" style="display:flex;flex-direction:column;gap:18px"></div>
    <a class="tg" id="allGames" href="#" target="_top" hidden>Se alle delprøvene i Monsterprøven</a>
    <div class="settings" id="settings"></div>
  </div>
</div>

<!-- Intro -->
<div class="ov" id="intro" hidden>
  <div class="card">
    <div class="eyebrow" id="inN"></div>
    <h2 id="inT"></h2>
    <p id="inTip"></p>
    <div class="ex" id="inEx"></div>
    <div class="row">
      <button class="btn" id="inGo">Start</button>
      <button class="btn alt" id="inHear">Hør eksempelet</button>
      <button class="btn alt" id="inBack">Meny</button>
    </div>
  </div>
</div>

<!-- Result -->
<div class="ov" id="result" hidden>
  <div class="card">
    <div class="eyebrow" id="reN"></div>
    <h2 id="reT"></h2>
    <div class="stars" id="reStars"></div>
    <div class="stats" id="reStats"></div>
    <div class="practice" id="rePractice"></div>
    <div class="row">
      <button class="btn" id="reNext">Neste nivå</button>
      <button class="btn alt" id="reAgain">Spill nivået på nytt</button>
      <button class="btn alt" id="reShare">Del</button>
      <button class="btn alt" id="reMenu">Til menyen</button>
    </div>
  </div>
</div>

<!-- Summary -->
<div class="ov" id="summary" hidden>
  <div class="card">
    <div class="eyebrow" id="suN"></div>
    <h2 id="suT"></h2>
    <p class="lead" id="suL"></p>
    <div class="stars" id="suStars"></div>
    <div class="practice" id="suRows"></div>
    <div class="row">
      <button class="btn" id="suShare">Del resultatet</button>
      <button class="btn alt" id="suMenu">Til menyen</button>
    </div>
  </div>
</div>

<!-- Share -->
<div class="ov" id="share" hidden>
  <div class="card">
    <div class="eyebrow">Del</div>
    <img id="shImg" class="shimg" alt="Delekort med resultatet ditt">
    <p class="lead sel" id="shText"></p>
    <div class="row">
      <button class="btn" id="shGo">Del</button>
      <button class="btn alt" id="shCopy">Kopier lenke</button>
      <button class="btn alt" id="shClose">Tilbake</button>
    </div>
    <p class="lead" style="font-size:12px">På mobil kan du også holde fingeren på bildet for å lagre det.</p>
  </div>
</div>

<!-- VIP -->
<div class="ov" id="vip" hidden>
  <div class="card">
    <div class="eyebrow">VIP</div>
    <h2>Lås opp alle nivåene</h2>
    <p>Første nivå i hver delprøve er gratis. Med VIP får du alle 26 nivåene i Monsterprøven, sammen med resten av verktøyene og artiklene i Rockeskolens Musikkportal. Elever og ansatte ved skoler med avtale logger inn med FEIDE.</p>
    <p><b>39,90 kr/mnd eller 299 kr/år.</b></p>
    <div class="row">
      <a class="btn" id="vipGo" href="/members/upgrade.php" target="_top">Bli VIP</a>
      <button class="btn alt" id="vipBack">Tilbake</button>
    </div>
  </div>
</div>

<script>
(()=>{
const $=s=>document.querySelector(s);
const KEY='akkordangrep-v1';
let S={stars:{},best:{},h:false,labels:true,beat:true,all:false};
try{const v=JSON.parse(localStorage.getItem(KEY));if(v)S=Object.assign(S,v)}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};

/* ---------- Theory ---------- */
const LET='CDEFGAB',LPC=[0,2,4,5,7,9,11];
const Q={note:[[0,0]],'':[[0,0],[4,2],[7,4]],m:[[0,0],[3,2],[7,4]],'7':[[0,0],[4,2],[7,4],[10,6]],m7:[[0,0],[3,2],[7,4],[10,6]],maj7:[[0,0],[4,2],[7,4],[11,6]]};
const ACC={0:'',1:'#',2:'##',11:'b',10:'bb'};
function mk(spec){
  const m=spec.match(/^([A-G][#b]?)(.*)$/);const root=m[1];let q=m[2];
  const note=q==='!';if(note)q='note';
  const li=LET.indexOf(root[0]);let pc=LPC[li];for(const c of root.slice(1))pc+=c==='#'?1:-1;pc=(pc+12)%12;
  const tones=Q[q].map(([s,l])=>{const tl=(li+l)%7,tp=(pc+s)%12;return{pc:tp,nm:LET[tl]+ACC[(tp-LPC[tl]+12)%12]}});
  const cls=note?'q-note':(q==='m'?'q-min':(q===''?'q-maj':'q-sev'));
  return{name:note?root:root+q,root:pc,ints:Q[q].map(x=>x[0]),pcs:tones.map(t=>t.pc),names:tones.map(t=>t.nm),q,cls};
}
const dn=s=>!S.h?s:(s.startsWith('Bb')?'B'+s.slice(2):(s.startsWith('B')?'H'+s.slice(1):s));
const DEF=['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
const FORM={note:'Én tone. Finn tangenten.','':'Dur: grunntone + 4 halvtoner + 3 halvtoner.',m:'Moll: grunntone + 3 halvtoner + 4 halvtoner.','7':'Septim: durakkord + tonen 10 halvtoner over grunntonen.',m7:'Moll-septim: mollakkord + tonen 10 halvtoner over grunntonen.',maj7:'Stor septim: durakkord + tonen 11 halvtoner over grunntonen (én under oktaven).'};

/* Rhythm */
const VN={4:'helnote',3:'punktert halvnote',2:'halvnote',1.5:'punktert fjerdedel',1:'fjerdedel',.5:'åttendel',.25:'sekstendel'};
const fr=v=>({0.25:'¼',0.5:'½',1.5:'1½',2.5:'2½',3.5:'3½'})[v]||String(v);
const RN={4:'helpause',2:'halvpause',1:'fjerdedelspause',.5:'åttendelspause',.25:'sekstendelspause'};
const nm=v=>v<0?RN[-v]:VN[v];
function mkR(vals,fill){const sum=vals.reduce((a,b)=>a+Math.abs(b),0);return{rhy:true,vals,fill:!!fill,ans:fill?4-sum:sum,name:fill?'mangler '+fr(4-sum):nm(vals[0]),cls:'q-rhy'}}
function genFillRest(){for(let t=0;t<50;t++){const c=genFill();const v=c.vals.map(x=>[2,1,.5].includes(x)&&Math.random()<.55?-x:x);if(v.some(x=>x<0))return mkR(v,true)}return mkR([2,-1],true)}
function restSVG(v){
  let s='<svg viewBox="0 0 24 40">';
  if(v===4||v===2)s+='<rect x="2" y="17" width="20" height="1.6" fill="currentColor"/>'+(v===4?'<rect x="6" y="18.6" width="12" height="6" fill="currentColor"/>':'<rect x="6" y="11" width="12" height="6" fill="currentColor"/>');
  else if(v===1)s+='<path d="M9 5 L16 13 L11 19 L17 27 Q10 25 12 33 Q5 27 12 26 L6 19 L11 13 Z" fill="currentColor"/>';
  else{const n=v===.5?1:2;for(let i=0;i<n;i++){const y=12+i*8;s+=`<circle cx="8" cy="${y}" r="3" fill="currentColor"/><path d="M8 ${y+2} Q13 ${y+3} 17.5 ${y-2.5}" stroke="currentColor" stroke-width="2" fill="none"/>`}s+='<path d="M17.5 9 L10 34" stroke="currentColor" stroke-width="2.2"/>'}
  return s+'</svg>';
}
function genFill(){
  for(let t=0;t<200;t++){const m=[.5,1,1.5,2,3][Math.floor(Math.random()*5)],n=1+Math.floor(Math.random()*3),v=[];let rem=4-m;
    for(let i=0;i<n&&rem>0;i++){const opts=[2,1.5,1,.5].filter(x=>x<=rem);const x=(i===n-1&&[3,2,1.5,1,.5].includes(rem))?rem:opts[Math.floor(Math.random()*opts.length)];v.push(x);rem-=x}
    if(rem===0&&v.length)return mkR(v,true)}
  return mkR([2,1],true);
}
const explainR=c=>c.vals.map(v=>`${nm(v)} ${fr(Math.abs(v))}`).join(' + ')+(c.fill?` = ${fr(4-c.ans)} slag. Mangler ${fr(c.ans)} til 4.`:` = ${fr(c.ans)} slag`);
function noteSVG(v){
  if(v<0)return restSVG(-v);
  const hollow=v>=2,stem=v!==4,flags=v===.5?1:v===.25?2:0,dot=v===3||v===1.5;
  let s=`<svg viewBox="0 0 24 40"><ellipse cx="9" cy="32" rx="6.4" ry="4.6" transform="rotate(-22 9 32)" fill="${hollow?'none':'currentColor'}" stroke="currentColor" stroke-width="${hollow?2.4:0}"/>`;
  if(stem)s+=`<rect x="13.8" y="5" width="2" height="27" fill="currentColor"/>`;
  for(let i=0;i<flags;i++)s+=`<path d="M15.6 ${5+i*7} q7 5 5 15 q-1-7-5-9z" fill="currentColor"/>`;
  if(dot)s+=`<circle cx="21" cy="31" r="2.3" fill="currentColor"/>`;
  return s+'</svg>';
}

/* Intervals */
const IN={1:'liten sekund',2:'stor sekund',3:'liten ters',4:'stor ters',5:'ren kvart',6:'tritonus',7:'ren kvint',8:'liten sekst',9:'stor sekst',10:'liten septim',11:'stor septim'};
const ISTEP={1:1,2:1,3:2,4:2,5:3,6:3,7:4,8:5,9:5,10:6,11:6};
function mkI(root,st){
  const li=LET.indexOf(root[0]);let pc=LPC[li];for(const c of root.slice(1))pc+=c==='#'?1:-1;pc=(pc+12)%12;
  const tl=(li+ISTEP[st])%7,tp=(pc+st)%12,top=LET[tl]+ACC[(tp-LPC[tl]+12)%12];
  return{name:root+' '+IN[st],root:pc,ints:[0,st],pcs:[pc,tp],names:[root,top],q:'int',s:st,cls:'q-int'};
}
const IP=(roots,sts)=>roots.flatMap(r=>sts.map(st=>mkI(r,st)));
/* Scales */
const SC={dur:{iv:[0,2,4,5,7,9,11],st:[0,1,2,3,4,5,6],form:'Durskala: hel – hel – halv – hel – hel – hel – halv.'},
  moll:{iv:[0,2,3,5,7,8,10],st:[0,1,2,3,4,5,6],form:'Naturlig moll: hel – halv – hel – hel – halv – hel – hel.'},
  pm:{iv:[0,3,5,7,10],st:[0,2,3,4,6],form:'Moll-pentaton: fem toner, avstand 3 – 2 – 2 – 3 – 2 halvtoner.'}};
function mkS(root,t){
  const li=LET.indexOf(root[0]);let pc=LPC[li];for(const c of root.slice(1))pc+=c==='#'?1:-1;pc=(pc+12)%12;const d=SC[t];
  const tones=d.iv.map((x,i)=>{const tl=(li+d.st[i])%7,tp=(pc+x)%12;return{pc:tp,nm:LET[tl]+ACC[(tp-LPC[tl]+12)%12]}});
  return{name:t==='pm'?root+'m penta':root+(t==='dur'?'-dur':'-moll'),root:pc,ints:d.iv,pcs:tones.map(x=>x.pc),names:tones.map(x=>x.nm),q:'scale',t,cls:'q-scl'};
}
/* Note reading (treble clef) */
function mkN(step,acc=0){const li=(step+2)%7,oct=4+Math.floor((step+2)/7),midi=12*(oct+1)+LPC[li]+acc,pc=((midi%12)+12)%12,n=LET[li]+(acc>0?'#':acc<0?'b':'');
  return{name:n,root:pc,ints:[0],pcs:[pc],names:[n],q:'read',step,acc,midi,cls:'q-read'}}
function posText(s){if(s===-2)return'på hjelpelinjen under systemet';if(s===-1)return'rett under nederste linje';if(s===9)return'rett over øverste linje';if(s===10)return'på hjelpelinjen over systemet';return s%2===0?`på ${s/2+1}. linje nedenfra`:`i ${(s+1)/2}. mellomrom nedenfra`}
function staffSVG(c){const y=k=>40-k*3.5;let g='<svg viewBox="0 0 70 52" class="staff">';
  for(let i=0;i<5;i++)g+=`<rect x="2" y="${y(i*2)-.6}" width="66" height="1.2" fill="currentColor"/>`;
  for(let k=-2;k>=c.step;k-=2)g+=`<rect x="31" y="${y(k)-.6}" width="18" height="1.2" fill="currentColor"/>`;
  for(let k=10;k<=c.step;k+=2)g+=`<rect x="31" y="${y(k)-.6}" width="18" height="1.2" fill="currentColor"/>`;
  g+=`<ellipse cx="40" cy="${y(c.step)}" rx="5" ry="3.6" transform="rotate(-20 40 ${y(c.step)})" fill="currentColor"/>`;
  if(c.acc)g+=`<text x="27" y="${y(c.step)+5}" font-size="14" font-weight="700" text-anchor="middle" fill="currentColor">${c.acc>0?'#':'♭'}</text>`;
  return g+'</svg>'}
const GAMES=[
 {id:'toner',slug:'toner',n:1,title:'Toner',desc:'Finn tonene på pianoet, hvite og svarte tangenter.'},
 {id:'les',slug:'notelesing',n:2,title:'Notelesing',desc:'Les noten i notesystemet og finn den på pianoet.'},
 {id:'int',slug:'intervaller',n:3,title:'Intervaller',desc:'Avstanden mellom to toner. Spill grunntonen og tonen over.'},
 {id:'akk',slug:'akkorder',n:4,title:'Akkorder',desc:'Bygg dur, moll og septimer, og hør forskjellen.'},
 {id:'skala',slug:'skalaer',n:5,title:'Skalaer',desc:'Dur, moll og pentaton. Trykk alle tonene i skalaen.'},
 {id:'rytme',slug:'noteverdier',n:6,title:'Noteverdier',desc:'Hvor mange slag varer noten? Fyll takten.'},
 {id:'pause',slug:'pauser',n:7,title:'Pauser',desc:'Stillhet har også lengde. Les pausene og fyll takten.'},
];
const L=(game,title,learn,specs,o)=>Object.assign({game,title,learn,pool:specs?specs.map(mk):null},o);
const LEVELS=[
 L('toner','Første tone','Hvite tangenter',['C!','D!','E!','F!','G!','A!','B!'],{sw:'--note',count:12,fall:10,interval:2.2,maxOn:3,ex:'C!',
   tip:'De hvite tangentene heter C D E F G A B, og så starter det på nytt. C ligger rett til venstre for gruppen med to svarte tangenter.'}),
 L('toner','Halvtoner','Svarte tangenter, # og b',['F#!','Bb!','C#!','Eb!','Ab!','E!','G!','D!'],{sw:'--note',count:12,fall:10,interval:2.2,maxOn:3,ex:'F#!',
   tip:'# betyr én halvtone opp, b betyr én halvtone ned. F# og Gb er samme tangent. En halvtone er avstanden til nærmeste nabotangent, svart eller hvit.'}),
 L('akk','Durakkorder','Dur = 4 + 3',['C','F','G'],{sw:'--maj',count:10,fall:15,interval:3.6,maxOn:2,ex:'C',
   tip:'En akkord er tre toner spilt samtidig. Dur bygges slik: grunntone, tell 4 halvtoner opp, så 3 til. C dur blir C E G. Dur låter lyst og åpent.'}),
 L('akk','Mollakkorder','Moll = 3 + 4',['Am','Dm','Em'],{sw:'--min',count:10,fall:15,interval:3.6,maxOn:2,ex:'Am',
   tip:'Moll bytter om rekkefølgen: grunntone, 3 halvtoner, så 4. A moll blir A C E. Moll låter mykere og mer vemodig. Blått monster betyr moll.'}),
 L('akk','Svarte tangenter','Dur og moll i andre tonearter',['D','A','E','Bm','F#m','Bb','Eb','Gm','Cm'],{sw:'--min',count:12,fall:17,interval:3.8,maxOn:2,ex:'D',
   tip:'Reglene er de samme i alle tonearter, men nå må du bruke svarte tangenter. D dur: D, 4 halvtoner opp til F#, 3 til A.'}),
 L('akk','Septimer','7 og maj7',['G7','C7','D7','Am7','Dm7','Cmaj7','Fmaj7'],{sw:'--sev',count:10,fall:20,interval:4.6,maxOn:2,ex:'G7',
   tip:'Legg til en fjerde tone. 7 betyr tonen 10 halvtoner over grunntonen, maj7 betyr 11. G7 = G B D F. Septimer gir jazz og blues-farge.'}),
 L('akk','Gehør','Hør forskjell på dur og moll',['C','Cm','D','Dm','E','Em','F','Fm','G','Gm','A','Am'],{sw:'--muted',count:10,fall:17,interval:4.2,maxOn:2,ear:true,ex:'Am',
   tip:'Nå ser du bare grunntonen. Monsteret spiller akkorden når det dukker opp. Låter den lyst, spill dur. Låter den mørkt, spill moll. Trykk på monsteret for å høre igjen.'}),
 L('rytme','Hele, halve, fjerdedeler','4, 2 og 1 slag',null,{sw:'--rhy',pool:[4,2,1].map(v=>mkR([v])),pads:[4,2,1],count:12,fall:11,interval:2.4,maxOn:3,exR:[1],
   tip:'Noteverdien forteller hvor mange slag tonen varer. Helnote (hul, uten hals) = 4 slag. Halvnote (hul med hals) = 2 slag. Fjerdedel (fylt med hals) = 1 slag. Trykk på monsteret for å høre lengden.'}),
 L('rytme','Åttendeler og sekstendeler','Flagg halverer noten',null,{sw:'--rhy',pool:[4,2,1,.5,.25].map(v=>mkR([v])),pads:[4,2,1,.5,.25],count:12,fall:11,interval:2.4,maxOn:3,exR:[.5],
   tip:'Hvert flagg på halsen halverer noten. Ett flagg: åttendel = ½ slag. To flagg: sekstendel = ¼ slag.'}),
 L('rytme','Punkterte noter','Punktum legger til halvparten',null,{sw:'--rhy',pool:[3,2,1.5,1,.5].map(v=>mkR([v])),pads:[3,2,1.5,1,.5],count:12,fall:12,interval:2.6,maxOn:3,exR:[1.5],
   tip:'Et punktum etter noten legger til halvparten av verdien. Punktert halvnote = 2 + 1 = 3 slag. Punktert fjerdedel = 1 + ½ = 1½ slag.'}),
 L('rytme','Fyll takten','4/4: hva mangler?',null,{sw:'--rhy',gen:genFill,fill:true,pads:[3,2,1.5,1,.5],count:10,fall:16,interval:3.8,maxOn:2,exR:[2,1],
   tip:'En takt i 4/4 har 4 slag. Legg sammen notene på monsteret og finn ut hvor mange slag som mangler for å fylle takten.'}),

 L('int','Sekunder','Halvtone og heltone',null,{sw:'--int',wide:true,pool:IP(['C','D','E','F','G','A'],[1,2]),count:10,fall:14,interval:3.2,maxOn:2,exI:['C',2],
   tip:'Et intervall er avstanden mellom to toner. Liten sekund = 1 halvtone (nabotangenten). Stor sekund = 2 halvtoner (en heltone). Spill grunntonen og tonen over, begge to. Pianoet har nå to oktaver, så tonen over ligger alltid til høyre for grunntonen.'}),
 L('int','Terser','Liten og stor ters',null,{sw:'--int',wide:true,pool:IP(['C','D','E','F','G','A'],[3,4]),count:10,fall:14,interval:3.2,maxOn:2,exI:['C',4],
   tip:'Liten ters = 3 halvtoner. Stor ters = 4 halvtoner. Kjenner du igjen tallene? Stor ters gjør en akkord til dur, liten ters gjør den til moll.'}),
 L('int','Kvart og kvint','5 og 7 halvtoner',null,{sw:'--int',wide:true,pool:IP(['C','D','E','F','G','A'],[5,7]),count:10,fall:14,interval:3.2,maxOn:2,exI:['C',7],
   tip:'Ren kvart = 5 halvtoner. Ren kvint = 7 halvtoner. Kvinten er grunnmuren i powerchords på gitar: grunntone + kvint.'}),
 L('int','Alle intervaller','Fra sekund til septim',null,{sw:'--int',wide:true,pool:IP(['C','D','F','G'],[1,2,3,4,5,7,8,9,10,11]),count:12,fall:17,interval:3.8,maxOn:2,exI:['D',9],
   tip:'Nå kommer alle. Sekst: liten = 8, stor = 9 halvtoner. Septim: liten = 10, stor = 11 halvtoner. Tell fra grunntonen hvis du er usikker.'}),
 L('int','Gehør','Hør hvor langt opp',null,{sw:'--int',wide:true,ear:true,pool:IP(['C','D','F','G'],[2,3,4,5,7,9]),count:10,fall:17,interval:4.2,maxOn:2,exI:['C',7],
   tip:'Du ser bare grunntonen. Monsteret spiller intervallet når det dukker opp. Finn tonen over, og spill begge. Trykk på monsteret for å høre igjen.'}),

 L('les','Linjer og mellomrom','G-nøkkel, fra E til F',null,{sw:'--read',wide:true,pool:[0,1,2,3,4,5,6,7,8].map(k=>mkN(k)),count:12,fall:12,interval:2.8,maxOn:2,exN:[2,0],
   tip:'De fem linjene kalles notesystemet. Med G-nøkkel er nederste linje E. Linjene nedenfra er E G B D F, og mellomrommene er F A C E. Finn tonen på pianoet.'}),
 L('les','Hjelpelinjer','Midt-C og høye toner',null,{sw:'--read',wide:true,pool:[-2,-1,9,10,0,4,8].map(k=>mkN(k)),count:12,fall:12,interval:2.8,maxOn:2,exN:[-2,0],
   tip:'Toner utenfor systemet får korte hjelpelinjer. Midt-C ligger på første hjelpelinje under systemet. A ligger på første hjelpelinje over.'}),
 L('les','Fortegn','# og ♭ foran noten',null,{sw:'--read',wide:true,pool:[[1,1],[4,-1],[5,1],[7,-1],[2,1],[3,-1],[8,1],[6,-1]].map(([k,a])=>mkN(k,a)),count:12,fall:13,interval:3,maxOn:2,exN:[1,1],
   tip:'# foran noten betyr én halvtone opp, ♭ betyr én halvtone ned. Les først hvilken tone linjen gir, og flytt så én tangent.'}),
 L('skala','Durskala','Hel – hel – halv',null,{sw:'--scl',wide:true,pool:['C','G','F'].map(r=>mkS(r,'dur')),count:6,fall:28,interval:6,maxOn:2,exS:['G','dur'],
   tip:'En skala er tonene en låt er bygget av. Durskalaen går hel – hel – halv – hel – hel – hel – halv. C-dur er alle de hvite tangentene. G-dur har F#, F-dur har Bb. Trykk alle sju tonene.'}),
 L('skala','Flere fortegn','D, A, Bb og Eb dur',null,{sw:'--scl',wide:true,pool:['D','A','Bb','Eb'].map(r=>mkS(r,'dur')),count:6,fall:32,interval:6.5,maxOn:2,exS:['D','dur'],
   tip:'Samme mønster i nye tonearter: hel – hel – halv – hel – hel – hel – halv. D-dur har to #-er (F# og C#). Bb-dur har to b-er (Bb og Eb).'}),
 L('skala','Mollskala','Naturlig moll',null,{sw:'--scl',wide:true,pool:['A','E','D'].map(r=>mkS(r,'moll')),count:6,fall:28,interval:6,maxOn:2,exS:['A','moll'],
   tip:'Naturlig moll går hel – halv – hel – hel – halv – hel – hel. A-moll har de samme tonene som C-dur, bare med A som grunntone.'}),
 L('skala','Pentaton','Rockens favorittskala',null,{sw:'--scl',wide:true,pool:['A','E','D','B'].map(r=>mkS(r,'pm')),count:8,fall:22,interval:4.5,maxOn:2,exS:['A','pm'],
   tip:'Moll-pentatonen har bare fem toner og er grunnlaget for de fleste rock- og bluessoloer. Am penta = A C D E G.'}),
 L('pause','Hele, halve og fjerdedeler','4, 2 og 1 slag stillhet',null,{sw:'--rhy',pool:[-4,-2,-1].map(v=>mkR([v])),pads:[4,2,1],count:12,fall:11,interval:2.4,maxOn:3,exR:[-1],
   tip:'En pause er stillhet med lengde. Helpausen henger under linjen (4 slag). Halvpausen sitter oppå linjen (2 slag). Fjerdedelspausen er den krøllete (1 slag).'}),
 L('pause','Korte pauser','½ og ¼ slag',null,{sw:'--rhy',pool:[-2,-1,-.5,-.25].map(v=>mkR([v])),pads:[2,1,.5,.25],count:12,fall:11,interval:2.4,maxOn:3,exR:[-.5],
   tip:'Åttendelspausen har én flik (½ slag), sekstendelspausen har to (¼ slag). Det er det samme systemet som flaggene på notene.'}),
 L('pause','Noter og pauser','Fyll takten',null,{sw:'--rhy',gen:genFillRest,fill:true,pads:[3,2,1.5,1,.5],count:10,fall:16,interval:3.8,maxOn:2,exR:[1,-1,1],
   tip:'En takt i 4/4 har 4 slag, og pausene teller like mye som notene. Legg sammen alt på monsteret og finn ut hvor mange slag som mangler.'}),
];
LEVELS.forEach(L=>{const same=LEVELS.filter(x=>x.game===L.game);L.idx=same.indexOf(L)+1;L.key=L.game+L.idx;L.g=GAMES.find(g=>g.id===L.game)});
GAMES.forEach(g=>g.sw=LEVELS.find(L=>L.game===g.id).sw);
const QP=new URLSearchParams(location.search);
const FOCUS=GAMES.find(g=>g.slug===String((QP.get('delprove')||QP.get('delspill'))||location.hash.slice(1)||'').toLowerCase())||null;
const CHAL=Math.max(0,Math.min(99,parseInt(QP.get('s')||'0',10)||0));
const BASE=window.RS_SHARE_BASE||'https://rockeskolen.com/tools/games/monsterproven/';
let LAST=null,SH=null;

/* ---------- Audio ---------- */
let ac,master,noiseBuf,beatTimer=null,nextT=0,step=0,bpm=96;
function initAudio(){
  if(ac){if(ac.state==='suspended')ac.resume();return}
  try{ac=new (window.AudioContext||window.webkitAudioContext)()}catch(e){return}
  const comp=ac.createDynamicsCompressor();master=ac.createGain();master.gain.value=.55;master.connect(comp).connect(ac.destination);
  noiseBuf=ac.createBuffer(1,ac.sampleRate*.5,ac.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
}
const hz=m=>440*Math.pow(2,(m-69)/12);
function tone(midi,t,dur=.6,vol=.16){
  if(!ac)return;t=t||ac.currentTime;
  const o=ac.createOscillator(),o2=ac.createOscillator(),g=ac.createGain(),g2=ac.createGain(),f=ac.createBiquadFilter();
  o.type='triangle';o2.type='sawtooth';o2.detune.value=8;o.frequency.value=o2.frequency.value=hz(midi);g2.gain.value=.3;
  f.type='lowpass';f.frequency.setValueAtTime(3400,t);f.frequency.exponentialRampToValueAtTime(600,t+dur);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.008);g.gain.exponentialRampToValueAtTime(.0008,t+dur);
  o.connect(g);o2.connect(g2).connect(g);g.connect(f).connect(master);
  o.start(t);o2.start(t);o.stop(t+dur+.05);o2.stop(t+dur+.05);
}
const playNote=pc=>tone(60+pc,0,.55,.17);
function playChord(c,strum){
  if(!ac)return;const t=ac.currentTime;
  tone(48+c.root,t,1.1,.14);
  c.ints.forEach((iv,i)=>tone(60+c.root+iv,t+(strum?i*.035:0),1.1,.1));
}
function playRhythm(c){if(!ac)return;const b=60/bpm;let t=ac.currentTime+.02;c.vals.forEach(v=>{const a=Math.abs(v);if(v>0)tone(76,t,Math.min(a*b*.85,1.4),.14);t+=a*b});if(c.fill)tone(83,t,Math.min(c.ans*b*.85,1.4),.14)}
function playInt(c){if(!ac)return;const t=ac.currentTime,a=60+c.root,b=a+c.s;tone(a,t,.5,.15);tone(b,t+.4,.5,.15);tone(a,t+.85,.9,.12);tone(b,t+.85,.9,.12)}
function playScale(c){if(!ac)return;const t=ac.currentTime;[...c.ints,12].forEach((iv,i)=>tone(60+c.root+iv,t+i*.13,.35,.13))}
const playC=c=>c.rhy?playRhythm(c):c.q==='int'?playInt(c):c.q==='scale'?playScale(c):c.q==='read'?tone(c.midi,0,.8,.17):playChord(c,true);
const descr=c=>c.rhy?explainR(c):c.q==='read'?`<b>${dn(c.name)}</b> ligger ${posText(c.step)}`:`<b>${dn(c.name)}</b> = ${c.names.map(dn).join(' · ')}`+(c.q==='int'?` · ${c.s} halvtoner`:'');
const formOf=c=>c.q==='scale'?SC[c.t].form:c.q==='read'?`${dn(c.name)} ligger ${posText(c.step)}.`:c.q==='int'?`${IN[c.s]} = ${c.s} halvtoner over grunntonen.`:FORM[c.q];
function noise(t,dur,vol,type,freq){
  const s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();s.buffer=noiseBuf;f.type=type;f.frequency.value=freq;
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(f).connect(g).connect(master);s.start(t);s.stop(t+dur+.02);
}
function kick(t){const o=ac.createOscillator(),g=ac.createGain();o.frequency.setValueAtTime(130,t);o.frequency.exponentialRampToValueAtTime(42,t+.25);g.gain.setValueAtTime(.55,t);g.gain.exponentialRampToValueAtTime(.001,t+.3);o.connect(g).connect(master);o.start(t);o.stop(t+.32)}
function bass(midi,t){const o=ac.createOscillator(),g=ac.createGain(),f=ac.createBiquadFilter();o.type='sawtooth';o.frequency.value=hz(midi);f.type='lowpass';f.frequency.value=420;g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.16,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+.24);o.connect(f).connect(g).connect(master);o.start(t);o.stop(t+.26)}
function sched(s,t){
  if(s===0||s===4)kick(t);
  if(s===2||s===6)noise(t,.14,.13,'bandpass',1900);
  noise(t,.035,s%2?.025:.045,'highpass',7500);
  const tg=lowest();if(tg&&!tg.c.rhy&&(s===0||s===3||s===4||s===6))bass(36+tg.c.root,t);
}
function startBeat(){stopBeat();if(!S.beat||!ac)return;nextT=ac.currentTime+.08;step=0;
  beatTimer=setInterval(()=>{while(nextT<ac.currentTime+.12){sched(step,nextT);nextT+=60/bpm/2;step=(step+1)%8}},25)}
function stopBeat(){if(beatTimer){clearInterval(beatTimer);beatTimer=null}}
function buzz(){if(!ac)return;const t=ac.currentTime,o=ac.createOscillator(),g=ac.createGain();o.type='square';o.frequency.setValueAtTime(110,t);o.frequency.linearRampToValueAtTime(70,t+.18);g.gain.setValueAtTime(.08,t);g.gain.exponentialRampToValueAtTime(.001,t+.2);o.connect(g).connect(master);o.start(t);o.stop(t+.22)}
function missSnd(){if(!ac)return;const t=ac.currentTime;[64,60,55].forEach((m,i)=>tone(m,t+i*.11,.3,.12))}
function zap(){if(!ac)return;const t=ac.currentTime,o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.setValueAtTime(1800,t);o.frequency.exponentialRampToValueAtTime(300,t+.15);g.gain.setValueAtTime(.06,t);g.gain.exponentialRampToValueAtTime(.001,t+.16);o.connect(g).connect(master);o.start(t);o.stop(t+.17)}

/* ---------- Keyboard ---------- */
const kb=$('#kb');let keyEl={},OCT=1;
const WH=[0,2,4,5,7,9,11],BK=[[1,0],[3,1],[6,3],[8,4],[10,5]];
function buildKeys(oct){
  if(oct)OCT=oct;kb.innerHTML='';keyEl={};kb.classList.toggle('nolabels',!S.labels);kb.classList.toggle('two',OCT===2);
  const w=100/(7*OCT),bw=w*.62;
  for(let o=0;o<OCT;o++){
    WH.forEach(pc=>{const n=o*12+pc,k=document.createElement('div');k.className='kw';k.innerHTML=`<span>${dn(DEF[pc])}</span>`;bindKey(k,n);kb.appendChild(k);keyEl[n]=k});
  }
  for(let o=0;o<OCT;o++)BK.forEach(([pc,after])=>{const n=o*12+pc,k=document.createElement('div');k.className='kbk';k.style.left=`calc(${(o*7+after+1)*w}% - ${bw/2}%)`;k.style.width=bw+'%';
    const sh=LET[LPC.indexOf(pc-1)]+'#',fl=LET[LPC.indexOf(pc+1)]+'b';k.innerHTML=`<span>${dn(sh)}<br>${dn(fl)}</span>`;bindKey(k,n);kb.appendChild(k);keyEl[n]=k});
  renderSel();
}
function bindKey(el,pc){el.addEventListener('pointerdown',e=>{e.preventDefault();onKey(pc)})}
document.addEventListener('keydown',e=>{const m={a:0,w:1,s:2,e:3,d:4,f:5,t:6,g:7,y:8,h:9,u:10,j:11}[e.key.toLowerCase()];if(m!==undefined&&!e.repeat)onKey(m)});

/* ---------- Game ---------- */
const stage=$('#stage');let state='menu',G=null,enemies=[],sel=new Set(),last=0,uid=0,hintT=null;
const lowest=()=>enemies.reduce((a,e)=>!a||e.y>a.y?e:a,null);
const lanes=[.14,.38,.62,.86];

function onKey(pc){
  initAudio();playNote(pc);const k=keyEl[pc];k.classList.add('hit');setTimeout(()=>k.classList.remove('hit'),110);
  if(state!=='play'||!enemies.length||G.lvl.pads)return;
  sel.has(pc)?sel.delete(pc):sel.add(pc);renderSel();check();
}
function check(){
  if(!sel.size)return;
  const arr=[...sel];
  const m=enemies.filter(e=>matches(e.c,arr));
  if(m.length){kill(m.sort((a,b)=>b.y-a.y)[0]);sel.clear();renderSel();return}
  if(!enemies.some(e=>possible(e.c,arr)))wrong();
}
function matches(c,arr){
  if(c.q==='int'){if(arr.length!==2)return false;const [a,b]=[...arr].sort((x,y)=>x-y);return a%12===c.root&&b-a===c.s}
  const p=new Set(arr.map(k=>k%12));return p.size===arr.length&&p.size===c.pcs.length&&c.pcs.every(x=>p.has(x));
}
function possible(c,arr){
  if(c.q==='int'){if(arr.length>2)return false;if(arr.length===2)return matches(c,arr);return c.pcs.includes(arr[0]%12)}
  return arr.every(k=>c.pcs.includes(k%12));
}
function nameFor(k){const pc=k%12,e=enemies.find(e=>possible(e.c,[...sel]));if(e){const i=e.c.pcs.indexOf(pc);if(i>=0)return e.c.names[i]}return DEF[pc]}
function renderSel(){
  Object.entries(keyEl).forEach(([pc,el])=>el.classList.toggle('on',sel.has(+pc)));
  const c=$('#chips');
  c.innerHTML=sel.size?[...sel].map(pc=>`<span class="chip">${dn(nameFor(pc))}</span>`).join(''):`<span class="ph">${state==='play'?(!G?'':G.lvl.pads?'Hvor mange slag?':({toner:'Finn tonen',les:'Finn tonen på pianoet',int:'Spill grunntonen og tonen over',skala:'Trykk alle tonene i skalaen'}[G.lvl.game]||'Trykk tonene i akkorden')):''}</span>`;
}
function buildPads(L){
  const p=$('#pads');p.innerHTML=L.pads.map(v=>`<button class="pad" data-v="${v}"><b>${fr(v)}</b><span>slag</span></button>`).join('');
  p.querySelectorAll('.pad').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();onPad(+b.dataset.v,b)}));
}
function onPad(v,b){
  initAudio();tone(76,0,Math.min(v*60/bpm*.85,1.4),.14);b.classList.add('hit');setTimeout(()=>b.classList.remove('hit'),110);
  if(state!=='play'||!enemies.length)return;
  const m=enemies.filter(e=>e.c.ans===v);
  if(m.length){kill(m.sort((a,b)=>b.y-a.y)[0]);return}
  G.mistakes++;G.combo=0;renderHud();buzz();toast(`Ingen monstre på scenen er ${fr(v)} slag`);
  stage.classList.add('flash');setTimeout(()=>stage.classList.remove('flash'),180);
}
function wrong(){
  G.mistakes++;G.combo=0;renderHud();buzz();
  const bad=[...sel].map(pc=>dn(DEF[pc%12])).join(' + ');
  toast(`${bad} passer ikke i noen akkord på scenen`);
  stage.classList.add('flash');setTimeout(()=>stage.classList.remove('flash'),180);
  setTimeout(()=>{sel.clear();renderSel()},160);
}
function spawn(){
  const L=G.lvl;let c;
  if(L.gen)c=L.gen();
  else{do{c=L.pool[Math.floor(Math.random()*L.pool.length)]}while(L.pool.length>1&&c===G.prev);}
  G.prev=c;G.spawned++;
  const ls=(L.fill||L.wide)?[.2,.5,.8]:lanes;
  const busy=enemies.filter(e=>e.y<140).map(e=>e.lane);const free=ls.map((_,i)=>i).filter(i=>!busy.includes(i)&&i!==G.lastLane);
  const lane=free.length?free[Math.floor(Math.random()*free.length)]:Math.floor(Math.random()*ls.length);G.lastLane=lane;
  const el=document.createElement('div');el.className='mon '+(L.ear&&c.q!=='int'?'q-ear':c.cls)+((c.fill||L.wide)?' wide':'');
  let inner;
  if(c.q==='int')inner=`<span class="iv"><b>${dn(c.names[0])}</b><small>${L.ear?'+ hør etter':IN[c.s]}</small></span>`;
  else if(c.q==='read')inner=staffSVG(c);
  else if(c.rhy)inner=`<span class="fig">${c.vals.map(noteSVG).join('')}${c.fill?'<b class="q">?</b>':''}</span>`;
  else{const label=L.ear?dn(c.name.replace(/m$/,''))+' ?':dn(c.name);inner=`<b class="${label.length>4?'long':''}">${label}</b>`}
  el.innerHTML=`<div class="body"><span class="eyes"><i></i><i></i></span>${inner}</div>`;
  const e={id:++uid,c,el,lane,fx:ls[lane],hw:(c.fill||L.wide)?62:39,y:-40};
  el.addEventListener('pointerdown',ev=>{ev.preventDefault();initAudio();playC(c)});
  stage.appendChild(el);enemies.push(e);place(e);
  if(L.ear)setTimeout(()=>playC(c),250);
}
function place(e){const W=stage.clientWidth;e.el.style.transform=`translate(${e.fx*W-e.hw}px,${e.y-39}px)`}
function update(dt){
  const L=G.lvl,H=stage.clientHeight;G.timer+=dt;
  if(G.spawned<L.count&&enemies.length<L.maxOn&&(G.timer>=L.interval||enemies.length===0)){G.timer=0;spawn()}
  const sp=(H/L.fall)*(1+.35*G.spawned/L.count);
  for(const e of [...enemies]){
    e.y+=sp*dt;place(e);e.el.classList.toggle('near',e.y>H*.68);
    if(e.y>H-8-30)miss(e);
  }
}
function loop(now){if(state!=='play')return;const dt=Math.min(.05,(now-last)/1000);last=now;update(dt);requestAnimationFrame(loop)}
function fx(e){
  const W=stage.clientWidth,x=e.fx*W,col=getComputedStyle(e.el).getPropertyValue('--c');
  const b=document.createElement('div');b.className='beam';b.style.left=x+'px';b.style.height=(stage.clientHeight-e.y)+'px';b.style.setProperty('--c',col);stage.appendChild(b);setTimeout(()=>b.remove(),400);
  for(let i=0;i<10;i++){const s=document.createElement('div');s.className='spark';const a=i/10*Math.PI*2,r=40+Math.random()*40;
    s.style.cssText=`left:${x-4}px;top:${e.y-4}px;--dx:${Math.cos(a)*r}px;--dy:${Math.sin(a)*r}px;--c:${col}`;stage.appendChild(s);setTimeout(()=>s.remove(),600)}
}
function popup(e,txt){const p=document.createElement('div');p.className='pts';p.textContent=txt;p.style.left=e.fx*stage.clientWidth+'px';p.style.top=(e.y-50)+'px';stage.appendChild(p);setTimeout(()=>p.remove(),900)}
function kill(e){
  enemies=enemies.filter(x=>x!==e);G.kills++;G.combo++;G.maxCombo=Math.max(G.maxCombo,G.combo);
  const H=stage.clientHeight,pts=Math.round((100+Math.max(0,1-e.y/H)*100)*(1+(G.combo-1)*.25));G.score+=pts;
  playC(e.c);zap();fx(e);popup(e,`${e.c.rhy?fr(e.c.ans)+' slag':dn(e.c.name)}  +${pts}`);
  e.el.classList.add('pop');setTimeout(()=>e.el.remove(),340);
  const cb=$('#combo');if(G.combo>=2){cb.textContent=`x${G.combo} kombo`;cb.classList.add('show','bump');setTimeout(()=>cb.classList.remove('bump'),150)}
  renderHud();checkEnd();
}
function miss(e){
  enemies=enemies.filter(x=>x!==e);e.el.classList.add('fall');setTimeout(()=>e.el.remove(),400);
  G.lives--;G.combo=0;if(!G.missed.find(c=>c===e.c))G.missed.push(e.c);
  toast(descr(e.c),2600);missSnd();
  try{navigator.vibrate&&navigator.vibrate(120)}catch(_){}
  stage.classList.add('shake');setTimeout(()=>stage.classList.remove('shake'),360);
  sel.clear();renderSel();renderHud();
  if(G.lives<=0)end(false);else checkEnd();
}
function checkEnd(){if(G.spawned>=G.lvl.count&&!enemies.length&&state==='play'){state='ending';setTimeout(()=>end(true),700)}}
let toastT;function toast(html,ms=1700){const t=$('#toast');t.innerHTML=html;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),ms)}
function hint(){
  if(state!=='play')return;const e=lowest();if(!e)return;initAudio();
  G.hints++;G.combo=0;renderHud();sel.clear();renderSel();
  const hk=()=>[...Object.values(keyEl),...document.querySelectorAll('.pad')];
  clearTimeout(hintT);hk().forEach(k=>k.classList.remove('hint'));
  if(e.c.rhy){const p=document.querySelector(`.pad[data-v="${e.c.ans}"]`);p&&p.classList.add('hint');toast(explainR(e.c))}
  else{(e.c.q==='int'?[e.c.root,e.c.root+e.c.s]:e.c.pcs).forEach(k=>keyEl[k]&&keyEl[k].classList.add('hint'));toast(descr(e.c))}
  playC(e.c);
  hintT=setTimeout(()=>hk().forEach(k=>k.classList.remove('hint')),1600);
}
const PICK='<svg viewBox="0 0 20 22"><path d="M10 21C5 15 1 9.5 1 5.6 1 2.3 4.6 1 10 1s9 1.3 9 4.6C19 9.5 15 15 10 21z"/></svg>';
function renderHud(){
  if(!G)return;$('#score').textContent=G.score;
  $('#lives').innerHTML=[0,1,2].map(i=>PICK.replace('<svg',`<svg class="${i<G.lives?'':'lost'}"`)).join('');
  $('#prog').style.width=((G.spawned-enemies.length)/G.lvl.count*100)+'%';
  if(G.combo<2)$('#combo').classList.remove('show');
}
function clearStage(){enemies.forEach(e=>e.el.remove());enemies=[];stage.querySelectorAll('.pts,.spark,.beam').forEach(n=>n.remove());sel.clear();renderSel()}
function startLevel(L){
  initAudio();clearStage();
  G={lvl:L,spawned:0,timer:L.interval-.6,score:0,combo:0,maxCombo:0,lives:3,mistakes:0,hints:0,kills:0,missed:[],prev:null,lastLane:-1};
  bpm=94+L.idx*2;$('#lvlName').textContent=`${L.g.title} ${L.idx} · ${L.title}`;
  buildKeys(L.game==='int'?2:1);$('#kb').hidden=!!L.pads;$('#pads').hidden=!L.pads;$('#clearBtn').hidden=!!L.pads;if(L.pads)buildPads(L);
  show(null);state='play';renderHud();renderSel();startBeat();last=performance.now();requestAnimationFrame(loop);
}
function end(won){
  state='over';stopBeat();
  const L=G.lvl;let st=0;
  if(won)st=(G.lives===3&&G.mistakes<=2&&G.hints===0)?3:(G.lives>=2?2:1);
  if(st>(S.stars[L.key]||0))S.stars[L.key]=st;if(G.score>(S.best[L.key]||0))S.best[L.key]=G.score;S.hits=S.hits||{};if(G.kills>(S.hits[L.key]||0))S.hits[L.key]=G.kills;save();
  LAST={L,kills:G.kills,count:L.count,st,won};
  clearStage();
  $('#reN').textContent=`${L.g.title} · Nivå ${L.idx} · ${L.title}`;
  $('#reT').textContent=won?(st===3?'Perfekt konsert!':'Nivå klart!'):'Scenen falt';
  $('#reStars').innerHTML=[1,2,3].map(i=>i<=st?'★':'<span class="e">★</span>').join('');
  const acc=G.kills+G.mistakes?Math.round(G.kills/(G.kills+G.mistakes)*100):0;
  $('#reStats').innerHTML=[[G.score,'Poeng'],[`${G.kills}/${L.count}`,'Treff'],[acc+'%','Presisjon'],['x'+G.maxCombo,'Beste kombo']].map(([b,s])=>`<div><b>${b}</b><span>${s}</span></div>`).join('');
  $('#rePractice').innerHTML=G.missed.length?`<div class="eyebrow">Øv på disse</div>`+G.missed.map(c=>c.rhy?`<div><span class="fig" style="display:inline-flex;vertical-align:middle;width:auto">${c.vals.map(noteSVG).join('').replace(/<svg /g,'<svg width="14" height="24" ')}</span> ${explainR(c)}</div>`:`<div><b>${dn(c.name)}</b> = ${c.names.map(dn).join(' · ')} <span class="lead">· ${formOf(c)}</span></div>`).join(''):(won?`<p class="lead">${st===3?'Ingen bom, ingen hint. Du kan dette.':'Tre stjerner krever null bom, maks to feiltoner og ingen hint.'}</p>`:'');
  const next=nextOf(L),nb=$('#reNext'),ab=$('#reAgain'),mb=$('#reMenu');
  nb.hidden=!won;ab.className=won?'btn alt':'btn';ab.textContent=won?'Spill nivået på nytt':'Prøv igjen';
  nb.textContent=!next?'Se resultat':vipLocked(next)?'Lås opp med VIP':'Neste nivå';
  if(won&&!next)$('#reT').textContent='Siste nivå er klart!';
  show('result');
}

/* ---------- Screens ---------- */
function show(id){['menu','intro','result','vip','share','summary'].forEach(x=>$('#'+x).hidden=x!==id)}
const PRO=window.CL_IS_PRO!==false,UPG=window.CL_UPGRADE_URL||'/members/upgrade.php';
const vipLocked=L=>!PRO&&L.idx>1;
const unlocked=L=>!vipLocked(L)&&(S.all||L.idx===1||(S.stars[L.game+(L.idx-1)]||0)>0);
const nextOf=L=>{const n=LEVELS[LEVELS.indexOf(L)+1];return n&&n.game===L.game?n:null};
function renderMenu(){
  const gs=FOCUS?[FOCUS]:GAMES;$('#how').hidden=!!FOCUS;$('#legend').hidden=!!FOCUS;
  $('#chal').hidden=!(CHAL&&FOCUS);if(CHAL&&FOCUS)$('#chal').textContent=`Du er utfordret! En venn har ${CHAL} av ${gameStats(FOCUS).max} stjerner i ${FOCUS.title}. Klarer du å slå det?`;
  $('#allGames').hidden=!FOCUS;$('#allGames').href=BASE;
  $('#games').innerHTML=gs.map(g=>`<section class="game"><div class="ghead"><div class="gtop"><span class="eyebrow">Delprøve ${g.n}</span><button class="share" data-g="${g.id}">Del</button></div><h3>${g.title}</h3><p class="lead">${g.desc}</p></div><div class="levels">`+
    LEVELS.filter(L=>L.game===g.id).map(L=>{const s=S.stars[L.key]||0,u=unlocked(L);
    const v=vipLocked(L);
    return `<button class="lv${v?' vip':''}" data-key="${L.key}" ${u||v?'':'disabled'} style="--c:var(${L.sw})"><span class="sw"></span><span class="n">Nivå ${L.idx}${v?' · VIP':u?'':' · låst'}</span><span class="t">${L.title}</span><span class="l">${L.learn}</span><span class="st">${[1,2,3].map(i=>i<=s?'★':'<span class="e">★</span>').join('')}</span></button>`}).join('')+`</div></section>`).join('');
  $('#games').querySelectorAll('.share').forEach(b=>b.onclick=()=>openShare(GAMES.find(g=>g.id===b.dataset.g),null,'menu'));
  $('#games').querySelectorAll('.lv').forEach(b=>b.onclick=()=>{initAudio();const L=LEVELS.find(L=>L.key===b.dataset.key);vipLocked(L)?show('vip'):openIntro(L)});
  const T=[['labels','Notenavn på tangentene'],['beat','Trommer og bass'],['h','Skriv B som H']].concat(PRO?[['all','Lærermodus: alle nivåer åpne']]:[]);
  $('#settings').innerHTML=T.map(([k,t])=>`<button class="tg" data-k="${k}" aria-pressed="${!!S[k]}">${t}</button>`).join('');
  $('#settings').querySelectorAll('.tg').forEach(b=>b.onclick=()=>{const k=b.dataset.k;S[k]=!S[k];save();renderMenu();buildKeys()});
}
let curL=null;
function openIntro(L){
  curL=L;state='intro';stopBeat();clearStage();
  bpm=94+L.idx*2;
  $('#inN').textContent=`Delprøve ${L.g.n} · ${L.g.title} · Nivå ${L.idx}`;$('#inT').textContent=L.title;$('#inTip').textContent=L.tip;
  $('#inEx').style.setProperty('--c',`var(${L.sw==='--muted'?'--min':L.sw})`);
  const c=exOf(L);
  $('#inEx').innerHTML=c.q==='read'?`<span class="big" style="color:var(--fg)">${staffSVG(c)}</span><span class="notes"><span class="chip">${dn(c.name)}</span></span><span class="formula">${formOf(c)}</span>`:c.rhy?`<span class="big" style="display:flex;align-items:flex-end">${c.vals.map(noteSVG).join('')}${c.fill?'?':''}</span><span class="formula">${explainR(c)}</span>`
    :`<span class="big">${dn(c.name)}</span><span class="notes">${c.names.map(n=>`<span class="chip">${dn(n)}</span>`).join('')}</span><span class="formula">${formOf(c)}</span>`;
  show('intro');
}
const exOf=L=>L.exR?mkR(L.exR,L.fill):L.exI?mkI(...L.exI):L.exS?mkS(...L.exS):L.exN?mkN(...L.exN):mk(L.ex);
$('#inGo').onclick=()=>startLevel(curL);
$('#inHear').onclick=()=>{initAudio();playC(exOf(curL))};
$('#inBack').onclick=goMenu;
$('#reAgain').onclick=()=>openIntro(G.lvl);
$('#reNext').onclick=()=>{const n=nextOf(G.lvl);if(!n)return openSummary(G.lvl.g);vipLocked(n)?show('vip'):openIntro(n)};
function openSummary(g){
  const {ls,st,max}=gameStats(g),done=ls.filter(L=>(S.stars[L.key]||0)>0).length;
  $('#suN').textContent=`Delprøve ${g.n} · ${g.title}`;
  $('#suT').textContent=done===ls.length?'Delprøven er bestått!':`Du har klart ${done} av ${ls.length} nivåer`;
  $('#suL').textContent=done===ls.length?(st===max?'Full pott på alle nivåene. Sterkt!':`Du har ${st} av ${max} stjerner. Spill nivåene på nytt fra menyen hvis du vil ha flere.`):'Gå til menyen og spill nivåene du mangler.';
  $('#suStars').innerHTML=`${st} <span class="lead" style="font-size:18px;letter-spacing:0">av ${max} ★</span>`;
  $('#suRows').innerHTML=ls.map(L=>{const s3=S.stars[L.key]||0,h=(S.hits||{})[L.key];return `<div style="display:flex;justify-content:space-between;gap:10px"><span><b>${L.title}</b>${h!=null?` <span class="lead">· ${h} av ${L.count} riktige</span>`:''}</span><span style="color:var(--maj);letter-spacing:2px;white-space:nowrap">${[1,2,3].map(i=>i<=s3?'★':'<span style="color:var(--line)">★</span>').join('')}</span></div>`}).join('');
  SUMG=g;show('summary');
}
let SUMG=null;
$('#suShare').onclick=()=>openShare(SUMG,null,'summary');
$('#suMenu').onclick=goMenu;
$('#vipBack').onclick=goMenu;$('#vipGo').href=UPG;
$('#reMenu').onclick=goMenu;
$('#menuBtn').onclick=goMenu;
$('#hintBtn').onclick=hint;
$('#clearBtn').onclick=()=>{sel.clear();renderSel()};
function gameStats(g){const ls=LEVELS.filter(L=>L.game===g.id);return{ls,st:ls.reduce((a,L)=>a+(S.stars[L.key]||0),0),max:ls.length*3}}
const shareUrl=(g,st)=>`${BASE}?delprove=${g.slug}${st?'&s='+st:''}`;
function blob(x,cx,cy,r,col){
  const gr=x.createRadialGradient(cx-r*.45,cy+r*.2,r*.05,cx,cy,r*1.1);gr.addColorStop(0,'#ffffff');gr.addColorStop(.25,col);gr.addColorStop(1,col);
  x.save();x.shadowColor=col;x.shadowBlur=60;x.fillStyle=gr;x.beginPath();x.ellipse(cx,cy,r*1.05,r,0,0,Math.PI*2);x.fill();x.restore();
  [[-.28,-.38],[.28,-.38]].forEach(([dx,dy])=>{x.fillStyle='#fff';x.beginPath();x.arc(cx+dx*r,cy+dy*r,r*.16,0,7);x.fill();x.fillStyle='#1a1020';x.beginPath();x.arc(cx+dx*r+r*.03,cy+dy*r+r*.05,r*.07,0,7);x.fill()});
}
async function drawCard(g,last){
  try{await Promise.all(['80px "Archivo Black"','600 40px Figtree','800 40px Figtree'].map(f=>document.fonts.load(f)))}catch(e){}
  const W=1080,H=1350,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  const cs=getComputedStyle(document.documentElement),t=n=>cs.getPropertyValue(n).trim()||'#fff';
  const col=t(g.sw==='--muted'?'--min':g.sw),fg=t('--fg'),mu=t('--muted'),amb=t('--maj'),ln=t('--line');
  const D='"Archivo Black","Arial Black",sans-serif',B='Figtree,system-ui,sans-serif';
  x.fillStyle=t('--ink');x.fillRect(0,0,W,H);
  [[200,-80,'rgba(255,176,58,.20)'],[880,-80,'rgba(94,200,255,.16)'],[540,-120,'rgba(255,95,168,.12)']].forEach(([gx,gy,cc])=>{const r=x.createRadialGradient(gx,gy,0,gx,gy,700);r.addColorStop(0,cc);r.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=r;x.fillRect(0,0,W,H)});
  blob(x,905,250,105,col);blob(x,985,1235,62,col);
  const fit=(txt,font,size,max)=>{let s2=size;do{x.font=font.replace('S',s2)}while(x.measureText(txt).width>max&&(s2-=4)>20);return s2};
  x.textBaseline='alphabetic';x.textAlign='left';
  x.fillStyle=mu;x.font=`700 30px ${B}`;x.fillText('ROCKESKOLEN · MONSTERPRØVEN',90,150);
  x.fillStyle=fg;fit(g.title,`S`+`px ${D}`,118,720);x.fillText(g.title,90,295);
  const {ls,st,max}=gameStats(g);
  let head,sub;
  if(last){head=last.kills===last.count?'Full pott!':`${last.kills} av ${last.count} riktige`;sub=last.kills===last.count?`${last.count} av ${last.count} på ${last.L.title}`:`på ${last.L.title}`}
  else if(st&&ls.every(L=>(S.stars[L.key]||0)>0)){head='Bestått!';sub=`${st} av ${max} stjerner i ${g.title}`}
  else if(st){head=`${st} av ${max} stjerner`;sub=`i ${g.title}`}
  else{head='Bli med og spill';sub=g.desc}
  x.fillStyle=col;fit(head,`S`+`px ${D}`,80,900);x.fillText(head,90,430);
  x.fillStyle=fg;fit(sub,`600 S`+`px ${B}`,44,900);x.fillText(sub,90,495);
  let y=600;
  ls.forEach(L=>{
    x.strokeStyle=ln;x.lineWidth=2;x.beginPath();x.moveTo(90,y-58);x.lineTo(990,y-58);x.stroke();
    const hl=last&&last.L===L;x.fillStyle=hl?col:fg;fit(L.title,`800 S`+`px ${B}`,40,620);x.fillText(L.title,90,y);
    const s3=S.stars[L.key]||0;x.font=`48px ${B}`;x.textAlign='right';
    x.fillText('',990,y);[0,1,2].forEach(i=>{x.fillStyle=i<s3?amb:ln;x.fillText('★',990-(2-i)*58,y+2)});x.textAlign='left';
    y+=96;
  });
  if(last||!st){x.fillStyle=mu;x.font=`600 38px ${B}`;x.fillText(st?`${st} av ${max} stjerner i ${g.title}`:'',90,y+10)}
  x.fillStyle=fg;fit('Klarer du å slå meg?',`S`+`px ${D}`,52,780);x.fillText(st||last?'Klarer du å slå meg?':'Spill. Utforsk. Lag musikk.',90,1225);
  x.fillStyle=col;x.font=`700 34px ${B}`;x.fillText('rockeskolen.com',90,1285);
  return c;
}
async function openShare(g,last,back){
  initAudio();const {st,max}=gameStats(g);const url=shareUrl(g,st);
  const text=last&&last.kills===last.count?`Full pott på ${last.L.title} i Monsterprøven! Klarer du å slå meg?`
    :last?`${last.kills} av ${last.count} riktige på ${last.L.title} i Monsterprøven. Klarer du å slå meg?`
    :st&&gameStats(g).ls.every(L=>(S.stars[L.key]||0)>0)?`Jeg har bestått Monsterprøven i ${g.title} med ${st} av ${max} stjerner. Klarer du å slå meg?`
    :st?`Jeg har ${st} av ${max} stjerner i ${g.title} på Monsterprøven. Klarer du å slå meg?`
    :`Prøv ${g.title} på Monsterprøven, et musikkteori-spill fra Rockeskolen.`;
  const cv=await drawCard(g,last);const b=await new Promise(r=>cv.toBlob(r,'image/png'));
  if(SH&&SH.src)URL.revokeObjectURL(SH.src);
  SH={text,url,blob:b,g,back,src:URL.createObjectURL(b)};$('#shImg').src=SH.src;$('#shText').textContent=`${text} ${url}`;
  $('#shGo').hidden=!navigator.share;show('share');
}
$('#shGo').onclick=async()=>{const {text,url,blob:b,g}=SH;let file=null;try{file=new File([b],`monsterproven-${g.slug}.png`,{type:'image/png'})}catch(e){}
  try{if(file&&navigator.canShare&&navigator.canShare({files:[file]}))await navigator.share({files:[file],text:`${text} ${url}`});else await navigator.share({title:'Monsterprøven',text,url})}
  catch(e){if(e&&e.name!=='AbortError'){$('#shGo').hidden=true}}};
$('#shCopy').onclick=async()=>{const bt=$('#shCopy');try{await navigator.clipboard.writeText(`${SH.text} ${SH.url}`);bt.textContent='Kopiert'}catch(e){const r=document.createRange();r.selectNodeContents($('#shText'));const se=getSelection();se.removeAllRanges();se.addRange(r);bt.textContent='Teksten er merket'}setTimeout(()=>bt.textContent='Kopier lenke',2000)};
$('#shClose').onclick=()=>show(SH&&SH.back||'menu');
$('#reShare').onclick=()=>LAST&&openShare(LAST.L.g,LAST,'result');
function goMenu(){buildKeys(1);$('#kb').hidden=false;$('#pads').hidden=true;$('#clearBtn').hidden=false;state='menu';stopBeat();clearStage();G=null;$('#lvlName').textContent='Monsterprøven';$('#score').textContent='0';$('#prog').style.width='0';$('#combo').classList.remove('show');renderMenu();show('menu')}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='play'){state='paused';stopBeat();toast('Pause. Trykk en tangent for å fortsette.',99999)}});
const resume=()=>{if(state==='paused'){state='play';$('#toast').classList.remove('show');startBeat();last=performance.now();requestAnimationFrame(loop)}};
document.addEventListener('pointerdown',resume,true);

buildKeys();renderMenu();
$('#lives').innerHTML=PICK.repeat(3);
})();
</script>

</body>
</html>
