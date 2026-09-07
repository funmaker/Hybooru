import React, { useCallback } from "react";
import { useLocation } from "wouter";

export interface ReactFormProps extends React.ComponentProps<"form"> {
  action?: string;
  processFormData?: (data: FormData) => void;
}

export default function ReactForm({ action, processFormData, ...props }: ReactFormProps) {
  const [, navigate] = useLocation();
  
  const onSubmit = useCallback<React.FormEventHandler<HTMLFormElement>>(ev => {
    ev.preventDefault();
    const formData = new FormData(ev.currentTarget);
    formData.forEach((value, key) => value === "" && formData.delete(key));
    
    if(processFormData) processFormData(formData);
    
    const search = new URLSearchParams(formData as any).toString();
    const submitter = (ev.nativeEvent as SubmitEvent).submitter;
    const formAction = submitter && submitter.getAttribute("formaction");
    
    navigate(`${formAction || action}${search ? `?${search}` : ""}`);
  }, [action, processFormData, navigate]);
  
  return <form action={action} {...props} onSubmit={onSubmit} />;
}

