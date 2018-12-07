const xfcEvent = e => `xfc.${e}`;
const xfcProviderEvent = e => xfcEvent(`provider.${e}`);

export const authorized = xfcEvent('authorized');
export const error = xfcEvent('error');
export const fullscreen = xfcEvent('fullscreen');
export const launched = xfcEvent('launched');
export const mounted = xfcEvent('mounted');
export const providerHttpError = xfcProviderEvent('httpError');
export const ready = xfcEvent('ready');
export const unload = xfcEvent('unload');
export const unmounted = xfcEvent('unmounted');
