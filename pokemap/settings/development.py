from base import *

DEBUG = True

ALLOWED_HOSTS = []

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