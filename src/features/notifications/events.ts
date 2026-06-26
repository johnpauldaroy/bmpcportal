export type NotificationEvent =
  | {
      type: "loan_status_changed";
      memberId: string;
      loanApplicationId: string;
      status: string;
    }
  | {
      type: "balance_snapshot_imported";
      memberId: string;
      snapshotType: "savings" | "share_capital";
      effectiveDate: string;
    }
  | {
      type: "insurance_expiring";
      memberId: string;
      insuranceRecordId: string;
      expiryDate: string;
    };

export function toNotificationPayload(event: NotificationEvent) {
  switch (event.type) {
    case "loan_status_changed":
      return {
        memberId: event.memberId,
        title: "Loan status updated",
        body: `Your loan application is now ${event.status}.`
      };
    case "balance_snapshot_imported":
      return {
        memberId: event.memberId,
        title: "Balance updated",
        body: `Your ${event.snapshotType.replace("_", " ")} snapshot was updated as of ${event.effectiveDate}.`
      };
    case "insurance_expiring":
      return {
        memberId: event.memberId,
        title: "Insurance expiring",
        body: `Your insurance record expires on ${event.expiryDate}.`
      };
  }
}
