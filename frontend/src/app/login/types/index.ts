export type LoginFormData = {
  email: string;
  password: string;
};

export type LoginState = {
  email: string;
  password: string;
  error: string;
  isLoading: boolean;
};
