export interface CountryInfo {
  code: string;
  name_ar: string;
  name_en: string;
  dialCode: string;
  police: string;
  ambulance: string;
  mental_health: string;
}

export const COUNTRIES: CountryInfo[] = [
  { code: 'EG', name_ar: 'مصر', name_en: 'Egypt', dialCode: '+20', police: '122', ambulance: '123', mental_health: '08008880700' },
  { code: 'SA', name_ar: 'السعودية', name_en: 'Saudi Arabia', dialCode: '+966', police: '999', ambulance: '997', mental_health: '920033360' },
  { code: 'AE', name_ar: 'الإمارات', name_en: 'UAE', dialCode: '+971', police: '999', ambulance: '998', mental_health: '8004673' },
  { code: 'KW', name_ar: 'الكويت', name_en: 'Kuwait', dialCode: '+965', police: '112', ambulance: '112', mental_health: '94048' },
  { code: 'QA', name_ar: 'قطر', name_en: 'Qatar', dialCode: '+974', police: '999', ambulance: '999', mental_health: '16000' },
  { code: 'OM', name_ar: 'عُمان', name_en: 'Oman', dialCode: '+968', police: '9999', ambulance: '9999', mental_health: '155' },
  { code: 'BH', name_ar: 'البحرين', name_en: 'Bahrain', dialCode: '+973', police: '999', ambulance: '999', mental_health: '17873333' },
  { code: 'JO', name_ar: 'الأردن', name_en: 'Jordan', dialCode: '+962', police: '911', ambulance: '911', mental_health: '110' },
  { code: 'LB', name_ar: 'لبنان', name_en: 'Lebanon', dialCode: '+961', police: '112', ambulance: '140', mental_health: '1564' },
  { code: 'IQ', name_ar: 'العراق', name_en: 'Iraq', dialCode: '+964', police: '104', ambulance: '122', mental_health: '131' },
  { code: 'MA', name_ar: 'المغرب', name_en: 'Morocco', dialCode: '+212', police: '190', ambulance: '150', mental_health: '0801001111' },
  { code: 'DZ', name_ar: 'الجزائر', name_en: 'Algeria', dialCode: '+213', police: '17', ambulance: '14', mental_health: '3030' },
  { code: 'TN', name_ar: 'تونس', name_en: 'Tunisia', dialCode: '+216', police: '197', ambulance: '190', mental_health: '1818' },
  { code: 'US', name_ar: 'أمريكا', name_en: 'United States', dialCode: '+1', police: '911', ambulance: '911', mental_health: '988' },
  { code: 'GB', name_ar: 'بريطانيا', name_en: 'UK', dialCode: '+44', police: '999', ambulance: '999', mental_health: '116123' },
  { code: 'DE', name_ar: 'ألمانيا', name_en: 'Germany', dialCode: '+49', police: '110', ambulance: '112', mental_health: '08001110111' },
  { code: 'FR', name_ar: 'فرنسا', name_en: 'France', dialCode: '+33', police: '17', ambulance: '15', mental_health: '3114' },
];

export const getCountryByCode = (code: string): CountryInfo | undefined =>
  COUNTRIES.find(c => c.code === code);

export const getCountryByDialCode = (dialCode: string): CountryInfo | undefined =>
  COUNTRIES.find(c => c.dialCode === dialCode);
