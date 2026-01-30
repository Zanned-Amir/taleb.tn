import countries from 'i18n-iso-countries';
import { ValidateBy, ValidationOptions } from 'class-validator';

export function IsValidCountryCode(validationOptions?: ValidationOptions) {
  return ValidateBy(
    {
      name: 'isValidCountryCode',
      validator: {
        validate: (value: any) => {
          return typeof value === 'string' && countries.isValid(value);
        },
        defaultMessage: () =>
          'country_code must be a valid ISO 3166-1 alpha-2 code',
      },
    },
    validationOptions,
  );
}
