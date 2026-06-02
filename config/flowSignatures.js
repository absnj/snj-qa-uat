module.exports = {
  loginAs: ['page', 'context', 'normalizedRole'],
  loginWithInvalidCredentials: ['page', 'context', 'normalizedRole'],

  navigateToSupport: ['page'],
  createTicketSuccess: ['page'],
  createTicketEmptySubject: ['page'],
  createTicketEmptyDescription: ['page'],
  createTicketLongSubject: ['page'],
  createLengthyTicketDescription: ['page'],

  createUserHappyPath: ['page'],
  staffUnableToCreate: ['page'],

  // First Name
  invalidFirstNameEmpty: ['page'],
  invalidFirstNameSpecialChars: ['page'],
  invalidFirstNameTooLong: ['page'],

  // Last Name
  invalidLastNameEmpty: ['page'],
  invalidLastNameSpecialChars: ['page'],

  // Email
  invalidEmailEmpty: ['page'],
  invalidEmailMissingAt: ['page'],
  invalidEmailMissingDomain: ['page'],
  invalidEmailMissingLocal: ['page'],
  invalidEmailDuplicate: ['page'],

  // Phone
  invalidPhoneEmpty: ['page'],
  invalidPhoneNonNumeric: ['page'],
  invalidPhoneTooShort: ['page'],
  invalidPhoneTooLong: ['page'],

  // Role
  invalidRoleNotSelected: ['page'],

  // Password
  invalidPasswordEmpty: ['page'],
  invalidPasswordTooShort: ['page'],
  invalidPasswordNoUppercase: ['page'],
  invalidPasswordNoLowercase: ['page'],
  invalidPasswordNoDigit: ['page'],
  invalidPasswordNoSpecialChar: ['page'],

  // Confirm Password
  invalidConfirmPasswordMismatch: ['page'],
  invalidConfirmPasswordEmpty: ['page'],

  // Blanket
  invalidAllFieldsEmpty: ['page'],

  // Boundary / positive guards
  validPasswordBoundaryMinimum: ['page'],
  validNameWithHyphenOrApostrophe: ['page'],

  // Configuration — Deals
  viewDealList: ['page'],
  createDealHappyPath: ['page'],
  staffUnableToCreateDeal: ['page'],

  // Configuration — Deals: Step 1 validation
  invalidDealTitleEmpty: ['page'],
  invalidDealTitleTooLong: ['page'],
  invalidDescriptionEmpty: ['page'],
  invalidDescriptionTooLong: ['page'],

  // Configuration — Deals: Step 2 validation
  invalidStartDateEmpty: ['page'],
  invalidEndDateEmpty: ['page'],
  invalidEndDateBeforeStartDate: ['page'],
  invalidEndTimeBeforeStartTime: ['page'],
  invalidStartTimeEmpty: ['page'],
  invalidEndTimeEmpty: ['page'],

  // Configuration — Deals: Step 3 validation
  invalidDealValueZero: ['page'],
  invalidDealValueEmpty: ['page'],
  invalidDealValueNegative: ['page'],
  invalidQuantityZero: ['page'],
  invalidQuantityNegative: ['page'],
  invalidMinimumSpendNegative: ['page'],
  emptyTermsAndConditionsNotAllowed: ['page'],
  dealValueExceedsOneHundredPercent: ['page'],

// ---------------------------------------------------------------------------
// Configuration — Loyalty Programs: Happy Path
// ---------------------------------------------------------------------------
createLoyaltyProgramVisitBased1Reward: ['page'],
createLoyaltyProgramTransactionBased1Reward: ['page'],
createLoyaltyProgramVisitBased5Rewards: ['page'],

// Configuration — Loyalty Programs: Access Control
staffUnableToCreateLoyaltyProgram: ['page'],

// Configuration — Loyalty Programs: Reward limit
addRewardButtonDisabledAtMax: ['page'],

// Configuration — Loyalty Programs: Step 1 validation
invalidVisitsPerStampEmpty: ['page'],
invalidAmountPerStampEmpty: ['page'],

// Configuration — Loyalty Programs: Step 2 validation
invalidLoyaltyTitleEmpty: ['page'],
invalidLoyaltyTitleTooLong: ['page'],
invalidLoyaltyDescriptionEmpty: ['page'],
invalidLoyaltyDescriptionTooLong: ['page'],

// Configuration — Loyalty Programs: Step 3 validation
invalidRewardMilestoneEmpty: ['page'],
invalidRewardNameEmpty: ['page'],
invalidRewardValidUntilEmpty: ['page'],
invalidRewardQuantityEmpty: ['page'],
};
