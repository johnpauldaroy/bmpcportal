// Option lists mirroring the public BMPC online loan application form.
// Values are stable machine codes; labels are what the member sees.

export type Option = { value: string; label: string };

export const loanTypeOptions: Option[] = [
  { value: "multi_purpose", label: "Multi-Purpose Loan" },
  { value: "salary", label: "Salary Loan" },
  { value: "faxcom", label: "FAXCOM Loan" },
  { value: "honorarium", label: "Honorarium Loan" },
  { value: "medap", label: "MEDAP" },
  { value: "pension", label: "Pension Loan" },
  { value: "enhanced_educational", label: "Enhanced Educational Loan" },
  { value: "others", label: "Others" }
];

export const securityOfferedOptions: Option[] = [
  { value: "savings_time_deposits", label: "Savings/Time Deposits" },
  { value: "real_estate", label: "Real Estate" },
  { value: "chattel", label: "Chattel" },
  { value: "jewelry", label: "Jewelry" },
  { value: "none", label: "None" }
];

export const loanPurposeOptions: Option[] = [
  { value: "agricultural", label: "Agricultural" },
  { value: "fishing", label: "Fishing" },
  { value: "livestocks", label: "Livestocks" },
  { value: "entrepreneurial_services", label: "Entrepreneurial services" },
  { value: "entrepreneurial_trading", label: "Entrepreneurial trading" },
  { value: "manufacturing_processing", label: "Manufacturing/processing" },
  { value: "education", label: "Education" },
  { value: "consumption", label: "Consumption" },
  { value: "medical", label: "Medical" },
  { value: "housing_repair", label: "Housing/house repair" },
  { value: "property_acquisition", label: "Property acquisition" },
  { value: "miscellaneous", label: "Miscellaneous" },
  { value: "placement_fee", label: "Placement fee" },
  { value: "restructuring", label: "Restructuring" }
];

export const civilStatusOptions: Option[] = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "separated", label: "Separated" },
  { value: "widowed", label: "Widowed" }
];

export const dependentsOptions: Option[] = [
  { value: "0", label: "None" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "6", label: "6" },
  { value: "7", label: "7" },
  { value: "8", label: "8" },
  { value: "9", label: "9" },
  { value: "10", label: "10" },
  { value: "11", label: "10 or more" }
];

export const occupationOptions: Option[] = [
  { value: "government_employee", label: "Government employee" },
  { value: "private_employee", label: "Private employee" },
  { value: "self_employed_non_professional", label: "Self employed (non-professional)" },
  { value: "self_employed_professional", label: "Self employed (practicing professional)" },
  { value: "business_entrepreneur", label: "Business person/entrepreneur" },
  { value: "church_worker", label: "Church servants/worker" },
  { value: "ofw", label: "Overseas Filipino Worker (OFW)" },
  { value: "retiree_pensioner", label: "Retiree/Pensioner" },
  { value: "homemaker", label: "Housewife/Househusbands" },
  { value: "youth_student", label: "Youth/Student" },
  { value: "farmer_fisherfolk", label: "Farmer/Fisherfolks" },
  { value: "laborer", label: "Laborer" }
];

export const employmentStatusOptions: Option[] = [
  { value: "permanent", label: "Permanent" },
  { value: "contractual", label: "Contractual" },
  { value: "temporary", label: "Temporary" }
];

export const validIdOptions: Option[] = [
  { value: "sss", label: "SSS" },
  { value: "gsis", label: "GSIS" },
  { value: "umid", label: "UMID" },
  { value: "lto_drivers_license", label: "LTO Driver's License" },
  { value: "prc", label: "PRC" },
  { value: "owwa_ecard", label: "OWWA E-Card" },
  { value: "voters_id", label: "Voter's ID" },
  { value: "senior_citizen", label: "Senior Citizen" },
  { value: "philippine_postal", label: "Philippine Postal" },
  { value: "passport", label: "Latest Passport" },
  { value: "tin", label: "TIN" },
  { value: "philhealth", label: "PhilHealth" }
];

export const propertyDescriptionOptions: Option[] = [
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "industrial", label: "Industrial" },
  { value: "agricultural", label: "Agricultural" }
];

export function optionValues(options: Option[]): [string, ...string[]] {
  return options.map((option) => option.value) as [string, ...string[]];
}
