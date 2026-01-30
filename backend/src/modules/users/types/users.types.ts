export const SETTINGS_THEME = {
  light: 'light',
  dark: 'dark',
};

export type ThemeType = (typeof SETTINGS_THEME)[keyof typeof SETTINGS_THEME];

export const SETTINGS_LANGUAGE = {
  en: 'en',
  fr: 'fr',
  ar: 'ar',
  tn: 'tn',
};

export type LanguageType =
  (typeof SETTINGS_LANGUAGE)[keyof typeof SETTINGS_LANGUAGE];

export const ACCOUNT_STATUS = {
  inactive: 'inactive',
  active: 'active',
  suspended: 'suspended',
  deactivated: 'deactivated',
  soft_deleted: 'soft_deleted',
};

export type AccountStatusType =
  (typeof ACCOUNT_STATUS)[keyof typeof ACCOUNT_STATUS];
