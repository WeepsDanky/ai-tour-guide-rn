# 1) Base image
FROM python:3.11-slim

# 2) Workdir
WORKDIR /app

# Make the venv's bin visible to the runtime
ENV VIRTUAL_ENV=/app/.venv
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# 3) Basic env
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# 4) (Optional but recommended) system deps for wheels that might fall back to build
# RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*

# 5) Fast installer
RUN pip install --no-cache-dir uv

# 6) Copy only what is needed to resolve and build project metadata
#    IMPORTANT: include README.md because pyproject points to it
COPY pyproject.toml uv.lock README.md ./

# If your project uses src-layout, copy the package metadata files needed for build.
# Minimal safe choice: copy the package directory (or at least pyproject-driven package files)
# so hatchling can build the editable wheel. Adjust the path if your package dir differs.
# Example assumes your code lives in "src/"
COPY src ./src

# 7) Install deps + project in editable from the lock (no network cache)
RUN uv sync --frozen --no-cache

# 8) Now copy the rest of the repo (tests, scripts, configs, etc.)
#    This invalidates fewer layers than copying everything earlier.
COPY . .

# Expose for docs; Render injects $PORT
EXPOSE 8000

# Use the venv's uvicorn binary explicitly
CMD ["bash", "-lc", "exec .venv/bin/uvicorn src.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers ${WEB_CONCURRENCY:-1}"]