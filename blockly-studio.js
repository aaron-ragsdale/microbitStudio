/* Studio visual programming runtime. Blockly 11, browser execution. */
(function(){
const $s=id=>document.getElementById(id);
if(!window.Blockly){$s('blockStatus').textContent='Blockly could not load. Check your internet connection.';return}
const B=window.Blockly;
const styles={basic:'#1687dc',input:'#d92d80',pins:'#a46123',sensor:'#8053d4',display:'#7245ca',studio:'#f05a13',timer:'#008c91',logic:'#159d75',loop:'#159cba',math:'#4169d5',variable:'#df315b',text:'#9857bf'};
const blockStyles={};for(const [k,v] of Object.entries(styles))blockStyles[k+'_blocks']={colourPrimary:v};
const theme=B.Theme.defineTheme('studioMotion',{base:B.Themes.Classic,blockStyles,categoryStyles:Object.fromEntries(Object.entries(styles).map(([k,v])=>[k+'_category',{colour:v}])),componentStyles:{workspaceBackgroundColour:'#f4f5f7',toolboxBackgroundColour:'#fff',toolboxForegroundColour:'#20252a',flyoutBackgroundColour:'#e9edf2',flyoutForegroundColour:'#20252a',flyoutOpacity:1,scrollbarColour:'#a3aab0',insertionMarkerColour:'#ff500d',insertionMarkerOpacity:0.5},fontStyle:{family:'Arial, sans-serif',weight:'600',size:15},startHats:true});
const pinOptions=[0,1,2,8,12,13,14,15,16].map(n=>['P'+n,''+n]),analogOptions=pinOptions.slice(0,3);
const field=(name,options)=>({type:'field_dropdown',name,options}),num=name=>({type:'input_value',name,check:'Number'}),str=name=>({type:'input_value',name}),statement=name=>({type:'input_statement',name});
function def(type,message0,args0,style,extra={}){return{type,message0,args0,style:style+'_blocks',...extra}}
const stmt={previousStatement:null,nextStatement:null},hat={nextStatement:null},out={output:'Number'};
B.defineBlocksWithJsonArray([
def('ms_start','on start',[],'basic',hat),
def('ms_forever','forever %1',[statement('DO')],'basic',hat),
def('ms_pause','pause %1 ms',[num('MS')],'basic',stmt),
def('ms_button','on button %1 pressed %2',[field('BUTTON',[['A','buttonA'],['B','buttonB'],['shake','shake']]),statement('DO')],'input',{}),
def('ms_sensor','read %1',[field('SENSOR',[['acceleration X','ax'],['acceleration Y','ay'],['acceleration Z','az'],['acceleration strength','strength'],['temperature','temperature'],['light level','light'],['sound level','sound'],['button A held','aPressed'],['button B held','bPressed']])],'input',out),
def('ms_dread','digital read pin %1',[field('PIN',pinOptions)],'pins',out),
def('ms_aread','analog read pin %1',[field('PIN',analogOptions)],'pins',out),
def('ms_dwrite','digital write pin %1 to %2',[field('PIN',pinOptions),num('VALUE')],'pins',stmt),
def('ms_pwm','analog write pin %1 to %2',[field('PIN',analogOptions),num('VALUE')],'pins',stmt),
def('ms_servo','servo pin %1 angle %2',[field('PIN',analogOptions),num('VALUE')],'pins',stmt),
def('ms_pull','set pin %1 pull %2',[field('PIN',pinOptions),field('PULL',[['none','0'],['up','1'],['down','2']])],'pins',stmt),
def('ms_ultra','ultrasonic cm · trig %1 echo %2',[field('TRIG',pinOptions),field('ECHO',pinOptions)],'sensor',out),
def('ms_gate','configure timing gate · start %1 stop %2',[field('TRIG',pinOptions),field('ECHO',pinOptions)],'sensor',stmt),
def('ms_gate_read','last gate time (ms)',[],'sensor',out),
def('ms_number','show number %1',[num('VALUE')],'display',stmt),
def('ms_clear','clear physical LED display',[],'display',stmt),
def('ms_pixel','%1 pixel x %2 y %3',[field('OP',[['plot','PLOT'],['unplot','UNPLOT']]),num('X'),num('Y')],'display',stmt),
def('ms_dashboard','display variable %1 as %2',[{type:'field_variable',name:'VAR',variable:'score'},field('KIND',[['number','Number'],['graph','Graph'],['timer (ms)','Timer (ms)'],['status','Status']])],'studio',stmt),
def('ms_dash_button','on dashboard button %1 %2',[{type:'field_input',name:'LABEL',text:'Reset'},statement('DO')],'studio',{}),
def('ms_device','use device %1',[{type:'field_number',name:'DEVICE',value:1,min:1,max:32,precision:1}],'studio',stmt),
def('ms_timer','%1 dashboard timer',[field('ACTION',[['start','start'],['stop','stop'],['reset','reset']])],'timer',stmt),
def('ms_elapsed','dashboard elapsed time (ms)',[],'timer',out)
]);
const shadow=(type,value)=>({shadow:{type,fields:{NUM:value}}});
const block=(type,inputs)=>({kind:'block',type,...(inputs?{inputs}:{})});
const cat=(name,key,contents)=>({kind:'category',name,categorystyle:key+'_category',contents});
const toolbox={kind:'categoryToolbox',contents:[
cat('Basic','basic',[block('ms_start'),block('ms_forever'),block('ms_pause',{MS:shadow('math_number',100)})]),
cat('Input','input',[block('ms_button'),block('ms_sensor')]),
cat('LED','display',[block('ms_number',{VALUE:shadow('math_number',0)}),block('ms_clear'),block('ms_pixel',{X:shadow('math_number',2),Y:shadow('math_number',2)})]),
cat('Pins','pins',[block('ms_dread'),block('ms_aread'),block('ms_dwrite',{VALUE:shadow('math_number',1)}),block('ms_pwm',{VALUE:shadow('math_number',512)}),block('ms_servo',{VALUE:shadow('math_number',90)}),block('ms_pull')]),
cat('Sensors','sensor',[block('ms_ultra'),block('ms_gate'),block('ms_gate_read')]),
cat('Loops','loop',[block('controls_repeat_ext',{TIMES:shadow('math_number',10)}),block('controls_whileUntil')]),
cat('Logic','logic',['controls_if','logic_compare','logic_operation','logic_negate','logic_boolean'].map(x=>block(x))),
{kind:'category',name:'Variables',categorystyle:'variable_category',custom:'VARIABLE'},
cat('Math','math',['math_number','math_arithmetic','math_single','math_random_int','math_modulo'].map(x=>block(x))),
cat('Text','text',['text','text_join'].map(x=>block(x))),
{kind:'sep'},cat('Dashboard','studio',[block('ms_dashboard'),block('ms_dash_button'),block('ms_device')]),cat('Timing','timer',[block('ms_timer'),block('ms_elapsed')])
]};
const ws=B.inject('blockWorkspace',{toolbox,theme,renderer:'zelos',grid:{spacing:24,length:2,colour:'#d0d5db',snap:true},zoom:{controls:true,wheel:true,startScale:1.05,minScale:0.45,maxScale:2,scaleSpeed:1.15},trashcan:true,move:{scrollbars:true,drag:true,wheel:true}});
const notice=s=>$s('blockStatus').textContent=s;
let run=null,variables=new Map(),active=false,deviceSlot=1,buttons=new Map();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function liveDevices(){return [...devices.values()].filter(d=>d.connected)}
async function configureDevice(token){assertRun(token);let d=selected();if(!d||token.used.has(d.id))return;if(d.type==='Demo'){token.used.add(d.id);return}if(d.firmware!=='studio-v3')throw Error('Flash Studio v3 firmware and reconnect before running');token.used.add(d.id);if(!await send('STOP_ALL',d.id))throw Error('Unable to initialize device');for(let key of new Set(token.events.map(b=>b.getFieldValue('BUTTON')))){assertRun(token);if(!await send('EVENT,'+key+',1',d.id))throw Error('Unable to enable '+key)}assertRun(token)}
function selected(){return run?.deviceId?devices.get(run.deviceId)?.connected?devices.get(run.deviceId):undefined:liveDevices()[deviceSlot-1]}
function varID(b){return b.getFieldValue('VAR')}
function varName(id){return ws.getVariableById(id)?.name||id}
function fieldValue(b,k){return b.getFieldValue(k)}
function child(b,k){return b.getInputTargetBlock(k)}
function getVal(key){let d=selected();return d?values.get(d.id+'.'+key):undefined}
function publish(id,v){variables.set(id,v);put('program.'+varName(id),v);render()}
function assertRun(token){if(run!==token||!active)throw Error('Stopped')}
async function hw(command,key,token){assertRun(token);let d=selected();if(!d)throw Error('Connect a device or add Demo first');if(d.type==='Demo'){let a=command.split(',');if(a[0]==='DREAD'||a[0]==='AREAD'||a[0]==='ULTRA'){let value=a[0]==='DREAD'?d.count%2:a[0]==='AREAD'?d.count%1024:40+20*Math.sin(d.count/5);putDevice(d,key,value);render();return value}if(a[0]==='PLOT'||a[0]==='UNPLOT'||a[0]==='CLEAR'){let p=(d.demoLED||'0'.repeat(25)).split('');if(a[0]==='CLEAR')p.fill('0');else p[Number(a[2])*5+Number(a[1])]=a[0]==='PLOT'?'1':'0';d.demoLED=p.join('');putDevice(d,'led',d.demoLED);render()}return 0}let previous=token.sampleSeq;let ok=await send(command,d.id);if(!ok)throw Error('Device command failed: '+command);if(!key)return 0;for(let i=0;i<100;i++){assertRun(token);let v=token.responses.get(d.id+'.'+key);if(v&&v.seq>previous)return v.value;await sleep(20)}throw Error('No response for '+key+'; verify universal firmware')}
async function val(b,token){assertRun(token);if(!b)return 0;let f=k=>fieldValue(b,k),v=k=>val(child(b,k),token);switch(b.type){
case 'math_number':return Number(f('NUM'));case 'text':return f('TEXT');case 'variables_get':return variables.get(varID(b))??0;
case 'logic_boolean':return f('BOOL')==='TRUE';case 'logic_negate':return !await v('BOOL');
case 'logic_compare':{let a=await v('A'),c=await v('B');return ({EQ:a===c,NEQ:a!==c,LT:a<c,LTE:a<=c,GT:a>c,GTE:a>=c})[f('OP')]}
case 'logic_operation':{let a=await v('A');return f('OP')==='AND'?a&&await v('B'):a||await v('B')}
case 'math_arithmetic':{let a=Number(await v('A')),c=Number(await v('B'));return ({ADD:a+c,MINUS:a-c,MULTIPLY:a*c,DIVIDE:a/c,POWER:a**c})[f('OP')]}
case 'math_single':{let n=Number(await v('NUM'));return ({ROOT:Math.sqrt(n),ABS:Math.abs(n),NEG:-n,LN:Math.log(n),LOG10:Math.log10(n),EXP:Math.exp(n),POW10:10**n})[f('OP')]}
case 'math_random_int':{let a=Number(await v('FROM')),c=Number(await v('TO'));return Math.floor(Math.random()*(Math.abs(c-a)+1))+Math.min(a,c)}
case 'math_modulo':return Number(await v('DIVIDEND'))%Number(await v('DIVISOR'));
case 'text_join':{let s='';for(let i=0;i<b.itemCount_;i++)s+=String(await v('ADD'+i));return s}
case 'ms_sensor':{let key=f('SENSOR'),d=selected();if(!d)throw Error('Connect a device first');if(d.type==='Demo'){let mock={ax:0,ay:0,az:1024,strength:1024,temperature:22,light:120,sound:40,aPressed:0,bPressed:0};return getVal(key)??mock[key]}if(d.firmware==='studio-v3')return hw('READ,'+key,key,token);throw Error('Flash Studio v3 firmware for on-demand sensors')}
case 'ms_dread':return hw('DREAD,'+f('PIN'),'digital'+f('PIN'),token);
case 'ms_aread':return hw('AREAD,'+f('PIN'),'analog'+f('PIN'),token);
case 'ms_ultra':if(f('TRIG')===f('ECHO'))throw Error('Choose distinct ultrasonic pins');return hw('ULTRA,'+f('TRIG')+','+f('ECHO'),'distance'+f('TRIG')+'_'+f('ECHO'),token);
case 'ms_gate_read':return getVal('gate_ms')??0;
case 'ms_elapsed':return elapsed();
default:throw Error('Unsupported expression: '+b.type)}}
async function chain(b,token){for(;b;b=b.getNextBlock()){assertRun(token);let f=k=>fieldValue(b,k),v=k=>val(child(b,k),token);switch(b.type){
case 'ms_start':break;case 'ms_pause':await sleep(Math.max(0,Math.min(60000,Number(await v('MS'))||0)));break;
case 'variables_set':publish(varID(b),await v('VALUE'));break;
case 'math_change':publish(varID(b),Number(variables.get(varID(b))||0)+Number(await v('DELTA')));break;
case 'controls_if':{let handled=false;for(let i=0;i<=b.elseifCount_;i++)if(await v('IF'+i)){await chain(child(b,'DO'+i),token);handled=true;break}if(!handled&&b.elseCount_)await chain(child(b,'ELSE'),token);break}
case 'controls_repeat_ext':{let n=Math.min(100000,Math.max(0,Math.floor(await v('TIMES'))));for(let i=0;i<n;i++){await chain(child(b,'DO'),token);assertRun(token);await sleep(0)}break}
case 'controls_whileUntil':while((!!await v('BOOL'))===(f('MODE')==='WHILE')){await chain(child(b,'DO'),token);assertRun(token);await sleep(10)}break;
case 'ms_dwrite':case 'ms_pwm':case 'ms_servo':{let op={ms_dwrite:'DWRITE',ms_pwm:'PWM',ms_servo:'SERVO'}[b.type];let n=Math.round(Number(await v('VALUE')));if(!Number.isFinite(n))throw Error('Invalid output');await hw(op+','+f('PIN')+','+n,null,token);break}
case 'ms_pull':await hw('PULL,'+f('PIN')+','+f('PULL'),null,token);break;
case 'ms_gate':if(f('TRIG')===f('ECHO'))throw Error('Choose distinct gate pins');await hw('GATE,'+f('TRIG')+','+f('ECHO'),null,token);break;
case 'ms_number':await hw('NUMBER,'+Math.round(Number(await v('VALUE'))),null,token);break;
case 'ms_clear':await hw('CLEAR',null,token);break;
case 'ms_pixel':await hw(f('OP')+','+Math.round(await v('X'))+','+Math.round(await v('Y')),null,token);break;
case 'ms_device':deviceSlot=Number(f('DEVICE'));token.deviceId=liveDevices()[deviceSlot-1]?.id;if(!token.deviceId)throw Error('Selected device is not connected');await configureDevice(token);break;
case 'ms_dashboard':{let k='program.'+varName(varID(b));if(!widgets.some(w=>w.key===k&&w.kind===f('KIND')))widgets.push({key:k,label:varName(varID(b)),kind:f('KIND'),arg:'',generatedByBlockly:true});save();break}
case 'ms_timer':{let a=f('ACTION');if(a==='reset')resetTimer();else if((a==='start'&&!timerRunning)||(a==='stop'&&timerRunning))timerToggle();break}
default:throw Error('Unsupported block: '+b.type)}await sleep(0)}}
function fail(e,token){if(run===token&&active){stop();notice(e.message)}}
function dispatch(b,token){if(!active||run!==token)return;let n=token.pending.get(b.id)||0;if(n>=64){notice('Event queue full; slow down inputs');return}token.pending.set(b.id,n+1);if(token.busy.has(b.id)||!token.ready)return;token.busy.add(b.id);(async()=>{while(active&&run===token&&(token.pending.get(b.id)||0)>0){token.pending.set(b.id,token.pending.get(b.id)-1);await chain(child(b,'DO'),token)}})().catch(e=>fail(e,token)).finally(()=>token.busy.delete(b.id))}
window.studioBlockSample=function(d,k,v){if(!run||!active)return;run.responses.set(d.id+'.'+k,{seq:++run.sampleSeq,value:v});if(d===selected()&&['buttonA','buttonB','shake'].includes(k)&&Number(v)===1)for(let b of run.events)if(b.getFieldValue('BUTTON')===k)dispatch(b,run)};
function stop(){active=false;let old=run;run=null;if(old)clearInterval(old.keep);$s('blockRun').disabled=false;$s('blockStop').disabled=true;notice('Stopped');for(let id of ['blockButtons','dashboardProgramButtons'])$s(id).replaceChildren();if(old)for(let id of old.used||[]){let d=devices.get(id);if(d?.connected&&d.type!=='Demo')send('STOP_ALL',id)}}
window.studioBlockStop=stop;$s('blockStop').onclick=stop;
$s('blockRun').onclick=async()=>{if(active)return;active=true;deviceSlot=Math.max(1,liveDevices().findIndex(d=>d.id===$s('targetDevice').value)+1);variables.clear();for(let map of [values,history,plotData])for(let k of map.keys())if(k.startsWith('program.'))map.delete(k);widgets=widgets.filter(w=>!w.generatedByBlockly);save();let token={responses:new Map(),sampleSeq:0,busy:new Set(),pending:new Map(),events:[],ready:false,used:new Set(),deviceId:liveDevices()[deviceSlot-1]?.id};run=token;$s('blockRun').disabled=true;$s('blockStop').disabled=false;notice('Running in browser');let tops=ws.getTopBlocks(true);token.events=tops.filter(b=>b.type==='ms_button');let db=tops.filter(b=>b.type==='ms_dash_button');for(let id of ['blockButtons','dashboardProgramButtons'])$s(id).replaceChildren(...db.map(b=>{let el=document.createElement('button');el.textContent=b.getFieldValue('LABEL');el.onclick=()=>dispatch(b,token);return el}));try{await configureDevice(token);assertRun(token);token.keep=setInterval(()=>{if(run===token&&active)for(let id of token.used){let d=devices.get(id);if(d?.connected&&d.type!=='Demo')send('KEEP',id)}},3000);for(let b of tops.filter(b=>b.type==='ms_start'))await chain(b.getNextBlock(),token);token.ready=true;for(let b of token.events.concat(db)){let n=token.pending.get(b.id)||0;if(n){token.pending.set(b.id,n-1);dispatch(b,token)}}for(let b of tops.filter(b=>b.type==='ms_forever'))(async()=>{try{while(active&&run===token){await chain(child(b,'DO'),token);await sleep(20)}}catch(e){fail(e,token)}})()}catch(e){fail(e,token)}};
function serialize(){return B.serialization.workspaces.save(ws)}
function load(s){stop();B.serialization.workspaces.load(s,ws);B.svgResize(ws)}
$s('blockSave').onclick=()=>{let blob=new Blob([JSON.stringify(serialize(),null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='studio-program.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
$s('blockLoad').onchange=async e=>{try{load(JSON.parse(await e.target.files[0].text()));notice('Program loaded')}catch(e){notice(e.message)}};
$s('blockExample').onclick=()=>{if(ws.getAllBlocks(false).length&&!confirm('Replace the current block program?'))return;load({variables:[{name:'score',id:'score'}],blocks:{languageVersion:0,blocks:[{type:'ms_start',x:50,y:35,next:{block:{type:'variables_set',fields:{VAR:{id:'score'}},inputs:{VALUE:{shadow:{type:'math_number',fields:{NUM:0}}}},next:{block:{type:'ms_dashboard',fields:{VAR:{id:'score'},KIND:'Number'}}}}}},{type:'ms_button',x:400,y:35,fields:{BUTTON:'buttonA'},inputs:{DO:{block:{type:'math_change',fields:{VAR:{id:'score'}},inputs:{DELTA:{shadow:{type:'math_number',fields:{NUM:1}}}}}}}},{type:'ms_dash_button',x:400,y:220,fields:{LABEL:'Reset'},inputs:{DO:{block:{type:'variables_set',fields:{VAR:{id:'score'}},inputs:{VALUE:{shadow:{type:'math_number',fields:{NUM:0}}}}}}}}]}});notice('Counter example loaded')};
$s('blockSimA').onclick=()=>{let d=selected();if(d?.type==='Demo')window.studioBlockSample(d,'buttonA',1);else notice('Add a Demo device first')};
ws.addChangeListener(e=>{if(!e.isUiEvent){try{localStorage.setItem('studio.blockly.v1',JSON.stringify(serialize()))}catch{}}});
try{let saved=localStorage.getItem('studio.blockly.v1');if(saved)load(JSON.parse(saved))}catch{}
new ResizeObserver(()=>B.svgResize(ws)).observe($s('blockWorkspace'));
notice('Ready · connect a micro:bit or add Demo');
})();
