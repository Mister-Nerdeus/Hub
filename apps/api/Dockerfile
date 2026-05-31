# Local-proof default. Use Dockerfile.production for production-shaped builds.
FROM python:3.13-slim

LABEL org.opencontainers.image.title="ER Pod Shift Simulator API"
LABEL org.opencontainers.image.description="Operational simulation API; no PHI or EHR integration"
LABEL org.opencontainers.image.revision="editor-assignment-ux-704-713"

WORKDIR /app

COPY apps/api/requirements.txt apps/api/requirements-dev.txt ./
RUN pip install --no-cache-dir -r requirements-dev.txt

COPY apps/api/ ./

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
