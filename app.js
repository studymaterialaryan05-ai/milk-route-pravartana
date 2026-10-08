const CONFIG={SUPABASE_URL:'https://vxmlokpiihemptqsoptx.supabase.co',SUPABASE_KEY:'sb_publishable_FRHN8PgBm93xcgA4eM8EHw_iu48QLEr'};
const isLive=()=>CONFIG.SUPABASE_URL.startsWith('https://')&&!CONFIG.SUPABASE_URL.includes('YOUR_')&&CONFIG.SUPABASE_KEY&&!CONFIG.SUPABASE_KEY.includes('YOUR_')&&window.supabase;
const state={round:1,team:'DAIRY TITANS',members:'4 operators',cash:100000,trust:82,rank:'—',spend:5000,submitted:false,event:null,ledger:[],choices:{procurement:'balanced',transport:'balanced',quality:'balanced'},sessionId:null,teamId:null,sessionCode:'',role:'player',finalCpi:0};
let db=null,sessionChannel=null,teamsChannel=null;
const rounds=[
 {eyebrow:'ROUND 01 · STABLE OPERATIONS',title:'The morning milk run.',brief:'200 farmers supply milk through two collection centres. Chilling capacity is constrained. Your union rewards reliable delivery and penalises rejection and delay.'},
 {eyebrow:'ROUND 02 · FIRST DISRUPTION',title:'The route just broke.',brief:'Your baseline plan is in place. Now the network will react. Protect service without destroying your cash position.'},
 {eyebrow:'ROUND 03 · FESTIVAL SURGE',title:'Demand is moving faster.',brief:'Urban demand jumps 25%. Farmer supply rises 18%. Fuel and transport become more expensive while labour availability tightens.'},
 {eyebrow:'ROUND 04 · CRISIS MANAGEMENT',title:'Everything fails at once.',brief:'Vehicle, road, electricity and quality problems hit the cooperative in one operating window. Your emergency cash is finite.'},
 {eyebrow:'ROUND 05 · FINAL BOARDROOM',title:'Survive the strategic bet.',brief:'Choose between expansion and optimisation. Then defend your strategy when the final disruption arrives.'}
];
const eventProfiles={
1:[['QUALITY ALERT','A supplier batch shows elevated bacterial load. Rejecting protects quality but reduces farmer satisfaction.',{quality:8,trust:-2,cash:-2500}]],
2:[['VEHICLE 1 DOWN','One vehicle is unavailable. The second vehicle must cover the network or you must spend emergency cash.',{transport:12,cash:-5000,delivered:-180}],['ROAD CLOSURE','The longest route is blocked after heavy rain. Consolidate routes or pay for an alternate vehicle.',{transport:10,cash:-4500,delivered:-150}],['POWER OUTAGE','The chiller loses power for 45 minutes. Spoilage risk rises sharply.',{quality:7,cash:-3500,delivered:-120}]],
3:[['FESTIVAL DEMAND SPIKE','Urban demand rises 25%, milk availability rises 18%, fuel rises 12%, and driver availability falls.',{procurement:8,transport:14,cash:-7000,delivered:-220}],['FUEL SHOCK','Fuel prices jump 22% during the festival period. Speed now has a much higher cost.',{transport:10,cash:-8000,delivered:-100}],['LABOUR SHORTAGE','Two collection-centre operators are absent. Processing delays threaten the evening collection.',{quality:5,transport:8,trust:-3,delivered:-140}]],
4:[['CASCADE FAILURE','Vehicle breakdown + road closure + 15% quality rejection + 45-minute power outage. Emergency cash is your only buffer.',{transport:22,quality:15,cash:-12000,delivered:-420}],['CHILLER FAILURE','The main chiller operates at only 55% capacity. You must prioritise milk and protect the highest-value routes.',{quality:18,cash:-10000,delivered:-350}],['UNION PENALTY','A late-delivery penalty is announced. Every missed SLA litre now costs margin as well as trust.',{transport:16,trust:-5,cash:-9000,delivered:-280}]],
5:[['FINAL SUPPLY SHOCK','A major farmer cluster delivers 20% less milk while urban demand remains elevated. Your strategy must absorb the mismatch.',{procurement:15,trust:-4,delivered:-300}],['FINAL INFRASTRUCTURE FAILURE','A critical collection point fails during the morning cycle. Recovery capacity is limited.',{transport:20,cash:-15000,delivered:-400}],['FINAL QUALITY CRISIS','A quality alert affects 18% of inbound milk just before final dispatch. Reject, blend, or protect service at a cost.',{quality:20,trust:-6,cash:-12000,delivered:-350}]]
};
function liveReady(){return isLive()&&db}
function go(id){document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));const target=document.getElementById(id);if(target)target.classList.add('active');window.scrollTo(0,0)}
function showJoin(){go('join')}
function showRules(){go('rules')}
function showAdmin(){go('admin')}
function setLiveStatus(){const label=document.getElementById('modeLabel');if(label)label.textContent=liveReady()?'LIVE MULTIPLAYER':'DEMO MODE'}
async function initLive(){
 if(!isLive()){setLiveStatus();return}
 db=window.supabase.createClient(CONFIG.SUPABASE_URL,CONFIG.SUPABASE_KEY);
 setLiveStatus();
}
async function joinLiveRoom(){
 if(!liveReady())return false;
 const code=(document.getElementById('gameCode').value||'').trim().toUpperCase();
 const {data,error}=await db.from('game_sessions').select('*').eq('code',code).maybeSingle();
 if(error||!data){toast('Live room not found. Ask the organiser for the active game code.');return false}
 if(data.status==='finished'){toast('This room is already finished.');return false}
 state.sessionId=data.id;state.sessionCode=data.code;state.round=data.round;state.event=data.event;
 state.cash=100000;state.trust=82;state.submitted=false;state.ledger=[];state.team=(document.getElementById('teamName').value||'DAIRY TITANS').toUpperCase();state.members=document.getElementById('members').value||'4 operators';
 const existing=await db.from('teams').select('*').eq('session_id',data.id).eq('name',state.team).maybeSingle();
 if(existing.data){state.teamId=existing.data.id;state.cash=Number(existing.data.cash);state.trust=Number(existing.data.trust);state.submitted=Boolean(existing.data.decisions?.[String(state.round)]?.submitted);state.ledger=existing.data.decisions?.ledger||[]}
 else{const ins=await db.from('teams').insert({session_id:data.id,name:state.team,members:state.members}).select().single();if(ins.error){toast('Could not register team: '+ins.error.message);return false}state.teamId=ins.data.id}
 subscribeLive();
 return true
}
function subscribeLive(){
 if(!liveReady()||!state.sessionId)return;
 if(sessionChannel)db.removeChannel(sessionChannel);if(teamsChannel)db.removeChannel(teamsChannel);
 sessionChannel=db.channel('session-'+state.sessionId).on('postgres_changes',{event:'*',schema:'public',table:'game_sessions',filter:'id=eq.'+state.sessionId},payload=>handleSession(payload.new)).subscribe();
 teamsChannel=db.channel('teams-'+state.sessionId).on('postgres_changes',{event:'*',schema:'public',table:'teams',filter:'session_id=eq.'+state.sessionId},()=>refreshLeaderboard()).subscribe();
 refreshLeaderboard();
}
function handleSession(row){
 if(!row)return;
 const previous=state.round;state.round=row.round;state.event=row.event;
 if(previous!==state.round){state.submitted=false;document.getElementById('lockBtn').style.display='block';document.getElementById('nextRoundBtn').style.display='none';startTimer();toast('Organiser opened Round '+String(state.round).padStart(2,'0'))}
 if(row.status==='finished'){showFinalResults()}
 renderEvent();render()
}
async function refreshLeaderboard(){
 if(!liveReady()||!state.sessionId)return;
 const {data}=await db.from('teams').select('id,name,score,alive').eq('session_id',state.sessionId).order('score',{ascending:false});
 if(!data)return;
 const me=data.find(x=>x.id===state.teamId);if(me){state.rank='#'+(data.findIndex(x=>x.id===state.teamId)+1);document.getElementById('rank').textContent=state.rank}
 const el=document.getElementById('leaderboardRows');if(el&&data.length)el.innerHTML=data.map((x,i)=>'<div class="leader-row '+(x.id===state.teamId?'current':'')+'"><div class="leader-rank">#'+(i+1)+'</div><div class="leader-team">'+x.name+(x.id===state.teamId?'<span class="leader-note">YOUR TEAM</span>':'')+'</div><div class="leader-score">'+Math.round(Number(x.score||0))+' CPI</div><div class="leader-status">'+(i===0?'LEADING':x.alive?'ACTIVE':'ELIMINATED')+'</div></div>').join('');
}
function renderEvent(){const title=document.getElementById('eventTitle'),text=document.getElementById('eventText');if(title)title.textContent=state.event?state.event[0]:'Waiting for organiser';if(text)text.textContent=state.event?state.event[1]:'The organiser controls the live disruption. Stand by.';const a=document.getElementById('adminEvent');if(a)a.textContent=state.event?state.event[0]:'STANDBY'}
function showLiveWaiting(){document.getElementById('lockBtn').style.display='none';document.getElementById('nextRoundBtn').style.display='none';toast('Decision locked. Waiting for the organiser to advance the room.')}
async function startGame(){
 state.round=1;state.cash=100000;state.trust=82;state.ledger=[];state.submitted=false;state.event=null;state.choices={procurement:'balanced',transport:'balanced',quality:'balanced'};state.spend=5000;
 if(liveReady()){if(!(await joinLiveRoom()))return}else{state.team=(document.getElementById('teamName').value||'DAIRY TITANS').toUpperCase();state.members=document.getElementById('members').value||'4 operators';setTimeout(autoDisruption,450)}
 document.getElementById('teamDisplay').textContent=state.team;document.getElementById('memberDisplay').textContent=state.members;go('game');renderEvent();render();startTimer();toast(liveReady()?'Connected to live room.':'Demo mode. Configure Supabase for multiplayer.')}
