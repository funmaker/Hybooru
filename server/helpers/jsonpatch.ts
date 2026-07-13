
export function getParts(path: string) {
  if(path === "") return [];
  return path.split(".");
}

function patchImpl(obj: any, parts: string[], value: any): any {
  if(parts.length === 0) {
    return value;
  } else {
    let propName: string | number = parts.shift()!;
    const isArray = Array.isArray(obj);
    
    if(isArray) {
      const index = parseInt(propName);
      if(isNaN(index)) throw new Error(`Invalid json path! Expected numeric index, got: '${propName}'.`);
      propName = index;
    }
    
    if(obj && obj[propName] === undefined && value === undefined) return obj;
    
    let newObj;
    if(isArray) newObj = [...obj];
    else newObj = { ...obj };
    
    if(parts.length === 0 && value === undefined) {
      if(isArray) {
        newObj.splice(propName, 1);
      } else {
        delete newObj[propName];
      }
    } else {
      newObj[propName] = patchImpl(newObj[propName], parts, value);
    }
    
    return newObj;
  }
}

export function patch(obj: any, path: string, value: any) {
  const parts = getParts(path);
  return patchImpl(obj, parts, value);
}

export function query(obj: any, path: string) {
  const parts = path.split(".");
  
  for(const part of parts) {
    if(typeof obj !== "object" || !obj) return undefined;
    obj = obj[part];
  }
  
  return obj;
}
