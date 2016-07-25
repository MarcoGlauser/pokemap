DEBUG = True

ALLOWED_HOSTS = []

REDIS_URL = 'redis://127.0.0.1:6379/0'

WS4REDIS_CONNECTION = {
    'host': '127.0.0.1',
    'port': 6379,
    'db': 5,
}

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': 'pokemap',
        'USER': 'postgres',
        'PASSWORD': '12345',
        'HOST': 'localhost',
        'PORT': '5432'
    }
}

BROKER_URL = REDIS_URL,
CELERY_RESULT_BACKEND = REDIS_URL