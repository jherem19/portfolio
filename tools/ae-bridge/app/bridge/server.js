const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawn,execFile}=require('node:child_process');
const {validateScene}=require('./validate');
const {prepareImages}=require('./assets');
const {version}=require('../version.json');
const config=JSON.parse(fs.readFileSync(path.join(__dirname,'local-config.json'),'utf8'));
const root=path.resolve(__dirname,'..');
const runtime=fs.readFileSync(path.join(root,'src/core.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/ae-runtime.js'),'utf8');
const resultEncoder=fs.readFileSync(path.join(__dirname,'result-json.js'),'utf8');
fs.mkdirSync(config.stateDirectory,{recursive:true});fs.mkdirSync(config.assetsDirectory,{recursive:true});
let busy=false;
function literal(value){return JSON.stringify(value).replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');}
function authenticated(req){const value=Buffer.from(String(req.headers['x-bridge-token']||''));const expected=Buffer.from(config.token);return value.length===expected.length&&crypto.timingSafeEqual(value,expected);}
function reply(res,status,value){res.writeHead(status,{'Content-Type':'application/json;charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));}
function runningAE(){return new Promise((resolve,reject)=>execFile('tasklist.exe',['/FI','IMAGENAME eq AfterFX.exe','/FO','CSV','/NH'],{windowsHide:true,timeout:5000},(error,stdout)=>error?reject(error):resolve(/"AfterFX\.exe"/i.test(stdout))));}
function runScript(file){return new Promise((resolve,reject)=>{
    // AE's Windows command parser expects an unquoted -r path, even when it contains spaces.
    // Quote argv[0] ourselves and bypass libuv's argument quoting. No command shell is used.
    const windows=process.platform==='win32';
    const child=spawn(config.afterEffects,['-r',file],{windowsHide:true,stdio:'ignore',windowsVerbatimArguments:windows,argv0:windows?'"'+config.afterEffects+'"':config.afterEffects});
    child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error('After Effects rejected the transfer ('+code+')')));
});}
function waitResult(file,timeout=45000){return new Promise((resolve,reject)=>{const start=Date.now();const timer=setInterval(()=>{try{if(fs.existsSync(file)){const result=JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));clearInterval(timer);resolve(result);return;}}catch(ignore){}if(Date.now()-start>timeout){clearInterval(timer);reject(Error('AE did not confirm the transfer. Close its dialogs and check script permissions; check the composition before retrying to avoid duplicates.'));}},150);});}
async function transfer(scene){
    const start=Date.now();
    if(!await runningAE())throw Error('Open After Effects, your project and the target composition before sending.');
    validateScene(scene);scene.directTransfer=true;scene.assetsDirectory=config.assetsDirectory;
    const id=crypto.randomUUID(),scriptFile=path.join(config.stateDirectory,id+'.jsx'),resultFile=path.join(config.stateDirectory,id+'.json');
    const images=prepareImages(scene,config.assetsDirectory,id),prepared=Date.now();
    const script='#target aftereffects\n(function(){\nvar resultFile=new File('+literal(resultFile.replace(/\\/g,'/'))+');\nvar result;\n'+resultEncoder+'\ntry{\n'+runtime+'\nresult=importFigmaScene('+literal(scene)+');\n}catch(error){result={ok:false,message:error.toString(),line:error.line};}\ntry{resultFile.encoding="UTF-8";if(!resultFile.open("w"))throw new Error("Could not save the transfer confirmation");resultFile.write(encodeBridgeResult(result));resultFile.close();}catch(writeError){alert("AE Bridge: could not confirm the transfer. Check script write permissions. The import may have completed.");}\n}());\n';
    fs.writeFileSync(scriptFile,script);
    const resultPromise=waitResult(resultFile);resultPromise.catch(()=>{});
    await runScript(scriptFile);
    const result=await resultPromise;
    if(!result.ok)throw Error(result.message||'AE could not import the selection');
    result.timings={prepareMs:prepared-start,aeMs:Date.now()-prepared,totalMs:Date.now()-start,imageBytes:images.bytes};
    return result;
}
function requestHandler(req,res){
    const host=String(req.headers.host||'');
    if(!['localhost:'+config.port,'127.0.0.1:'+config.port,'[::1]:'+config.port].includes(host))return reply(res,403,{ok:false,message:'Host not allowed'});
    res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type,X-Bridge-Token');res.setHeader('Access-Control-Allow-Private-Network','true');
    if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
    if(!authenticated(req))return reply(res,401,{ok:false,message:'Plugin key does not match the local bridge'});
    if(req.method==='GET'&&req.url==='/health')return reply(res,200,{ok:true,version,busy});
    if(req.method!=='POST'||req.url!=='/transfer')return reply(res,404,{ok:false,message:'Route unavailable'});
    if(busy)return reply(res,409,{ok:false,message:'Wait for the previous transfer to finish'});
    let chunks=[],length=0,oversize=false;
    req.on('data',chunk=>{length+=chunk.length;if(length>90000000){oversize=true;chunks=[];}else if(!oversize)chunks.push(chunk);});
    req.on('end',async()=>{
        if(oversize)return reply(res,413,{ok:false,message:'Selection too large; send in smaller parts'});
        if(busy)return reply(res,409,{ok:false,message:'Wait for the previous transfer to finish'});
        busy=true;
        try{const body=JSON.parse(Buffer.concat(chunks).toString('utf8'));const result=await transfer(body.scene);reply(res,200,result);}
        catch(error){reply(res,422,{ok:false,message:String(error.message||error)});}
        finally{busy=false;}
    });
}
function listener(host){const server=http.createServer(requestHandler);server.requestTimeout=120000;server.headersTimeout=10000;server.listen(config.port,host);return server;}
const ipv4=listener('127.0.0.1');ipv4.on('listening',()=>{fs.writeFileSync(path.join(config.stateDirectory,'server.pid'),String(process.pid));console.log('AE Bridge '+version+' ready on localhost:'+config.port);});
ipv4.on('error',error=>{if(error.code==='EADDRINUSE'){console.log('The bridge is already running.');process.exit(0);}console.error(error.message);process.exit(1);});
const ipv6=listener('::1');ipv6.on('error',error=>{if(!['EADDRINUSE','EAFNOSUPPORT','EADDRNOTAVAIL'].includes(error.code))console.error(error.message);});
process.on('SIGTERM',()=>{ipv4.close();ipv6.close();process.exit(0);});
