import importlib.metadata
import flask
import flask_bcrypt
import flask_jwt_extended
import pymysql
import boto3
import torch
import torchvision
import PIL
import numpy
import requests

def print_versions():
    print(f"Flask=={flask.__version__}")
    print(f"Flask-Bcrypt=={flask_bcrypt.__version__}")
    print(f"Flask-JWT-Extended=={flask_jwt_extended.__version__}")
    print(f"PyMySQL=={pymysql.__version__}")
    print(f"boto3=={boto3.__version__}")
    print(f"python-dotenv=={importlib.metadata.version('python-dotenv')}")
    print(f"torch=={torch.__version__}")
    print(f"torchvision=={torchvision.__version__}")
    print(f"Pillow=={PIL.__version__}")
    print(f"numpy=={numpy.__version__}")
    print(f"requests=={requests.__version__}")
    print(f"quart=={importlib.metadata.version('quart')}")
    print(f"aiohttp=={importlib.metadata.version('aiohttp')}")

if __name__ == "__main__":
    print_versions()

# 버전확인을 위한 코드