
const q=(s,r=document)=>r.querySelector(s), qa=(s,r=document)=>[...r.querySelectorAll(s)];
const menu=q('.menu'),nav=q('.navlinks');if(menu&&nav)menu.addEventListener('click',()=>nav.classList.toggle('open'));qa('.navlinks a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));
qa('[data-year]').forEach(x=>x.textContent=new Date().getFullYear());
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('show');io.unobserve(e.target)}}),{threshold:.1});qa('.reveal').forEach(x=>io.observe(x));
qa('[data-tabs]').forEach(group=>{const tabs=qa('.tab',group),panels=qa('.tab-panel',group);tabs.forEach(t=>t.addEventListener('click',()=>{tabs.forEach(x=>x.classList.remove('active'));panels.forEach(x=>x.classList.remove('active'));t.classList.add('active');q('#'+t.dataset.target,group).classList.add('active')}))});
function money(n){return '$'+Math.round(n).toLocaleString()}
const readiness=q('#readinessBtn');if(readiness)readiness.addEventListener('click',()=>{const apps=+q('#apps').value,data=+q('#data').value,gov=+q('#gov').value,team=+q('#team').value,integ=+q('#integ').value;let score=Math.round(28+data*12+gov*11+team*10+integ*9-Math.min(apps,25)*1.1);score=Math.max(24,Math.min(94,score));q('#readinessScore').textContent=score+'/100';q('#readinessBar').style.width=score+'%';q('#readinessLevel').textContent=score<50?'Foundation first':score<72?'Ready for a focused proof-of-pattern':'Ready to scale a governed platform pattern';q('#readinessOut').classList.remove('hidden')});
const roi=q('#roiBtn');if(roi)roi.addEventListener('click',()=>{const people=+q('#people').value,hours=+q('#hours').value,rate=+q('#rate').value,auto=+q('#auto').value/100,cost=+q('#cost').value;const gross=people*hours*52*rate*auto,net=gross-cost,pay=cost/(gross/12);q('#gross').textContent=money(gross);q('#net').textContent=money(net);q('#payback').textContent=(isFinite(pay)?pay.toFixed(1):'—')+' months';q('#roiOut').classList.remove('hidden')});
const blueprint=q('#blueprintBtn');if(blueprint)blueprint.addEventListener('click',()=>{const industry=q('#industry').value,goal=q('#goal').value,systems=q('#systems').value,control=q('#control').value;q('#bpTitle').textContent=industry+' Intelligence Blueprint';q('#bpSystems').textContent=systems;q('#bpModel').textContent=industry==='Utilities'?'Asset • Outage • Crew • Customer • Territory • Event':industry==='Software Vendor'?'Customer • Product • Account • Usage • Support Case • Entitlement':'Asset • Work • Event • Risk • Customer • Decision';q('#bpAI').textContent=goal+' Copilot + governed specialist agents';q('#bpGov').textContent=control;q('#blueprintOut').classList.remove('hidden')});
const agents=q('#runAgents');if(agents)agents.addEventListener('click',async()=>{const steps=qa('.step');steps.forEach(s=>s.classList.remove('done','active'));q('#agentOut').classList.add('hidden');for(const s of steps){s.classList.add('active');await new Promise(r=>setTimeout(r,600));s.classList.remove('active');s.classList.add('done')}q('#agentOut').classList.remove('hidden')});
const gate=q('#gateBtn');if(gate)gate.addEventListener('click',()=>{const risk=+q('#risk').value,sensitive=q('#sensitive').value==='yes',write=q('#write').value==='yes';let level=risk+(sensitive?2:0)+(write?2:0);const result=level>=7?'Executive approval required':level>=4?'Domain owner approval required':'Automated action permitted with audit logging';q('#gateResult').textContent=result;q('#gateReason').textContent=`Decision score ${level}/9 based on consequence, sensitive data, and write authority.`;q('#gateOut').classList.remove('hidden')});
qa('[data-question]').forEach(b=>b.addEventListener('click',()=>{q('#copilotAnswer').textContent=b.dataset.answer;q('#copilotOut').classList.remove('hidden')}));

