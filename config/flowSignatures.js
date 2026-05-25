module.exports = {
  loginAs: ['page', 'normalizedRole'],
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
};