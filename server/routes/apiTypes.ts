
export interface IndexResponse {
  kek: string;
}

export interface ErrorResponse {
  error: {
    code: number;
    message: string;
    stack?: string;
  };
}
