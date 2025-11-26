"""
Celery worker entry point
Run with: celery -A celery_worker worker --loglevel=info
"""

from app.tasks.generation_tasks import celery_app

if __name__ == '__main__':
    celery_app.start()
