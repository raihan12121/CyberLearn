FROM python:3.11-alpine

WORKDIR /code

# Install build dependencies for libraries like bcrypt
RUN apk add --no-cache gcc musl-dev libffi-dev g++ make

COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

COPY . /code

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
