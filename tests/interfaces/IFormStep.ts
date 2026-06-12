// tests/pages/interfaces/IFormStep.ts
export interface IFormStep<Tdata, Tpage> {
  fill(data: Tdata): Promise<void>;
  next(): Promise<Tpage>;
}

export interface ISubmitStep<T> {
  submit(): Promise<T>;
}
