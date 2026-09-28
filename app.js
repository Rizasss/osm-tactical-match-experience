/*
 * Tactical Match Experience
 * Unofficial OSM UX concept prototype
 *
 * Architecture:
 * - Static event data defines the demonstration match.
 * - Normal phases highlight one of three pitch zones.
 * - Key events temporarily reveal the ball and relevant players.
 * - A lightweight scheduler drives both isolated events and full-match autoplay.
 *
 * This is intentionally a UX prototype, not a football simulation engine.
 */

"use strict";

// -----------------------------------------------------------------------------
// Demo data
// -----------------------------------------------------------------------------

const RM={Courtois:[7,50],Trent:[18,18],Rudiger:[18,40],Huijsen:[18,60],Cucurella:[18,82],Camavinga:[39,30],Valverde:[39,50],Bellingham:[39,70],Brahim:[62,22],Mbappe:[65,50],Vini:[62,78]};
const LIV={Alisson:[93,50],VanDijk:[82,35],Jacquet:[82,56],Kerkez:[82,78],Araujo:[82,17],Gravenberch:[62,40],MacAllister:[62,62],Szoboszlai:[54,51],Wirtz:[40,30],Barcola:[40,74],Isak:[36,50]};
const pretty={Rudiger:"Rüdiger",Mbappe:"Mbappé",Vini:"Vini Jr.",VanDijk:"Van Dijk",MacAllister:"Mac Allister"};

const playersLayer=document.getElementById("players"),labelsLayer=document.getElementById("labels"),ball=document.getElementById("ball"),pulse=document.getElementById("pulse"),arrow=document.getElementById("arrow");
const eventCard=document.getElementById("eventCard"),eventIcon=document.getElementById("eventIcon"),eventType=document.getElementById("eventType"),eventTitle=document.getElementById("eventTitle"),eventText=document.getElementById("eventText"),eventIconDock=document.getElementById("eventIconDock"),eventTypeDock=document.getElementById("eventTypeDock"),eventMinuteDock=document.getElementById("eventMinuteDock"),eventTitleDock=document.getElementById("eventTitleDock"),eventTextDock=document.getElementById("eventTextDock");
const scoreEl=document.getElementById("score"),clockEl=document.getElementById("clock"),modeText=document.getElementById("modeText"),zoneText=document.getElementById("zoneText"),noteText=document.getElementById("noteText");
const feed=document.getElementById("feed"),jumpGrid=document.getElementById("jumpGrid"),zones=[...document.querySelectorAll(".zone")];

let currentIndex = 0;
let timers = [];
let score = [0, 0];
const playerEls={},labelEls={};

// -----------------------------------------------------------------------------
// DOM / rendering helpers
// -----------------------------------------------------------------------------

function pn(n){return pretty[n]||n}
function createPlayers(){
  for(const [roster,cls] of [[RM,"rm"],[LIV,"liv"]]){
    for(const [name,[x,y]] of Object.entries(roster)){
      const p=document.createElement("div");p.className=`player ${cls} faded`;p.style.left=x+"%";p.style.top=y+"%";playersLayer.appendChild(p);playerEls[name]=p;
      const l=document.createElement("div");l.className="name";l.textContent=pn(name);l.style.left=x+"%";l.style.top=y+"%";labelsLayer.appendChild(l);labelEls[name]=l;
    }
  }
}
function setPlayer(name,x,y,active=false,faded=true){
  const p=playerEls[name],l=labelEls[name];if(!p)return;p.style.left=x+"%";p.style.top=y+"%";p.classList.toggle("active",active);p.classList.toggle("faded",faded);l.style.left=x+"%";l.style.top=y+"%";l.classList.toggle("show",active);
}
function resetShape(){
  Object.entries(RM).forEach(([n,[x,y]])=>setPlayer(n,x,y,false,true));
  Object.entries(LIV).forEach(([n,[x,y]])=>setPlayer(n,x,y,false,true));
  hideBall();hideArrow();hideCard();
}
function focus(names){
  Object.entries(playerEls).forEach(([n,p])=>{const on=names.includes(n);p.classList.toggle("faded",!on);p.classList.toggle("active",on);labelEls[n].classList.toggle("show",on)});
}
function activateZone(z){zones.forEach(el=>el.classList.toggle("active",el.dataset.zone===z));zoneText.textContent=z==="left"?"Defensive third":z==="middle"?"Midfield":"Attacking third"}
function showBall(x,y){ball.classList.remove("hidden");ball.style.left=x+"%";ball.style.top=y+"%"}
function hideBall(){ball.classList.add("hidden")}
function showArrow(x1,y1,x2,y2){const dx=x2-x1,dy=y2-y1,len=Math.sqrt(dx*dx+dy*dy),ang=Math.atan2(dy,dx)*180/Math.PI;arrow.style.left=x1+"%";arrow.style.top=y1+"%";arrow.style.width=len+"%";arrow.style.transform=`rotate(${ang}deg)`;arrow.classList.add("show")}
function hideArrow(){arrow.classList.remove("show");arrow.style.width="0"}
function ping(x,y,type=""){pulse.className=`pulse ${type} go`;pulse.style.left=x+"%";pulse.style.top=y+"%"}
function updateDock(icon,type,title,text,minute){eventIconDock.textContent=icon;eventTypeDock.textContent=type;eventMinuteDock.textContent=minute;eventTitleDock.textContent=title;eventTextDock.textContent=text}
function showCard(icon,type,title,text,minute){updateDock(icon,type,title,text,minute);eventIcon.textContent=icon;eventType.textContent=type;eventTitle.textContent=title;eventText.textContent=text;}
function hideCard(){}
function setScore(h,a){score=[h,a];scoreEl.textContent=`${h} - ${a}`}
function setClock(m){clockEl.textContent=String(m).padStart(2,"0")+":00"}
function later(ms,fn){const t=setTimeout(fn,ms);timers.push(t)}
function clearTimers(){timers.forEach(clearTimeout);timers=[]}

