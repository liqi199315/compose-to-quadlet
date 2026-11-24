export const INTERNAL_TRAFFIC_STORAGE_KEY = 'qg_internal_traffic';

// Opt-in internal traffic marker: set only by visiting /?internal=1, cleared by /?internal=0.
export const INTERNAL_TRAFFIC_BOOTSTRAP = `(function(){
var key=${JSON.stringify(INTERNAL_TRAFFIC_STORAGE_KEY)};
var enabled=false;
try{enabled=localStorage.getItem(key)==='1';}catch(_e){}
try{
var params=new URLSearchParams(location.search);
if(params.has('internal')){
var value=params.get('internal');
if(value==='1'){
try{localStorage.setItem(key,'1');enabled=true;}catch(_e){}
}else if(value==='0'){
try{localStorage.removeItem(key);enabled=false;}catch(_e){}
}
params.delete('internal');
var search=params.toString();
history.replaceState(history.state,'',location.pathname+(search?'?'+search:'')+location.hash);
}
}catch(_e){}
window.__qgInternalTraffic=enabled===true;
})();`;

export function isInternalTraffic(): boolean {
	if (typeof window === 'undefined') {
		return false;
	}

	try {
		return window.localStorage?.getItem(INTERNAL_TRAFFIC_STORAGE_KEY) === '1';
	} catch {
		return false;
	}
}
