# CITYSYNC – Installation & Deployment Guide

## 1. System Requirements & Prerequisites

CITYSYNC is designed to run locally or deployed in containerized cloud environments with minimal setup overhead.

### Prerequisites:
- **Operating System**: Windows 10/11, macOS (12+), or Linux (Ubuntu 20.04+, Debian 11+, RHEL 8+).
- **Python Runtime**: Python 3.10, 3.11, 3.12, 3.13, or 3.14.
- **Node/Frontend Runtime**: None required! CITYSYNC uses native HTML5, CSS3, and ES6+ JavaScript without node_modules, webpack, or npm builds.
- **Disk Space**: At least 500 MB free space.
- **RAM**: Minimum 2 GB RAM (4 GB recommended).

---

## 2. Quickstart Installation (Under 3 Minutes)

### Step 1: Clone the Repository
```bash
git clone https://github.com/citysync/citysync.git
cd CITYSYNC
```

### Step 2: Create & Activate Python Virtual Environment
**On Windows (PowerShell):**
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**On Linux / macOS (Bash / Zsh):**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### Step 3: Install Backend Dependencies
```bash
python -m pip install --upgrade pip
python -m pip install -r backend/requirements.txt
```

*Key Packages Installed:*
- `fastapi`, `uvicorn`, `starlette`
- `sqlalchemy`, `pydantic`, `pydantic-settings`
- `pyjwt`, `bcrypt`
- `pandas`, `numpy`, `joblib`
- `pytest`, `httpx`

---

## 3. Configuration & Environment Variables

Copy `.env.example` to `.env` (or use the defaults provided):
```bash
cp .env.example .env
```

### Configuration Variables (`.env`):
| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `APP_NAME` | `CITYSYNC` | Application identification |
| `APP_ENV` | `development` | `development` or `production` |
| `DEBUG` | `True` | Debug logging enabled |
| `SECRET_KEY` | `citysync-super-secret-jwt-key...` | JWT token signature secret |
| `ALGORITHM` | `HS256` | Token hashing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES`| `1440` | Token expiration duration (24h) |
| `DATABASE_URL` | `sqlite:///./citysync.db` | SQLite development or PostgreSQL connection string |
| `SIMULATION_INTERVAL_SECONDS`| `4` | Telemetry loop frequency in seconds |
| `SIMULATION_AUTO_START` | `True` | Automatically start telemetry loop on boot |
| `HOST` | `127.0.0.1` | Server binding host |
| `PORT` | `8000` | Server HTTP port |

---

## 4. Machine Learning Model Training & Database Seeding

The application automatically checks and seeds default users, infrastructure nodes, and loads pre-trained models on boot. However, you can manually trigger model training or re-seed anytime:

### Retrain Machine Learning Models:
```bash
python train_models.py
```
This generates the 4 synthetic municipal datasets (`datasets/`), trains the 2 Random Forest Regressors and 2 Isolation Forests, verifies evaluation metrics ($R^2 > 0.97$, $F_1 > 0.91$), and saves `.joblib` model binaries into `backend/ml/saved_models/`.

### Seed Database Records:
```bash
python backend/seed_data.py
```
This initializes:
- 5 municipal role users with secure hashed credentials.
- 16 geo-referenced infrastructure nodes across 5 sectors.
- 24 hours of baseline time-series telemetry.
- Initial incidents and anomaly alerts.

---

## 5. Running the Application

### Start the FastAPI Server:
```bash
# On Windows PowerShell:
$env:PYTHONPATH="backend"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

# On Linux / macOS:
export PYTHONPATH="backend"
python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Accessing the Platform:
- **Command Center Dashboard**: Open your browser at [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive REST API Docs (Swagger)**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **API Specification (ReDoc)**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 6. Running Verification Tests

CITYSYNC includes a comprehensive test suite covering RBAC auth, telemetry endpoints, map search, facility inspection, incident lifecycle, anomaly resolution, all 4 ML models, cross-system cascades, crisis simulation, and CSV reporting:

```bash
# Run full test suite with verbose output
$env:PYTHONPATH="backend"; python -m pytest backend/tests/test_citysync.py -v
```

Expected output:
```
======================= 22 passed, 2 warnings in 3.24s ========================
```

---

## 7. PostgreSQL Production Deployment (Optional)

To switch from the default local SQLite database to an enterprise PostgreSQL server:

1. Install psycopg2 / asyncpg:
```bash
pip install psycopg2-binary
```
2. Update `.env`:
```ini
DATABASE_URL=postgresql://citysync_user:securepassword@localhost:5432/citysync_db
```
3. Run the application as usual. SQLAlchemy will automatically create all tables and relationships on PostgreSQL on boot.