const tower=q('[data-control-tower]');
if(tower){
  const scenarios={
    cve:{id:'INC-2048 · Production release',title:'Critical dependency exposure',risk:'87 risk',gate:'Human approval required',rationale:'Patch is verified in staging. Policy requires a release owner before production write authority is granted.',policy:'OPS-17 · Production Change Authority'},
    secret:{id:'DLP-1139 · Deployment telemetry',title:'Credential detected in deployment log',risk:'72 risk',gate:'Deployment blocked',rationale:'A high-confidence credential pattern was detected. DLP policy blocks release progression until the secret is revoked and the artifact is rebuilt.',policy:'DLP-04 · Credential Exposure Prevention'},
    evidence:{id:'ATO-0782 · Control package',title:'Evidence freshness threshold missed',risk:'48 risk',gate:'Control owner review required',rationale:'Two required artifacts are older than the approved evidence window. The agent prepared requests but cannot attest control effectiveness.',policy:'GRC-09 · Evidence Freshness Standard'}
  };
  const audit=q('[data-audit]',tower),approve=q('[data-approve]',tower);
  function resetDecision(){audit.classList.add('hidden');q('strong',audit).textContent='✓ Decision recorded';q('span',audit).textContent='Approval, evidence, policy, rationale, and timestamp added to the audit trail.';approve.textContent='Approve controlled remediation';approve.disabled=false}
  qa('[data-scenario]',tower).forEach(b=>b.addEventListener('click',()=>{
    qa('[data-scenario]',tower).forEach(x=>x.classList.remove('active'));b.classList.add('active');
    const s=scenarios[b.dataset.scenario];q('#incidentId').textContent=s.id;q('#incidentTitle').textContent=s.title;q('#riskScore').textContent=s.risk;q('#gateTitle').textContent=s.gate;q('#rationaleText').textContent=s.rationale;q('#policyText').textContent=s.policy;resetDecision()
  }));
  approve.addEventListener('click',()=>{approve.textContent='✓ Approved & audit logged';approve.disabled=true;audit.classList.remove('hidden')});
  q('[data-reject]',tower).addEventListener('click',()=>{approve.textContent='Decision routed to control owner';approve.disabled=true;audit.classList.remove('hidden');q('strong',audit).textContent='↗ Owner assignment recorded';q('span',audit).textContent='The decision, evidence, policy, and assignment were added to the audit trail.'});
  q('[data-replay]',tower).addEventListener('click',async()=>{
    resetDecision();const steps=qa('.agent-step',tower);steps.forEach(s=>s.classList.remove('active'));
    for(const step of steps){step.classList.add('active');await new Promise(r=>setTimeout(r,320));step.classList.remove('active')}
  });
}

const cmmc=q('[data-cmmc-tower]');
if(cmmc){
  const scenarios={
    fips:{id:'SC.L2-3.13.11 · Production service',title:'Container missing FIPS-validated cryptography',risk:'High finding',gate:'Human approval required',conf:'94%',evid:'7 artifacts',rationale:'The FIPS 140-3 baseline requires validated cryptographic modules for CUI in transit. Remediation swaps to a validated image; policy requires an ISSO approver before production write authority is granted.',policy:'SC.L2-3.13.11 · Cryptographic Protection',fam:'SC',famNote:'remediated',from:71,to:90},
    vuln:{id:'RA.L2-3.11.2 · Vulnerability management',title:'Authorized scan window exceeded',risk:'Medium finding',gate:'Control owner review required',conf:'88%',evid:'5 artifacts',rationale:'The authorized scan cadence lapsed on two in-scope assets. The agent generated scan requests and evidence stubs but cannot attest control effectiveness without control-owner review.',policy:'RA.L2-3.11.2 · Vulnerability Scanning',fam:'SC',famNote:'evidence pending',from:71,to:78},
    audit:{id:'AU.L2-3.3.1 · Audit records',title:'Audit log retention below policy standard',risk:'Medium finding',gate:'Human approval required',conf:'91%',evid:'6 artifacts',rationale:'Log retention on one boundary dropped below the 90-day standard. Remediation restores retention and backfills evidence; approval is required to change logging configuration in production.',policy:'AU.L2-3.3.1 · Event Logging',fam:'SC',famNote:'held',from:71,to:71}
  };
  const audit=q('[data-audit]',cmmc),approve=q('[data-approve]',cmmc);
  const scBar=q('#scBar'),scVal=q('#scVal'),scNote=q('#scNote'),ready=q('#cmmcReady'),met=q('#cmmcMet'),findings=q('#cmmcFindings');
  let active='fips';
  function resetDecision(){audit.classList.add('hidden');q('strong',audit).textContent='✓ Evidence captured';q('span',audit).textContent='Approver, policy, control objective, rationale, timestamp, and SPRS impact added to the assessment package.';approve.textContent='Approve controlled remediation';approve.disabled=false}
  qa('[data-scenario]',cmmc).forEach(b=>b.addEventListener('click',()=>{
    qa('[data-scenario]',cmmc).forEach(x=>x.classList.remove('active'));b.classList.add('active');active=b.dataset.scenario;
    const s=scenarios[active];q('#incidentId').textContent=s.id;q('#incidentTitle').textContent=s.title;q('#riskScore').textContent=s.risk;q('#gateTitle').textContent=s.gate;q('#mConf').textContent=s.conf;q('#mEvid').textContent=s.evid;q('#rationaleText').textContent=s.rationale;q('#policyText').textContent=s.policy;resetDecision()
  }));
  approve.addEventListener('click',()=>{
    approve.textContent='✓ Approved & evidence logged';approve.disabled=true;audit.classList.remove('hidden');
    const s=scenarios[active];
    if(s.to>s.from){scBar.style.width=s.to+'%';scVal.textContent=s.to;scNote.textContent=s.famNote;}
    ready.textContent='84%';met.textContent='100 / 110';findings.textContent='2';
  });
  q('[data-reject]',cmmc).addEventListener('click',()=>{approve.textContent='Deferred · routed to control owner';approve.disabled=true;audit.classList.remove('hidden');q('strong',audit).textContent='↗ Owner assignment recorded';q('span',audit).textContent='The decision, evidence, practice, and owner assignment were added to the assessment package and POA&M.'});
  q('[data-replay]',cmmc).addEventListener('click',async()=>{
    resetDecision();const steps=qa('.agent-step',cmmc);steps.forEach(x=>x.classList.remove('active'));
    for(const step of steps){step.classList.add('active');await new Promise(r=>setTimeout(r,320));step.classList.remove('active')}
  });
}
