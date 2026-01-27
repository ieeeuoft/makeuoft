# Generated manually for order packing improvements

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('hardware', '0014_set_default_max_item_count'),
    ]

    operations = [
        # add new "In Progress" status option to existing status choices
        migrations.AlterField(
            model_name='order',
            name='status',
            field=models.CharField(
                choices=[
                    ('Submitted', 'Submitted'),
                    ('In Progress', 'In Progress'),
                    ('Ready for Pickup', 'Ready for Pickup'),
                    ('Picked Up', 'Picked Up'),
                    ('Cancelled', 'Cancelled'),
                    ('Returned', 'Returned')
                ],
                default='Submitted',
                max_length=64
            ),
        ),
        # add packing_admin field to track who is currently packing the order
        migrations.AddField(
            model_name='order',
            name='packing_admin',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='packing_orders',
                to=settings.AUTH_USER_MODEL
            ),
        ),
    ]

