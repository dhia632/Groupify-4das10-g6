"""
ML Clustering Engine (Python / FastAPI) : enregistrement dans Eureka.

Installation : pip install py-eureka-client fastapi uvicorn
Lancement    : uvicorn main:app --port 8000

Une fois enregistré, le service apparaît dans Eureka sous le nom
ML-CLUSTERING-ENGINE et la Gateway peut l'appeler par lb://ml-clustering-engine,
exactement comme un microservice Spring Boot.
"""
import os
from contextlib import asynccontextmanager

import py_eureka_client.eureka_client as eureka_client
from fastapi import FastAPI

EUREKA_URL = os.getenv("EUREKA_URL", "http://localhost:8761/eureka")
APP_NAME = "ml-clustering-engine"
PORT = int(os.getenv("PORT", "8000"))
HOST = os.getenv("INSTANCE_HOST", "localhost")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Démarrage : enregistrement + heartbeat toutes les 10 s
    await eureka_client.init_async(
        eureka_server=EUREKA_URL,
        app_name=APP_NAME,
        instance_host=HOST,
        instance_port=PORT,
        renewal_interval_in_secs=10,
        duration_in_secs=30,
        health_check_url=f"http://{HOST}:{PORT}/health",
        status_page_url=f"http://{HOST}:{PORT}/docs",
    )
    yield
    # Arrêt : désenregistrement propre
    await eureka_client.stop_async()


app = FastAPI(title="ML Clustering Engine", lifespan=lifespan)


@app.get("/health")
def health():
    return {"status": "UP"}
