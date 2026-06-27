"""
hackathon_site URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.0/topics/http/urls/
"""

from django.contrib import admin
from django.urls import path, include  # re_path is imported later only for DEBUG block
from django.conf import settings

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

from registration.views import ResumeView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("api.urls", namespace="api")),
    # OpenAPI schema & docs (drf-spectacular)
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    path("registration/", include("registration.urls", namespace="registration")),
]

# Serve resume files from MEDIA_URL (only if MEDIA_URL is local)
if not settings.MEDIA_URL.startswith("http"):
    urlpatterns += [
        path(
            f"{settings.MEDIA_URL.strip('/')}/applications/resumes/<str:filename>",
            ResumeView.as_view(),
            name="resume",
        ),
    ]

# Dev-only: debug toolbar and media serving
if settings.DEBUG:
    import debug_toolbar
    from django.core.exceptions import ImproperlyConfigured
    from django.urls import re_path
    from django.views.static import serve

    urlpatterns += [path("__debug__/", include(debug_toolbar.urls))]

    if settings.MEDIA_URL.startswith("http"):
        raise ImproperlyConfigured(
            "To serve media from off-site in development, "
            "remove the media path from hackathon_site.urls"
        )

    urlpatterns += [
        re_path(
            rf"^{settings.MEDIA_URL.strip('/')}/(?P<path>.*)$",
            serve,
            {"document_root": settings.MEDIA_ROOT},
        )
    ]

# Catchall for event urls at the end of the url routes
urlpatterns += [path("", include("event.urls", namespace="event"))]
