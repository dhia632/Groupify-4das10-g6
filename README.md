# Plateforme de constitution automatique de groupes d'apprentissage collaboratif

Projet du module AWD (ESPRIT, année universitaire 2026-2027) : une application web en architecture microservices qui profile les étudiants, forme par apprentissage non supervisé des groupes hétérogènes et équilibrés, puis entretient la motivation de chaque équipe grâce à la gamification.

- Équipe : [Groupify]
- Classe : [4DAS10]

---

## 1. Description du projet

### Problème

Le travail en groupe améliore les résultats et développe les compétences relationnelles, mais seulement si les équipes sont bien composées. Aujourd'hui, les groupes se forment surtout de deux façons :

- le libre choix, qui reproduit les affinités et les cercles d'amis ;
- la composition manuelle par l'enseignant, lente au-delà de quelques dizaines d'étudiants et exposée aux biais.

Aucune des deux ne garantit des équipes comparables entre elles.

### Solution

Chaque étudiant renseigne un profil multi-critères. Un moteur d'apprentissage non supervisé identifie des profils types, puis répartit les étudiants pour que chaque groupe soit diversifié à l'intérieur et que tous les groupes soient de niveau comparable. L'enseignant valide, ajuste si besoin, puis publie. La gamification entretient ensuite l'engagement.

### Acteurs

| Acteur | Rôle |
|---|---|
| Étudiant | Complète son profil, découvre son équipe, suit sa contribution, gagne des badges |
| Enseignant | Lance une constitution de groupes, choisit les critères et leur poids, valide et ajuste le résultat, suit les équipes |
| Administration | Consulte des indicateurs agrégés (équilibre des groupes, engagement) par classe ou par promotion |

### Fonctionnalités principales

1. Gestion du profil étudiant : GPA, compétences, styles d'apprentissage, centres d'intérêt.
2. Constitution automatique des groupes : clustering des profils, répartition hétérogène, équilibrage.
3. Indicateurs de qualité par groupe et comparaison avec une répartition aléatoire.
4. Validation humaine : l'enseignant peut déplacer un étudiant et voit l'effet sur l'équilibre. Rien n'est publié sans sa validation.
5. Historique des versions de groupes.
6. Gamification : avatars, badges, points, classement des équipes (et non des individus).
7. Tableaux de bord pour l'enseignant, l'étudiant et l'administration.



---

## 2. Architecture globale

```
                        +-----------------------------+
                        |  Front-end Angular          |
                        +--------------+--------------+
                                       |
                                       v
 +-------------+          +------------------------------+          +-------------+
 |  Keycloak   |<-------->|  API Gateway                 |<-------->|   Eureka    |
 |  (OAuth2/   |  JWT     |  (Spring Cloud Gateway)      | découverte|  (registre) |
 |   JWT)      |          +--------------+---------------+          +-------------+
 +-------------+                         |                          +-------------+
                                         |                          |   Config    |
        +------------+------------+------+-----+------------+       |   Server    |
        v            v            v            v            v       +-------------+
  +-----------+ +-----------+ +-----------+ +-----------+ +-----------+ +-----------+
  |   Auth    | |   User /  | |  Course / | |    ML     | |Gamification| | Analytics |
  |  Service  | | Profiling | |   Group   | | Clustering| |   Engine   | |  Service  |
  | (Keycloak)| | (Spring)  | |(Spring,   | | (Python,  | | (Spring)   | | (Spring)  |
  |           | |           | |  MySQL)   | |  FastAPI) | |            | |           |
  +-----------+ +-----------+ +-----------+ +-----------+ +-----------+ +-----------+
                                       \________ REST / OpenFeign ________/
                                       \__ événements : Kafka ou RabbitMQ __/
```

Principes :

- Chaque microservice correspond à une capacité métier (contexte borné) et possède sa propre base de données. Aucune base n'est partagée.
- Les services communiquent en synchrone (REST avec OpenFeign) quand la réponse est nécessaire tout de suite, et en asynchrone (événements) quand les autres services peuvent réagir plus tard.
- Tout le trafic externe passe par l'API Gateway.
- Toute l'application est conteneurisée avec Docker et se lance avec Docker Compose.

---

Analytics Service

Ouvrir le dossier :

analytics-service-springboot/analytics-service

Démarrer l'application avec IntelliJ IDEA ou Maven :

mvn spring-boot:run

Le service sera accessible sur :

http://localhost:8085

Vérifier son état :

http://localhost:8085/actuator/health

Résultat attendu :

{
  "status": "UP"
}

3. Démarrer API Gateway

Ouvrir le dossier :

groupify-gateway

Exécuter :

mvn spring-boot:run

Le Gateway sera accessible sur :

http://localhost:8090

Vérifier son état :

http://localhost:8090/actuator/health

Le Gateway redirige les requêtes Analytics vers le service correspondant.

