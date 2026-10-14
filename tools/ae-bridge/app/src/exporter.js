/* Figma plugin sandbox entry point. Bundled with core.js by build.js. */
figma.showUI(__html__, {width: 400, height: 590, themeColors: true});
let exporting = false;
function reportSelection() {
    if (!exporting) figma.ui.postMessage({type: 'selection', count: figma.currentPage.selection.length});
}
figma.on('selectionchange', reportSelection);
reportSelection();

function visiblePaints(paints) {
    if (paints === figma.mixed) return null;
    return (paints || []).filter(p => p.visible !== false && p.opacity !== 0);
}
function normalBlend(n) { return !n.blendMode || n.blendMode === 'NORMAL' || n.blendMode === 'PASS_THROUGH'; }
function subtreeBlends(n) { return !normalBlend(n) || (n.effects || []).some(e => e.visible !== false && e.type === 'BACKGROUND_BLUR') || ('children' in n && n.children.some(c => c.visible !== false && subtreeBlends(c))); }
function containsText(n) { return n.visible!==false && (n.type==='TEXT' || ('children' in n && n.children.some(containsText))); }
function isGradientPaint(p) { return ['GRADIENT_LINEAR','GRADIENT_RADIAL','GRADIENT_ANGULAR','GRADIENT_DIAMOND'].includes(p.type); }
function containsGradient(n) {
    if(n.visible===false || n.opacity===0) return false;
    return ['fills','strokes'].some(field=>Array.isArray(n[field]) && visiblePaints(n[field]).some(isGradientPaint)) || ('children' in n && n.children.some(containsGradient));
}
function gradientSolid(paint) {
    const stops=(paint.gradientStops || []).filter(s=>s.color && Number.isFinite(s.position)).slice().sort((a,b)=>a.position-b.position);
    let color={r:0.5,g:0.5,b:0.5,a:1};
    if(stops.length) {
        color=stops[0].color;
        if(0.5>=stops[stops.length-1].position) color=stops[stops.length-1].color;
        else for(let i=1;i<stops.length;i++) if(stops[i].position>=0.5) {
            const left=stops[i-1],right=stops[i],t=Math.max(0,Math.min(1,(0.5-left.position)/(right.position-left.position || 1)));
            const a=left.color.a===undefined?1:left.color.a,b=right.color.a===undefined?1:right.color.a;
            color={r:left.color.r+(right.color.r-left.color.r)*t,g:left.color.g+(right.color.g-left.color.g)*t,b:left.color.b+(right.color.b-left.color.b)*t,a:a+(b-a)*t};break;
        }
    }
    return {type:'SOLID',color:{r:color.r,g:color.g,b:color.b},opacity:(paint.opacity===undefined?1:paint.opacity)*(color.a===undefined?1:color.a)};
}
function editableTextStyle(n,segments) {
    const first=segments[0] || {};
    const font=n.fontName!==figma.mixed && n.fontName && typeof n.fontName.family==='string' ? n.fontName : first.fontName;
    const size=typeof n.fontSize==='number' ? n.fontSize : first.fontSize;
    const sourceFills=visiblePaints(n.fills) || visiblePaints(first.fills) || [];
    const paint=sourceFills.find(p=>p.type==='SOLID') || sourceFills[0];
    const color=paint && (paint.color || (paint.gradientStops && paint.gradientStops[0] && paint.gradientStops[0].color));
    const spacing=n.letterSpacing!==figma.mixed && n.letterSpacing ? n.letterSpacing : first.letterSpacing;
    const leading=n.lineHeight!==figma.mixed && n.lineHeight ? n.lineHeight : first.lineHeight;
    return {
        font:font && typeof font.family==='string' && typeof font.style==='string' ? {family:font.family,style:font.style} : {family:'Figma font unavailable',style:'Regular'},
        fontSize:Number.isFinite(size) && size>=1 ? size : 16,
        color:color ? [color.r,color.g,color.b] : [0,0,0],
        fillOpacity:paint && paint.opacity!==undefined ? paint.opacity : 1,
        letterSpacing:spacing && ['PIXELS','PERCENT'].includes(spacing.unit) ? spacing : {unit:'PIXELS',value:0},
        lineHeight:leading && ['AUTO','PIXELS','PERCENT'].includes(leading.unit) ? leading : {unit:'AUTO'}
    };
}
function polygonPrimitive(n) {
    if(n.type!=='POLYGON' || !Number.isInteger(n.pointCount) || n.pointCount<3 || n.pointCount>1000 || n.cornerRadius || n.cornerSmoothing) return null;
    if(!n.fillGeometry || n.fillGeometry.length!==1) return null;
    const paths=BridgeCore.parsePath(n.fillGeometry[0].data),count=n.pointCount;
    if(paths.length!==1 || !paths[0].closed || paths[0].vertices.length!==count || paths[0].inTangents.concat(paths[0].outTangents).some(t=>Math.abs(t[0])+Math.abs(t[1])>0.0001)) return null;
    const vertices=paths[0].vertices,unit=Array.from({length:count},(_,i)=>[Math.cos(-Math.PI/2+i*2*Math.PI/count),Math.sin(-Math.PI/2+i*2*Math.PI/count)]);
    const bounds=points=>[Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))];
    const a=bounds(vertices),b=bounds(unit),sx=(a[2]-a[0])/(b[2]-b[0]),sy=(a[3]-a[1])/(b[3]-b[1]);
    if(sx<=0 || sy<=0) return null;
    const position=[a[0]-b[0]*sx,a[1]-b[1]*sy];
    if(unit.some(p=>!vertices.some(v=>Math.abs(v[0]-position[0]-p[0]*sx)<0.01 && Math.abs(v[1]-position[1]-p[1]*sy)<0.01))) return null;
    const radius=Math.max(sx,sy);
    return {type:'polygon',points:count,radius,position,scale:[sx/radius*100,sy/radius*100]};
}
function primitive(n) {
    if(n.type==='POLYGON') return polygonPrimitive(n);
    if (n.type === 'ELLIPSE' && (!n.arcData || (Math.abs(n.arcData.endingAngle - n.arcData.startingAngle) >= Math.PI * 2 - 0.0001 && !n.arcData.innerRadius))) return {type: 'ellipse', size: [n.width, n.height]};
    if (['RECTANGLE', 'FRAME', 'COMPONENT', 'INSTANCE', 'COMPONENT_SET'].includes(n.type) && (!n.cornerSmoothing || n.cornerSmoothing === 0)) {
        const radius = typeof n.cornerRadius === 'number' ? n.cornerRadius : null;
        if (radius !== null) return {type: 'rect', size: [n.width, n.height], radius: Math.min(radius, n.width / 2, n.height / 2)};
    }
    return null;
}
function clipPaths(n) {
    if (n.fillGeometry && n.fillGeometry.length === 1) return BridgeCore.parsePath(n.fillGeometry[0].data);
    const w = n.width, h = n.height, r = typeof n.cornerRadius === 'number' ? Math.min(n.cornerRadius, w / 2, h / 2) : 0;
    return BridgeCore.parsePath('M' + r + ' 0 L' + (w-r) + ' 0 Q' + w + ' 0 ' + w + ' ' + r + ' L' + w + ' ' + (h-r) + ' Q' + w + ' ' + h + ' ' + (w-r) + ' ' + h + ' L' + r + ' ' + h + ' Q0 ' + h + ' 0 ' + (h-r) + ' L0 ' + r + ' Q0 0 ' + r + ' 0 Z');
}
function nativeStroke(n) {
    const width=n.strokeWeight, cap=n.strokeCap || 'NONE', join=n.strokeJoin || 'MITER';
    if (!Number.isFinite(width) || width<=0) throw new Error('mixed or non-uniform width');
    if (!['NONE','ROUND','SQUARE'].includes(cap) || !['MITER','ROUND','BEVEL'].includes(join)) throw new Error('mixed styles or arrow caps');
    for (const side of ['strokeTopWeight','strokeRightWeight','strokeBottomWeight','strokeLeftWeight']) if (typeof n[side]==='number' && n[side]!==width) throw new Error('different widths on each side');
    if (n.variableWidthStrokeProperties && n.variableWidthStrokeProperties.widthProfile!=='UNIFORM') throw new Error('variable width');
    if (n.vectorNetwork) for (const vertex of n.vectorNetwork.vertices) {
        if ((vertex.strokeCap && vertex.strokeCap!==cap) || (vertex.strokeJoin && vertex.strokeJoin!==join)) throw new Error('per-vertex stroke styles');
    }
    let dashes=[...(n.dashPattern || [])];
    if (dashes.length%2) dashes=dashes.concat(dashes);
    if (dashes.length>6 || dashes.some(d=>!Number.isFinite(d) || d<0)) throw new Error('unsupported dash pattern');
    let geometry=n.type==='VECTOR' ? n.vectorPaths : fillGeometryForShape(n);
    if (n.type==='LINE') geometry=[{data:'M0 0 L'+n.width+' 0',windingRule:'NONE'}];
    if (!geometry || !geometry.length) throw new Error('original paths unavailable');
    const parsed=geometry.map(g=>({paths:BridgeCore.parsePath(g.data),rule:g.windingRule==='EVENODD'?'EVENODD':'NONZERO'}));
    let alignment='CENTER';
    if (n.strokeAlign && n.strokeAlign!=='CENTER' && parsed.some(g=>g.paths.some(p=>p.closed))) {
        if(!primitive(n)) throw new Error(n.strokeAlign.toLowerCase()+' alignment on a non-parametric closed path');
        alignment=n.strokeAlign;
    }
    return {geometry:parsed,style:{width,cap,join,alignment,miterLimit:Number.isFinite(n.strokeMiterLimit)?n.strokeMiterLimit:4,dashes}};
}
function layersForPaints(n, warnings) {
    const layers = [];
    for (const field of ['fills', 'strokes']) {
        let paints = visiblePaints(n[field]);
        if (!paints) throw new Error('Mixed styles');
        if (!paints.length) continue;
        const gradients=paints.some(isGradientPaint);
        if(gradients && paints.every(p=>p.type==='SOLID' || isGradientPaint(p))) {
            if(warnings) warnings.push(n.name+': gradient '+(field==='fills'?'fill':'stroke')+' simplified to an editable solid color sampled at 50%. Geometry remains editable.');
            if(paints.length>1 && warnings) warnings.push(n.name+': multiple '+field+' simplified to the first visible paint to keep geometry editable');
            if(paints.some(p=>p.blendMode && p.blendMode!=='NORMAL') && warnings) warnings.push(n.name+': paint blending simplified to Normal');
            paints=[isGradientPaint(paints[0])?gradientSolid(paints[0]):{type:'SOLID',color:paints[0].color,opacity:paints[0].opacity}];
        }
        if (paints.length > 1 || paints.some(p => p.type !== 'SOLID' || (p.blendMode && p.blendMode !== 'NORMAL'))) throw new Error('Images or unsupported paint combinations');
        if (field==='strokes') {
            try {
                const stroke=nativeStroke(n);
                for (const g of stroke.geometry) layers.push({paths:g.paths,primitive:primitive(n),rule:g.rule,color:[paints[0].color.r,paints[0].color.g,paints[0].color.b],opacity:(paints[0].opacity===undefined?1:paints[0].opacity)*100,label:'Stroke',stroke:stroke.style});
                continue;
            } catch(error) {
                if(warnings) warnings.push(n.name+': stroke outlined — '+error.message+(n.strokeAlign && n.strokeAlign!=='CENTER'?' (review alignment: Figma exposes centered stroke geometry)':''));
            }
        }
        const geometry = field === 'fills' ? fillGeometryForShape(n) : n.strokeGeometry;
        if (!geometry || !geometry.length) throw new Error('Geometry unavailable');
        for (const g of geometry) {
            layers.push({paths: BridgeCore.parsePath(g.data), primitive: field === 'fills' ? primitive(n) : null, rule: g.windingRule, color: [paints[0].color.r, paints[0].color.g, paints[0].color.b], opacity: (paints[0].opacity === undefined ? 1 : paints[0].opacity) * 100, label: field === 'fills' ? 'Fill' : 'Outline'});
        }
    }
    return layers;
}
function fillGeometryForShape(n) {
    if(n.fillGeometry && n.fillGeometry.length) return n.fillGeometry;
    const shape=primitive(n);if(!shape || !['rect','ellipse'].includes(shape.type)) return n.fillGeometry;
    const w=n.width,h=n.height;
    if(shape.type==='rect') {
        const r=shape.radius;
        return [{data:'M'+r+' 0 L'+(w-r)+' 0 Q'+w+' 0 '+w+' '+r+' L'+w+' '+(h-r)+' Q'+w+' '+h+' '+(w-r)+' '+h+' L'+r+' '+h+' Q0 '+h+' 0 '+(h-r)+' L0 '+r+' Q0 0 '+r+' 0 Z',windingRule:'NONZERO'}];
    }
    const x=w/2,y=h/2,k=0.5522847498307936,dx=x*k,dy=y*k;
    return [{data:'M'+x+' 0 C'+(x+dx)+' 0 '+w+' '+(y-dy)+' '+w+' '+y+' C'+w+' '+(y+dy)+' '+(x+dx)+' '+h+' '+x+' '+h+' C'+(x-dx)+' '+h+' 0 '+(y+dy)+' 0 '+y+' C0 '+(y-dy)+' '+(x-dx)+' 0 '+x+' 0 Z',windingRule:'NONZERO'}];
}
function paintBounds(n,paints) {
    let minX=0,minY=0,maxX=n.width,maxY=n.height;
    const paths=paints.flatMap(p=>p.paths);
    // Expanded geometry is used only for bounds, never for native Stroke paths.
    if(paints.some(p=>p.stroke)) {
        try {
            if(!n.strokeGeometry || !n.strokeGeometry.length) throw new Error('No bounds');
            for(const geometry of n.strokeGeometry) paths.push(...BridgeCore.parsePath(geometry.data));
        } catch(error) {
            const pad=Math.max(...paints.filter(p=>p.stroke).map(p=>p.stroke.width/2*(p.stroke.join==='MITER'?p.stroke.miterLimit:1)));
            minX-=pad;minY-=pad;maxX+=pad;maxY+=pad;
        }
    }
    for(const path of paths) for(let i=0;i<path.vertices.length;i++) {
        const v=path.vertices[i];
        for(const t of [[0,0],path.inTangents[i],path.outTangents[i]]) {minX=Math.min(minX,v[0]+t[0]);minY=Math.min(minY,v[1]+t[1]);maxX=Math.max(maxX,v[0]+t[0]);maxY=Math.max(maxY,v[1]+t[1]);}
    }
    return {canvasOrigin:[Math.floor(minX),Math.floor(minY)],canvasWidth:Math.max(1,Math.ceil(maxX)-Math.floor(minX)),canvasHeight:Math.max(1,Math.ceil(maxY)-Math.floor(minY))};
}
function hasOverflow(n) {
    if (n.clipsContent) return false;
    for (const child of n.children) {
        if (child.visible === false) continue;
        const m = child.relativeTransform;
        for (const p of [[0, 0], [child.width, 0], [0, child.height], [child.width, child.height]]) {
            const x = m[0][0] * p[0] + m[0][1] * p[1] + m[0][2];
            const y = m[1][0] * p[0] + m[1][1] * p[1] + m[1][2];
            if (x < -0.01 || y < -0.01 || x > n.width + 0.01 || y > n.height + 0.01) return true;
        }
        // Render bounds include effects and strokes; compare in this container's coordinates.
        const rb = child.absoluteRenderBounds;
        const t = n.absoluteTransform;
        const det = t[0][0] * t[1][1] - t[0][1] * t[1][0];
        if (rb && Math.abs(det) > 0.000001) {
            for (const p of [[rb.x, rb.y], [rb.x + rb.width, rb.y], [rb.x, rb.y + rb.height], [rb.x + rb.width, rb.y + rb.height]]) {
                const dx = p[0] - t[0][2], dy = p[1] - t[1][2];
                const x = (t[1][1] * dx - t[0][1] * dy) / det, y = (-t[1][0] * dx + t[0][0] * dy) / det;
                if (x < -0.5 || y < -0.5 || x > n.width + 0.5 || y > n.height + 0.5) return true;
            }
        }
    }
    return false;
}
function encodePNG(bytes) {
    // Figma's native encoder avoids a JavaScript loop over every image byte.
    return typeof figma.base64Encode==='function' ? figma.base64Encode(bytes) : BridgeCore.base64(bytes);
}
async function raster(n, base, scene, reason, backgroundOnly) {
    // Render an isolated, unrotated clone. Originals are never changed.
    const wrapper = figma.createFrame();
    let clone;
    try {
        wrapper.name = 'AE Bridge · temporary'; wrapper.fills = []; wrapper.clipsContent = true;
        clone = n.clone(); wrapper.appendChild(clone);
        if ('isMask' in clone) clone.isMask = false;
        if (backgroundOnly && 'children' in clone) { for (const child of [...clone.children]) child.remove(); clone.effects = []; }
        clone.relativeTransform = [[1, 0, 0], [0, 1, 0]];
        if ('opacity' in clone) clone.opacity = 1;
        if ('blendMode' in clone) clone.blendMode = 'NORMAL';
        const bounds = clone.absoluteRenderBounds;
        const origin = clone.absoluteTransform;
        const x = bounds ? Math.floor(Math.min(0, bounds.x - origin[0][2])) : 0;
        const y = bounds ? Math.floor(Math.min(0, bounds.y - origin[1][2])) : 0;
        const width = Math.max(1, Math.ceil(Math.max(n.width, bounds ? bounds.x + bounds.width - origin[0][2] : n.width) - x));
        const height = Math.max(1, Math.ceil(Math.max(n.height, bounds ? bounds.y + bounds.height - origin[1][2] : n.height) - y));
        if (width * height * scene.rasterScale * scene.rasterScale > 32000000) throw new Error('Image too large; select a smaller frame or export at 1×');
        wrapper.resizeWithoutConstraints(width, height); clone.x = -x; clone.y = -y;
        const bytes = await wrapper.exportAsync({format: 'PNG', constraint: {type: 'SCALE', value: scene.rasterScale}, useAbsoluteBounds: true, contentsOnly: true, colorProfile: 'SRGB'});
        const data = encodePNG(bytes);
        scene.assetBytes += data.length;
        if (scene.assetBytes > 64000000) throw new Error('Selection exceeds 64 MB; export in smaller parts');
        scene.warnings.push(n.name + ': image — ' + reason);
        scene.stats.images++;
        return Object.assign(base, {kind: 'image', data, offset: [x, y], renderWidth: width, renderHeight: height, rasterScale: scene.rasterScale});
    } finally { if (clone && !clone.removed) clone.remove(); wrapper.remove(); }
}
function multiplyMatrices(a,b) {
    return [[a[0][0]*b[0][0]+a[0][1]*b[1][0],a[0][0]*b[0][1]+a[0][1]*b[1][1],a[0][0]*b[0][2]+a[0][1]*b[1][2]+a[0][2]],[a[1][0]*b[0][0]+a[1][1]*b[1][0],a[1][0]*b[0][1]+a[1][1]*b[1][1],a[1][0]*b[0][2]+a[1][1]*b[1][2]+a[1][2]]];
}
function stackingPath(n) {
    const path=[];
    for(let node=n;node.parent;node=node.parent) path.unshift(node.parent.children.indexOf(node));
    return path;
}
function compareStacking(a,b) {
    const x=stackingPath(a),y=stackingPath(b);
    for(let i=0;i<Math.min(x.length,y.length);i++) if(x[i]!==y[i]) return x[i]-y[i];
    return x.length-y.length;
}
async function rasterSelection(selection,scene,frameInverse) {
    const nodes=selection.filter(n=>n.visible!==false && n.opacity!==0 && !selection.some(parent=>{
        for(let ancestor=n.parent;ancestor;ancestor=ancestor.parent) if(ancestor===parent) return true;
        return false;
    }));
    if(!nodes.length) throw new Error('Selection is hidden or has zero opacity');
    if(nodes.length===1) {
        const n=nodes[0],base={kind:'image',id:n.id,name:n.name,matrix:[[1,0,0],[0,1,0]],width:n.width,height:n.height,opacity:n.opacity===undefined?100:n.opacity*100,asMask:false,blendMode:n.blendMode};
        const image=await raster(n,base,scene,'Raster image mode');
        image.matrix=frameInverse?multiplyMatrices(frameInverse,n.absoluteTransform):[[1,0,-image.offset[0]],[0,1,-image.offset[1]]];
        BridgeCore.transform(image.matrix);return image;
    }
    const bounds=nodes.map(n=>n.absoluteRenderBounds || n.absoluteBoundingBox).filter(Boolean);
    if(bounds.length!==nodes.length) throw new Error('Could not measure the raster selection');
    const x=Math.floor(Math.min(...bounds.map(b=>b.x))),y=Math.floor(Math.min(...bounds.map(b=>b.y)));
    const width=Math.max(1,Math.ceil(Math.max(...bounds.map(b=>b.x+b.width)))-x),height=Math.max(1,Math.ceil(Math.max(...bounds.map(b=>b.y+b.height)))-y);
    if(width*height*scene.rasterScale*scene.rasterScale>32000000) throw new Error('Image too large; select fewer elements or use 1×');
    const wrapper=figma.createFrame(),clones=[];
    try {
        wrapper.name='AE Bridge · temporary raster selection';wrapper.fills=[];wrapper.clipsContent=true;
        wrapper.relativeTransform=[[1,0,0],[0,1,0]];wrapper.resizeWithoutConstraints(width,height);
        for(const n of nodes) {
            const clone=n.clone();clones.push(clone);wrapper.appendChild(clone);
            clone.relativeTransform=[[n.absoluteTransform[0][0],n.absoluteTransform[0][1],n.absoluteTransform[0][2]-x],[n.absoluteTransform[1][0],n.absoluteTransform[1][1],n.absoluteTransform[1][2]-y]];
        }
        const bytes=await wrapper.exportAsync({format:'PNG',constraint:{type:'SCALE',value:scene.rasterScale},useAbsoluteBounds:true,contentsOnly:true,colorProfile:'SRGB'});
        const data=encodePNG(bytes);scene.assetBytes+=data.length;
        if(scene.assetBytes>64000000) throw new Error('Selection exceeds 64 MB; export in smaller parts');
        scene.stats.images++;scene.warnings.push('Raster image mode: selection flattened into one PNG.');
        const matrix=frameInverse?multiplyMatrices(frameInverse,[[1,0,x],[0,1,y]]):[[1,0,0],[0,1,0]];
        BridgeCore.transform(matrix);
        return {kind:'image',name:scene.name,id:nodes[0].id,matrix,width,height,opacity:100,asMask:false,data,offset:[0,0],renderWidth:width,renderHeight:height,rasterScale:scene.rasterScale};
    } finally {
        for(const clone of clones) if(!clone.removed) clone.remove();
        wrapper.remove();
    }
}
function inverseMatrix(m) {
    const det=m[0][0]*m[1][1]-m[0][1]*m[1][0];
    if(Math.abs(det)<0.000001) throw new Error('Cannot preserve position with a degenerate frame transform');
    const a=m[1][1]/det,b=-m[0][1]/det,c=-m[1][0]/det,d=m[0][0]/det;
    return [[a,b,-a*m[0][2]-b*m[1][2]],[c,d,-c*m[0][2]-d*m[1][2]]];
}
function referenceFrames(selection) {
    const frames=[];
    for(let node=selection[0];node;node=node.parent) {
        // A Section organizes artboards; it never supplies artwork coordinates.
        if(node.type==='SECTION')break;
        if(node.type!=='FRAME')continue;
        const contains=selection.every(item=>{
            for(let ancestor=item;ancestor;ancestor=ancestor.parent)if(ancestor===node)return true;
            return false;
        });
        if(contains)frames.push(node);
    }
    if(!frames.length)throw new Error('Keep Figma position requires a frame or elements inside a frame');
    return frames;
}
async function outlineText(n) {
    if(!figma.flatten) throw new Error('Outline API unavailable');
    if(n.hasMissingFont) throw new Error('The font is also missing in Figma');
    const names=n.getRangeAllFontNames ? n.getRangeAllFontNames(0,n.characters.length) : [n.fontName];
    if(figma.loadFontAsync) for(const name of names) if(name!==figma.mixed) await figma.loadFontAsync(name);
    const wrapper=figma.createFrame();let clone=null,vector=null;
    try {
        wrapper.name='AE Bridge · temporary outlines';wrapper.fills=[];wrapper.clipsContent=false;
        wrapper.resizeWithoutConstraints(Math.max(1,n.width),Math.max(1,n.height));
        clone=n.clone();wrapper.appendChild(clone);clone.relativeTransform=[[1,0,0],[0,1,0]];
        clone.opacity=1;clone.blendMode='NORMAL';clone.effects=[];clone.isMask=false;
        vector=figma.flatten([clone],wrapper);
        const paints=layersForPaints(vector);
        if(!paints.length) throw new Error('Text produced no outlines');
        return {matrix:vector.relativeTransform.map(row=>[...row]),paints};
    } finally {
        if(vector&&!vector.removed)vector.remove();
        if(clone&&!clone.removed)clone.remove();
        wrapper.remove();
    }
}
function decodeSvgText(value) {
    return value.replace(/&#(x[0-9a-f]+|[0-9]+);/gi,(_,code)=>String.fromCodePoint(code[0].toLowerCase()==='x'?parseInt(code.slice(1),16):parseInt(code,10))).replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&');
}
async function pointTextLayout(n,scene) {
    let text=n.textCase==='UPPER'?n.characters.toUpperCase():n.textCase==='LOWER'?n.characters.toLowerCase():n.textCase==='TITLE'?n.characters.replace(/\S+/g,word=>word[0].toUpperCase()+word.slice(1).toLowerCase()):n.characters;
    if(n.exportAsync) try {
        const svg=await n.exportAsync({format:'SVG_STRING',svgOutlineText:false});
        const spans=[...svg.matchAll(/<tspan\b([^>]*)>([\s\S]*?)<\/tspan>/g)],lines=[];
        for(const span of spans) {
            if(/</.test(span[2])) throw new Error('SVG contains nested spans');
            const y=span[1].match(/\by=["']([^"']+)["']/);if(!y)throw new Error('SVG has no baseline');
            const baseline=parseFloat(y[1]);if(!Number.isFinite(baseline))throw new Error('Invalid baseline');
            const value=decodeSvgText(span[2]);
            if(lines.length&&Math.abs(lines[lines.length-1].y-baseline)<0.01)lines[lines.length-1].text+=value;
            else lines.push({y:baseline,text:value});
        }
        if(lines.length) {
            const rendered=lines.map(line=>line.text).join('\n');
            if(rendered.replace(/\s/g,'')===text.replace(/\s/g,'')) {
                const spacing=lines.length>1?lines[1].y-lines[0].y:0;
                return {text:rendered,lineHeight:spacing>0?{unit:'PIXELS',value:spacing}:null};
            }
        }
    } catch(error) { scene.warnings.push(n.name+': could not read SVG lines; explicit line breaks are preserved'); }
    return {text,lineHeight:null};
}
async function serialize(n, scene, root) {
    if (n.visible === false || n.opacity === 0) return null;
    if (++scene.nodeCount > 2000) throw new Error('Maximum 2000 nodes per export; select fewer elements');
    const matrix = root ? [[1, 0, 0], [0, 1, 0]] : n.relativeTransform;
    BridgeCore.transform(matrix); // Fail explicitly instead of silently dropping skew.
    const base = {name: n.name, id: n.id, matrix, width: n.width, height: n.height, opacity: n.opacity === undefined ? 100 : n.opacity * 100, asMask: !!n.isMask, maskType: n.maskType || 'ALPHA', blendMode: n.blendMode};
    const container = 'children' in n && n.type !== 'BOOLEAN_OPERATION';
    // An editable text request takes precedence over appearance flattening, including ancestors.
    const preferEditable=scene.preferEditable || (scene.editableText && containsText(n)) || containsGradient(n);
    if (container && n.isMask && scene.flatLayers) return raster(n,base,scene,'Group mask only; its subjects remain separate layers');
    let reason = '';
    if (!normalBlend(n)) reason = 'Blend mode (external background is not included)';
    if ((n.effects || []).some(e => e.visible !== false)) reason = 'Shadows or effects (backgrounds outside the selection are not included)';
    if (n.isMask && !preferEditable) reason = 'Mask';
    if (reason && !preferEditable) return raster(n, base, scene, reason);
    if (n.type === 'TEXT') {
        const fills = visiblePaints(n.fills);
        const strokes = visiblePaints(n.strokes);
        const textFields = ['fontName', 'fontSize', 'letterSpacing', 'lineHeight', 'textCase', 'textDecoration', 'paragraphSpacing', 'paragraphIndent', 'listOptions'];
        const segments = n.getStyledTextSegments(textFields.concat(['fills']));
        const simple = scene.editableText && segments.length === 1 && fills && fills.length === 1 && fills[0].type === 'SOLID' && strokes && !strokes.length && n.fontName !== figma.mixed && n.fontSize !== figma.mixed && n.letterSpacing !== figma.mixed && n.lineHeight !== figma.mixed && (!n.textDecoration || n.textDecoration==='NONE') && !['SMALL_CAPS','SMALL_CAPS_FORCED'].includes(n.textCase) && !(n.fontName.variationSettings && Object.keys(n.fontName.variationSettings).length);
        let outline=null;
        try { outline=await outlineText(n); }
        catch(error) { scene.warnings.push(n.name+': could not prepare text outlines: '+String(error.message||error)); }
        if (!scene.editableText) {
            if(outline) {
                scene.stats.shapes++;
                scene.warnings.push(n.name+': text outlined to preserve typography; characters are no longer editable as text');
                return Object.assign(base,{kind:'shape',matrix:multiplyMatrices(matrix,outline.matrix),paints:outline.paints});
            }
            return raster(n, base, scene, 'Text outlines unavailable');
        }
        const style=editableTextStyle(n,segments);
        if(!simple) scene.warnings.push(n.name+': complex text styles simplified to a single editable text style. No vector conversion.');
        scene.stats.text++;
        if ((n.effects || []).some(e => e.visible !== false)) scene.warnings.push(n.name + ': effects omitted to keep text editable');
        if (n.paragraphSpacing || n.paragraphIndent) scene.warnings.push(n.name + ': review paragraph spacing');
        const layout=await pointTextLayout(n,scene);
        return Object.assign(base, style, {kind: 'text', text: layout.text, originalText:n.characters, outline, lineHeight: layout.lineHeight || style.lineHeight, align: n.textAlignHorizontal, verticalAlign: n.textAlignVertical});
    }
    let paints;
    let background = null;
    try { paints = layersForPaints(n,scene.warnings); } catch (e) {
        if (!container || !preferEditable) return raster(n, base, scene, e.message);
        paints = []; background = await raster(n, Object.assign({}, base, {name: n.name + ' · background', matrix: [[1,0,0],[0,1,0]], opacity: 100, asMask: false}), scene, 'Background only: ' + e.message, true);
    }
    if (preferEditable && !background && (n.effects || []).some(e => e.visible !== false)) scene.warnings.push(n.name + ': effects omitted to keep layers editable');
    if (base.asMask && base.maskType === 'VECTOR') {
        base.opacity = 100;
        for (const paint of paints) { paint.color=[1,1,1]; paint.opacity=100; }
    }
    if (container) {
        if (!preferEditable) {
            if (n.children.some(c => c.visible !== false && (c.isMask || subtreeBlends(c)))) return raster(n, base, scene, 'Group with masks or blending between layers');
            if ((n.clipsContent && (n.cornerRadius === figma.mixed || n.cornerRadius > 0)) || n.clipsContent && (n.topLeftRadius || n.topRightRadius || n.bottomLeftRadius || n.bottomRightRadius)) return raster(n, base, scene, 'Clip with rounded corners');
            if (hasOverflow(n)) return raster(n, base, scene, 'Content outside group bounds');
        }
        // Pass-through groups with effects/blends in deeper descendants need flattening.
        const children = [];
        for (const c of n.children) { const child = await serialize(c, scene, false); if (child) children.push(child); }
        scene.stats.groups++;
        const ownBounds=n.clipsContent?null:paintBounds(n,paints);
        let minX = ownBounds?ownBounds.canvasOrigin[0]:0, minY = ownBounds?ownBounds.canvasOrigin[1]:0, maxX = ownBounds?minX+ownBounds.canvasWidth:n.width, maxY = ownBounds?minY+ownBounds.canvasHeight:n.height;
        if (!n.clipsContent) for (const child of children) {
            const origin = child.canvasOrigin || child.offset || [0,0], w = child.canvasWidth || child.renderWidth || child.width, h = child.canvasHeight || child.renderHeight || child.height;
            const m = child.matrix;
            for (const p of [[origin[0],origin[1]],[origin[0]+w,origin[1]],[origin[0],origin[1]+h],[origin[0]+w,origin[1]+h]]) {
                const x = m[0][0]*p[0]+m[0][1]*p[1]+m[0][2], y = m[1][0]*p[0]+m[1][1]*p[1]+m[1][2];
                minX = Math.min(minX,x); minY = Math.min(minY,y); maxX = Math.max(maxX,x); maxY = Math.max(maxY,y);
            }
        }
        return Object.assign(base, {kind: 'container', sourceType:n.type, paints, background, children, clip: n.clipsContent ? clipPaths(n) : null, canvasOrigin: [Math.floor(minX),Math.floor(minY)], canvasWidth: Math.ceil(maxX)-Math.floor(minX), canvasHeight: Math.ceil(maxY)-Math.floor(minY)});
    }
    scene.stats.shapes++;
    return Object.assign(base, {kind: 'shape', paints},paintBounds(n,paints));
}

function parseBridgeCode(code) {
 const match=String(code||'').trim().match(/^AEBridge:(\d{5}):([a-f0-9]{64})$/i);
 if(!match || Number(match[1])<38473 || Number(match[1])>38503)throw new Error('Paste the connection code from the AE Bridge installer.');
 return {port:Number(match[1]),token:match[2].toLowerCase()};
}
function useBridgeConnection(connection) {BRIDGE_CONFIG.url='http://localhost:'+connection.port;BRIDGE_CONFIG.token=connection.token;}
const connectionReady=(async()=>{
 try{if(figma.clientStorage){const saved=await figma.clientStorage.getAsync('ae-bridge-connection');if(saved)useBridgeConnection(parseBridgeCode('AEBridge:'+saved.port+':'+saved.token));}}
 catch(error){figma.ui.postMessage({type:'connection-error',message:'Saved connection is unavailable. Paste your connection code again.'});}
})();
async function checkBridgeConnection() {
 await connectionReady;
 if(!BRIDGE_CONFIG.token){figma.ui.postMessage({type:'bridge-status',connected:false,configured:false});return;}
 try{const response=await fetch(BRIDGE_CONFIG.url+'/health',{headers:{'X-Bridge-Token':BRIDGE_CONFIG.token}}),result=await response.json();figma.ui.postMessage({type:'bridge-status',connected:response.ok&&result.ok,configured:true});}
 catch(error){figma.ui.postMessage({type:'bridge-status',connected:false,configured:true});}
}
figma.ui.onmessage = async message => {
 if(message.type==='bridge-pair'){
  await connectionReady;
  try{const connection=parseBridgeCode(message.code);if(!figma.clientStorage)throw new Error('Figma could not save the connection. Reopen the plugin.');
   const response=await fetch('http://localhost:'+connection.port+'/health',{headers:{'X-Bridge-Token':connection.token}}),result=await response.json();
   if(!response.ok||!result.ok)throw new Error('The code does not match the running bridge. Open AE Bridge First steps on this computer.');
   await figma.clientStorage.setAsync('ae-bridge-connection',connection);useBridgeConnection(connection);figma.ui.postMessage({type:'bridge-paired'});await checkBridgeConnection();
  }catch(error){figma.ui.postMessage({type:'connection-error',message:String(error.message||'Could not connect. Start the AE Bridge companion and try again.')});}
  return;
 }
 if(message.type==='bridge-forget'){await connectionReady;try{if(figma.clientStorage)await figma.clientStorage.deleteAsync('ae-bridge-connection');BRIDGE_CONFIG.token='';figma.ui.postMessage({type:'bridge-status',connected:false,configured:false});}catch(error){figma.ui.postMessage({type:'connection-error',message:'Could not clear the saved connection.'});}return;}

    if(message.type==='bridge-check'){await checkBridgeConnection();return;}
    if (message.type !== 'export' || exporting) return;
    if(message.direct){await connectionReady;if(!BRIDGE_CONFIG.token){figma.ui.postMessage({type:'error',message:'Connect your local AE Bridge companion first, or use Export .jsx.'});return;}}
    exporting = true;
    const selection = [...figma.currentPage.selection];
    try {
        if (!selection.length) throw new Error('Select a frame or multiple elements');
        if (![24, 25, 30, 60].includes(message.fps) || !Number.isFinite(message.duration) || message.duration < 1 || message.duration > 3600 || ![1, 2].includes(message.rasterScale)) throw new Error('Invalid options');
        const rasterMode=message.rasterSelection===true;
        const scene = {version: 1, build: BRIDGE_VERSION, precomposeSelection:!!message.precomposeSelection, rasterSelection:rasterMode,groupShapes:!rasterMode&&!!message.groupShapes, flatLayers:!!message.direct||!!message.groupShapes||!!message.precomposeSelection, centerInComp:message.centerInComp!==false, preferEditable: message.preferEditable !== false, name: selection.length === 1 ? selection[0].name : 'Figma selection', fps: message.fps, duration: message.duration, editableText:!rasterMode&&message.editableText !== false, rasterScale: message.rasterScale, warnings: [], stats: {shapes: 0, text: 0, images: 0, groups: 0}, nodeCount: 0, assetBytes: 0, roots: []};
        // Editable multi-selections need siblings; raster selections use document stacking order.
        if (!rasterMode && selection.length > 1 && selection.some(n => n.parent !== selection[0].parent)) throw new Error('Select elements from the same group, or export each frame separately');
        const frames=message.keepFigmaPosition ? referenceFrames(selection) : [];
        // Use a shared basis for serialization. AE chooses the actual design frame
        // from these candidates once the active composition dimensions are known.
        const frame=frames.length ? frames[frames.length-1] : null;
        const frameInverse=frame ? inverseMatrix(frame.absoluteTransform) : null;
        if(frame) {
            scene.centerInComp=false;
            scene.keepFigmaPosition=true;
            scene.positionFrames=frames.map(candidate=>({id:candidate.id,name:candidate.name,width:candidate.width,height:candidate.height,selected:selection.length===1&&candidate===selection[0],matrix:multiplyMatrices(inverseMatrix(candidate.absoluteTransform),frame.absoluteTransform)}));
            scene.warnings.push('Position reference: '+frame.name+' ('+frame.width+' × '+frame.height+' px).');
        }
        selection.sort(rasterMode?compareStacking:(a, b) => a.parent.children.indexOf(a) - b.parent.children.indexOf(b));
        if(rasterMode) {
            const image=await rasterSelection(selection,scene,frameInverse);
            scene.width=image.renderWidth;scene.height=image.renderHeight;scene.roots.push(image);
        } else if (selection.length === 1) {
            scene.width = Math.max(1, Math.ceil(selection[0].width)); scene.height = Math.max(1, Math.ceil(selection[0].height));
            const root = await serialize(selection[0], scene, true);
            if (root) {
                const localMatrix=root.matrix.map(row=>[...row]);
                // Retain exterior strokes/effects when a single non-container is selected.
                if (root.kind === 'image') {
                    scene.width = root.renderWidth; scene.height = root.renderHeight;
                    root.matrix[0][2] = -root.offset[0]; root.matrix[1][2] = -root.offset[1];
                } else if (root.kind === 'container') {
                    scene.width = root.canvasWidth; scene.height = root.canvasHeight;
                    root.matrix[0][2] = -root.canvasOrigin[0]; root.matrix[1][2] = -root.canvasOrigin[1];
                } else if (root.kind === 'shape') {
                    let minX = root.canvasOrigin[0], minY = root.canvasOrigin[1], maxX = minX+root.canvasWidth, maxY = minY+root.canvasHeight;
                    for (const paint of root.paints) for (const path of paint.paths) for (let i = 0; i < path.vertices.length; i++) {
                        const v = path.vertices[i];
                        for (const t of [[0, 0], path.inTangents[i], path.outTangents[i]]) { minX = Math.min(minX, v[0] + t[0]); minY = Math.min(minY, v[1] + t[1]); maxX = Math.max(maxX, v[0] + t[0]); maxY = Math.max(maxY, v[1] + t[1]); }
                    }
                    const x = Math.floor(minX), y = Math.floor(minY);
                    scene.width = Math.max(1, Math.ceil(maxX) - x); scene.height = Math.max(1, Math.ceil(maxY) - y);
                    root.matrix[0][2] = -x; root.matrix[1][2] = -y;
                }
                if(frame) { root.matrix=multiplyMatrices(multiplyMatrices(frameInverse,selection[0].absoluteTransform),localMatrix); BridgeCore.transform(root.matrix); }
                scene.roots.push(root);
            }
        } else {
            const bounds = selection.map(n => n.absoluteRenderBounds || n.absoluteBoundingBox).filter(Boolean);
            if (!bounds.length) throw new Error('No visible elements');
            const x = Math.floor(Math.min(...bounds.map(b => b.x))), y = Math.floor(Math.min(...bounds.map(b => b.y)));
            scene.width = Math.max(1, Math.ceil(Math.max(...bounds.map(b => b.x + b.width)) - x));
            scene.height = Math.max(1, Math.ceil(Math.max(...bounds.map(b => b.y + b.height)) - y));
            for (const n of selection) {
                const item = await serialize(n, scene, true);
                if (item) {
                    item.matrix=multiplyMatrices(frame ? multiplyMatrices(frameInverse,n.absoluteTransform) : n.absoluteTransform,item.matrix);
                    if(!frame) { item.matrix[0][2]-=x;item.matrix[1][2]-=y; }
                    BridgeCore.transform(item.matrix);scene.roots.push(item);
                }
            }
        }
        if(frame) { scene.width=Math.max(1,Math.ceil(frame.width));scene.height=Math.max(1,Math.ceil(frame.height)); }
        if (!scene.roots.length) throw new Error('Selection is hidden or has zero opacity');
        if (scene.width > 30000 || scene.height > 30000) throw new Error('Composition too large for After Effects');
        figma.currentPage.selection = selection;
        if (message.direct) {
            figma.ui.postMessage({type:'sending',rasterSelection:rasterMode});
            if(!BRIDGE_CONFIG.token)throw new Error('Local bridge is not configured');
            let response;
            try { response=await fetch(BRIDGE_CONFIG.url+'/transfer',{method:'POST',headers:{'Content-Type':'application/json','X-Bridge-Token':BRIDGE_CONFIG.token},body:JSON.stringify({scene})}); }
            catch(networkError){throw new Error('Could not connect to the local bridge. Start the local bridge and send again.');}
            const result=await response.json();
            if(!response.ok||!result.ok)throw new Error(result.message||'After Effects did not confirm the transfer');
            figma.ui.postMessage({type:'sent',result});
        } else figma.ui.postMessage({type: 'exported', scene});
    } catch (e) {
        figma.currentPage.selection = selection.filter(n => !n.removed);
        figma.ui.postMessage({type: 'error', message: String(e.message || e)});
    } finally { exporting = false; reportSelection(); }
};
