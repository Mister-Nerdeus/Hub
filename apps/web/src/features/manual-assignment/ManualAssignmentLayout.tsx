import type { ReactNode } from "react";

type ManualAssignmentLayoutProps = {
  floorplanOverview: ReactNode;
  roomAssignmentTable: ReactNode;
  nurseAssignmentCards: ReactNode;
  assignmentIssues: ReactNode;
  burdenExplanation: ReactNode;
  children?: ReactNode;
};

export function ManualAssignmentLayout({
  floorplanOverview,
  roomAssignmentTable,
  nurseAssignmentCards,
  assignmentIssues,
  burdenExplanation,
  children
}: ManualAssignmentLayoutProps) {
  return (
    <div
      className="manual-assignment-layout"
      data-manual-assignment-layout="three-column"
      data-manual-assignment-uses-assignment-set="true"
    >
      <div className="manual-assignment-layout__columns">
        <div className="manual-assignment-layout__column" data-manual-assignment-column="floorplan-overview">
          {floorplanOverview}
        </div>
        <div className="manual-assignment-layout__column" data-manual-assignment-column="room-assignment-table">
          {roomAssignmentTable}
        </div>
        <div className="manual-assignment-layout__column" data-manual-assignment-column="nurse-assignment-cards">
          {nurseAssignmentCards}
        </div>
      </div>
      {assignmentIssues}
      {burdenExplanation}
      {children}
    </div>
  );
}