4. Démarrer Angular Frontend

Ouvrir un terminal dans :

groupify-front

Installer les dépendances :

npm install

Démarrer Angular :

ng serve

Accéder à l'application :

http://localhost:4200

Configuration Angular

Dans src/environments/environment.ts, configurer l'URL du Gateway :

apiUrl: 'http://localhost:8090'

Pour utiliser le véritable service Analytics et non les données simulées :

mocks: {
  analytics: false
}

Les autres options de mock restent configurables indépendamment.

API Analytics

Toutes les requêtes Analytics passent par l'API Gateway.

Méthode

Endpoint

Description

GET

/api/analytics/courses/{courseId}/balance

Statistiques d'équilibre des groupes

GET

/api/analytics/courses/{courseId}/engagement

Statistiques d'engagement

GET

/api/analytics/promotions/{promotionId}/summary

Résumé d'une promotion

GET

/api/analytics/reports

Consulter les rapports

POST

/api/analytics/reports

Créer un rapport

Exemple de test avec cURL

curl -i \
  -H "X-User-Id: 1" \
  -H "X-User-Name: Test" \
  -H "X-User-Roles: TEACHER" \
  http://localhost:8090/api/analytics/courses/1/balance

Une réponse HTTP 200 OK indique que la requête a été traitée avec succès.

Exemple de réponse JSON

{
  "courseId": 1,
  "projectId": 1,
  "gpaStdDev": 2.35,
  "skillCoverage": 100.0,
  "diversityIndex": 50.0,
  "groups": [],
  "computedAt": "2026-11-10T23:53:10Z"
}

Les valeurs et les groupes dépendent des données disponibles dans la base.

Sécurité et autorisations

En mode développement, les requêtes Analytics utilisent les en-têtes suivants :

X-User-Id
X-User-Name
X-User-Roles

L'endpoint de balance nécessite un rôle autorisé, notamment :

TEACHER

ADMIN

Une requête avec un rôle non autorisé peut retourner 403 Forbidden.

Vérification du fonctionnement

Avant de tester l'application, vérifier les composants :

Vérification

URL

Angular

http://localhost:4200

Gateway Health

http://localhost:8090/actuator/health

Analytics Health

http://localhost:8085/actuator/health

MongoDB

Port 27018

Dépannage

Erreur 403 Forbidden

Vérifier le rôle transmis dans X-User-Roles.

Erreur 404 Not Found

Vérifier le chemin de l'API et la configuration des routes du Gateway.

Erreur CORS

Vérifier que le Gateway autorise l'origine :

http://localhost:4200

Erreur de connexion MongoDB

Vérifier que le conteneur est actif :

docker ps

Consulter les logs :

docker logs mongodb-analytics

Consulter les logs Analytics

docker logs analytics-service

# Course / Group Service

Microservice de la plateforme de constitution automatique de groupes d'apprentissage collaboratif (module AWD, ESPRIT, année universitaire 2026-2027).

Responsable du microservice : [Ons Ben Said]

---

## 1. Rôle du microservice

Le Course / Group Service organise le cadre pédagogique et garde la trace de la constitution des groupes. Il fait le lien entre l'enseignant, qui lance et valide la constitution, et le moteur de Machine Learning, qui calcule la répartition.

Ce que le service gère :

- les modules et les classes ;
- les projets pour lesquels des groupes doivent être formés ;
- les demandes de constitution lancées par l'enseignant, avec les poids des critères choisis ;
- les versions de groupes : la proposition de l'algorithme, puis chaque version ajustée ;
- les groupes d'une version et l'affectation des étudiants dans ces groupes ;
- les ajustements manuels faits par l'enseignant ;
- la publication d'une version de groupes.

Ce que le service ne gère pas :

- le calcul des groupes, qui appartient au ML Clustering Engine ;
- les profils des étudiants, qui appartiennent au User / Profiling Service ;
- les badges, points et avatars, qui appartiennent au Gamification Engine ;
- les tableaux de bord, qui appartiennent à l'Analytics Service.

---

## 2. Choix technologiques

