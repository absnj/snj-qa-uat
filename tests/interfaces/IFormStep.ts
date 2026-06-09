// tests/pages/interfaces/IFormStep.ts
export interface IFormStep<T> {
  fill(data: T): Promise<void>;
  next(): Promise<void>;
}

export interface ISubmitStep<T> {
  fill(data: T): Promise<void>;
  submit(): Promise<void>;
}