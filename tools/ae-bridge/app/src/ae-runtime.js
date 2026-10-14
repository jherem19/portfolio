/* ES3-compatible runtime embedded in every exported .jsx. */
function importFigmaScene(scene) {
    var assetFolder = null, created = [], createdLayers = [], warnings = scene.warnings.slice(0), imageIndex = 0, targetComp = null, oldSelection = [], clipping={created:0,omitted:0};
    function trackedLayer(layer) { createdLayers.push(layer); return layer; }
    function comp(name, width, height) {
        width = Math.max(1, Math.ceil(width)); height = Math.max(1, Math.ceil(height));
        if (width > 30000 || height > 30000) throw new Error('Composition too large: ' + name);
        var c = app.project.items.addComp(name, width, height, 1, scene.duration, scene.fps);
        created.push(c); c.parentFolder = app.project.rootFolder; return c;
    }
    function transformLayer(layer, node, anchor) {
        var t = BridgeCore.transform(node.matrix), props = layer.property('ADBE Transform Group');
        props.property('ADBE Anchor Point').setValue(anchor || [0, 0]);
        props.property('ADBE Position').setValue(t.position);
        props.property('ADBE Scale').setValue(t.scale);
        props.property('ADBE Rotate Z').setValue(t.rotation);
        props.property('ADBE Opacity').setValue(node.opacity);
        if (node.blendMode && node.blendMode !== 'NORMAL' && node.blendMode !== 'PASS_THROUGH') {
            var blendNames = {MULTIPLY:'MULTIPLY',SCREEN:'SCREEN',OVERLAY:'OVERLAY',DARKEN:'DARKEN',LIGHTEN:'LIGHTEN',COLOR_DODGE:'COLOR_DODGE',COLOR_BURN:'COLOR_BURN',HARD_LIGHT:'HARD_LIGHT',SOFT_LIGHT:'SOFT_LIGHT',DIFFERENCE:'DIFFERENCE',EXCLUSION:'EXCLUSION',HUE:'HUE',SATURATION:'SATURATION',COLOR:'COLOR',LUMINOSITY:'LUMINOSITY'};
            try { if (!blendNames[node.blendMode]) throw new Error('unsupported'); layer.blendingMode = BlendingMode[blendNames[node.blendMode]]; }
            catch (blendError) { warnings.push(node.name + ': blend mode not converted: ' + node.blendMode); }
        }
        layer.name = node.name; layer.comment = 'Figma AE Bridge | ' + node.id;
    }
    function addPaints(layer, paints) { addPaintsTo(layer.property('ADBE Root Vectors Group'), paints); }
    function addPaintsTo(contents, paints) {
        var i, j;
        // The first AE vector group renders in front: stroke must sit above fill.
        for (i = paints.length-1; i >= 0; i--) {
            var paint = paints[i];
            var group = contents.addProperty('ADBE Vector Group'); group.name = paint.label;
            var vectors = group.property('ADBE Vectors Group');
            if (paint.primitive) {
                var primitive = paint.primitive, ellipse = primitive.type === 'ellipse';
                if(primitive.type==='polygon') {
                    var polygonGroup=vectors.addProperty('ADBE Vector Group');polygonGroup.name='Polygon';
                    var polygonTransform=polygonGroup.property('ADBE Vector Transform Group');
                    polygonTransform.property('ADBE Vector Position').setValue(primitive.position);
                    polygonTransform.property('ADBE Vector Scale').setValue(primitive.scale);
                    var polygon=polygonGroup.property('ADBE Vectors Group').addProperty('ADBE Vector Shape - Star');polygon.name='Polygon Path';
                    polygon.property('ADBE Vector Star Type').setValue(2);
                    polygon.property('ADBE Vector Star Points').setValue(primitive.points);
                    polygon.property('ADBE Vector Star Outer Radius').setValue(primitive.radius);
                    polygon.property('ADBE Vector Star Position').setValue([0,0]);
                    polygon.property('ADBE Vector Star Rotation').setValue(0);
                    polygon.property('ADBE Vector Star Outer Roundess').setValue(0);
                    // Consume the transformed polygon before painting: stroke width stays
                    // constant when Figma stretches a polygon to a non-square box.
                    vectors.addProperty('ADBE Vector Filter - Merge').property('ADBE Vector Merge Type').setValue(1);
                } else {
                var geometry = vectors.addProperty(ellipse ? 'ADBE Vector Shape - Ellipse' : 'ADBE Vector Shape - Rect');
                geometry.property(ellipse ? 'ADBE Vector Ellipse Size' : 'ADBE Vector Rect Size').setValue(primitive.size);
                geometry.property(ellipse ? 'ADBE Vector Ellipse Position' : 'ADBE Vector Rect Position').setValue([primitive.size[0]/2,primitive.size[1]/2]);
                if (!ellipse) geometry.property('ADBE Vector Rect Roundness').setValue(primitive.radius);
                }
            } else for (j = 0; j < paint.paths.length; j++) {
                var p = paint.paths[j], shape = new Shape();
                shape.vertices = p.vertices; shape.inTangents = p.inTangents; shape.outTangents = p.outTangents; shape.closed = p.closed;
                vectors.addProperty('ADBE Vector Shape - Group').property('ADBE Vector Shape').setValue(shape);
            }
            if (paint.stroke) {
                if(paint.stroke.alignment && paint.stroke.alignment!=='CENTER') {
                    var offset=vectors.addProperty('ADBE Vector Filter - Offset'),offsetJoin=1;
                    if(paint.stroke.join==='ROUND') offsetJoin=2;
                    else if(paint.stroke.join==='BEVEL') offsetJoin=3;
                    offset.property('ADBE Vector Offset Line Join').setValue(offsetJoin);
                    if(offsetJoin===1) offset.property('ADBE Vector Offset Miter Limit').setValue(paint.stroke.miterLimit);
                }
                var style=paint.stroke,stroke=vectors.addProperty('ADBE Vector Graphic - Stroke');
                stroke.name='Stroke';
                stroke.property('ADBE Vector Stroke Color').setValue(paint.color);
                stroke.property('ADBE Vector Stroke Opacity').setValue(paint.opacity);
                stroke.property('ADBE Vector Stroke Width').setValue(style.width);
                var capValue=1,joinValue=1;
                if(style.cap==='ROUND') capValue=2;
                else if(style.cap==='SQUARE') capValue=3;
                if(style.join==='ROUND') joinValue=2;
                else if(style.join==='BEVEL') joinValue=3;
                stroke.property('ADBE Vector Stroke Line Cap').setValue(capValue);
                stroke.property('ADBE Vector Stroke Line Join').setValue(joinValue);
                // AE hides Miter Limit for round/bevel joins and rejects writes to it.
                if(style.join==='MITER') stroke.property('ADBE Vector Stroke Miter Limit').setValue(style.miterLimit);
                var dashes=stroke.property('ADBE Vector Stroke Dashes'),d;
                for(d=0;d<style.dashes.length;d++) dashes.addProperty('ADBE Vector Stroke '+(d%2?'Gap ':'Dash ')+(Math.floor(d/2)+1));
                // Indexed additions invalidate earlier property handles; reacquire before writing.
                dashes=stroke.property('ADBE Vector Stroke Dashes');
                for(d=0;d<style.dashes.length;d++) dashes.property('ADBE Vector Stroke '+(d%2?'Gap ':'Dash ')+(Math.floor(d/2)+1)).setValue(style.dashes[d]);
                if(style.alignment && style.alignment!=='CENTER') {
                    var amount=vectors.property('ADBE Vector Filter - Offset').property('ADBE Vector Offset Amount');
                    amount.setValue(style.width/2*(style.alignment==='INSIDE'?-1:1));
                    amount.expression='thisProperty.propertyGroup(3).content("Stroke").strokeWidth * '+(style.alignment==='INSIDE'?'-0.5':'0.5')+';';
                }
            } else {
                var fill = vectors.addProperty('ADBE Vector Graphic - Fill');
                fill.property('ADBE Vector Fill Color').setValue(paint.color);
                fill.property('ADBE Vector Fill Opacity').setValue(paint.opacity);
                fill.property('ADBE Vector Fill Rule').setValue(paint.rule === 'EVENODD' ? 2 : 1);
            }
        }
    }
    function shiftedNode(node, origin) {
        var copy = {}, k; for (k in node) if (node.hasOwnProperty(k)) copy[k] = node[k];
        copy.matrix = [[node.matrix[0][0],node.matrix[0][1],node.matrix[0][2]-origin[0]],[node.matrix[1][0],node.matrix[1][1],node.matrix[1][2]-origin[1]]];
        return copy;
    }
    function joinedBounds(a,b) {
        if(!a) return b;if(!b) return a;
        return [Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[2],b[2]),Math.max(a[3],b[3])];
    }
    function transformedBounds(bounds,matrix) {
        var corners=BridgeCore.boundsCorners(bounds),points=[],i,p;
        for(i=0;i<corners.length;i++) {p=corners[i];points.push([matrix[0][0]*p[0]+matrix[0][1]*p[1]+matrix[0][2],matrix[1][0]*p[0]+matrix[1][1]*p[1]+matrix[1][2]]);}
        return BridgeCore.pointsBounds(points);
    }
    function vectorBounds(node) {
        var bounds=null,i,p,b,pad,childBounds;
        if(!node.paints) return null;
        for(i=0;i<node.paints.length;i++) {
            p=node.paints[i];b=BridgeCore.pointsBounds(BridgeCore.pathControls(p.paths));
            if(!b) return null;
            pad=0.02;
            if(p.stroke) pad+=p.stroke.width*(p.stroke.alignment && p.stroke.alignment!=='CENTER'?1:0.5)*Math.max(Math.sqrt(2),p.stroke.join==='MITER'?p.stroke.miterLimit:1);
            bounds=joinedBounds(bounds,[b[0]-pad,b[1]-pad,b[2]+pad,b[3]+pad]);
        }
        if(node.children) for(i=0;i<node.children.length;i++) {
            childBounds=vectorBounds(node.children[i]);if(!childBounds) return null;
            bounds=joinedBounds(bounds,transformedBounds(childBounds,node.children[i].matrix));
        }
        if(node.background) {
            if(node.background.kind!=='shape' && node.background.kind!=='container') return null;
            childBounds=vectorBounds(node.background);if(!childBounds) return null;
            bounds=joinedBounds(bounds,transformedBounds(childBounds,node.background.matrix));
        }
        return bounds;
    }
    function layerBounds(layer,node) {
        if(node.kind==='shape') return vectorBounds(node);
        if(node.kind==='image' || node.kind==='container') {
            if(!layer.source || !layer.source.width || !layer.source.height) return null;
            return [-0.02,-0.02,layer.source.width+0.02,layer.source.height+0.02];
        }
        if(node.kind==='text' && layer.sourceRectAtTime) {
            var r=layer.sourceRectAtTime(layer.inPoint || 0,false);
            return [r.left-0.02,r.top-0.02,r.left+r.width+0.02,r.top+r.height+0.02];
        }
        return null;
    }
    function applyClip(layer, clip, node, parentOrigin, intersect) {
        if (!clip || !clip.length) return;
        var m = node.matrix, det = m[0][0]*m[1][1]-m[0][1]*m[1][0];
        // ExtendScript can evaluate the text branch of a nested conditional for
        // image nodes. Keep these branches explicit: images have no text origin.
        var sourceOrigin = [0,0];
        if (node.kind === 'container') sourceOrigin = node.canvasOrigin || [0,0];
        else if (node.kind === 'image') sourceOrigin = node.offset;
        else if (node.kind === 'text' && node.textBoxOrigin) sourceOrigin = [-node.textBoxOrigin[0],-node.textBoxOrigin[1]];
        var scale = node.kind === 'image' ? node.rasterScale : 1;
        function point(p) {
            var x = p[0]-parentOrigin[0]-m[0][2], y = p[1]-parentOrigin[1]-m[1][2];
            return [((m[1][1]*x-m[0][1]*y)/det-sourceOrigin[0])*scale,((-m[1][0]*x+m[0][0]*y)/det-sourceOrigin[1])*scale];
        }
        function tangent(t) { return [(m[1][1]*t[0]-m[0][1]*t[1])/det*scale,(-m[1][0]*t[0]+m[0][0]*t[1])/det*scale]; }
        var localClip=[],bounds=layerBounds(layer,node),p,j;
        for(var c=0;c<clip.length;c++) {
            p=clip[c];var local={vertices:[],inTangents:[],outTangents:[],closed:p.closed};
            for(j=0;j<p.vertices.length;j++) {local.vertices.push(point(p.vertices[j]));local.inTangents.push(tangent(p.inTangents[j]));local.outTangents.push(tangent(p.outTangents[j]));}
            localClip.push(local);
        }
        if(bounds && BridgeCore.clipContainsPoints(localClip,BridgeCore.boundsCorners(bounds))) {clipping.omitted+=clip.length;return;}
        for (var i=0;i<clip.length;i++) {
            var shape = new Shape();p=localClip[i];
            shape.vertices=p.vertices; shape.inTangents=p.inTangents; shape.outTangents=p.outTangents; shape.closed=p.closed;
            var mask=layer.property('ADBE Mask Parade').addProperty('ADBE Mask Atom'); mask.name='Figma clip';
            mask.property('ADBE Mask Shape').setValue(shape);
            if (intersect) mask.maskMode = MaskMode.INTERSECT;
            clipping.created++;
        }
    }
    function populateContainer(node, target) {
        var origin=node.canvasOrigin || [0,0], backgroundNode, background, i, activeMatte=null, matteType=null, mattes=[];
        if (node.background) {
            backgroundNode=shiftedNode(node.background,origin); background=buildNode(backgroundNode,target); applyClip(background,node.clip,backgroundNode,origin);
        }
        if (node.paints.length) {
            background=target.layers.addShape(); addPaints(background,node.paints);
            backgroundNode={kind:'shape',matrix:[[1,0,-origin[0]],[0,1,-origin[1]]],name:node.name+' · background',id:node.id,opacity:100,paints:node.paints};
            transformLayer(background,backgroundNode); applyClip(background,node.clip,backgroundNode,origin);
        }
        for (i=0;i<node.children.length;i++) {
            var child=shiftedNode(node.children[i],origin), layer=buildNode(child,target);
            if (child.asMask) {
                activeMatte=layer; matteType=child.maskType==='LUMINANCE' ? TrackMatteType.LUMA : TrackMatteType.ALPHA; mattes.push(layer);
            } else {
                if (activeMatte) layer.setTrackMatte(activeMatte,matteType);
                applyClip(layer,node.clip,child,origin);
            }
        }
        for(i=0;i<mattes.length;i++) mattes[i].enabled=false;
    }
    function multiply(a,b) {
        return [[a[0][0]*b[0][0]+a[0][1]*b[1][0],a[0][0]*b[0][1]+a[0][1]*b[1][1],a[0][0]*b[0][2]+a[0][1]*b[1][2]+a[0][2]],[a[1][0]*b[0][0]+a[1][1]*b[1][0],a[1][0]*b[0][1]+a[1][1]*b[1][1],a[1][0]*b[0][2]+a[1][1]*b[1][2]+a[1][2]]];
    }
    function compositionPlacement(target) {
        if(scene.keepFigmaPosition && scene.positionFrames && scene.positionFrames.length) {
            var frames=scene.positionFrames,reference=null,i;
            // Prefer the closest artwork frame matching the composition, rather
            // than an organizer frame containing several artboards.
            for(i=0;i<frames.length;i++)if(Math.abs(frames[i].width-target.width)<1 && Math.abs(frames[i].height-target.height)<1){reference=frames[i];break;}
            if(!reference) {
                reference=frames[0];
                if(reference.selected && frames.length>1)reference=frames[1];
            }
            for(i=warnings.length-1;i>=0;i--)if(warnings[i].indexOf('Position reference: ')===0)warnings.splice(i,1);
            warnings.push('Position reference: '+reference.name+' ('+reference.width+' × '+reference.height+' px).');
            if(Math.abs(reference.width-target.width)>=1 || Math.abs(reference.height-target.height)>=1)warnings.push('The containing Figma frame and AE composition have different sizes. Original pixel coordinates are preserved without scaling.');
            return reference.matrix;
        }
        var x=scene.centerInComp===false ? 0 : (target.width-scene.width)/2,y=scene.centerInComp===false ? 0 : (target.height-scene.height)/2;
        return [[1,0,x],[0,1,y]];
    }
    function worldPaths(paths,matrix) {
        var result=[],i,j;
        for(i=0;i<paths.length;i++) {
            var p=paths[i],copy={vertices:[],inTangents:[],outTangents:[],closed:p.closed};
            for(j=0;j<p.vertices.length;j++) {
                var v=p.vertices[j],t=p.inTangents[j],u=p.outTangents[j];
                copy.vertices.push([matrix[0][0]*v[0]+matrix[0][1]*v[1]+matrix[0][2],matrix[1][0]*v[0]+matrix[1][1]*v[1]+matrix[1][2]]);
                copy.inTangents.push([matrix[0][0]*t[0]+matrix[0][1]*t[1],matrix[1][0]*t[0]+matrix[1][1]*t[1]]);
                copy.outTangents.push([matrix[0][0]*u[0]+matrix[0][1]*u[1],matrix[1][0]*u[0]+matrix[1][1]*u[1]]);
            }
            result.push(copy);
        }
        return result;
    }
    function flatNode(node,parentMatrix,clips,parentOpacity,inheritedMatte,matteType,ancestry) {
        var copy=shiftedNode(node,[0,0]),matrix=multiply(parentMatrix,node.matrix),added=[],i;
        copy.matrix=matrix;copy.opacity=node.opacity*parentOpacity/100;
        if(node.kind==='container') {
            if(node.asMask) throw new Error('Select a shape or image mask; simplify a group mask before sending it.');
            var ownClips=clips.slice(0),path=ancestry ? ancestry+' / '+node.name : node.name;
            if(node.clip) ownClips.push(worldPaths(node.clip,matrix));
            if(scene.groupShapes && canGroupVectors(node,true)) {
                var grouped=trackedLayer(targetComp.layers.addShape());
                populateVectors(grouped.property('ADBE Root Vectors Group'),node);
                copy.kind='shape';transformLayer(grouped,copy);
                finishFlatLayer(grouped,copy,ownClips,inheritedMatte,matteType,ancestry);
                return [grouped];
            }
            if(scene.groupShapes) warnings.push(path+': separate layers retained for text, images, masks or internal clips');
            if(node.opacity!==100) warnings.push(path+': group opacity applied to individual layers; review overlapping areas');
            if(node.blendMode && node.blendMode!=='NORMAL' && node.blendMode!=='PASS_THROUGH') warnings.push(path+': review group blending when transferring separate layers');
            if(node.background) {
                var backgroundLayers=flatNode(node.background,matrix,ownClips,copy.opacity,inheritedMatte,matteType,path);
                for(i=0;i<backgroundLayers.length;i++) added.push(backgroundLayers[i]);
            }
            if(node.paints.length) {
                var backgroundNode={kind:'shape',matrix:[[1,0,0],[0,1,0]],name:node.name+' · background',id:node.id,opacity:100,paints:node.paints,width:node.width,height:node.height};
                var backgroundResult=flatNode(backgroundNode,matrix,ownClips,copy.opacity,inheritedMatte,matteType,path);
                for(i=0;i<backgroundResult.length;i++) added.push(backgroundResult[i]);
            }
            var activeMatte=inheritedMatte,activeType=matteType;
            for(i=0;i<node.children.length;i++) {
                var child=node.children[i],layers=flatNode(child,matrix,ownClips,copy.opacity,activeMatte,activeType,path),j;
                if(child.asMask) {
                    if(layers.length!==1) throw new Error('The group mask must be exported as a single mask layer.');
                    activeMatte=layers[0];activeType=child.maskType==='LUMINANCE' ? TrackMatteType.LUMA : TrackMatteType.ALPHA;
                    activeMatte.enabled=false;
                }
                for(j=0;j<layers.length;j++) added.push(layers[j]);
            }
            return added;
        }
        var layer=buildNode(copy,targetComp);
        finishFlatLayer(layer,copy,clips,inheritedMatte,matteType,ancestry);
        added.push(layer);return added;
    }
    function finishFlatLayer(layer,node,clips,matte,matteType,ancestry) {
        if(matte) layer.setTrackMatte(matte,matteType);
        var retained=[],i,j,redundant;
        for(i=0;i<clips.length;i++) {
            redundant=false;
            for(j=0;j<clips.length;j++) if(i!==j) {
                if(BridgeCore.samePaths(clips[i],clips[j])) {if(j<i) redundant=true;}
                else if(BridgeCore.clipContainsPoints(clips[i],BridgeCore.pathControls(clips[j]))) {
                    // Equal regions may have different start vertices/directions.
                    // Keep one even when containment holds in both directions.
                    if(!BridgeCore.clipContainsPoints(clips[j],BridgeCore.pathControls(clips[i])) || j<i) redundant=true;
                }
                if(redundant) break;
            }
            if(redundant) clipping.omitted+=clips[i].length;else retained.push(clips[i]);
        }
        for(i=0;i<retained.length;i++) applyClip(layer,retained[i],node,[0,0],true);
        layer.comment += '\nGrupo Figma: '+ancestry;
        layer.startTime=targetComp.time;layer.inPoint=targetComp.time;layer.outPoint=targetComp.duration;
    }
    function canGroupVectors(node,root) {
        if(node.asMask || (node.blendMode && node.blendMode!=='NORMAL' && node.blendMode!=='PASS_THROUGH')) return false;
        if(node.kind==='shape') return true;
        if(node.kind!=='container' || (node.background && !canGroupVectors(node.background,false))) return false;
        for(var i=0;i<node.children.length;i++) if(!canGroupVectors(node.children[i],false)) return false;
        if(!root && node.clip && node.clip.length) {var bounds=vectorBounds(node);if(!bounds || !BridgeCore.clipContainsPoints(node.clip,BridgeCore.boundsCorners(bounds))) return false;}
        return !!(node.children.length || node.paints.length || node.background);
    }
    function vectorNode(contents,node) {
        var group=contents.addProperty('ADBE Vector Group');group.name=node.name;
        var t=BridgeCore.transform(node.matrix),props=group.property('ADBE Vector Transform Group');
        props.property('ADBE Vector Anchor').setValue([0,0]);props.property('ADBE Vector Position').setValue(t.position);
        props.property('ADBE Vector Scale').setValue(t.scale);props.property('ADBE Vector Rotation').setValue(t.rotation);
        props.property('ADBE Vector Group Opacity').setValue(node.opacity);
        var vectors=group.property('ADBE Vectors Group');
        if(node.kind==='shape') addPaintsTo(vectors,node.paints);else populateVectors(vectors,node);
    }
    function populateVectors(contents,node) {
        // AE renders the first vector group in front; Figma children are bottom-to-top.
        for(var i=node.children.length-1;i>=0;i--) vectorNode(contents,node.children[i]);
        if(node.paints.length) addPaintsTo(contents,node.paints);
        if(node.background) vectorNode(contents,node.background);
    }
    function writeImage(node) {
        var file;
        if(scene.directTransfer && typeof node.assetFile==='string') {
            // The authenticated bridge writes the PNG with Node before invoking AE.
            file=new File(node.assetFile);
            if(!file.exists)throw new Error('The prepared PNG is missing. Send the selection again.');
            if(!assetFolder)assetFolder=file.parent;
        } else {
        if (!assetFolder) {
            // Assets live next to the exported script; keep this folder with the .aep.
            var scriptParent = scene.directTransfer ? (app.project.file ? app.project.file.parent : new Folder(scene.assetsDirectory)) : File($.fileName).parent;
            var suffix = new Date().getTime() + '-' + Math.floor(Math.random() * 1000000);
            assetFolder = new Folder(scriptParent.fsName + '/FigmaAE-assets-' + suffix);
            if (!assetFolder.create()) throw new Error('Could not create the image folder. Move the .jsx to a writable folder.');
        }
        file = new File(assetFolder.fsName + '/image-' + (++imageIndex) + '.png');
        file.encoding = 'BINARY';
        if (!file.open('w')) throw new Error('Could not write ' + file.fsName);
        try { if (!file.write(BridgeCore.decode64(node.data))) throw new Error('Could not write the PNG'); }
        finally { file.close(); }
        }
        var footage = app.project.importFile(new ImportOptions(file)); created.push(footage);
        footage.parentFolder = app.project.rootFolder; footage.name = node.name + '.png'; return footage;
    }
    function fontName(font) {
        function normalized(value) { return String(value).toLowerCase().replace(/[\s_-]/g,''); }
        try {
            var groups = app.fonts.allFonts, i, j;
            for (i = 0; i < groups.length; i++) for (j = 0; j < groups[i].length; j++) {
                var f = groups[i][j];
                if (!f.isSubstitute && normalized(f.familyName)===normalized(font.family) && normalized(f.styleName)===normalized(font.style)) return f.postScriptName;
            }
        } catch (ignore) {}
        return null;
    }
    function availableTextFont(candidate) {
        // AE's current text defaults can reference a missing/substitute font too.
        try {
            var groups=app.fonts.allFonts,first=null,arial=null,i,j;
            for(i=0;i<groups.length;i++) for(j=0;j<groups[i].length;j++) {
                var f=groups[i][j];if(f.isSubstitute || !f.postScriptName) continue;
                if(f.postScriptName===candidate) return candidate;
                if(!first) first=f.postScriptName;
                if(f.familyName==='Arial' && f.styleName==='Regular') arial=f.postScriptName;
            }
            return arial || first || candidate;
        } catch(ignore) { return candidate; }
    }
    function buildNode(node, target) {
        var layer, i;
        if (node.kind === 'container') {
            var nested = comp(node.name, node.canvasWidth || node.width, node.canvasHeight || node.height);
            populateContainer(node,nested);
            var canvasOrigin=node.canvasOrigin || [0,0];
            layer = target.layers.add(nested); transformLayer(layer, node, [-canvasOrigin[0],-canvasOrigin[1]]);
        } else if (node.kind === 'shape') {
            layer = trackedLayer(target.layers.addShape()); addPaints(layer, node.paints); transformLayer(layer, node);
        } else if (node.kind === 'image') {
            var footage = writeImage(node);
            layer = trackedLayer(target.layers.add(footage));
            transformLayer(layer, node, [-node.offset[0] * node.rasterScale, -node.offset[1] * node.rasterScale]);
            var t = BridgeCore.transform(node.matrix);
            layer.property('ADBE Transform Group').property('ADBE Scale').setValue([t.scale[0] / node.rasterScale, t.scale[1] / node.rasterScale]);
        } else if (node.kind === 'text') {
            var resolvedFont=fontName(node.font);
            // Point text: AE must not reflow Figma's lines inside a paragraph box.
            layer = trackedLayer(target.layers.addText(node.text.replace(/\r?\n/g,'\r')));
            var prop = layer.property('ADBE Text Properties').property('ADBE Text Document'), doc = prop.value;
            // Capture AE's own default from the fresh text layer, before resetting styles.
            var defaultFont=availableTextFont(doc.font);
            if(doc.resetCharStyle) doc.resetCharStyle();
            doc.font = resolvedFont || defaultFont; doc.fontSize = node.fontSize;
            // TextDocument scales use a multiplier: 1 is 100%, unlike layer Scale.
            doc.fauxBold=false;doc.fauxItalic=false;doc.horizontalScale=1;doc.verticalScale=1;doc.baselineShift=0;
            doc.applyFill = true; doc.applyStroke = false; doc.fillColor = node.color;
            doc.justification = node.align === 'CENTER' ? ParagraphJustification.CENTER_JUSTIFY : node.align === 'RIGHT' ? ParagraphJustification.RIGHT_JUSTIFY : ParagraphJustification.LEFT_JUSTIFY;
            doc.tracking = Math.round(node.letterSpacing.unit === 'PIXELS' ? node.letterSpacing.value / node.fontSize * 1000 : node.letterSpacing.value * 10);
            if (node.lineHeight.unit !== 'AUTO') {
                doc.autoLeading = false;
                doc.leading = node.lineHeight.unit === 'PIXELS' ? node.lineHeight.value : node.fontSize * node.lineHeight.value / 100;
            } else doc.autoLeading = true;
            prop.setValue(doc);
            if(!resolvedFont) warnings.push(node.name+': '+node.font.family+' '+node.font.style+' is not installed in After Effects; using an available font ('+prop.value.font+'). Text remains editable.');
            var rect=layer.sourceRectAtTime ? layer.sourceRectAtTime(0,false) : {left:0,top:-node.fontSize*0.75,width:node.width,height:node.height};
            var layout=[0,0];
            if(node.outline) { layout[0]=node.outline.matrix[0][2];layout[1]=node.outline.matrix[1][2]; }
            else if(node.textLayout) { layout[0]=node.textLayout.left;layout[1]=node.textLayout.top; }
            node.textBoxOrigin=[rect.left-layout[0],rect.top-layout[1]];
            transformLayer(layer, node, node.textBoxOrigin);
            layer.property('ADBE Transform Group').property('ADBE Opacity').setValue(node.opacity * node.fillOpacity);
        } else throw new Error('Unknown type: ' + node.kind);
        return layer;
    }
    if (scene.version !== 1) throw new Error('Incompatible export version');
    if (scene.directTransfer) {
        if (!app.project) throw new Error('Open your project and a composition in After Effects before sending.');
        // Restore the composition viewer's focus if the Project panel was active.
        if (app.activeViewer && app.activeViewer.type===ViewerType.VIEWER_COMPOSITION) app.activeViewer.setActive();
        targetComp=app.project.activeItem;
        if (!(targetComp instanceof CompItem)) throw new Error('Activate the target composition in After Effects and send again from Figma.');
        if (targetComp.time>=targetComp.duration) throw new Error('Move the playhead within the composition duration.');
        oldSelection=targetComp.selectedLayers.slice(0);
    }
    app.beginUndoGroup('Import Figma AE Bridge');
    try {
        if (!app.project) app.newProject();
        if (scene.directTransfer) {
            var placement=compositionPlacement(targetComp),rootIndex;
            var rootMatte=null,rootMatteType=null;
            for(rootIndex=0;rootIndex<scene.roots.length;rootIndex++) {
                var rootLayers=flatNode(scene.roots[rootIndex],placement,[],100,rootMatte,rootMatteType,'');
                if(scene.roots[rootIndex].asMask) {
                    if(rootLayers.length!==1)throw new Error('The mask must be a single layer.');
                    rootMatte=rootLayers[0];rootMatteType=scene.roots[rootIndex].maskType==='LUMINANCE' ? TrackMatteType.LUMA : TrackMatteType.ALPHA;
                    rootMatte.enabled=false;
                }
            }
            for(rootIndex=0;rootIndex<oldSelection.length;rootIndex++) oldSelection[rootIndex].selected=false;
            for(rootIndex=0;rootIndex<createdLayers.length;rootIndex++) createdLayers[rootIndex].selected=createdLayers[rootIndex].enabled!==false;
            for(rootIndex=0;rootIndex<createdLayers.length;rootIndex++) createdLayers[rootIndex].comment+='\n'+warnings.join('\n');
            var importedLayers=createdLayers.length,precomposition=null;
            if(scene.precomposeSelection) {
                // Move only this transfer's layers, including its mattes. A full-size
                // precomp preserves all placement modes and the target's timing.
                var indices=[],preIndex,preLayer=null;
                for(preIndex=0;preIndex<createdLayers.length;preIndex++)indices.push(createdLayers[preIndex].index);
                indices.sort(function(a,b){return a-b;});
                var nested=targetComp.layers.precompose(indices,scene.name,true);
                created.push(nested);nested.parentFolder=app.project.rootFolder;
                nested.comment='Figma AE Bridge\n'+warnings.join('\n');
                for(preIndex=1;preIndex<=targetComp.numLayers;preIndex++)if(targetComp.layer(preIndex).source===nested){preLayer=targetComp.layer(preIndex);break;}
                if(!preLayer)throw new Error('The imported precomposition layer could not be found.');
                createdLayers=[preLayer];
                preLayer.startTime=0;preLayer.inPoint=targetComp.time;preLayer.outPoint=targetComp.duration;
                preLayer.comment='Figma AE Bridge | precomposition\n'+warnings.join('\n');preLayer.selected=true;
                precomposition={name:nested.name,id:nested.id,layers:importedLayers};
            }
            targetComp.openInViewer();
            return {ok:true,composition:targetComp.name,compositionId:targetComp.id,layers:createdLayers.length,precomposition:precomposition,warnings:warnings,clipping:clipping,assets:assetFolder ? assetFolder.fsName : null};
        }
        var main = comp(scene.name, scene.width, scene.height), i;
        if(scene.groupShapes || scene.precomposeSelection) {
            targetComp=main;
            for(i=0;i<scene.roots.length;i++) flatNode(scene.roots[i],[[1,0,0],[0,1,0]],[],100,null,null,'');
        } else if ((scene.build === '0.2' || scene.build === '0.3' || scene.build === '0.4' || scene.build === '0.4.1' || scene.build === '0.4.2' || scene.build === '0.4.3' || scene.build === '0.4.4' || scene.build === '0.4.5' || scene.build === '0.4.6' || scene.build === '0.4.7' || scene.build === '0.4.8' || scene.build === '0.4.9' || scene.build === '0.4.10' || scene.build === '0.4.11' || scene.build === '0.4.12' || scene.build === '0.4.13' || scene.build === '0.4.14' || scene.build === '0.4.15' || scene.build === '0.4.16' || scene.build === '0.4.17') && scene.roots.length === 1 && scene.roots[0].kind === 'container' && scene.roots[0].opacity === 100 && (!scene.roots[0].blendMode || scene.roots[0].blendMode === 'NORMAL' || scene.roots[0].blendMode === 'PASS_THROUGH')) {
            populateContainer(scene.roots[0],main);
        } else for (i = 0; i < scene.roots.length; i++) buildNode(scene.roots[i], main);
        main.comment = 'Figma AE Bridge — prototipo\n' + warnings.join('\n');
        main.openInViewer();
        alert('Import complete: ' + scene.name + '\n' + scene.stats.shapes + ' shapes · ' + scene.stats.text + ' text layers · ' + scene.stats.images + ' images\n' + (warnings.length ? warnings.length + ' warnings: see the composition comment.' : '') + (assetFolder ? '\nKeep the image folder: ' + assetFolder.fsName : ''));
        return main;
    } catch (error) {
        if (scene.directTransfer) {
            for(var l=createdLayers.length-1;l>=0;l--) { try { createdLayers[l].remove(); } catch(layerError) {} }
            for(var old=0;old<oldSelection.length;old++) { try {oldSelection[old].selected=true;}catch(selectionError){} }
        }
        // Remove project items created in this run only. Existing items are untouched.
        for (var k = created.length - 1; k >= 0; k--) { try { created[k].remove(); } catch (ignored) {} }
        if (!scene.directTransfer) alert('Import did not complete.\n' + error.toString() + (assetFolder ? '\nWritten PNG files remain in ' + assetFolder.fsName : ''));
        throw error;
    } finally { app.endUndoGroup(); }
}
