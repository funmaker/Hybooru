import React, { useCallback } from "react";
import { useHistory } from "react-router";

export interface ReactFormProps extends React.ComponentProps<"form"> {
  action?: string;
}

export default function ReactForm({ action, ...props }: ReactFormProps) {
  const history = useHistory();
  
  const onSubmit = useCallback<React.FormEventHandler<HTMLFormElement>>(ev => {
    ev.preventDefault();
    const formData = new FormData(ev.currentTarget);
    formData.forEach((value, key) => value === "" && formData.delete(key));
    
    const search = new URLSearchParams(formData as any).toString();
    const submitter = (ev.nativeEvent as SubmitEvent).submitter;
    const formAction = submitter && submitter.getAttribute("formaction");
    
    history.push(`${formAction || action}${search ? `?${search}` : ""}`);
  }, [action, history]);
  
  return <form action={action} {...props} onSubmit={onSubmit} />;
}

