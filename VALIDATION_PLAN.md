# Validation Plan

## Test cases
Use reproducible dam-break benchmark cases first, then real DEM/event data.

## Metrics
- Flood extent IoU
- Depth MAE and RMSE
- Maximum depth difference
- Maximum velocity difference
- Arrival-time MAE
- Mass-balance error
- Wall-clock runtime

## Fair comparison
Keep the same:
- terrain
- boundary conditions
- breach hydrograph
- simulation duration
- output resolution

Run each case multiple times and report median runtime.

## Important
Do not present demo values as measured performance. The dashboard labels its sample benchmark as DEMO.
