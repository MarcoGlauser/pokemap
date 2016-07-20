"""
WSGI config for pokemap project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/1.9/howto/deployment/wsgi/
"""

import os


from django.core.wsgi import get_wsgi_application
from whitenoise.django import DjangoWhiteNoise
from ws4redis.uwsgi_runserver import uWSGIWebsocketServer

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "pokemap.settings.production")
from django.conf import settings

_django_app = get_wsgi_application()
_django_app = DjangoWhiteNoise(_django_app)

_websocket_app = uWSGIWebsocketServer()

def application(environ, start_response):
    if environ.get('PATH_INFO').startswith(settings.WEBSOCKET_URL):
        return _websocket_app(environ, start_response)
    return _django_app(environ, start_response)