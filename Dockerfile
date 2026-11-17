# ============================================================
# CITYSYNC — Smart City Intelligence & Predictive Decision Platform
# Production Multi-Cloud Container Image
# Compatible with: Docker, Render, Railway, Fly.io, Cloud Run, AWS
# ============================================================

FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app/backend \
    PORT=8000

# Set working directory
WORKDIR /app

# Install system dependencies (curl for healthchecks)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy source code and static assets
COPY backend /app/backend
COPY frontend /app/frontend
COPY datasets /app/datasets
COPY .env.example /app/.env

# Create non-root user for security
RUN useradd -m -u 1000 citysync && \
    chown -R citysync:citysync /app
USER citysync

# Expose port (default 8000)
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT}/api/health || exit 1

# Launch application using dynamic PORT environment variable
CMD ["sh", "-c", "python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
