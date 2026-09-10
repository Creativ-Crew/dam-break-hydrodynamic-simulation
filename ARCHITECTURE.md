# System Architecture

User
→ Scenario Builder
→ DEM/GIS Preprocessor
→ Adaptive Grid Engine
→ Solver Selector
→ Fast Solver / Full SWE Solver
→ Parallel/GPU Engine
→ Accuracy Guard
→ Accept / Refine / Switch
→ Depth / Velocity / Arrival Time
→ Risk Analysis
→ GIS Dashboard
→ Benchmark & Report

## Key novelty
The prototype does not force the same computational fidelity everywhere. It allocates more computation only where the physics or decision impact requires it.

## Production implementation
1. Raster preprocessing and terrain conditioning.
2. Build coarse base mesh.
3. Detect breach, channels, steep terrain and critical assets.
4. Refine cells dynamically.
5. Use a fast solver in simple regions.
6. Switch to full 2D shallow-water equations in rapid/critical regions.
7. Run adaptive time stepping.
8. Apply mass-balance, stability and conservation checks.
9. Refine or switch solver when guard thresholds fail.
10. Export flood depth, velocity and arrival-time rasters.

## Validation
Compare against a trusted reference model and/or benchmark datasets.
Track:
- runtime
- flood extent error
- depth MAE/RMSE
- velocity error
- arrival-time error
- mass conservation
