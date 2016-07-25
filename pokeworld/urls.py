from django.conf.urls import url
from pokeworld import views

urlpatterns = [
    url(r'^scan/?$', views.scan),
]