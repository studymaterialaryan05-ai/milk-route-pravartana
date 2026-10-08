const state={round:1,team:'DAIRY TITANS',members:'4 operators',cash:100000,trust:82,rank:'—',spend:5000,submitted:false,event:null,ledger:[],choices:{procurement:'balanced',transport:'balanced',quality:'balanced'}};
const rounds=[
 {eyebrow:'ROUND 01 · STABLE OPERATIONS',title:'The morning milk run.',brief:'200 farmers supply milk through two collection centres. Chilling capacity is constrained. Your union rewards reliable delivery and penalises rejection and delay.'},
 {eyebrow:'ROUND 02 · FIRST DISRUPTION',title:'The route just broke.',brief:'Your baseline plan is in place. Now the network will react. Protect service without destroying your cash position.'},
 {eyebrow:'ROUND 03 · FESTIVAL SURGE',title:'Demand is moving faster.',brief:'Urban demand jumps 25%. Farmer supply rises 18%. Fuel and transport become more expensive while labour availability tightens.'},
 {eyebrow:'ROUND 04 · CRISIS MANAGEMENT',title:'Everything fails at once.',brief:'Vehicle, road, electricity and quality problems hit the cooperative in one operating window. Your emergency cash is finite.'},
 {eyebrow:'ROUND 05 · FINAL BOARDROOM',title:'Survive the strategic bet.',brief:'Choose between expansion and optimisation. Then defend your strategy when the final disruption arrives.'}
];
const eventProfiles={
  1:[['QUALITY ALERT','A supplier batch shows elevated bacterial load. Rejecting protects quality but reduces farmer satisfaction.',{quality:8,trust:-2,cash:-2500}]],
  2:[
    ['VEHICLE 1 DOWN','One vehicle is unavailable. The second vehicle must cover the network or you must spend emergency cash.',{transport:12,cash:-5000,delivered:-180}],
    ['ROAD CLOSURE','The longest route is blocked after heavy rain. Consolidate routes or pay for an alternate vehicle.',{transport:10,cash:-4500,delivered:-150}],
    ['POWER OUTAGE','The chiller loses power for 45 minutes. Spoilage risk rises sharply.',{quality:7,cash:-3500,delivered:-120}]
  ],
  3:[
    ['FESTIVAL DEMAND SPIKE','Urban demand rises 25%, milk availability rises 18%, fuel rises 12%, and driver availability falls.',{procurement:8,transport:14,cash:-7000,delivered:-220}],
    ['FUEL SHOCK','Fuel prices jump 22% during the festival period. Speed now has a much higher cost.',{transport:10,cash:-8000,delivered:-100}],
    ['LABOUR SHORTAGE','Two collection-centre operators are absent. Processing delays threaten the evening collection.',{quality:5,transport:8,trust:-3,delivered:-140}]
  ],
  4:[
    ['CASCADE FAILURE','Vehicle breakdown + road closure + 15% quality rejection + 45-minute power outage. Emergency cash is your only buffer.',{transport:22,quality:15,cash:-12000,delivered:-420}],
    ['CHILLER FAILURE','The main chiller operates at only 55% capacity. You must prioritise milk and protect the highest-value routes.',{quality:18,cash:-10000,delivered:-350}],
    ['UNION PENALTY','A late-delivery penalty is announced. Every missed SLA litre now costs margin as well as trust.',{transport:16,trust:-5,cash:-9000,delivered:-280}]
  ],
  5:[
    ['FINAL SUPPLY SHOCK','A major farmer cluster delivers 20% less milk while urban demand remains elevated. Your strategy must absorb the mismatch.',{procurement:15,trust:-4,delivered:-300}],
    ['FINAL INFRASTRUCTURE FAILURE','A critical collection point fails during the morning cycle. Recovery capacity is limited.',{transport:20,cash:-15000,delivered:-400}],
    ['FINAL QUALITY CRISIS','A quality alert affects 18% of inbound milk just before final dispatch. Reject, blend, or protect service at a cost.',{quality:20,trust:-6,cash:-12000,delivered:-350}]
  ]
};
function go(id){document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));const target=document.getElementById(id);if(target)target.classList.add('active');window.scrollTo(0,0)}
function showJoin(){go('join')}
function showRules(){go('rules')}
function startGame(){state.round=1;state.cash=100000;state.trust=82;state.ledger=[];state.submitted=false;state.event=null;state.choices={procurement:'balanced',transport:'balanced',quality:'balanced'};state.team=(document.getElementById('teamName').value||'DAIRY TITANS').toUpperCase();state.members=document.getElementById('members').value||'4 operators';document.getElementById('teamDisplay').textContent=state.team;document.getElementById('memberDisplay').textContent=state.members;go('game');startTimer();setTimeout(autoDisruption,450);toast('Control room unlocked. A disruption may already be in motion.');}
function tab(name,button){document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));const target=document.querySelector('#tab-'+name);if(target)target.classList.add('active');document.querySelectorAll('.nav').forEach(x=>x.classList.remove('active'));if(button)button.classList.add('active')}
document.querySelectorAll('.choices').forEach(group=>group.addEventListener('click',e=>{if(e.target.tagName!=='BUTTON')return;group.querySelectorAll('button').forEach(b=>b.classList.remove('selected'));e.target.classList.add('selected');state.choices[group.dataset.group]=e.target.dataset.value;}));
const spendInput=document.getElementById('spend');if(spendInput)spendInput.addEventListener('input',e=>{state.spend=+e.target.value;document.getElementById('spendValue').textContent='₹'+state.spend.toLocaleString('en-IN')});
function triggerEvent(){
  const pool=eventProfiles[state.round]||eventProfiles[2];
  const picked=pool[Math.floor(Math.random()*pool.length)];
  state.event=picked;
  document.getElementById('eventTitle').textContent=picked[0];
  document.getElementById('eventText').textContent=picked[1];
  document.getElementById('adminEvent').textContent=picked[0];
  toast('DISRUPTION: '+picked[0]);
}
function autoDisruption(){triggerEvent();}
function submitDecision(){
  if(state.submitted){toast('Decision already locked for this round.');return}
  let base=0;
  if(state.choices.procurement==='aggressive')base+=5;
  if(state.choices.procurement==='conservative')base-=2;
  if(state.choices.transport==='speed')base+=4;
  if(state.choices.transport==='consolidate')base+=2;
  if(state.choices.quality==='strict')base+=4;
  if(state.choices.quality==='lenient')base-=3;

  const impact=state.event?state.event[2]:{};
  const responsePenalty=(impact.transport||0)+(impact.quality||0);
  const strategicBonus=base*300;
  const disruptionCost=responsePenalty*180;
  const emergencyCost=state.spend*.35;
  const profit=7000+strategicBonus-disruptionCost-emergencyCost+(state.choices.transport==='speed'&&(impact.transport||0)>8?1800:0);
  state.cash=Math.max(0,state.cash+profit);

  let trustDelta=state.choices.quality==='strict'?2:state.choices.quality==='lenient'?-1:0;
  trustDelta+=(impact.trust||0);
  if(state.spend>=15000)trustDelta+=2;
  if(state.spend<5000 && responsePenalty>=15)trustDelta-=3;
  state.trust=Math.max(0,Math.min(100,state.trust+trustDelta));

  let collected=2200+(state.choices.procurement==='aggressive'?300:state.choices.procurement==='conservative'?-150:0);
  if(state.round===3 && state.choices.procurement==='aggressive')collected+=180;
  if(state.round===5 && (impact.procurement||0)>0)collected-=180;
  collected=Math.max(1000,collected);

  let rejectionRate=state.choices.quality==='strict'?.035:state.choices.quality==='lenient'?.09:.06;
  rejectionRate+=((impact.quality||0)/1000);
  if(state.choices.quality==='strict' && responsePenalty>=15)rejectionRate-=.01;
  rejectionRate=Math.max(.02,Math.min(.20,rejectionRate));
  let rejected=Math.max(20,Math.round(collected*rejectionRate));
  let delivered=Math.min(2000,collected-rejected);
  delivered=Math.max(0,delivered-(impact.delivered||0));
  if(state.choices.transport==='speed')delivered=Math.min(collected-rejected,delivered+100);
  if(state.choices.transport==='consolidate' && (impact.transport||0)>=12)delivered=Math.max(0,delivered-80);

  state.ledger.push({round:state.round,collected,delivered,rejected,profit,event:state.event?state.event[0]:'Normal'});
  state.submitted=true;
  render();
  document.getElementById('lockBtn').style.display='none';
  document.getElementById('nextRoundBtn').style.display='block';
  clearInterval(window.tick);
  toast('Decision locked. '+(state.event?'Disruption impact calculated.':'Baseline period completed.'));
}
function nextRound(){if(!state.submitted){toast('Lock your decision before proceeding.');return}if(state.round>=5){if(state.submitted)showFinalResults();else toast('Lock your final decision to see the results.');return}state.round++;state.submitted=false;state.event=null;document.getElementById('lockBtn').style.display='block';document.getElementById('nextRoundBtn').style.display='none';document.getElementById('eventTitle').textContent='No disruption yet';document.getElementById('eventText').textContent='Submit your operating plan. The environment will respond.';render();setTimeout(autoDisruption,450);toast('Round '+String(state.round).padStart(2,'0')+' opened. Disruption incoming.');}
function render(){const r=rounds[state.round-1];document.getElementById('roundEyebrow').textContent=r.eyebrow;document.getElementById('roundTitle').textContent=r.title;document.getElementById('briefTitle').textContent='Village cooperative · Period '+state.round;document.getElementById('briefText').textContent=r.brief;document.getElementById('cash').textContent='₹'+state.cash.toLocaleString('en-IN');document.getElementById('trust').textContent=Math.round(state.trust);document.getElementById('rank').textContent=state.round===1?'—':'TOP 30%';document.getElementById('adminRound').textContent=String(state.round).padStart(2,'0');document.getElementById('adminAlive').textContent=Math.max(1,12-(state.round-1)*3);document.getElementById('ledgerRows').innerHTML=state.ledger.map(x=>'<div class="ledger-row"><span>ROUND '+x.round+'</span><span>'+x.collected.toLocaleString()+' L</span><span>'+x.delivered.toLocaleString()+' L</span><span>'+x.rejected.toLocaleString()+' L</span><span>₹'+Math.round(x.profit).toLocaleString('en-IN')+'</span></div>').join('')}
function startTimer(){let s=240;clearInterval(window.tick);document.getElementById('timer').textContent='04:00';window.tick=setInterval(()=>{s--;document.getElementById('timer').textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');if(s<=0){clearInterval(window.tick);if(!state.submitted){submitDecision();}}},1000)}

function calculateFinalPerformance(){
  const roundsDone=state.ledger.length;
  const avgProfit=roundsDone?state.ledger.reduce((s,x)=>s+x.profit,0)/roundsDone:0;
  const totalCollected=state.ledger.reduce((s,x)=>s+x.collected,0);
  const totalDelivered=state.ledger.reduce((s,x)=>s+x.delivered,0);
  const totalRejected=state.ledger.reduce((s,x)=>s+x.rejected,0);
  const rejectionRate=totalCollected?totalRejected/totalCollected:0;
  const deliveryRate=totalCollected?totalDelivered/totalCollected:0;
  const operational=Math.max(0,Math.min(100,Math.round(100-(Math.max(0,2200*roundsDone-totalDelivered)/(2200*roundsDone||1))*35)));
  const financial=Math.max(0,Math.min(100,Math.round(72+(avgProfit/7000)*20)));
  const service=Math.max(0,Math.min(100,Math.round(deliveryRate*100)));
  const quality=Math.max(0,Math.min(100,Math.round(100-rejectionRate*100*5)));
  const farmer=Math.max(0,Math.min(100,Math.round(state.trust)));
  const resilience=Math.max(0,Math.min(100,Math.round(78+(state.cash-100000)/2500+(state.trust-82)*.35)));
  const metrics=[
    ['Operational Efficiency',operational,25],
    ['Financial Performance',financial,20],
    ['Service Level',service,20],
    ['Milk Quality',quality,15],
    ['Farmer Satisfaction',farmer,10],
    ['Resilience',resilience,10]
  ];
  const cpi=Math.round(metrics.reduce((s,m)=>s+m[1]*m[2]/100,0));
  return {metrics,cpi,totalDelivered,farmer};
}
function showFinalResults(){
  const result=calculateFinalPerformance();
  document.getElementById('finalCpi').textContent=result.cpi;
  document.getElementById('finalCash').textContent='₹'+Math.round(state.cash).toLocaleString('en-IN');
  document.getElementById('finalDelivered').textContent=result.totalDelivered.toLocaleString('en-IN')+' L';
  document.getElementById('finalTrust').textContent=result.farmer;
  document.getElementById('resultsTitle').textContent=result.cpi>=85?'A strong operating finish.':result.cpi>=70?'A resilient finish under pressure.':'The system survived. The optimisation did not.';
  document.getElementById('closureTitle').textContent=result.cpi>=85?'You kept the route moving.':result.cpi>=70?'You kept the cooperative alive.':'The cooperative made it to the boardroom.';
  document.getElementById('performanceMetrics').innerHTML=result.metrics.map(m=>'<div class="perf-row"><div class="perf-name">'+m[0]+'</div><div class="perf-bar"><div class="perf-fill" style="width:'+m[1]+'%"></div></div><div class="perf-value">'+m[1]+' <span>/ 100</span></div></div>').join('');
  const names=['Supply Chain Mavericks','Dairy Titans','Route Masters','Co-op Commanders','Milk Matrix','Rural Ops United','Chill Chain','Last Mile Legends'];
  const scores=[96, result.cpi, 91, 87, 83, 79, 74, 69].filter((v,i)=>i!==1 || true);
  const board=names.map((n,i)=>({name:n,score:i===1?result.cpi:scores[i]})).sort((a,b)=>b.score-a.score);
  const currentRank=board.findIndex(x=>x.name==='Dairy Titans')+1;
  const currentName=state.team;
  const renamed=board.map(x=>x.name==='Dairy Titans'?currentName:x.name);
  document.getElementById('leaderboardRows').innerHTML=board.map((x,i)=>'<div class="leader-row '+(x.name==='Dairy Titans'?'current':'')+'"><div class="leader-rank">#'+(i+1)+'</div><div class="leader-team">'+(x.name==='Dairy Titans'?currentName:x.name)+(x.name==='Dairy Titans'?'<span class="leader-note">YOUR TEAM</span>':'')+'</div><div class="leader-score">'+x.score+' CPI</div><div class="leader-status">'+(i===0?'CHAMPION':i<3?'FINALIST':'FINISHED')+'</div></div>').join('');
  document.getElementById('rank').textContent='#'+currentRank;
  go('results');
}

function endGame(){clearInterval(window.tick);if(state.round>=5 && state.submitted){showFinalResults();}else{go('landing');toast('Simulation exited.')}}
function resetDemo(){location.reload()}
function toast(t){const el=document.getElementById('toast');el.textContent=t;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2400)}
render();