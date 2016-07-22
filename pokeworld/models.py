from __future__ import unicode_literals

from django.db import models

class Pokemon(models.Model):
    name = models.CharField(max_length=256,unique=True)
    number = models.IntegerField(db_index=True,unique=True)