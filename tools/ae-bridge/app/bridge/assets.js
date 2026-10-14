/* Local-only asset preparation. Client paths are rejected before this runs. */
const fs=require('node:fs'),path=require('node:path');
function prepareImages(scene,assetsRoot,id) {
    if(!/^[a-f0-9-]{36}$/.test(id))throw Error('Invalid transfer identifier');
    const images=[];
    function visit(node){if(node.kind==='image')images.push(node);if(node.children)node.children.forEach(visit);if(node.background)visit(node.background);}
    scene.roots.forEach(visit);
    if(!images.length)return {images:0,bytes:0};
    const directory=path.join(assetsRoot,'FigmaAE-assets-'+id);
    fs.mkdirSync(directory);let bytes=0;
    try {
        for(let i=0;i<images.length;i++) {
            const node=images[i],png=Buffer.from(node.data,'base64'),file=path.join(directory,'image-'+(i+1)+'.png');
            fs.writeFileSync(file,png,{flag:'wx'});bytes+=png.length;
            node.assetFile=file.replace(/\\/g,'/');delete node.data;
        }
    }catch(error){fs.rmSync(directory,{recursive:true,force:true});throw error;}
    return {images:images.length,bytes,directory};
}
module.exports={prepareImages};
