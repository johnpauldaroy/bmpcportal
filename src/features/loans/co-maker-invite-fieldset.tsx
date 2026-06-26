"use client";

import { FieldGrid, TextField } from "./application-form-fields";

export type CoMakerInviteState = {
  firstName: string;
  lastName: string;
  middleName: string;
  contactNo: string;
  email: string;
};

export function emptyCoMakerInvite(): CoMakerInviteState {
  return { firstName: "", lastName: "", middleName: "", contactNo: "", email: "" };
}

export function CoMakerInviteFieldset({
  coMaker,
  onChange
}: {
  coMaker: CoMakerInviteState;
  onChange: (patch: Partial<CoMakerInviteState>) => void;
}) {
  return (
    <div className="grid gap-4">
      <FieldGrid>
        <TextField
          label="First Name"
          required
          value={coMaker.firstName}
          onChange={(value) => onChange({ firstName: value })}
        />
        <TextField
          label="Last Name"
          required
          value={coMaker.lastName}
          onChange={(value) => onChange({ lastName: value })}
        />
        <TextField
          label="Middle Name"
          value={coMaker.middleName}
          onChange={(value) => onChange({ middleName: value })}
        />
      </FieldGrid>
      <FieldGrid>
        <TextField
          label="Contact No."
          required
          inputMode="tel"
          value={coMaker.contactNo}
          onChange={(value) => onChange({ contactNo: value })}
        />
        <TextField
          label="Email Address"
          required
          type="email"
          inputMode="email"
          value={coMaker.email}
          onChange={(value) => onChange({ email: value })}
        />
      </FieldGrid>
    </div>
  );
}
