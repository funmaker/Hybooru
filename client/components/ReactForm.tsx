import React, { useCallback } from "react";
import { useHistory } from "react-router";

export default function ReactForm({ action, ...props }: React.FormHTMLAttributes<HTMLFormElement>) {
  const history = useHistory();
  
  const onSubmit = useCallback<React.FormEventHandler<HTMLFormElement>>(ev => {
    ev.preventDefault();
    const formData = new FormData(ev.currentTarget);
    const search = new URLSearchParams(formData as any).toString();
    
    history.push(`${action}${search ? `?${search}` : ""}`);
  }, [action, history]);
  
  return <form action={action} {...props} onSubmit={onSubmit} />;
}

