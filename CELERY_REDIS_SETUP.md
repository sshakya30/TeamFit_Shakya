# Celery + Redis Setup Guide

## Overview

The TEAMFIT backend now uses **Celery** with **Redis** as the message broker for async background task processing. This provides production-grade task queuing, automatic retries, and horizontal scalability.

## What Changed

### From BackgroundTasks to Celery

**Before (BackgroundTasks)**:
```python
background_tasks.add_task(_process_custom_generation, job_id, ...)
```

**After (Celery)**:
```python
from app.tasks.generation_tasks import generate_custom_activities_task
generate_custom_activities_task.delay(job_id, team_id, organization_id)
```

## Architecture

```
POST /api/activities/generate-custom
    ↓
Create job record (status: pending)
    ↓
Queue Celery task → Redis broker
    ↓
Return job_id to frontend
    ↓
Celery worker picks up task
    ↓
Generate 3 activities via OpenAI
    ↓
Save to customized_activities table
    ↓
Update job (status: completed)
    ↓
Frontend polls GET /api/jobs/{job_id}
```

## Dependencies Added

```toml
"celery>=5.3.4"
"redis>=5.0.1"
```

**Installed packages** (12 total):
- celery==5.5.3
- redis==7.1.0
- amqp, billiard, kombu, vine (Celery dependencies)
- click-didyoumean, click-plugins, click-repl (CLI tools)
- prompt-toolkit, wcwidth, tzdata (utilities)

## Files Created

### 1. `backend/app/tasks/generation_tasks.py`
Celery task definition for custom activity generation.

**Key Features**:
- Celery app initialization with Redis broker
- Task decorator: `@celery_app.task(name='generate_custom_activities_task')`
- Async-to-sync conversion using `asyncio.get_event_loop().run_until_complete()`
- Identical logic to previous BackgroundTasks implementation

### 2. `backend/app/tasks/__init__.py`
Tasks package initializer.

### 3. `backend/celery_worker.py`
Worker entry point for starting Celery workers.

## Configuration

### Environment Variables (`.env`)

```env
# Redis/Celery
REDIS_URL=redis://localhost:6379/0
```

### Settings (`app/config.py`)

```python
class Settings(BaseSettings):
    # ...existing settings...

    # Redis/Celery
    redis_url: str = "redis://localhost:6379/0"
```

## Running the Application

### Prerequisites

1. **Install Redis** (if not already installed)

**Windows (using Chocolatey)**:
```bash
choco install redis-64
```

**Windows (using Docker)**:
```bash
docker run -d -p 6379:6379 redis:latest
```

**macOS (using Homebrew)**:
```bash
brew install redis
brew services start redis
```

**Linux (Ubuntu/Debian)**:
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

2. **Verify Redis is running**:
```bash
redis-cli ping
# Expected output: PONG
```

### Development Setup (3 Terminals)

**Terminal 1 - Redis** (if not using system service):
```bash
redis-server
```

**Terminal 2 - Celery Worker**:
```bash
cd backend
uv run celery -A celery_worker worker --loglevel=info
```

**Terminal 3 - FastAPI Server**:
```bash
cd backend
uv run uvicorn app.main:app --reload --port 8000
```

### Production Setup

**Using Systemd (Linux)**:

Create `/etc/systemd/system/teamfit-celery.service`:
```ini
[Unit]
Description=TEAMFIT Celery Worker
After=network.target redis.service

[Service]
Type=forking
User=www-data
Group=www-data
WorkingDirectory=/path/to/backend
ExecStart=/path/to/venv/bin/celery -A celery_worker worker --detach --loglevel=info
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable teamfit-celery
sudo systemctl start teamfit-celery
```

**Using Docker Compose**:

```yaml
version: '3.8'

services:
  redis:
    image: redis:latest
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

  celery-worker:
    build: ./backend
    command: celery -A celery_worker worker --loglevel=info
    depends_on:
      - redis
    environment:
      - REDIS_URL=redis://redis:6379/0

  api:
    build: ./backend
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000
    ports:
      - "8000:8000"
    depends_on:
      - redis
      - celery-worker
    environment:
      - REDIS_URL=redis://redis:6379/0

volumes:
  redis-data:
```

## Celery Commands

### Start Worker
```bash
cd backend
uv run celery -A celery_worker worker --loglevel=info
```

### Start Worker with Concurrency
```bash
uv run celery -A celery_worker worker --loglevel=info --concurrency=4
```

### Inspect Active Tasks
```bash
uv run celery -A celery_worker inspect active
```

### Inspect Registered Tasks
```bash
uv run celery -A celery_worker inspect registered
```

### Purge All Tasks
```bash
uv run celery -A celery_worker purge
```

### Monitor with Flower (Web UI)

Install Flower:
```bash
uv add flower
```

Start Flower:
```bash
uv run celery -A celery_worker flower
```

Access at: http://localhost:5555

## Task Processing Flow

### Custom Activity Generation

1. **API Endpoint** (`POST /api/activities/generate-custom`):
   - Validates subscription (paid only)
   - Checks trust score
   - Checks quota availability
   - Fetches team materials
   - Creates job record (status: `pending`)
   - Queues Celery task
   - Returns `job_id`