function tab(name,button){document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));const target=document.querySelector('#tab-'+name);if(target)target.classList.add('active');document.querySelectorAll('.nav').forEach(x=>x.classList.remove('active'));if(button)button.classList.add('active')}
document.querySelectorAll('.choices').forEach(group=>group.addEventListener('click',e=>{if(e.target.tagName!=='BUTTON'||state.submitted)return;group.querySelectorAll('button').forEach(b=>b.classList.remove('selected'));e.target.classList.add('selected');state.choices[group.dataset.group]=e.target.dataset.value;}));
const spendInput=document.getElementById('spend');if(spendInput)spendInput.addEventListener('input',e=>{state.spend=+e.target.value;document.getElementById('spendValue').textContent='₹'+state.spend.toLocaleString('en-IN')});
function pickEvent(){const pool=eventProfiles[state.round]||eventProfiles[2];return pool[Math.floor(Math.random()*pool.length)]}
async function triggerEvent(){
 const picked=pickEvent();state.event=picked;renderEvent();
 if(liveReady()&&state.sessionId){const {error}=await db.from('game_sessions').update({event:picked}).eq('id',state.sessionId);if(error)toast('Event sync failed: '+error.message);else toast('LIVE DISRUPTION: '+picked[0])}else toast('DISRUPTION: '+picked[0]);
}
function autoDisruption(){if(!liveReady())triggerEvent()}
function calculateDecision(){
 let base=0;if(state.choices.procurement==='aggressive')base+=5;if(state.choices.procurement==='conservative')base-=2;if(state.choices.transport==='speed')base+=4;if(state.choices.transport==='consolidate')base+=2;if(state.choices.quality==='strict')base+=4;if(state.choices.quality==='lenient')base-=3;
 const impact=state.event?state.event[2]:{};const responsePenalty=(impact.transport||0)+(impact.quality||0);const strategicBonus=base*300;const disruptionCost=responsePenalty*180;const emergencyCost=state.spend*.35;const profit=7000+strategicBonus-disruptionCost-emergencyCost+(state.choices.transport==='speed'&&(impact.transport||0)>8?1800:0);
 state.cash=Math.max(0,state.cash+profit);
 let trustDelta=state.choices.quality==='strict'?2:state.choices.quality==='lenient'?-1:0;trustDelta+=(impact.trust||0);if(state.spend>=15000)trustDelta+=2;if(state.spend<5000&&responsePenalty>=15)trustDelta-=3;state.trust=Math.max(0,Math.min(100,state.trust+trustDelta));
 let collected=2200+(state.choices.procurement==='aggressive'?300:state.choices.procurement==='conservative'?-150:0);if(state.round===3&&state.choices.procurement==='aggressive')collected+=180;if(state.round===5&&(impact.procurement||0)>0)collected-=180;collected=Math.max(1000,collected);
 let rejectionRate=state.choices.quality==='strict'?.035:state.choices.quality==='lenient'?.09:.06;rejectionRate+=(impact.quality||0)/1000;if(state.choices.quality==='strict'&&responsePenalty>=15)rejectionRate-=.01;rejectionRate=Math.max(.02,Math.min(.20,rejectionRate));
 let rejected=Math.max(20,Math.round(collected*rejectionRate));let delivered=Math.min(2000,collected-rejected);delivered=Math.max(0,delivered-(impact.delivered||0));if(state.choices.transport==='speed')delivered=Math.min(collected-rejected,delivered+100);if(state.choices.transport==='consolidate'&&(impact.transport||0)>=12)delivered=Math.max(0,delivered-80);
 return {round:state.round,collected,delivered,rejected,profit,event:state.event?state.event[0]:'Normal'}
}
async function submitDecision(){
 if(state.submitted){toast('Decision already locked for this round.');return}
 const row=calculateDecision();state.ledger.push(row);state.submitted=true;
 const cumulativeProfit=state.ledger.reduce((s,x)=>s+x.profit,0);const roundScore=Math.max(0,Math.min(100,70+row.profit/500+state.trust*.12-row.rejected/30));const score=state.round===5?calculateFinalPerformance().cpi:Math.round((cumulativeProfit/350*1)+roundScore);
 render();clearInterval(window.tick);
 if(liveReady()&&state.teamId){const decisions={...(await getTeamDecisions()),[String(state.round)]:{...row,submitted:true,choices:state.choices,spend:state.spend},ledger:state.ledger};const {error}=await db.from('teams').update({cash:state.cash,trust:state.trust,score:Math.max(0,Math.min(100,score)),decisions}).eq('id',state.teamId);if(error){state.submitted=false;toast('Could not lock decision: '+error.message);return}showLiveWaiting();await refreshLeaderboard()}else{document.getElementById('lockBtn').style.display='none';document.getElementById('nextRoundBtn').style.display='block';toast('Decision locked. '+(state.event?'Disruption impact calculated.':'Baseline period completed.'))}
}
async function getTeamDecisions(){if(!liveReady()||!state.teamId)return {};const {data}=await db.from('teams').select('decisions').eq('id',state.teamId).single();return data?.decisions||{}}
async function nextRound(){if(liveReady()){if(state.role!=='admin'){toast('The organiser controls the shared round. Wait for the next round.');return}return advanceLiveRound()}if(!state.submitted){toast('Lock your decision before proceeding.');return}if(state.round>=5){showFinalResults();return}state.round++;state.submitted=false;state.event=null;document.getElementById('lockBtn').style.display='block';document.getElementById('nextRoundBtn').style.display='none';renderEvent();render();setTimeout(autoDisruption,450);toast('Round '+String(state.round).padStart(2,'0')+' opened.')}
async function advanceLiveRound(){
 if(!liveReady()||!state.sessionId)return;
 if(state.round>=5){await db.from('game_sessions').update({status:'finished'}).eq('id',state.sessionId);showFinalResults();return}
 const next=state.round+1;const pool=eventProfiles[next];const picked=pool[Math.floor(Math.random()*pool.length)];
 const {error}=await db.from('game_sessions').update({round:next,event:picked,status:'live'}).eq('id',state.sessionId);if(error)toast('Could not advance: '+error.message);else toast('Room advanced to Round '+String(next).padStart(2,'0'));
}
function render(){const r=rounds[state.round-1]||rounds[0];document.getElementById('roundEyebrow').textContent=r.eyebrow;document.getElementById('roundTitle').textContent=r.title;document.getElementById('briefTitle').textContent='Village cooperative · Period '+state.round;document.getElementById('briefText').textContent=r.brief;document.getElementById('cash').textContent='₹'+Math.round(state.cash).toLocaleString('en-IN');document.getElementById('trust').textContent=Math.round(state.trust);document.getElementById('rank').textContent=state.rank||'—';document.getElementById('adminRound').textContent=String(state.round).padStart(2,'0');document.getElementById('ledgerRows').innerHTML=state.ledger.map(x=>'<div class="ledger-row"><span>ROUND '+x.round+'</span><span>'+x.collected.toLocaleString()+' L</span><span>'+x.delivered.toLocaleString()+' L</span><span>'+x.rejected.toLocaleString()+' L</span><span>₹'+Math.round(x.profit).toLocaleString('en-IN')+'</span></div>').join('')}
function startTimer(){let s=240;clearInterval(window.tick);document.getElementById('timer').textContent='04:00';window.tick=setInterval(()=>{s--;document.getElementById('timer').textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');if(s<=0){clearInterval(window.tick);if(!state.submitted)submitDecision()}},1000)}
function calculateFinalPerformance(){const roundsDone=state.ledger.length;const avgProfit=roundsDone?state.ledger.reduce((s,x)=>s+x.profit,0)/roundsDone:0;const totalCollected=state.ledger.reduce((s,x)=>s+x.collected,0);const totalDelivered=state.ledger.reduce((s,x)=>s+x.delivered,0);const totalRejected=state.ledger.reduce((s,x)=>s+x.rejected,0);const rejectionRate=totalCollected?totalRejected/totalCollected:0;const deliveryRate=totalCollected?totalDelivered/totalCollected:0;const operational=Math.max(0,Math.min(100,Math.round(100-(Math.max(0,2200*roundsDone-totalDelivered)/(2200*roundsDone||1))*35)));const financial=Math.max(0,Math.min(100,Math.round(72+(avgProfit/7000)*20)));const service=Math.max(0,Math.min(100,Math.round(deliveryRate*100)));const quality=Math.max(0,Math.min(100,Math.round(100-rejectionRate*100*5)));const farmer=Math.max(0,Math.min(100,Math.round(state.trust)));const resilience=Math.max(0,Math.min(100,Math.round(78+(state.cash-100000)/2500+(state.trust-82)*.35)));const metrics=[['Operational Efficiency',operational,25],['Financial Performance',financial,20],['Service Level',service,20],['Milk Quality',quality,15],['Farmer Satisfaction',farmer,10],['Resilience',resilience,10]];const cpi=Math.round(metrics.reduce((s,m)=>s+m[1]*m[2]/100,0));return{metrics,cpi,totalDelivered,farmer}}
async function showFinalResults(){const result=calculateFinalPerformance();state.finalCpi=result.cpi;document.getElementById('finalCpi').textContent=result.cpi;document.getElementById('finalCash').textContent='₹'+Math.round(state.cash).toLocaleString('en-IN');document.getElementById('finalDelivered').textContent=result.totalDelivered.toLocaleString('en-IN')+' L';document.getElementById('finalTrust').textContent=result.farmer;document.getElementById('resultsTitle').textContent=result.cpi>=85?'A strong operating finish.':result.cpi>=70?'A resilient finish under pressure.':'The system survived. The optimisation did not.';document.getElementById('closureTitle').textContent=result.cpi>=85?'You kept the route moving.':result.cpi>=70?'You kept the cooperative alive.':'The cooperative made it to the boardroom.';document.getElementById('performanceMetrics').innerHTML=result.metrics.map(m=>'<div class="perf-row"><div class="perf-name">'+m[0]+'</div><div class="perf-bar"><div class="perf-fill" style="width:'+m[1]+'%"></div></div><div class="perf-value">'+m[1]+' <span>/ 100</span></div></div>').join('');await refreshLeaderboard();go('results')}
async function createLiveRoom(){
 if(!liveReady()){toast('Configure Supabase URL and publishable key in app.js first.');return}
 const code=(document.getElementById('adminCode').value||'PRAV-OPS').trim().toUpperCase();
 const {data,error}=await db.from('game_sessions').insert({code,round:1,status:'live',event:pickEvent(),settings:{competition:'Milk Route'}}).select().single();
 if(error){toast('Could not create room: '+error.message);return}
 state.sessionId=data.id;state.sessionCode=code;state.round=1;state.event=data.event;state.role='admin';subscribeLive();renderEvent();render();toast('LIVE ROOM '+code+' CREATED');document.getElementById('adminRoomCode').textContent=code;go('admin')
}
async function connectAdmin(){
 if(!liveReady()){toast('Configure Supabase first.');return}
 const code=(document.getElementById('adminCode').value||'PRAV-OPS').trim().toUpperCase();const {data,error}=await db.from('game_sessions').select('*').eq('code',code).maybeSingle();if(error||!data){toast('Room not found. Create it first.');return}
 state.sessionId=data.id;state.sessionCode=code;state.round=data.round;state.event=data.event;state.role='admin';subscribeLive();renderEvent();render();document.getElementById('adminRoomCode').textContent=code;go('admin')
}
function endGame(){clearInterval(window.tick);if(state.round>=5&&state.submitted)showFinalResults();else{go('landing');toast('Simulation exited.')}}
function resetDemo(){location.reload()}
function toast(t){const el=document.getElementById('toast');if(!el)return;el.textContent=t;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2400)}
initLive();render();