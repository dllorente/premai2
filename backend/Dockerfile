FROM python:3.12-slim

WORKDIR /app

RUN pip install poetry==2.5.1 && \
    poetry config virtualenvs.create false

COPY pyproject.toml poetry.lock ./
RUN poetry install --only main --no-root --no-interaction

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
# TODO Sprint 4: RUN playwright install --with-deps chromium