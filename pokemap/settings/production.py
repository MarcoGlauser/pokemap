import dj_database_url
import re
from base import *

DEBUG = False

ALLOWED_HOSTS = ['*']

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = True

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'CONN_MAX_AGE' : 500
    }
}

db_from_env = dj_database_url.config()
DATABASES['default'].update(db_from_env)

REDIS_URL = os.environ.get('REDIS_URL','redis://127.0.0.1:6379')
REDIS_CONFIG = re.match(r'^redis://((?P<user>.*):(?P<password>.*)@)?(?P<hostname>.+):(?P<port>.+)$', REDIS_URL).groupdict()
WS4REDIS_CONNECTION = {
    'host': REDIS_CONFIG['hostname'],
    'port': REDIS_CONFIG['port'],
    'password': REDIS_CONFIG['password'],
    #'user':os.environ.get('REDIS_USER',None),
    'db': 1,
}

BROKER_URL = os.environ['REDIS_URL'] + '/2',
CELERY_RESULT_BACKEND = os.environ['REDIS_URL']+ '/2'

STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATIC_URL = '/static/'

# Extra places for collectstatic to find static files.
STATICFILES_DIRS = (
    os.path.join(BASE_DIR, 'static'),
)
STATICFILES_STORAGE = 'whitenoise.django.GzipManifestStaticFilesStorage'