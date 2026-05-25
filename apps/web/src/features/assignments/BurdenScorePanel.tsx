import type { Plan1AssignmentBurdenScore } from "@nerdeus/shared";

export function BurdenScorePanel({ burdenScore }: { burdenScore: Plan1AssignmentBurdenScore }) {
  return (
    <section className="assignment-panel" aria-labelledby="burden-score-title" data-assignment-stage="burden-score">
      <h3 id="burden-score-title">Operational Burden Score</h3>
      <strong>{burdenScore.totalBurdenScore}</strong>
      <table>
        <thead>
          <tr><th>Nurse</th><th>Occupied</th><th>Acuity</th><th>Walking</th><th>Warnings</th><th>Total</th></tr>
        </thead>
        <tbody>
          {burdenScore.nurseScores.map((score) => (
            <tr key={score.nurseId}>
              <td>{score.nurseId}</td>
              <td>{score.assignedOccupiedRoomCount}</td>
              <td>{score.acuityLoadPoints}</td>
              <td>{score.walkingDistancePoints + score.walkingTimePoints}</td>
              <td>{score.warningPenaltyPoints}</td>
              <td>{score.totalBurdenScore}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>{burdenScore.limitations.join(" ")}</p>
    </section>
  );
}
