/* No dependencies. Node.js is needed only to rebuild edited source. */
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const version = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8')).version;
if(typeof version!=='string' || !/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Invalid package version');
const read = name => fs.readFileSync(path.join(root, 'src', name), 'utf8');
const core = read('core.js');
const runtimeLiteral = JSON.stringify(core + '\n' + read('ae-runtime.js')).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
const configPath=path.join(root,'bridge','local-config.json');
const bridgeConfig=!process.argv.includes('--public')&&fs.existsSync(configPath)?JSON.parse(fs.readFileSync(configPath,'utf8')):{port:38473,token:''};
const clientConfig=JSON.stringify({url:'http://localhost:'+bridgeConfig.port,token:bridgeConfig.token});
fs.writeFileSync(path.join(root, 'code.js'), 'const BRIDGE_VERSION='+JSON.stringify(version)+';\nconst BRIDGE_CONFIG='+clientConfig+';\n'+core+'\n'+read('exporter.js'));
fs.writeFileSync(path.join(root, 'ui.html'), read('ui-direct.template.html').replace('__BRIDGE_VERSION__', () => version).replace('__AE_RUNTIME__', () => runtimeLiteral));
console.log('Built code.js and ui.html');
