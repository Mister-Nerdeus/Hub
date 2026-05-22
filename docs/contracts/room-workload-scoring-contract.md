# Room Workload Scoring Contract

Room workload scoring is a deterministic operational proxy. It is not a medical model and does not certify staffing safety.

## Weights

| Component | Points |
| --- | ---: |
| Acuity 1 | 1 |
| Acuity 2 | 2 |
| Acuity 3 | 4 |
| Acuity 4 | 7 |
| Acuity 5 | 10 |
| Trauma active | 8 |
| Isolation active | 3 |
| Behavioral risk | 4 |
| Fall risk | 2 |
| Sitter required | 5 |
| High or continuous medication frequency | 3 |
| High or continuous monitoring frequency | 3 |
| High or very high procedure burden | 4 |

## Output

`scoreRoomLoad` returns visible component points for acuity, trauma, isolation, behavioral risk, fall risk, sitter need, medication frequency, monitoring frequency, procedure burden, and `totalRoomBurden`.

Unoccupied rooms return zero for every component.
