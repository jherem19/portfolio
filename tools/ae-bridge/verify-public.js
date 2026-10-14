const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'app'),code=fs.readFileSync(path.join(root,'code.js'),'utf8'),html=fs.readFileSync(path.join(root,'ui.html'),'utf8'),manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
assert(code.includes('"token":""'));assert.equal(manifest.networkAccess.allowedDomains.length,31);assert(manifest.networkAccess.allowedDomains.every(u=>/^http:\/\/localhost:38[45]\d\d$/.test(u)));assert(!fs.existsSync(path.join(root,'bridge/local-config.json')));
for(const text of [code,html,JSON.stringify(manifest)])assert(!/C:[\\/]Users[\\/]/i.test(text));
const messages=[],requests=[],storage=new Map(),fakeToken='a'.repeat(64),page={type:'PAGE',selection:[]};let offline=false,badKey=false;
const figma={currentPage:page,ui:{postMessage(m){messages.push(m);}},showUI(){},on(){},clientStorage:{async getAsync(k){return storage.get(k);},async setAsync(k,v){storage.set(k,v);},async deleteAsync(k){storage.delete(k);}}};
const context=vm.createContext({figma,__html__:'',console,async fetch(url,options){requests.push({url,options});if(offline)throw Error('Network failed');return {ok:!badKey,async json(){return {ok:!badKey,version:'0.4.16'};}};}});vm.runInContext(code,context);
(async()=>{
 await figma.ui.onmessage({type:'bridge-check'});assert.equal(messages.at(-1).configured,false);assert.equal(requests.length,0);
 await figma.ui.onmessage({type:'export',direct:true});assert.equal(messages.at(-1).type,'error');assert(messages.at(-1).message.includes('Connect your local'));assert.equal(requests.length,0);
 for(const input of ['https://evil.example:'+fakeToken,'AEBridge:38504:'+fakeToken,'AEBridge:38473:bad','AEBridge:38473:'+fakeToken+';app.quit()']){await figma.ui.onmessage({type:'bridge-pair',code:input});assert.equal(messages.at(-1).type,'connection-error');assert.equal(storage.size,0);}assert.equal(requests.length,0);
 badKey=true;await figma.ui.onmessage({type:'bridge-pair',code:'AEBridge:38474:'+fakeToken});assert.equal(messages.at(-1).type,'connection-error');assert.equal(storage.size,0);badKey=false;
 await figma.ui.onmessage({type:'bridge-pair',code:'AEBridge:38474:'+fakeToken});assert.equal(storage.get('ae-bridge-connection').port,38474);assert.equal(messages.at(-1).connected,true);assert.equal(requests.at(-1).url,'http://localhost:38474/health');assert.equal(requests.at(-1).options.headers['X-Bridge-Token'],fakeToken);assert(!JSON.stringify(messages).includes(fakeToken));
 const reloadMessages=[],reloadFigma={...figma,ui:{postMessage(m){reloadMessages.push(m);}}},reload=vm.createContext({figma:reloadFigma,__html__:'',console,fetch:context.fetch});vm.runInContext(code,reload);await reloadFigma.ui.onmessage({type:'bridge-check'});assert.equal(reloadMessages.at(-1).connected,true);assert.equal(requests.at(-1).url,'http://localhost:38474/health');
 offline=true;await reloadFigma.ui.onmessage({type:'bridge-check'});assert.equal(reloadMessages.at(-1).connected,false);assert.equal(reloadMessages.at(-1).configured,true);offline=false;
 await reloadFigma.ui.onmessage({type:'bridge-forget'});assert.equal(storage.size,0);assert.equal(reloadMessages.at(-1).configured,false);
 const elements={},uiMessages=[];function element(id){return elements[id]||(elements[id]={value:'',checked:false,style:{},textContent:'',hidden:true,classList:{toggle(){},add(){}},closest(){return this;}});}
 for(const [id,value]of Object.entries({mode:'editable',duration:'10',fps:'30',scale:'2',position:'center'}))element(id).value=value;
 const window={},ui=vm.createContext({document:{getElementById:element,querySelectorAll:()=>[]},window,parent:{postMessage(m){uiMessages.push(m);}}});vm.runInContext(html.match(/<script>([\s\S]*)<\/script>/)[1],ui);
 window.onmessage({data:{pluginMessage:{type:'bridge-status',connected:false,configured:false}}});assert.equal(element('connection-panel').hidden,false);
 element('connection-code').value='AEBridge:38474:'+fakeToken;element('pair').onclick();assert.equal(uiMessages.at(-1).pluginMessage.type,'bridge-pair');window.onmessage({data:{pluginMessage:{type:'bridge-paired'}}});assert.equal(element('connection-code').value,'');assert.equal(element('connection-panel').hidden,true);
 console.log('PASS: public package has no private credentials or paths; pairing, storage, reload, invalid codes, offline state, forget and English UI verified.');
})().catch(error=>{console.error(error);process.exitCode=1;});