// -----------------------------------------------------------------------------
// Scripted match timeline
// -----------------------------------------------------------------------------

const events=[
{m:0,label:"Kick-off",icon:"▶",tag:"MATCH FLOW",zone:"middle",hot:false,title:"Kick-off",note:"Ball hidden during standard play",desc:"The match starts in compact mode.",feed:"Match starts. Play begins in midfield."},
{m:7,label:"Zone shift",icon:"↔",tag:"MATCH FLOW",zone:"left",hot:false,title:"Liverpool pressure",note:"Only zone activity is shown",desc:"Liverpool push the ball into Real Madrid's defensive third.",feed:"Ball shifts to Real Madrid's defensive third."},
{m:13,label:"Throw-in",icon:"↗",tag:"THROW-IN",zone:"right",hot:true,title:"Trent takes a quick throw-in",note:"Key event card + short visual sequence",desc:"The throw-in develops into a dangerous attack.",feed:"Quick throw-in creates a dangerous move.",focus:["Trent","Bellingham","Brahim","Mbappe"],steps:[
[200,()=>{showCard("↗","THROW-IN","Trent takes a quick throw-in","Real Madrid move play quickly into the attacking third.", "13'");showBall(33,20);setPlayer("Trent",33,20,true,false)}],
[900,()=>{showArrow(33,20,48,30);showBall(48,30);setPlayer("Bellingham",48,30,true,false)}],
[1550,()=>{showArrow(48,30,66,23);showBall(66,23);setPlayer("Brahim",66,23,true,false)}],
[2200,()=>{showArrow(66,23,86,43);showBall(86,43);setPlayer("Mbappe",86,43,true,false)}],
[2700,()=>{ping(95,44,"blue");noteText.textContent="Shot goes wide after a quick throw-in routine"}],
[3300,()=>{hideBall();hideArrow();hideCard()}]
]},
{m:22,label:"Foul",icon:"⚠",tag:"FOUL",zone:"middle",hot:true,title:"Van Dijk fouls Bellingham",note:"Important incidents get a visible overlay",desc:"Play stops in midfield and a free kick is awarded.",feed:"Foul by Van Dijk on Bellingham.",focus:["VanDijk","Bellingham"],steps:[
[200,()=>{showCard("⚠","FOUL","Van Dijk fouls Bellingham","Play stops in midfield and the referee awards a free kick.", "22'");showBall(56,56);setPlayer("Bellingham",56,56,true,false);setPlayer("VanDijk",59,53,true,false)}],
[1000,()=>{ping(57,54);noteText.textContent="Free kick awarded"}],
[1800,()=>{hideBall();hideCard()}]
]},
{m:23,label:"Yellow",icon:"🟨",tag:"YELLOW CARD",zone:"middle",hot:true,title:"Van Dijk is booked",note:"Cards can appear as standalone match notes",desc:"The disciplinary outcome is shown separately.",feed:"Yellow card shown to Van Dijk.",focus:["VanDijk"],steps:[
[150,()=>{showCard("🟨","YELLOW CARD","Van Dijk booked","The referee shows a yellow card after the foul.", "23'");setPlayer("VanDijk",59,53,true,false);ping(59,53)}],
[1500,()=>hideCard()]
]},
{m:28,label:"Direct FK",icon:"🎯",tag:"DIRECT FREE KICK",zone:"right",hot:true,title:"Bellingham goes directly for goal",note:"Direct attempts show the shot path itself",desc:"The direct free kick is visualised from strike to save.",feed:"Direct free kick on target. Alisson saves.",focus:["Bellingham","Alisson"],steps:[
[200,()=>{showCard("🎯","DIRECT FREE KICK","Bellingham tries his luck","A direct attempt from the edge of the area.", "28'");showBall(71,54);setPlayer("Bellingham",69,55,true,false)}],
[950,()=>{showArrow(71,54,95,39);showBall(95,39)}],
[1500,()=>{setPlayer("Alisson",94,42,true,false);ping(95,39,"blue");noteText.textContent="Alisson saves"}],
[2200,()=>{hideBall();hideArrow();hideCard()}]
]},
{m:35,label:"Offside",icon:"🚩",tag:"OFFSIDE",zone:"right",hot:true,title:"Mbappé is caught offside",note:"Decision events stay brief",desc:"Only the pass and the decision cue are needed.",feed:"Mbappé flagged offside.",focus:["Valverde","Mbappe"],steps:[
[200,()=>{showCard("🚩","OFFSIDE","Mbappé starts too early","The move is stopped immediately by the assistant referee.", "35'");showBall(61,50);setPlayer("Valverde",61,50,true,false)}],
[850,()=>{showArrow(61,50,83,49);showBall(83,49);setPlayer("Mbappe",83,49,true,false)}],
[1350,()=>{ping(83,49,"orange");noteText.textContent="Offside called"}],
[2000,()=>{hideBall();hideArrow();hideCard()}]
]},
{m:41,label:"Save",icon:"🧤",tag:"SHOT & SAVE",zone:"left",hot:true,title:"Isak forces Courtois into a save",note:"Only the decisive attacking actions become visible",desc:"Liverpool break forward and the final action is visualised.",feed:"Isak tests Courtois. Save.",focus:["Wirtz","Isak","Courtois"],steps:[
[200,()=>{showCard("🧤","SHOT & SAVE","Liverpool break quickly","The dangerous part of the move becomes visible.", "41'");showBall(55,67);setPlayer("Wirtz",55,67,true,false)}],
[900,()=>{showArrow(55,67,36,53);showBall(36,53);setPlayer("Isak",36,53,true,false)}],
[1500,()=>{showArrow(36,53,8,45);showBall(8,45)}],
[1950,()=>{setPlayer("Courtois",7,46,true,false);ping(8,45,"blue");noteText.textContent="Courtois keeps the score level"}],
[2600,()=>{hideBall();hideArrow();hideCard()}]
]},
{m:45,label:"Half-time",icon:"⏸",tag:"HALF-TIME",zone:"middle",hot:false,title:"Half-time",note:"Break events stay compact",desc:"Half-time is just another clean timeline event.",feed:"Half-time. Real Madrid 0–0 Liverpool."},
{m:53,label:"Corner",icon:"🚩",tag:"CORNER",zone:"right",hot:true,title:"Vini Jr. swings in the corner",note:"Set pieces fit naturally into the visual layer",desc:"Corners show the delivery and immediate outcome.",feed:"Corner kick results in a headed chance.",focus:["Vini","Rudiger","Alisson"],steps:[
[200,()=>{showCard("🚩","CORNER","Vini Jr. takes the corner","The set piece begins from a clearly identifiable position.", "53'");showBall(90,91);setPlayer("Vini",87,88,true,false)}],
[900,()=>{showArrow(90,91,83,50);showBall(83,50);setPlayer("Rudiger",83,50,true,false)}],
[1500,()=>{ping(83,50);noteText.textContent="Rüdiger meets it in the box"}],
[1950,()=>{showBall(94,49);setPlayer("Alisson",94,49,true,false);ping(94,49,"blue")}],
[2600,()=>{hideBall();hideArrow();hideCard()}]
]},
{m:60,label:"Sub",icon:"🔁",tag:"SUBSTITUTION",zone:"middle",hot:true,title:"Real Madrid make a substitution",note:"Administrative events use only a lightweight overlay",desc:"Not every event needs a ball animation.",feed:"Substitution for Real Madrid.",focus:["Camavinga"],steps:[
[200,()=>{showCard("🔁","SUBSTITUTION","Real Madrid change personnel","A lightweight card is enough to inform the manager.", "60'");setPlayer("Camavinga",49,90,true,false);ping(49,90,"green")}],
[1600,()=>hideCard()]
]},
{m:66,label:"Indirect FK",icon:"↪",tag:"INDIRECT FREE KICK",zone:"right",hot:true,title:"Valverde creates a chance",note:"Indirect free kicks show the build-up, not a direct shot",desc:"The passing sequence is the meaningful visual element.",feed:"Indirect free kick creates a dangerous chance.",focus:["Valverde","Brahim","Mbappe"],steps:[
[200,()=>{showCard("↪","INDIRECT FREE KICK","Valverde restarts play","The routine leads into a dangerous final ball.", "66'");showBall(70,56);setPlayer("Valverde",68,56,true,false)}],
[850,()=>{showArrow(70,56,80,31);showBall(80,31);setPlayer("Brahim",80,31,true,false)}],
[1500,()=>{showArrow(80,31,89,47);showBall(89,47);setPlayer("Mbappe",89,47,true,false)}],
[2100,()=>{ping(95,48,"blue");noteText.textContent="Chance created from the indirect routine"}],
[2800,()=>{hideBall();hideArrow();hideCard()}]
]},
{m:71,label:"Red card",icon:"🟥",tag:"RED CARD",zone:"middle",hot:true,title:"Araujo is sent off",note:"Major disciplinary incidents are strongly signalled",desc:"The stronger colour cue makes the moment immediately readable.",feed:"Red card shown to Araujo.",focus:["Araujo","Vini"],steps:[
[200,()=>{showCard("🟥","RED CARD","Araujo is sent off","Liverpool are reduced to ten men after a late challenge.", "71'");setPlayer("Araujo",53,45,true,false);setPlayer("Vini",51,48,true,false);showBall(52,47)}],
[1000,()=>{ping(53,46,"red");noteText.textContent="Liverpool down to 10 players"}],
[1900,()=>{hideBall();hideCard()}]
]},
{m:77,label:"Penalty",icon:"⚽",tag:"PENALTY",zone:"right",hot:true,title:"Mbappé scores from the spot",note:"High-impact events deserve the clearest treatment",desc:"The taker, shot, outcome and score update are shown.",feed:"Penalty converted by Mbappé. Real Madrid lead 1–0.",focus:["Mbappe","Alisson"],steps:[
[200,()=>{showCard("⚽","PENALTY","Mbappé steps up","High-impact events receive the clearest visual treatment.", "77'");showBall(88,50);setPlayer("Mbappe",82,50,true,false)}],
[1100,()=>{showArrow(88,50,98,42);showBall(98,42)}],
[1650,()=>{ping(98,42,"green");setScore(1,0);noteText.textContent="Goal for Real Madrid"}],
[2350,()=>{hideBall();hideArrow();hideCard()}]
]},
{m:84,label:"Zone shift",icon:"↔",tag:"MATCH FLOW",zone:"middle",hot:false,title:"Back to normal play",note:"The screen returns to the compact overview",desc:"After the key moment, only the zone overview remains.",feed:"Ball returns to midfield."},
{m:88,label:"Goal",icon:"⚽",tag:"GOAL",zone:"right",hot:true,title:"Vini Jr. finishes the counter",note:"Open-play goals show only the decisive final sequence",desc:"The last important transition is visualised with minimal context.",feed:"Counter-attack finished by Vini Jr. Real Madrid go 2–0 ahead.",focus:["Camavinga","Bellingham","Vini"],steps:[
[200,()=>{showCard("⚽","GOAL","Real Madrid break quickly","Only the decisive final sequence is visualised.", "88'");showBall(47,37);setPlayer("Camavinga",47,37,true,false)}],
[850,()=>{showArrow(47,37,62,52);showBall(62,52);setPlayer("Bellingham",62,52,true,false)}],
[1500,()=>{showArrow(62,52,76,70);showBall(76,70);setPlayer("Vini",76,70,true,false)}],
[2150,()=>{showArrow(76,70,97,54);showBall(97,54)}],
[2600,()=>{ping(97,54,"green");setScore(2,0);noteText.textContent="Counter-attack goal"}],
[3300,()=>{hideBall();hideArrow();hideCard()}]
]},
{m:90,label:"Full-time",icon:"■",tag:"FULL-TIME",zone:"middle",hot:false,title:"Full-time · Real Madrid 2–0 Liverpool",note:"Final result remains in the history",desc:"The match ends with the same principle: short pacing and richer context only when needed.",feed:"Full-time. Real Madrid win 2–0."}
];

