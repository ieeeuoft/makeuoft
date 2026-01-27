# Generated manually for order lock system
# Migration for hardware app

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('hardware', '0015_order_in_progress_status'),
    ]

    operations = [
        migrations.CreateModel(
            name='OrderLockConfig',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('orders_locked', models.BooleanField(default=False)),
                ('locked_at', models.DateTimeField(blank=True, null=True)),
                ('reason', models.TextField(blank=True, default='')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('locked_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='order_locks', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Order Lock Configuration',
                'verbose_name_plural': 'Order Lock Configuration',
            },
        ),
    ]

