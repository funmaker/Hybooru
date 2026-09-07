import axios, { AxiosError, AxiosResponse } from "axios";
import { toast, Id as ToastId } from "react-toastify";
import { ErrorResponse } from "../../types/api";

export default class ClientError extends Error {
  status: number;
  response: AxiosResponse<ErrorResponse> | null;
  inner: any;
  toastTimeout: NodeJS.Timeout | number | null = null;
  toastId: ToastId | null = null;
  isCancel: boolean;
  
  constructor(error: AxiosError<ErrorResponse> | ErrorResponse | Error) {
    const anyError = error as any;
    const message = anyError.response?.data?._error?.message || anyError.message || "Something Happened";
    
    super(message);
    
    this.status = anyError.response?.data?._error?.code || anyError.code || anyError.response?.status || 0;
    this.response = anyError.response || null;
    this.stack = anyError.response?.data?._error?.stack || anyError.stack || this.stack;
    this.inner = anyError;
    this.isCancel = axios.isCancel(anyError);
  }
  
  prepareNotify() {
    if(this.toastTimeout) return;
    
    this.toastTimeout = setTimeout(() => {
      this.toastTimeout = null;
      this.toastId = toast.error(this.message);
    }, 0);
  }
  
  cancelNotify() {
    if(this.toastTimeout) {
      clearTimeout(this.toastTimeout);
      this.toastTimeout = null;
    }
    if(this.toastId && toast.isActive(this.toastId)) {
      toast.dismiss(this.toastId);
      this.toastId = null;
    }
  }
}
