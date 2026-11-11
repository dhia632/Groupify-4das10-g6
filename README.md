# ML-Clustering-Engine

Microservice de groupement des étudiants dans le cadre d'un projet
universitaire d'architecture web distribuée.

> **État du document :** récapitulatif du travail réalisé et de la
> configuration présentée dans les échanges. Les éléments indiqués « à
> vérifier » ne sont pas considérés comme terminés.

## 1. Présentation du microservice

Le microservice **ML-Clustering-Engine** est chargé de gérer les
demandes de groupement des étudiants, l'exécution du groupement et la
consultation des résultats.

Il communique avec le frontend Angular à travers une API REST développée
avec FastAPI. La base de données prévue pour ce microservice est
PostgreSQL.

## 2. Technologies utilisées

  -----------------------------------------------------------------------
  Technologie                         Utilisation
  ----------------------------------- -----------------------------------
  Python                              Langage du backend

  FastAPI                             Création de l'API REST

  SQLAlchemy                          ORM et accès à PostgreSQL

  PostgreSQL                          Base de données relationnelle

  Uvicorn                             Serveur de développement FastAPI

  Angular                             Frontend

  Spring Cloud Gateway                Passerelle entre le frontend et les
                                      microservices

  pgAdmin                             Administration de PostgreSQL
  -----------------------------------------------------------------------

## 3. Organisation du projet

La structure présentée pour le microservice est :

``` text
ML-Clustering-Engine/
├── app/
│   ├── models/
│   │   └── __init__.py
│   ├── repositories/
│   │   └── __init__.py
│   ├── routers/
│   │   └── __init__.py
│   ├── schemas/
│   │   └── __init__.py
│   ├── services/
│   │   └── __init__.py
│   ├── database.py
│   └── main.py
├── .env
└── requirements.txt
```

Les fichiers et modules supplémentaires peuvent être ajoutés selon
l'évolution du microservice.

## 4. Connexion à PostgreSQL

### 4.1 Configuration SQLAlchemy

Le fichier `app/database.py` contient la configuration de la connexion à
PostgreSQL :

``` python
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

Rôle des éléments : - `load_dotenv()` charge les variables du fichier
`.env`. - `DATABASE_URL` contient l'adresse de connexion à PostgreSQL. -
`create_engine()` crée le moteur SQLAlchemy. - `SessionLocal` permet
d'ouvrir des sessions de base de données. - `Base` est la classe de base
dont héritent les modèles SQLAlchemy. - `get_db()` fournit une session
aux routes qui en ont besoin et la ferme après utilisation.

### 4.2 Variable d'environnement

Le fichier `.env` doit contenir une URL adaptée à la base réellement
utilisée :

``` env
DATABASE_URL=postgresql://postgres:VOTRE_MOT_DE_PASSE@localhost:5432/ml_clustering_db
```

Remplacer `VOTRE_MOT_DE_PASSE` par le mot de passe PostgreSQL local. Ne
jamais publier le vrai fichier `.env` ni son mot de passe sur GitHub.

**À vérifier :** le nom de la base doit être identique dans pgAdmin et
dans `DATABASE_URL`. Le nom `ml_clustering_db` a été utilisé dans les
échanges, mais la connexion réelle doit encore être confirmée.

## 5. Démarrage de FastAPI et création des tables

Le fichier `app/main.py` présenté contient le cycle de vie FastAPI et la
création des tables :

``` python
from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy import text