// -----------------------------------------------------------------------------
// Navigation and timeline UI
// -----------------------------------------------------------------------------

function buildFeed(){
  feed.innerHTML="";events.forEach((e,i)=>{const item=document.createElement("div");item.className="feed-item";item.innerHTML=`<div class="fi-head"><span class="fi-minute">${e.m}'</span><span class="fi-tag">${e.tag}</span></div><div class="fi-text">${e.feed}</div>`;item.onclick = () => { pauseFullMatch(); loadEvent(i, false); };feed.appendChild(item)});
}
function buildJumps(){
  jumpGrid.innerHTML="";events.forEach((e,i)=>{const b=document.createElement("button");b.className="jump";b.textContent=`${e.m}' · ${e.label}`;b.onclick = () => { pauseFullMatch(); loadEvent(i, false); };jumpGrid.appendChild(b)});
}
function highlightFeed(){[...feed.children].forEach((el,i)=>el.classList.toggle("live",i===currentIndex));const active=feed.children[currentIndex];if(active)active.scrollIntoView({behavior:"smooth",block:"nearest"})}

function scoreBeforeEvent(index) {
  if (index >= events.findIndex((event) => event.m === 88)) return [1, 0];
  if (index >= events.findIndex((event) => event.m === 77)) return [0, 0];
  return [0, 0];
}

