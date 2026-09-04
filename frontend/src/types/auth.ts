export type SignUpFormData = {
  confirmPassword: string;
  email: string;
  firstName: string;
  lastName: string;
  newsletterSubscribed: boolean;
  password: string;
  phone: string;
};

export type SignInFormData = {
  email: string;
  password: string;
};

export type ResetPasswordFormData = {
  email: string;
};

export type UpdatePasswordFormData = {
  confirmPassword: string;
  password: string;
};

export type AuthFormErrors<TField extends string = string> = Partial<
  Record<TField | "form", string>
>;
