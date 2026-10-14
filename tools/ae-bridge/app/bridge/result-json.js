/* ES3 serializer for result messages: works even if AE has no global JSON. */
function encodeBridgeResult(value) {
    function quote(s) {
        return '"'+String(s).replace(/["\\\u0000-\u001f\u2028\u2029]/g,function(c){
            if(c==='"')return '\\"';if(c==='\\')return '\\\\';
            var hex=c.charCodeAt(0).toString(16);return '\\u'+('0000'+hex).slice(-4);
        })+'"';
    }
    if(value===null)return 'null';
    if(typeof value==='string')return quote(value);
    if(typeof value==='number')return isFinite(value)?String(value):'null';
    if(typeof value==='boolean')return value?'true':'false';
    var entries=[],i,key;
    if(value instanceof Array){for(i=0;i<value.length;i++)entries.push(encodeBridgeResult(value[i]));return '['+entries.join(',')+']';}
    if(typeof value==='object'){for(key in value)if(Object.prototype.hasOwnProperty.call(value,key)&&value[key]!==undefined)entries.push(quote(key)+':'+encodeBridgeResult(value[key]));return '{'+entries.join(',')+'}';}
    return 'null';
}
