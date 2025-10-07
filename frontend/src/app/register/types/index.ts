export type RegisterFormData = {
  email: string;
  password: string;
};

export type RegisterState = {
  email: string;
  password: string;
  error: string;
  isLoading: boolean;
};
