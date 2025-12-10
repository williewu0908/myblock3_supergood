FROM python:3.10-slim

ENV PIP_NO_CACHE_DIR=true
ENV PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir gunicorn && \
    pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5500

CMD ["gunicorn", "--workers", "3", "--bind", "0.0.0.0:5500", "app:app"]