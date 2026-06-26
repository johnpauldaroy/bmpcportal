"use client";

import {
  civilStatusOptions,
  dependentsOptions,
  employmentStatusOptions,
  occupationOptions,
  validIdOptions
} from "./application-options";
import { FieldGrid, SelectField, TextField } from "./application-form-fields";

export type PersonState = {
  firstName: string;
  lastName: string;
  middleName: string;
  presentAddress: string;
  permanentAddress: string;
  phoneNo: string;
  landlineNo: string;
  otherContactNo: string;
  email: string;
  civilStatus: string;
  noOfDependents: string;
  occupation: string;
  employer: string;
  monthlySalary: string;
  employmentStatus: string;
  otherMonthlyIncome: string;
  taxIdentificationNumber: string;
  validId: string;
  idNumber: string;
  spouseName: string;
  shareCapitalAsOf: string;
  shareCapitalAmount: string;
};

export function emptyPerson(): PersonState {
  return {
    firstName: "",
    lastName: "",
    middleName: "",
    presentAddress: "",
    permanentAddress: "",
    phoneNo: "",
    landlineNo: "",
    otherContactNo: "",
    email: "",
    civilStatus: "",
    noOfDependents: "",
    occupation: "",
    employer: "",
    monthlySalary: "",
    employmentStatus: "",
    otherMonthlyIncome: "",
    taxIdentificationNumber: "",
    validId: "",
    idNumber: "",
    spouseName: "",
    shareCapitalAsOf: "",
    shareCapitalAmount: ""
  };
}

export function PersonFieldset({
  person,
  onChange,
  requireCoreOnly = false
}: {
  person: PersonState;
  onChange: (patch: Partial<PersonState>) => void;
  // Co-maker blocks only require name on the public form; applicant requires full detail.
  requireCoreOnly?: boolean;
}) {
  const required = !requireCoreOnly;

  return (
    <div className="grid gap-4">
      <FieldGrid>
        <TextField
          label="First Name"
          required
          value={person.firstName}
          onChange={(value) => onChange({ firstName: value })}
        />
        <TextField
          label="Last Name"
          required
          value={person.lastName}
          onChange={(value) => onChange({ lastName: value })}
        />
        <TextField
          label="Middle Name"
          required={required}
          value={person.middleName}
          onChange={(value) => onChange({ middleName: value })}
        />
      </FieldGrid>

      <TextField
        label="Present Address"
        required={required}
        value={person.presentAddress}
        onChange={(value) => onChange({ presentAddress: value })}
      />
      <TextField
        label="Permanent Address"
        required={required}
        value={person.permanentAddress}
        onChange={(value) => onChange({ permanentAddress: value })}
      />

      <FieldGrid>
        <TextField
          label="Phone No."
          required={required}
          inputMode="tel"
          value={person.phoneNo}
          onChange={(value) => onChange({ phoneNo: value })}
        />
        <TextField
          label="Landline No."
          value={person.landlineNo}
          inputMode="tel"
          onChange={(value) => onChange({ landlineNo: value })}
        />
        <TextField
          label="Other Contact No."
          value={person.otherContactNo}
          inputMode="tel"
          onChange={(value) => onChange({ otherContactNo: value })}
        />
      </FieldGrid>

      <FieldGrid>
        <TextField
          label="Email"
          type="email"
          inputMode="email"
          required={required}
          value={person.email}
          onChange={(value) => onChange({ email: value })}
        />
        <SelectField
          label="Civil Status"
          required={required}
          options={civilStatusOptions}
          value={person.civilStatus}
          onChange={(value) => onChange({ civilStatus: value })}
        />
        <SelectField
          label="No. of Dependent/s"
          required={required}
          options={dependentsOptions}
          value={person.noOfDependents}
          onChange={(value) => onChange({ noOfDependents: value })}
        />
      </FieldGrid>

      <FieldGrid>
        <SelectField
          label="Occupation"
          required={required}
          options={occupationOptions}
          value={person.occupation}
          onChange={(value) => onChange({ occupation: value })}
        />
        <TextField
          label="Employer"
          placeholder="if employed"
          value={person.employer}
          onChange={(value) => onChange({ employer: value })}
        />
        <TextField
          label="Other Monthly Income"
          inputMode="decimal"
          value={person.otherMonthlyIncome}
          onChange={(value) => onChange({ otherMonthlyIncome: value })}
        />
      </FieldGrid>

      <FieldGrid>
        <TextField
          label="Monthly Salary"
          inputMode="decimal"
          value={person.monthlySalary}
          onChange={(value) => onChange({ monthlySalary: value })}
        />
        <SelectField
          label="Employment Status"
          options={employmentStatusOptions}
          value={person.employmentStatus}
          onChange={(value) => onChange({ employmentStatus: value })}
        />
        <TextField
          label="Spouse Name"
          value={person.spouseName}
          onChange={(value) => onChange({ spouseName: value })}
        />
      </FieldGrid>

      <FieldGrid>
        <TextField
          label="Tax Identification Number"
          value={person.taxIdentificationNumber}
          onChange={(value) => onChange({ taxIdentificationNumber: value })}
        />
        <SelectField
          label="Valid ID"
          options={validIdOptions}
          value={person.validId}
          onChange={(value) => onChange({ validId: value })}
        />
        <TextField
          label="ID Number"
          value={person.idNumber}
          onChange={(value) => onChange({ idNumber: value })}
        />
      </FieldGrid>

      <FieldGrid>
        <TextField
          label="Share Capital as of (date)"
          type="date"
          value={person.shareCapitalAsOf}
          onChange={(value) => onChange({ shareCapitalAsOf: value })}
        />
        <TextField
          label="Share Capital Amount"
          inputMode="decimal"
          value={person.shareCapitalAmount}
          onChange={(value) => onChange({ shareCapitalAmount: value })}
        />
      </FieldGrid>
    </div>
  );
}
