
let csrf: null | string = null;

export function getCSRF() {
  return csrf;
}

export function setCSRF(newCsrf: string) {
  csrf = newCsrf;
}