function restoreScoreForEvent(index) {
  const event = events[index];

  if (event.m > 88) {
    setScore(2, 0);
  } else if (event.m > 77) {
    setScore(1, 0);
  } else {
    setScore(0, 0);
  }
}

function loadEvent(i,autoplay=false){
  clearTimers();
  currentIndex = Math.max(0, Math.min(events.length - 1, i));
  const e = events[currentIndex];

  if (!autoplay) {
    restoreScoreForEvent(currentIndex);
  }
  resetShape();activateZone(e.zone);setClock(e.m);modeText.textContent=e.hot?"Key event visualization":"Normal play";noteText.textContent=e.note;highlightFeed();
  updateDock(e.icon,e.tag,e.title,e.desc, `${e.m}'`);
  if(e.hot&&e.focus)focus(e.focus);
  if(!e.hot){showCard(e.icon,e.tag,e.title,e.desc, `${e.m}'`);}
  if(autoplay&&e.hot&&e.steps)e.steps.forEach(([ms,fn])=>later(ms,fn));
}

// -----------------------------------------------------------------------------
// Full-match autoplay controller
// -----------------------------------------------------------------------------

let autoMatchToken = 0;
let autoMatchActive = false;
function eventDuration(e){
  if(e.hot && e.steps && e.steps.length){
    const maxStep = Math.max(...e.steps.map(s => s[0]));
    return maxStep + 2200;
  }
  return 2200;
}
function playFullMatch(startIndex=currentIndex){
  autoMatchToken += 1;
  const token = autoMatchToken;
  autoMatchActive = true;
  runAutoEvent(Math.max(0, Math.min(events.length-1, startIndex)), token);
}
function runAutoEvent(index, token){
  if(token !== autoMatchToken) return;
  loadEvent(index, true);
  if(index >= events.length - 1){
    autoMatchActive = false;
    return;
  }
  later(eventDuration(events[index]), () => runAutoEvent(index + 1, token));
}
function pauseFullMatch(){
  autoMatchToken += 1;
  autoMatchActive = false;
  clearTimers();
}
function resetPrototype(){
  pauseFullMatch();
  setScore(0,0);
  loadEvent(0,false);
}

document.getElementById("playBtn").onclick=()=>{pauseFullMatch(); loadEvent(currentIndex,true)};
document.getElementById("playMatchBtn").onclick=()=>playFullMatch(currentIndex);
document.getElementById("pauseBtn").onclick=()=>pauseFullMatch();
document.getElementById("prevBtn").onclick=()=>{pauseFullMatch(); loadEvent(currentIndex-1,false)};
document.getElementById("nextBtn").onclick=()=>{pauseFullMatch(); loadEvent(currentIndex+1,false)};
document.getElementById("resetBtn").onclick=()=>resetPrototype();

function initializePrototype() {
  createPlayers();
  buildFeed();
  buildJumps();
  setScore(0, 0);
  loadEvent(0, false);

  // Brief delay lets the layout render before the guided full-match demo begins.
  later(700, () => playFullMatch(0));
}

initializePrototype();