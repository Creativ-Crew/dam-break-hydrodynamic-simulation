# Adaptive Multi-Fidelity Dam-Break Flood Simulation — SIH26161

A software-only prototype for SIH26161: Dam Break Hydrodynamic Flood Simulation.

## Prototype concept
The dashboard demonstrates an **Adaptive Multi-Fidelity Flood Engine**:
- Fast solver for low-complexity regions
- Higher-fidelity shallow-water solver for critical/rapid-flow regions
- Adaptive refinement around the breach, channels and populated/critical areas
- Physics/accuracy guard
- Interactive flood layers and time playback
- Risk and performance benchmark dashboard

> The benchmark numbers in the UI are DEMO values for presentation only. Replace them with measured results from real validation runs before claiming performance improvements.

## Run
The prototype is intentionally dependency-light.

### Frontend
Open `frontend/index.html` in a browser.

### Optional backend
```bash
cd backend
python app.py
```
Then open `http://127.0.0.1:8000`.

## Project structure
- `frontend/` — interactive SIH presentation prototype
- `backend/` — lightweight API skeleton
- `docs/` — architecture and validation plan

## Suggested production stack
React + TypeScript + MapLibre/Leaflet, FastAPI, NumPy/Numba/CuPy/C++, Rasterio/GDAL/GeoPandas, PostgreSQL/PostGIS.
