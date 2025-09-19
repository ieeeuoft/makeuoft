FROM python:3.9-slim-bookworm

WORKDIR /usr/src/hackathon_site

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Set timezone (install tzdata only if needed)
# If /usr/share/zoneinfo isn't present, uncomment the tzdata block.
# ARG DEBIAN_FRONTEND=noninteractive
# RUN apt-get update && apt-get install -y --no-install-recommends tzdata && rm -rf /var/lib/apt/lists/*
RUN cp /usr/share/zoneinfo/Canada/Eastern /etc/localtime \
 && echo "America/Toronto" > /etc/timezone

# System deps: psql client (brings libpq), then clean
RUN apt-get update \
 && apt-get install -y --no-install-recommends postgresql-client \
 && rm -rf /var/lib/apt/lists/*

# Python deps
RUN pip install --upgrade pip
COPY hackathon_site/requirements.txt .
RUN pip install -r requirements.txt

# App
COPY hackathon_site/ .

# Entrypoint
COPY deployment/entrypoint.sh /usr/src/entrypoint.sh
RUN chmod +x /usr/src/entrypoint.sh
ENTRYPOINT ["/usr/src/entrypoint.sh"]
