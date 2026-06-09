import type { Page, Locator } from '@playwright/test';
import { CreateDealForm } from '../../CreateDealForm';
import { IFormStep } from 'tests/interfaces/IFormStep';
import { expect } from '@playwright/test';

type ProgramSetupData = {
    amount: number;
}

export class AmountStep extends CreateDealForm implements IFormStep<ProgramSetupData> {
    
}