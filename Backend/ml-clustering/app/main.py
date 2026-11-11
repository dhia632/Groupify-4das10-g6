from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy import text

from app.database import Base, engine
from app.models import *
from app.routers import demande_router, groupement_router


@asynccontextmanager
async def lifespan(app: FastAPI):

    # Création des tables PostgreSQL
    Base.metadata.create_all(bind=engine)

    yield

    # Fermeture de l'application


app = FastAPI(
    title="ML Clustering Engine",
    description="Microservice de groupement des étudiants",
    version="1.0.0",
    lifespan=lifespan
)


app.include_router(demande_router.router)
app.include_router(groupement_router.router)


@app.get("/")
def accueil():
    return {"message": "ML Clustering Engine fonctionne !"}


@app.get("/test-db")
def test_database():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    return {"message": "Connexion PostgreSQL réussie !"}