from app.database import Base, engine
from app.models import *
from app.routers import demande_router, groupement_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Création des tables PostgreSQL définies par les modèles importés
    Base.metadata.create_all(bind=engine)
    yield


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
```

Au démarrage de l'application, `Base.metadata.create_all(bind=engine)`
demande à SQLAlchemy de créer les tables correspondant aux modèles
connus de `Base`.

**Important :** cette commande ne récupère pas automatiquement les
tables des autres microservices. Les modèles doivent être définis et
importés dans `app/models/` avant la création des tables. `create_all()`
crée les tables manquantes, mais ne remplace pas un système de
migrations pour faire évoluer les schémas.

### Commande de démarrage

Depuis le dossier du backend, avec l'environnement virtuel activé :

``` powershell
uvicorn app.main:app --reload
```

Adaptez le chemin de lancement si le dossier courant n'est pas celui qui
contient le package `app`.

## 6. Routes API présentées

Les routes suivantes ont été identifiées dans la documentation Swagger
du backend :

  -----------------------------------------------------------------------------------------------------------------------------
  Méthode                 Route                                                                         Fonction
  ----------------------- ----------------------------------------------------------------------------- -----------------------
  POST                    `/api/clustering/demandes`                                                    Créer une demande de
                                                                                                        groupement

  GET                     `/api/clustering/demandes`                                                    Lister les demandes

  GET                     `/api/clustering/demandes/{demande_id}`                                       Consulter une demande

  DELETE                  `/api/clustering/demandes/{demande_id}`                                       Supprimer une demande

  POST                    `/api/clustering/demandes/{demande_id}/executer`                              Lancer l'exécution
                                                                                                        d'une demande

  GET                     `/api/clustering/demandes/{demande_id}/groupes`                               Lister les groupes
                                                                                                        obtenus

  GET                     `/api/clustering/demandes/{demande_id}/clusters`                              Consulter les clusters

  GET                     `/api/clustering/demandes/{demande_id}/qualite`                               Consulter les
                                                                                                        indicateurs de qualité

  GET                     `/api/clustering/demandes/{demande_id}/etudiants/{id_etudiant}/explication`   Obtenir l'explication
                                                                                                        du groupement d'un
                                                                                                        étudiant

  PUT                     `/api/clustering/demandes/{demande_id}/deplacer`                              Déplacer un étudiant
                                                                                                        entre groupes

  POST                    `/api/clustering/demandes/{demande_id}/valider`                               Valider le résultat du
                                                                                                        groupement

  GET                     `/`                                                                           Vérifier que l'API
                                                                                                        répond

  GET                     `/test-db`                                                                    Tester la connexion à
                                                                                                        PostgreSQL
  -----------------------------------------------------------------------------------------------------------------------------

Ces routes ont été vues dans Swagger. Leur comportement doit être testé
individuellement dans l'environnement final.

## 7. Test de création d'une demande

Un test de création a été effectué depuis Swagger avec le corps JSON
suivant :

``` json
{
  "idCours": 12,
  "idEnseignant": 1,
  "algorithme": "KMEANS",
  "nombreGroupes": 5,
  "tailleGroupe": 4,
  "graineAleatoire": 42,
  "criteres": []
}
```

La réponse obtenue indiquait : - une demande créée ; - un identifiant de
demande égal à `6` ; - un état `EN_ATTENTE`.

Ce test confirme que la route de création a répondu correctement lors de
cet essai. Il ne prouve pas à lui seul que toute l'exécution du
clustering est finalisée.

## 8. Intégration avec Angular

Le frontend du projet est développé avec Angular. Le service Angular
concerné est :

``` text
src/app/core/api/clustering-api.service.ts
```

Il utilise `HttpClient` pour communiquer avec le backend.

Les méthodes nécessaires pour la gestion des demandes sont :

``` typescript
creerDemande(data: any): Observable<any> {
  return this.http.post<any>(`${this.base}/demandes`, data);
}

demandes(): Observable<any[]> {
  return this.http.get<any[]>(`${this.base}/demandes`);
}
```

La base de l'API doit correspondre à la configuration de l'environnement
et du proxy Angular. Si `environment.apiUrl` est vide et que le proxy
`/api` pointe vers Gateway, une base possible est :

``` typescript
private base = '/api/clustering';
```

Le mode mock doit être désactivé pour tester le vrai backend, par
exemple avec `environment.mocks.clustering = false`, si cette propriété
est bien présente dans la configuration du projet.

### Fonctionnalités frontend prévues

-   Saisir l'identifiant du cours.
-   Saisir l'identifiant de l'enseignant.
-   Choisir l'algorithme.
-   Définir le nombre et la taille des groupes.
-   Définir la graine aléatoire et les critères.
-   Envoyer la demande au backend.
-   Afficher la liste des demandes reçues depuis FastAPI.

Le code Angular doit être testé avec la structure exacte des réponses
JSON du backend. Les noms de propriétés peuvent être différents entre le
format Python (`snake_case`) et le format Angular (`camelCase`).

## 9. Architecture de communication

Le chemin de communication visé est :

``` text
Navigateur
   |
   v
Frontend Angular (port 4200)
   |
   v
Proxy Angular : /api
   |
   v
Spring Cloud Gateway (port 8081)
   |
   v
ML-Clustering-Engine / FastAPI (port 8000)
   |
   v
SQLAlchemy
   |
   v
PostgreSQL (port 5432)
```

Le proxy Angular présenté contient déjà une règle `/api` vers
`http://localhost:8081`. Il reste à confirmer que Spring Cloud Gateway
possède une route qui redirige `/api/clustering/**` vers le service
FastAPI sur le port `8000`.

## 10. Commandes utiles

### Activer l'environnement virtuel (PowerShell)

``` powershell
.\venv\Scripts\Activate.ps1
```

### Installer les dépendances

``` powershell
pip install -r requirements.txt
```

### Démarrer FastAPI

``` powershell
uvicorn app.main:app --reload
```

### Ouvrir Swagger

``` text
http://127.0.0.1:8000/docs
```

### Tester l'API

``` text
http://127.0.0.1:8000/
http://127.0.0.1:8000/test-db
```

### Démarrer Angular

Depuis le dossier du frontend :

``` powershell
ng serve
```



------------------------------------------------------------------------

**Sécurité :** ne pas versionner le fichier `.env` contenant le mot de
passe PostgreSQL. Ajouter `.env` au `.gitignore` et publier uniquement
un fichier `.env.example` sans secret.
