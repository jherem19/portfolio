/* Shared geometry code: ES3-compatible for Adobe ExtendScript. */
var BridgeCore = (function () {
    function point(x, y) { return [x, y]; }
    function sub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
    function parsePath(data) {
        var tokens = data.match(/[MLCQZmlcqz]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g) || [];
        if (data.replace(/[MLCQZmlcqz]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?|[\s,]/g, '') !== '') {
            throw new Error('Unsupported vector command');
        }
        var i = 0, cmd = '', current = [0, 0], paths = [], path = null;
        function num() { if (i >= tokens.length || /^[a-z]$/i.test(tokens[i])) throw new Error('Invalid path'); return Number(tokens[i++]); }
        function read(relative) { var p = [num(), num()]; return relative ? [p[0] + current[0], p[1] + current[1]] : p; }
        function add(p, incoming) { path.vertices.push(p); path.inTangents.push(incoming || [0, 0]); path.outTangents.push([0, 0]); current = p; }
        function finish() {
            if (!path) return;
            var v = path.vertices, last = v.length - 1;
            if (path.closed && last > 0 && Math.abs(v[0][0] - v[last][0]) < 0.000001 && Math.abs(v[0][1] - v[last][1]) < 0.000001) {
                path.inTangents[0] = path.inTangents[last]; v.pop(); path.inTangents.pop(); path.outTangents.pop();
            }
            if (v.length) paths.push(path);
            path = null;
        }
        while (i < tokens.length) {
            if (/^[a-z]$/i.test(tokens[i])) cmd = tokens[i++];
            var relative = cmd === cmd.toLowerCase(), upper = cmd.toUpperCase(), p, a, b;
            if (upper === 'M') { p = read(relative); finish(); path = {vertices: [], inTangents: [], outTangents: [], closed: false}; add(p); cmd = relative ? 'l' : 'L'; }
            else if (upper === 'Z') { if (!path) throw new Error('Invalid close'); path.closed = true; current = path.vertices[0]; finish(); cmd = ''; }
            else {
                if (!path) throw new Error('Path must start with M');
                if (upper === 'L') add(read(relative));
                else if (upper === 'C') {
                    a = read(relative); b = read(relative); p = read(relative);
                    path.outTangents[path.vertices.length - 1] = sub(a, current); add(p, sub(b, p));
                } else if (upper === 'Q') {
                    a = read(relative); p = read(relative);
                    var start = current;
                    path.outTangents[path.vertices.length - 1] = [(a[0] - start[0]) * 2 / 3, (a[1] - start[1]) * 2 / 3];
                    add(p, [(a[0] - p[0]) * 2 / 3, (a[1] - p[1]) * 2 / 3]);
                } else throw new Error('Unsupported vector command');
            }
        }
        finish(); return paths;
    }
    function transform(m) {
        var a = m[0][0], b = m[1][0], c = m[0][1], d = m[1][1];
        var sx = Math.sqrt(a * a + b * b), sy = Math.sqrt(c * c + d * d);
        if (sx < 0.000001 || sy < 0.000001) throw new Error('Degenerate transform');
        if (Math.abs(a * c + b * d) > 0.0001 * sx * sy) throw new Error('Skew transform not supported in this prototype');
        if (a * d - b * c < 0) sy = -sy;
        return {position: [m[0][2], m[1][2]], scale: [sx * 100, sy * 100], rotation: Math.atan2(b, a) * 180 / Math.PI};
    }
    function base64(bytes) {
        var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/', out = '', i;
        for (i = 0; i < bytes.length; i += 3) {
            var a = bytes[i], b = i + 1 < bytes.length ? bytes[i + 1] : 0, c = i + 2 < bytes.length ? bytes[i + 2] : 0;
            out += alphabet.charAt(a >> 2) + alphabet.charAt(((a & 3) << 4) | (b >> 4)) + (i + 1 < bytes.length ? alphabet.charAt(((b & 15) << 2) | (c >> 6)) : '=') + (i + 2 < bytes.length ? alphabet.charAt(c & 63) : '=');
        }
        return out;
    }
    function decode64(s) {
        var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/', out = '', i;
        for (i = 0; i < s.length; i += 4) {
            var a = alphabet.indexOf(s.charAt(i)), b = alphabet.indexOf(s.charAt(i + 1)), c = alphabet.indexOf(s.charAt(i + 2)), d = alphabet.indexOf(s.charAt(i + 3));
            out += String.fromCharCode((a << 2) | (b >> 4));
            if (c >= 0) out += String.fromCharCode(((b & 15) << 4) | (c >> 2));
            if (d >= 0) out += String.fromCharCode(((c & 3) << 6) | d);
        }
        return out;
    }
    function pathControls(paths) {
        var points=[],i,j,p,v,next;
        for(i=0;i<paths.length;i++) {
            p=paths[i];
            for(j=0;j<p.vertices.length;j++) {
                v=p.vertices[j];points.push(v);
                if(j+1<p.vertices.length || p.closed) {
                    next=(j+1)%p.vertices.length;
                    points.push([v[0]+p.outTangents[j][0],v[1]+p.outTangents[j][1]]);
                    v=p.vertices[next];points.push([v[0]+p.inTangents[next][0],v[1]+p.inTangents[next][1]]);
                }
            }
        }
        return points;
    }
    function pointsBounds(points) {
        if(!points.length) return null;
        var b=[points[0][0],points[0][1],points[0][0],points[0][1]],i;
        for(i=1;i<points.length;i++) {b[0]=Math.min(b[0],points[i][0]);b[1]=Math.min(b[1],points[i][1]);b[2]=Math.max(b[2],points[i][0]);b[3]=Math.max(b[3],points[i][1]);}
        return b;
    }
    function boundsCorners(b) {return [[b[0],b[1]],[b[2],b[1]],[b[2],b[3]],[b[0],b[3]]];}
    function convexPolygon(points) {
        var polygon=[],i,j,area=0,sign,a,b,c,cross;
        // Complex/custom clips remain intact. Frames normally have 4–12 controls.
        if(points.length>128) return false;
        for(i=0;i<points.length;i++) if(!polygon.length || Math.abs(points[i][0]-polygon[polygon.length-1][0])+Math.abs(points[i][1]-polygon[polygon.length-1][1])>0.000001) polygon.push(points[i]);
        if(polygon.length>1 && Math.abs(polygon[0][0]-polygon[polygon.length-1][0])+Math.abs(polygon[0][1]-polygon[polygon.length-1][1])<0.000001) polygon.pop();
        if(polygon.length<3) return false;
        for(i=0;i<polygon.length;i++) {a=polygon[i];b=polygon[(i+1)%polygon.length];area+=a[0]*b[1]-a[1]*b[0];}
        if(Math.abs(area)<0.000001) return false;
        sign=area>0?1:-1;
        for(i=0;i<polygon.length;i++) {
            a=polygon[i];b=polygon[(i+1)%polygon.length];
            for(j=0;j<polygon.length;j++) {c=polygon[j];cross=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);if(sign*cross < -0.000001) return false;}
        }
        return polygon;
    }
    function clipContainsPoints(clip, points) {
        if(!points.length || clip.length!==1 || !clip[0].closed) return false;
        var path=clip[0],controls=pathControls(clip),vertices=path.vertices,i,j,a,b,c,area=0,sign;
        // A convex control contour certifies that the endpoint polygon is inside
        // the curved clip. Testing that smaller polygon never removes corner cuts.
        if(!convexPolygon(controls) || !convexPolygon(vertices)) return false;
        for(i=0;i<vertices.length;i++) {a=vertices[i];b=vertices[(i+1)%vertices.length];area+=a[0]*b[1]-a[1]*b[0];}
        sign=area>0?1:-1;
        for(i=0;i<vertices.length;i++) {
            a=vertices[i];b=vertices[(i+1)%vertices.length];
            for(j=0;j<points.length;j++) {c=points[j];if(sign*((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])) < -0.000001) return false;}
        }
        return true;
    }
    function samePaths(a,b) {
        if(a.length!==b.length) return false;
        var i,j,k,fields=['vertices','inTangents','outTangents'];
        for(i=0;i<a.length;i++) {
            if(a[i].closed!==b[i].closed || a[i].vertices.length!==b[i].vertices.length) return false;
            for(k=0;k<fields.length;k++) for(j=0;j<a[i][fields[k]].length;j++) if(Math.abs(a[i][fields[k]][j][0]-b[i][fields[k]][j][0])+Math.abs(a[i][fields[k]][j][1]-b[i][fields[k]][j][1])>0.000001) return false;
        }
        return true;
    }
    return {parsePath: parsePath, transform: transform, base64: base64, decode64: decode64, pathControls:pathControls, pointsBounds:pointsBounds, boundsCorners:boundsCorners, clipContainsPoints:clipContainsPoints, samePaths:samePaths};
}());