| Élément | Choix | Justification |
|---|---|---|
| Langage et framework | Java, Spring Boot | Cohérent avec la stack du module (écosystème Spring Cloud) et avec le reste de l'équipe |
| Base de données | MySQL | Les données sont fortement reliées (projet, demande, version, groupe, affectation). Le modèle relationnel, les clés étrangères et les transactions garantissent la cohérence de l'historique des versions |
| Accès aux données | Spring Data JPA | Correspondance entre les classes et les tables, dépôts prêts à l'emploi |
| Appels vers d'autres services | OpenFeign | Communication synchrone simple et déclarative |
| Événements | Kafka ou RabbitMQ (à confirmer avec l'équipe) | Communication asynchrone |
| Découverte et configuration | Client Eureka, client Config Server | Enregistrement du service et configuration centralisée |
| Sécurité | Spring Security, validation des jetons JWT émis par Keycloak | Seul l'enseignant peut lancer, ajuster et publier |
| Résilience | Délai limite, nouvelles tentatives et coupe-circuit (par exemple Resilience4j) | Le service reste disponible quand un autre service est en panne |

Le service n'a qu'une seule base MySQL, qu'il est le seul à utiliser. Les autres services n'y accèdent jamais directement : ils passent par son API ou par ses événements.

---

### 3.Les classes

| Classe | Attributs | Description |
|---|---|---|
| Module | id (Long), code (String), intitule (String), semestre (String) | La matière enseignée, par exemple AWD |
| Classe | id (Long), nom (String), niveau (String), anneeUniversitaire (String) | Le groupe d'étudiants d'une filière, par exemple 4DS1 |
| Projet | id (Long), titre (String), dateDebut (LocalDate), dateLimite (LocalDate), tailleMin (Integer), tailleMax (Integer) | Le travail pour lequel on forme des groupes. Les tailles minimale et maximale servent de contraintes à l'algorithme |
| DemandeConstitution | id (Long), dateDemande (LocalDateTime), nombreGroupes (Integer), poidsCriteres (String), statut (String) | L'ordre « forme-moi les groupes » donné par l'enseignant, avec les poids choisis pour chaque critère |
| VersionGroupes | id (Long), numero (Integer), dateCreation (LocalDateTime), source (String), publiee (Boolean) | Une photo de la répartition à un moment donné. La version 1 vient de l'algorithme, les suivantes des ajustements de l'enseignant |
| Groupe | id (Long), nom (String), statut (String), ecartTypeGpa (Double), indiceDiversite (Double) | Une équipe au sein d'une version |
| Affectation | id (Long), etudiantId (Long), origine (String), dateAffectation (LocalDateTime) | La place d'un étudiant dans un groupe |
| AjustementManuel | id (Long), etudiantId (Long), groupeSource (Long), groupeCible (Long), motif (String), date (LocalDateTime) | Un déplacement d'étudiant fait à la main par l'enseignant |

## 4. Contrat d'API REST

Toutes les routes passent par l'API Gateway et exigent un jeton JWT valide. Elles commencent par /api. Les routes qui créent ou modifient des données sont réservées au rôle enseignant.

| Méthode | URI | Description | Codes de réponse |
|---|---|---|---|
| GET | /api/modules | Lister les modules | 200 |
| POST | /api/modules | Créer un module | 201, 400, 403 |
| GET | /api/classes | Lister les classes | 200 |
| POST | /api/projets | Créer un projet | 201, 400, 403, 404 (module ou classe introuvable) |
| GET | /api/projets/{id} | Consulter un projet | 200, 404 |
| POST | /api/projets/{id}/demandes | Lancer une constitution de groupes | 202, 400, 403, 404, 409 (une demande est déjà en cours) |
| GET | /api/demandes/{id} | Consulter l'état d'une demande | 200, 404 |
| GET | /api/demandes/{id}/versions | Lister les versions d'une demande | 200, 404 |
| GET | /api/versions/{id}/groupes | Lister les groupes d'une version et leurs affectations | 200, 404 |
| POST | /api/versions/{id}/ajustements | Déplacer un étudiant d'un groupe à un autre | 201, 400, 403, 404, 422 (déplacement invalide, par exemple taille maximale dépassée) |
| POST | /api/versions/{id}/publication | Publier une version | 200, 403, 404, 409 (version déjà publiée) |

Signification des codes : 200 succès, 201 ressource créée, 202 demande acceptée et en cours de traitement, 400 requête invalide, 403 rôle insuffisant, 404 ressource introuvable, 409 conflit avec l'état actuel, 422 requête valide mais impossible à appliquer.

---
## 5. Interactions avec les autres microservices

### Communication synchrone (OpenFeign)

| Service appelé | Données échangées | Pourquoi synchrone |
|---|---|---|
| User / Profiling Service | On envoie les identifiants des étudiants de la classe, on reçoit leurs profils | Les profils sont nécessaires avant de lancer le calcul |
| ML Clustering Engine | On envoie les profils, les poids, le nombre et la taille des groupes, on reçoit la proposition de groupes et ses indicateurs | L'enseignant attend la proposition, qui prend quelques secondes |

### Communication asynchrone (Kafka ou RabbitMQ)

| Événement publié | Consommé par | Contenu |
|---|---|---|
| GroupesPubliés | Gamification Engine, Analytics Service, service de notifications | Identifiant du projet et de la version, liste des groupes et de leurs membres |
| AjustementEffectué | Analytics Service | Identifiant de la version, étudiant déplacé, groupe source et groupe cible |

Ces services n'ont pas besoin de répondre pour que la publication réussisse, d'où le mode asynchrone.



---
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
