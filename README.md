# 🌍 GeoForecaster

A geopolitical super-forecasting platform that extracts and visualizes time-varying data from CIA World Factbook editions for trend analysis.

![Dashboard Preview](docs/dashboard.png)

## 📋 Project Scope

### Current Capabilities
- **Data Source**: 2010 CIA World Factbook (parsed from raw HTML).
- **Core Dataset**: Focuses on time-varying indicators relevant for forecasting:
    - **Demographics**: Population (adjusted for density), Growth Rates, Median Age.
    - **Economy**: GDP (PPP), Trade Balance, Debt, Energy Production.
    - **Political**: Leadership and Election cycles.
    - **Military**: Expenditures and Manpower.
- **Visualization**: Dashboard with global stats, leaderboards, and side-by-side comparison tables.

### Future Roadmap
- **Interactive 3D Globe**: Immersive visualization of geopolitical power indices (GDP, Military) on a 3D Earth using `globe.gl`.
- **Trend Analysis**: Ingestion of multi-year datasets (1990-2025) to generate time-series graphs and detect significant geopolitical shifts (e.g., "Rapid Militarization Alert" or "Economic Collapse Warning").

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev
# Open http://localhost:3000
```
*(See `extract_factbook.py` notes below for data ingestion)*

---

## 🏗️ Architecture

```
/
├── extract_factbook.py    # Python extraction script (Stream processing ~18MB HTML)
├── merge_timeseries.py    # Trend detection utility
├── data/                  # Extracted JSON data (No database required)
│   ├── 2010/              # Per-year country files
│   └── _merged/           # Time-series aggregations
└── src/                   # Next.js Application
    ├── app/               # App Router & API
    └── components/        # UI (Globe, Charts)
```

## 📥 Adding Data (Trend Analysis)

To enable forecasting capabilities, you can feed the system additional Factbook years.
We recommend **Project Gutenberg** or **CIA Archives** for editions like:
- **2000** (Pre-9/11 Baseline)
- **2015** (Mid-decade Checkpoint)
- **2025** (Current State)

**Workflow**:
1. Download HTML factbook.
2. Run extraction: `python extract_factbook.py factbook_2015.html --year 2015`
3. Run merge: `python merge_timeseries.py`
4. Application automatically visualizes the new historical context.

---

## 🔐 Security & Deployment

Designed for **AWS Amplify** with high-security standards:
- **Strict-Transport-Security (HSTS)**: Enforced HTTPS.
- **Content-Security-Policy (CSP)**: Strict resource control.
- **Permissions-Policy**: Locks down device features (Camera, Mic, Location).

Deployed at: `https://rockrun.cloud`

---

## License

Data source: CIA World Factbook (Public Domain)
Code: MIT License
