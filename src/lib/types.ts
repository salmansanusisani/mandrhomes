export type ActionState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
} | null;

export type CheckoutState = ActionState;
