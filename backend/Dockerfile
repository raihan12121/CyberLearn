FROM python:3.11-alpine

WORKDIR /code

# Install build dependencies and standard Linux lab utilities
RUN apk add --no-cache gcc musl-dev libffi-dev g++ make bash coreutils curl iputils procps nano grep sed gawk

COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

COPY . /code

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
