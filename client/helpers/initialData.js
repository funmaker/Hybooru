import requestJSON from "./requestJSON";

let initialData = null;
let cancel = null;

export function setInitialData(data) {
	if(cancel) cancel();
	cancel = null;
	initialData = data;
}

export function getInitialData() {
	if(initialData instanceof Promise) return null;
	
	return initialData;
}

export function fetchInitialData() {
	if(initialData !== null) return initialData;
	
	return initialData = requestJSON({
		cancelCb: cancelFn => cancel = cancelFn,
	});
}
