import EventEmitter from "node:events";
import { ProgressMessage } from "../../types/api";

export type ProgressCallback = (progress: ProgressMessage) => void;
type InitFn<T> = (onProgress: ProgressCallback) => Promise<T>;

class DbLock extends EventEmitter implements IDbLock {
  protected promise: ImperativePromise<void> | null = null;
  public lastMessage: ProgressMessage | null = null;
  public lockName: string | null = null;
  
  async lock<T>(callback: InitFn<T>): Promise<T>;
  async lock<T>(name: string, callback: InitFn<T>): Promise<T>;
  async lock<T>(arg1: string | InitFn<T>, arg2?: InitFn<T>): Promise<T> {
    let callback, name;
    if(arg2) [name, callback] = [arg1 as string, arg2];
    else callback = arg1 as InitFn<T>;
    
    await this.await();
    const lock = this.promise = new ImperativePromise();
    this.lockName = name ?? null;
    this.lastMessage = null;
    
    try {
      const result = await callback(msg => this.emitProgress(msg));
      
      this.lockName = null;
      this.promise = null;
      lock.resolve();
      
      return result;
    } catch(err: any) {
      this.lockName = null;
      this.promise = null;
      lock.reject(err instanceof Error ? err : new Error("Rejected promise"));
      
      throw err;
    } finally {
      this.emit("end");
    }
  }
  
  async await() {
    while(this.promise) await this.promise;
  }
  
  isLocked() {
    return !!this.promise;
  }
  
  emitProgress(msg: ProgressMessage) {
    if(!this.isLocked()) return;
    
    this.lastMessage = msg;
    this.emit("progress", msg);
  }
}

interface IDbLock {
  on(event: 'progress', listener: (msg: ProgressMessage) => void): this;
  on(event: 'end', listener: () => void): this;
  
  emit(event: 'progress', msg: ProgressMessage): boolean;
  emit(event: 'end'): boolean;
}

export default DbLock;


type Resolve<T> = (value: (T | PromiseLike<T>)) => void;
type Reject = (reason?: any) => void;

export class ImperativePromise<T> extends Promise<T> {
  resolve!: Resolve<T>;
  reject!: Reject;
  
  constructor(callback?: (res: Resolve<T>, rej: Reject) => void) {
    let resolve: Resolve<T>;
    let reject: Reject;
    
    super((res, rej) => {
      [resolve, reject] = [res, rej];
      return callback?.(res, rej);
    });
    
    this.resolve = resolve!;
    this.reject = reject!;
  }
}
