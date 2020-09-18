
export default class FormIterator implements Iterable<readonly [string, any]> {
  constructor(private form: HTMLFormElement) {}
  
  *[Symbol.iterator]() {
    const used: string[] = [];
    
    yield* Array.from(this.form.querySelectorAll("input[type=checkbox]")).map(cb => {
      const name = cb.getAttribute('name') || "unknown";
      used.push(name);
      return [name, (cb as HTMLInputElement).checked] as const;
    });
    yield* Array.from(this.form.querySelectorAll("input"))
          .map(field => [field.name, field.value] as const)
          .filter(field => !used.includes(field[0]));
  }
  
  serialize<T extends Record<string, any>>(): T {
    const data: Record<string, any> = {};
    for(const entry of this) {
      data[entry[0]] = entry[1];
    }
    return data as T;
  }
}
