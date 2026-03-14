# Main app image for ECS: backend + frontend in one container
# Build: docker build -t lizard-main-app .
# Run: docker run -p 8000:8000 -e OPENAI_API_KEY=... -e REDIS_URL=... lizard-main-app

# Stage 1: build frontend
FROM node:20-alpine AS frontend
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Stage 2: backend + frontend static
FROM python:3.12-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .
RUN mkdir -p /app/static
COPY --from=frontend /app/dist/. /app/static/
ENV PYTHONPATH=/app
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