2. **Celery Task** (`generate_custom_activities_task`):
   - Updates job status to `processing`
   - Fetches job context from database
   - Generates 3 activities via OpenAI
   - Saves to `customized_activities` table
   - Updates job status to `completed` or `failed`
   - Increments quota on success

3. **Frontend Polling** (`GET /api/jobs/{job_id}`):
   - Returns job status
   - Returns generated activities if completed
   - Returns error message if failed

## Error Handling

### Task Failures

Celery automatically handles task failures:
- Updates job status to `failed`
- Stores error message in `customization_jobs.error_message`
- Frontend receives error via `/api/jobs/{job_id}`

### Redis Connection Errors

If Redis is unavailable:
- API will throw exception when queuing task
- Return HTTP 500 with "Connection to broker failed"
- User should retry after Redis is back online

### Worker Crashes

If Celery worker crashes:
- Tasks remain in Redis queue
- Worker picks up tasks on restart
- No data loss

## Monitoring

### Check Redis Queue Size

```bash
redis-cli LLEN celery
```

### Check Worker Status

```bash
uv run celery -A celery_worker status
```

### View Worker Stats

```bash
uv run celery -A celery_worker inspect stats
```

### Check Task Results

```bash
redis-cli KEYS celery-task-meta-*
```

## Advantages Over BackgroundTasks

| Feature | BackgroundTasks | Celery + Redis |
|---------|----------------|----------------|
| **Infrastructure** | None required | Requires Redis |
| **Scalability** | Single server only | Horizontal scaling |
| **Task Persistence** | Lost on crash | Persisted in Redis |
| **Task Retries** | Manual | Automatic |
| **Task Monitoring** | None | Flower UI |
| **Task Priority** | No | Yes |
| **Scheduled Tasks** | No | Yes (Celery Beat) |
| **Complexity** | Very simple | More complex |
| **Best For** | MVP/Small apps | Production/Scale |

## Testing

### Test Redis Connection

```bash
redis-cli ping
```

### Test Celery Worker

```bash
cd backend
uv run celery -A celery_worker worker --loglevel=debug
```

### Test Task Execution

```python
from app.tasks.generation_tasks import generate_custom_activities_task

# Queue task
result = generate_custom_activities_task.delay("job-id", "team-id", "org-id")

# Check result
print(result.id)  # Task ID
print(result.state)  # Task state
```

### Test via API

```bash
# Create custom generation job
curl -X POST http://localhost:8000/api/activities/generate-custom \
  -H "Content-Type: application/json" \
  -d '{
    "team_id": "...",
    "organization_id": "...",
    "requirements": "Focus on collaboration"
  }'

# Response: {"success": true, "job_id": "...", "status": "processing", ...}

# Poll job status
curl http://localhost:8000/api/jobs/{job_id}
```

## Troubleshooting

### Issue: "Connection to broker failed"

**Cause**: Redis not running

**Solution**:
```bash
# Check Redis status
redis-cli ping

# Start Redis (if not running)
redis-server
```

### Issue: Tasks not being processed

**Cause**: Celery worker not running

**Solution**:
```bash
# Start worker
cd backend
uv run celery -A celery_worker worker --loglevel=info
```

### Issue: "No module named 'app.tasks'"

**Cause**: Import path issues

**Solution**:
Ensure you're in the `backend` directory and using `uv run`.

### Issue: Async function errors in Celery

**Cause**: Celery tasks can't be async

**Solution**: Already handled with `asyncio.get_event_loop().run_until_complete()` wrapper.

## Migration Notes

### From BackgroundTasks to Celery

If you have existing jobs that were created with BackgroundTasks, they will work fine with Celery. The job polling mechanism (`GET /api/jobs/{job_id}`) is identical.

### Rollback to BackgroundTasks

If you need to rollback:

1. Remove Celery import from `activities.py`
2. Replace `.delay()` with `background_tasks.add_task()`
3. Restore `_process_custom_generation()` function
4. Add `BackgroundTasks` parameter back
5. Remove `celery` and `redis` from dependencies

## Future Enhancements

### Task Retries

Add automatic retries on failure:
```python
@celery_app.task(name='generate_custom_activities_task', max_retries=3)
def generate_custom_activities_task(job_id, team_id, org_id):
    try:
        # ... task logic ...
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)  # Retry after 60 seconds
```

### Task Priority

Add priority queue for paid users:
```python
# High priority for paid users
generate_custom_activities_task.apply_async(
    args=[job_id, team_id, org_id],
    priority=9
)
```

### Scheduled Tasks

Use Celery Beat for periodic tasks:
```python
from celery.schedules import crontab

celery_app.conf.beat_schedule = {
    'reset-monthly-quotas': {
        'task': 'reset_quotas_task',
        'schedule': crontab(day_of_month=1, hour=0, minute=0),
    },
}
```

## Conclusion

Celery + Redis provides production-grade async task processing with:
- ✅ Task persistence and reliability
- ✅ Horizontal scalability
- ✅ Automatic retries
- ✅ Monitoring and debugging tools
- ✅ Task prioritization

The migration from BackgroundTasks is complete and the system is ready for production deployment.

**Commands to remember**:
```bash
# Start Redis
redis-server

# Start Celery worker
cd backend && uv run celery -A celery_worker worker --loglevel=info

# Start FastAPI
cd backend && uv run uvicorn app.main:app --reload --port 8000
```
