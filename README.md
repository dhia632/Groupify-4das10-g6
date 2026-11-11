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





# 📊 Groupify – Analytics Service

## 1. Présentation du projet

**Analytics Service** est un microservice de la plateforme **Groupify**, une application qui facilite la formation de groupes d'étudiants selon leurs profils, compétences et préférences.

Ce microservice est responsable de la collecte, du traitement et de l'analyse des données statistiques liées aux étudiants, aux groupes et à leurs activités.

Il permet notamment d'évaluer l'équilibre des groupes, de suivre l'engagement des étudiants et de générer des rapports statistiques.

## 2. Objectifs du microservice

Les principaux objectifs sont :

- Analyser l'équilibre des groupes d'étudiants.
- Mesurer le niveau d'engagement des étudiants.
- Suivre les contributions des membres.
- Fournir des statistiques sur les groupes et les promotions.
- Générer des rapports analytiques.
- Faciliter la prise de décision grâce aux données.

## 3. Architecture du projet

Le projet utilise une architecture microservices.

```text
                 Angular Frontend
                        |
                        v
                   API Gateway
                        |
                        v
                Analytics Service
                        |
              ---------------------
              |                   |
              v                   v
           MongoDB              RabbitMQ
```

### Technologies utilisées

| Technologie | Utilisation |
|---|---|
| Java | Langage de programmation |
| Spring Boot | Développement du microservice |
| Spring Data MongoDB | Accès à la base de données |
| MongoDB | Stockage des données analytiques |
| Spring Web | Création des API REST |
| RabbitMQ | Communication asynchrone |
| Eureka | Découverte des microservices, si activée |
| Keycloak | Authentification et autorisation |
| Docker | Conteneurisation |
| Angular | Interface frontend |

## 4. Fonctionnalités principales

### 4.1 Group Balance

Analyse l'équilibre des groupes selon les informations disponibles sur les étudiants.

Exemples d'indicateurs :

- Répartition des compétences.
- Répartition des étudiants.
- Équilibre entre les membres.
- Score d'équilibre du groupe.

### 4.2 Student Engagement

Permet de suivre la participation des étudiants dans leurs groupes.

Exemples d'indicateurs :

- Nombre de contributions.
- Participation aux activités.
- Niveau d'engagement.
- Évolution de la participation.

### 4.3 Promotion Summary

Fournit une vue globale des statistiques d'une promotion.

Exemples :

- Nombre total d'étudiants.
- Nombre de groupes formés.
- Moyenne des scores d'équilibre.
- Statistiques de participation.

### 4.4 Reports

Permet de consulter les rapports analytiques générés à partir des données disponibles.

## 5. API REST

Le préfixe des endpoints est :

```text
/api/analytics
```

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/courses/{id}/balance` | Consulter l'équilibre des groupes d'un cours |
| GET | `/courses/{id}/engagement` | Consulter les statistiques d'engagement |
| GET | `/promotions/{id}/summary` | Consulter le résumé statistique d'une promotion |
| GET | `/reports` | Consulter les rapports disponibles |

**Exemple de requête :**

```http
GET /api/analytics/courses/1/balance
```

Les réponses sont retournées au format JSON.

## 6. Communication entre microservices

Analytics Service peut communiquer avec les autres microservices de deux manières.

### 6.1 Communication synchrone – REST API

Les autres services peuvent envoyer des requêtes HTTP pour récupérer des informations.

```text
Angular
   |
   v
API Gateway
   |
   v
Analytics Service
   |
   v
MongoDB
   |
   v
JSON Response
```

### 6.2 Communication asynchrone – RabbitMQ

Les autres services peuvent publier des événements que Analytics Service consomme sans bloquer le traitement initial.

Exemples d'événements envisagés :

| Événement | Service source |
|---|---|
| `group.formed` | Course / Group Service |
| `profile.updated` | User / Profiling Service |
| `contribution.recorded` | Course / Group Service |
| `badge.awarded` | Gamification Service |

Les noms et les formats des événements doivent être harmonisés avec les autres membres de l'équipe.

## 7. Base de données

Analytics Service utilise **MongoDB** pour stocker les données nécessaires aux analyses.

Base de données proposée :

```text
analytics_db
```

Exemple de configuration dans `application.properties` :

```properties
spring.application.name=analytics-service
server.port=8085
spring.data.mongodb.uri=mongodb://localhost:27018/analytics_db
```

Les collections dépendent des entités réellement implémentées dans le projet.

## 8. Installation et lancement

### Prérequis

Avant de lancer le microservice, installer :

- Java (version compatible avec le projet).
- MongoDB.
- IntelliJ IDEA, Eclipse ou Spring Tool Suite.
- Maven ou Maven Wrapper.

### Étape 1 : Cloner le projet

```bash
git clone <URL_DU_REPOSITORY>
```

### Étape 2 : Accéder au dossier

```bash
cd analytics-service
```

### Étape 3 : Configurer MongoDB

Vérifier que MongoDB est démarré et que l'URI configurée dans `application.properties` correspond à ton environnement.

### Étape 4 : Lancer le microservice

Avec Maven :

```bash
mvn spring-boot:run
```

Avec Maven Wrapper sous Windows :

```bash
.\mvnw.cmd spring-boot:run
```

Avec Maven Wrapper sous Linux ou macOS :

```bash
./mvnw spring-boot:run
```

Il est également possible d'importer le projet comme projet Maven dans IntelliJ IDEA ou Eclipse et de lancer la classe principale `AnalyticsServiceApplication`.

## 9. Configuration

Exemple de configuration locale :

```properties
spring.application.name=analytics-service
server.port=8085

spring.data.mongodb.uri=mongodb://localhost:27018/analytics_db

eureka.client.enabled=false
```

Adapter les propriétés selon les dépendances et les profils réellement configurés dans le projet.

Ne jamais publier les mots de passe, les clés secrètes ou les informations sensibles dans GitHub.

## 10. Tests

Les tests peuvent couvrir les éléments suivants :

- Calcul du score d'équilibre des groupes.
- Calcul des statistiques d'engagement.
- Récupération des statistiques d'une promotion.
- Vérification des endpoints REST.
- Vérification de la communication avec MongoDB.
- Traitement des événements RabbitMQ.

Exécuter les tests avec :

```bash
mvn test
```

Ou avec Maven Wrapper :

```bash
.\mvnw.cmd test
```

## 11. Structure du projet

Exemple d'organisation recommandée :

```text
analytics-service/
│
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── .../
│   │   │       ├── controller/
│   │   │       ├── service/
│   │   │       ├── repository/
│   │   │       ├── model/
│   │   │       ├── dto/
│   │   │       ├── config/
│   │   │       └── AnalyticsServiceApplication.java
│   │   │
│   │   └── resources/
│   │       └── application.properties
│   │
│   └── test/
│
├── pom.xml
└── README.md
```

Cette structure est indicative et doit être adaptée à l'organisation réelle du code.





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

# 🏆 Gamification Service

> Microservice individuel – Mini-projet AWD 2026-2027
> **Responsable :** _Nom Prénom_ · **Stack :** Spring Boot 3 · MySQL 8 · Angular · Spring Cloud

---

## Sommaire

1. [Fiche d'identité](#1-fiche-didentité)
2. [Rôle et responsabilités](#2-rôle-et-responsabilités)
3. [Règles métier](#3-règles-métier)
4. [Diagramme de classes](#4-diagramme-de-classes)
5. [Base de données : choix de MySQL](#5-base-de-données--choix-de-mysql)
6. [Contrat d'API REST](#6-contrat-dapi-rest)
7. [Interactions du microservice](#7-interactions-du-microservice)
8. [Gestion des pannes](#8-gestion-des-pannes)
9. [Sécurité](#9-sécurité)
10. [Structure du projet Spring Boot](#10-structure-du-projet-spring-boot)
11. [Écrans Angular consommant le service](#11-écrans-angular-consommant-le-service)
12. [API Gateway du microservice](#12-api-gateway-du-microservice)
13. [Lancement et tests](#13-lancement-et-tests)
14. [Correspondance avec la grille d'évaluation](#14-correspondance-avec-la-grille-dévaluation)

---

## 1. Fiche d'identité

| Élément | Valeur |
|---|---|
| Nom du service (Eureka) | `gamification-service` |
| Port | `8084` |
| Route API Gateway | `/api/gamification/**` |
| Base de données | MySQL 8 – schéma `gamification_db` (propre au service, non partagée) |
| Communication synchrone | OpenFeign + Resilience4j |
| Communication asynchrone | RabbitMQ (Spring AMQP) – exchange topic `platform.events` |
| Sécurité | Resource Server OAuth2 / JWT émis par Keycloak |
| Documentation API | Swagger / OpenAPI (`springdoc-openapi`) → `/swagger-ui.html` |

---

## 2. Rôle et responsabilités

**Contexte borné :** *l'engagement et la motivation des étudiants et des équipes.*
Le service entretient la motivation des groupes formés par la plateforme grâce à trois leviers décrits dans la thématique : **identité**, **reconnaissance** et **visualisation**.

### Ce que le service fait

| Levier | Fonctionnalités |
|---|---|
| **Identité** | Bibliothèque d'avatars, choix de l'avatar par l'étudiant, nom et emblème de l'équipe |
| **Reconnaissance** | Attribution automatique de points et de badges à partir des événements métier, niveaux, badges manuels par l'enseignant, *kudos* (remerciement d'entraide entre coéquipiers) |
| **Visualisation** | Jauge de progression de l'équipe, répartition des contributions, classement **par équipes**, tableau de bord du joueur |

### Données propres au service

Le service ne stocke **que** les données de gamification ; il garde une copie locale minimale (`groupId`, `studentId`, appartenance à l'équipe) reçue par événement, sans jamais lire la base d'un autre service.

### Acteurs et cas d'utilisation

| Acteur | Cas d'utilisation |
|---|---|
| **Étudiant** | Choisir son avatar · consulter ses points, son niveau et ses badges · renommer son équipe et choisir son emblème · envoyer un kudos à un coéquipier · consulter le tableau de bord de l'équipe et le classement |
| **Enseignant** | Créer / modifier les badges et leurs règles · attribuer un badge manuellement · consulter les tableaux de bord des équipes et le classement de son module |
| **Administrateur** | Gérer la bibliothèque d'avatars, d'emblèmes et les niveaux |
| **Système** (autres services) | Publier les événements qui déclenchent points et badges |

### Gamification responsable

Conformément à la thématique :
- le **classement compare les équipes, jamais les individus** ; les points individuels ne sont visibles que par l'étudiant lui-même et par l'enseignant ;
- les badges récompensent la **participation et la coopération** (profil complété, régularité, entraide, rendu à temps) plutôt que la note ;
- les points de contribution sont **plafonnés par jour** pour éviter le « farming ».

---

## 3. Règles métier

### Barème des points

| Événement (`EventType`) | Source | Points | Bénéficiaire |
|---|---|---|---|
| `PROFILE_COMPLETED` | Profiling Service | +20 | Étudiant |
| `GROUP_JOINED` | Course / Group Service | +10 | Étudiant |
| `CONTRIBUTION_RECORDED` | Course / Group Service | +5 (plafond 50 / jour) | Étudiant + équipe |
| `DELIVERABLE_SUBMITTED` à temps | Course / Group Service | +30 | Chaque membre + équipe |
| `DELIVERABLE_SUBMITTED` en retard | Course / Group Service | +10 | Chaque membre + équipe |
| `KUDOS_RECEIVED` | Gamification (interne) | +5 (3 kudos envoyés max / semaine) | Destinataire + équipe |
| `DAILY_ACTIVITY` | calculé (série de jours actifs) | +2 | Étudiant |
| `MANUAL` | Enseignant | selon le badge | Étudiant |

Les points de l'équipe = somme des transactions rattachées à l'équipe.

### Niveaux

| Rang | Nom | Points minimum |
|---|---|---|
| 1 | Débutant | 0 |
| 2 | Contributeur | 100 |
| 3 | Collaborateur | 250 |
| 4 | Pilier | 500 |
| 5 | Mentor | 1000 |

Le niveau est **calculé** à partir de `totalPoints` (pas stocké) ; certains avatars ne se débloquent qu'à partir d'un niveau (`requiredLevel`).

### Badges initiaux (données de seed)

| Code | Catégorie | Règle (`triggerEvent` / `conditionType` / `threshold` / `scope`) |
|---|---|---|
| `PROFILE_DONE` – Profil complété | PARTICIPATION | `PROFILE_COMPLETED` / `FIRST_OCCURRENCE` / 1 / STUDENT |
| `FIRST_STEP` – Première contribution | PARTICIPATION | `CONTRIBUTION_RECORDED` / `FIRST_OCCURRENCE` / 1 / STUDENT |
| `ON_TIME` – Livrable à l'heure | DELIVERY | `DELIVERABLE_SUBMITTED` / `ON_TIME` / 1 / TEAM |
| `HELPER` – Entraide | COOPERATION | `KUDOS_RECEIVED` / `COUNT_THRESHOLD` / 5 / STUDENT |
| `REGULAR` – Régularité | REGULARITY | `DAILY_ACTIVITY` / `STREAK_DAYS` / 7 / STUDENT |
| `DREAM_TEAM` – Équipe exemplaire | COOPERATION | `DELIVERABLE_SUBMITTED` / `ON_TIME` / 3 / TEAM |

Un badge n'est attribué **qu'une seule fois** par étudiant (contrainte d'unicité en base).

---

## 4. Diagramme de classes

![Diagramme de classes – Gamification Service](docs/diagramme-classes-gamification.png)

<details>
<summary>Source Mermaid (rendu automatique par GitHub)</summary>

```mermaid
classDiagram
    direction LR
    class PlayerProfile {
        -Long id
        -String studentId
        -String displayName
        -int totalPoints
        -LocalDateTime createdAt
        -LocalDateTime lastActivityAt
        -int currentStreakDays
        +addPoints(int points) void
        +progressToNextLevel() double
    }
    class Avatar {
        -Long id
        -String code
        -String label
        -String imageUrl
        -int requiredLevel
        -boolean active
    }
    class Level {
        -Long id
        -int rank
        -String name
        -int minPoints
    }
    class Badge {
        -Long id
        -String code
        -String name
        -String description
        -String iconUrl
        -BadgeCategory category
        -int rewardPoints
        -boolean active
    }
    class BadgeRule {
        -Long id
        -EventType triggerEvent
        -ConditionType conditionType
        -int threshold
        -RuleScope scope
        +isSatisfiedBy(int counter) boolean
    }
    class BadgeAward {
        -Long id
        -LocalDateTime awardedAt
        -String sourceEventId
        -boolean manual
        -String awardedBy
    }
    class PointTransaction {
        -Long id
        -int points
        -EventType reason
        -String sourceEventId
        -LocalDateTime createdAt
    }
    class Team {
        -Long id
        -Long groupId
        -Long courseId
        -String name
        -int totalPoints
        -int deliverablesTotal
        -int deliverablesSubmitted
        -int onTimeDeliveries
        -LocalDateTime createdAt
        +progressPercent() double
        +rename(String name) void
    }
    class Emblem {
        -Long id
        -String code
        -String imageUrl
    }
    class TeamMembership {
        -Long id
        -LocalDateTime joinedAt
    }
    class Kudos {
        -Long id
        -String message
        -LocalDateTime createdAt
    }
    class ProcessedEvent {
        -String eventId
        -String eventType
        -LocalDateTime processedAt
    }
    class EventType {
        <<enumeration>>
        PROFILE_COMPLETED
        GROUP_JOINED
        CONTRIBUTION_RECORDED
        DELIVERABLE_SUBMITTED
        KUDOS_RECEIVED
        DAILY_ACTIVITY
        BADGE_REWARD
        MANUAL
    }
    class BadgeCategory {
        <<enumeration>>
        PARTICIPATION
        COOPERATION
        REGULARITY
        DELIVERY
    }
    class ConditionType {
        <<enumeration>>
        FIRST_OCCURRENCE
        COUNT_THRESHOLD
        STREAK_DAYS
        ON_TIME
    }
    class RuleScope {
        <<enumeration>>
        STUDENT
        TEAM
    }
    PlayerProfile "0..*" --> "0..1" Avatar : choisit
    PlayerProfile "0..*" ..> "1" Level : niveau calculé
    Avatar "0..*" --> "1" Level : débloqué à
    PlayerProfile "1" *-- "0..*" PointTransaction : historique
    PlayerProfile "1" *-- "0..*" BadgeAward : obtient
    BadgeAward "0..*" --> "1" Badge : concerne
    Badge "1" *-- "1..*" BadgeRule : règles
    Team "1" *-- "1..*" TeamMembership : membres
    TeamMembership "0..*" --> "1" PlayerProfile : joueur
    Team "0..*" --> "0..1" Emblem : emblème
    PointTransaction "0..*" --> "0..1" Team : crédite
    Kudos "0..*" --> "1" PlayerProfile : émetteur
    Kudos "0..*" --> "1" PlayerProfile : destinataire
    Kudos "0..*" --> "1" Team : équipe
    Badge ..> BadgeCategory
    BadgeRule ..> EventType
    BadgeRule ..> ConditionType
    BadgeRule ..> RuleScope
    PointTransaction ..> EventType
```
</details>

### Explication des entités

| Entité | Rôle |
|---|---|
| `PlayerProfile` | Profil de jeu d'un étudiant. `studentId` = identifiant Keycloak (`sub` du JWT) : **référence externe**, pas de clé étrangère vers un autre service. |
| `Avatar` / `Emblem` | Catalogues d'images pour l'identité de l'étudiant et de l'équipe. |
| `Level` | Table de référence des paliers de points. |
| `Badge` / `BadgeRule` | Un badge possède une ou plusieurs règles déclenchées par un type d'événement. Les règles sont **paramétrables** par l'enseignant (pas codées en dur). |
| `BadgeAward` | Attribution d'un badge à un joueur (automatique ou manuelle). |
| `PointTransaction` | Journal (*ledger*) des points : chaque gain est tracé, explicable et rejouable. `totalPoints` est un cumul dénormalisé pour la performance. |
| `Team` / `TeamMembership` | Identité gamifiée d'un groupe. `groupId` et `courseId` sont des références vers le Course / Group Service (copie locale reçue par événement). |
| `Kudos` | Remerciement d'entraide entre deux membres d'une même équipe. |
| `ProcessedEvent` | Garantit l'**idempotence** : un événement RabbitMQ rejoué n'est jamais traité deux fois. |

> Le **classement** n'est pas une entité : il est calculé par requête (`ORDER BY total_points`) et renvoyé sous forme de DTO `LeaderboardEntryDTO`.

---

## 5. Base de données : choix de MySQL

**Pourquoi un SGBD relationnel, et MySQL en particulier :**

1. **Intégrité forte** : les règles « un badge une seule fois par étudiant » ou « un événement traité une seule fois » s'expriment directement par des contraintes `UNIQUE`.
2. **Transactions ACID** : ajouter des points, mettre à jour le total de l'équipe et attribuer un badge doit se faire **atomiquement** (`@Transactional`).
3. **Agrégations** : classement et répartition des contributions = `SUM` / `GROUP BY` / `ORDER BY`, naturels en SQL.
4. **Modèle stable et fortement relié** (badges ↔ règles ↔ attributions), donc pas besoin de la flexibilité d'un modèle document.
5. Conforme à la stack imposée (MySQL pour le microservice 4) et bien intégré à Spring Data JPA / Hibernate.

**Contraintes principales :**

| Table | Contrainte |
|---|---|
| `player_profile` | `UNIQUE(student_id)` |
| `badge` | `UNIQUE(code)` |
| `badge_award` | `UNIQUE(player_id, badge_id)` |
| `point_transaction` | `UNIQUE(player_id, source_event_id)` + index `(team_id)` |
| `team` | `UNIQUE(group_id)`, `UNIQUE(course_id, name)` |
| `team_membership` | `UNIQUE(team_id, player_id)` |
| `processed_event` | `PRIMARY KEY(event_id)` |

---

## 6. Contrat d'API REST

Base : `http://gateway:8080/api/gamification` · format JSON · pagination `?page=0&size=20`.
`me` = étudiant identifié par le JWT.

### Joueurs

| Méthode | URI | Rôle | Description | Codes |
|---|---|---|---|---|
| GET | `/players/me` | STUDENT | Profil de jeu : points, niveau, progression, avatar | 200, 401, 404 |
| GET | `/players/me/badges` | STUDENT | Badges obtenus | 200, 401 |
| GET | `/players/me/points-history` | STUDENT | Historique paginé des points | 200, 401 |
| PUT | `/players/me/avatar` | STUDENT | Choisir un avatar `{ "avatarId": 3 }` | 200, 400, 403 (avatar verrouillé), 404 |
| GET | `/players/{studentId}` | TEACHER | Profil de jeu d'un étudiant | 200, 403, 404 |

### Avatars, emblèmes, niveaux

| Méthode | URI | Rôle | Description | Codes |
|---|---|---|---|---|
| GET | `/avatars` | tous | Bibliothèque d'avatars | 200 |
| POST | `/avatars` | ADMIN | Ajouter un avatar | 201, 400, 409 (code existant) |
| DELETE | `/avatars/{id}` | ADMIN | Désactiver un avatar | 204, 404 |
| GET | `/emblems` | tous | Liste des emblèmes | 200 |
| GET | `/levels` | tous | Paliers de niveaux | 200 |

### Badges et règles

| Méthode | URI | Rôle | Description | Codes |
|---|---|---|---|---|
| GET | `/badges` | tous | Catalogue des badges | 200 |
| GET | `/badges/{id}` | tous | Détail d'un badge et de ses règles | 200, 404 |
| POST | `/badges` | TEACHER, ADMIN | Créer un badge avec ses règles | 201, 400, 409 |
| PUT | `/badges/{id}` | TEACHER, ADMIN | Modifier un badge | 200, 400, 404 |
| DELETE | `/badges/{id}` | TEACHER, ADMIN | Désactiver (soft delete, les attributions restent) | 204, 404 |
| POST | `/players/{studentId}/badges/{badgeId}` | TEACHER | Attribution manuelle | 201, 404, 409 (déjà obtenu) |

### Équipes et classement

| Méthode | URI | Rôle | Description | Codes |
|---|---|---|---|---|
| GET | `/teams/{teamId}` | membres, TEACHER | Identité de l'équipe | 200, 403, 404 |
| PATCH | `/teams/{teamId}/identity` | STUDENT membre | Nom et emblème `{ "name": "...", "emblemId": 2 }` | 200, 400, 403 (non membre), 404, 409 (nom pris dans le module) |
| GET | `/teams/{teamId}/dashboard` | membres, TEACHER | Jauge de progression, points, répartition des contributions, badges d'équipe | 200, 403, 404 |
| GET | `/courses/{courseId}/leaderboard` | STUDENT, TEACHER | Classement **des équipes** du module | 200, 404 |
| GET | `/courses/{courseId}/engagement` | TEACHER, service Analytics | Indicateurs agrégés d'engagement | 200, 404 |

### Kudos

| Méthode | URI | Rôle | Description | Codes |
|---|---|---|---|---|
| POST | `/kudos` | STUDENT | `{ "toStudentId": "...", "message": "Merci !" }` | 201, 400 (à soi-même), 403 (pas la même équipe), 429 (quota hebdo atteint) |
| GET | `/teams/{teamId}/kudos` | membres | Kudos échangés dans l'équipe | 200, 403 |

### Format d'erreur commun

```json
{
  "timestamp": "2026-11-10T09:15:00Z",
  "status": 409,
  "error": "Conflict",
  "message": "Le nom 'Les Pionniers' est déjà utilisé dans ce module",
  "path": "/api/gamification/teams/12/identity"
}
```

### Exemple – `GET /players/me`

```json
{
  "studentId": "7f3c2a1e-...",
  "displayName": "Sara B.",
  "avatar": { "id": 3, "label": "Renard", "imageUrl": "/avatars/fox.png" },
  "totalPoints": 135,
  "level": { "rank": 2, "name": "Contributeur" },
  "nextLevel": { "rank": 3, "name": "Collaborateur", "minPoints": 250 },
  "progressToNextLevel": 0.23,
  "badgesCount": 3,
  "teamId": 12
}
```

### Exemple – `GET /courses/5/leaderboard`

```json
[
  { "rank": 1, "teamId": 12, "name": "Les Pionniers", "emblemUrl": "/emblems/rocket.png", "totalPoints": 640, "progressPercent": 75.0 },
  { "rank": 2, "teamId": 9,  "name": "Data Squad",    "emblemUrl": "/emblems/owl.png",    "totalPoints": 590, "progressPercent": 50.0 }
]
```

---

## 7. Interactions du microservice

```mermaid
flowchart LR
    FE[Frontend Angular] -->|REST via Gateway| GW[API Gateway]
    GW --> GAM[Gamification Service]
    PROF[Profiling Service] -- profile.completed --> MQ[(RabbitMQ<br/>platform.events)]
    GRP[Course / Group Service] -- groups.published<br/>contribution.recorded<br/>deliverable.submitted --> MQ
    MQ --> GAM
    GAM -- badge.awarded<br/>level.up<br/>team.points.updated --> MQ
    MQ --> ANA[Analytics Service]
    GAM -. OpenFeign : GET /api/groups/{id} .-> GRP
    ANA -. OpenFeign : GET /courses/{id}/engagement .-> GAM
    GAM --- DB[(MySQL<br/>gamification_db)]
```

### 7.1 Communication asynchrone (RabbitMQ) – mode principal

**Justification :** l'attribution de points est une **réaction** à ce qui se passe ailleurs. Les services producteurs n'ont pas à attendre la gamification ni même à connaître son existence (couplage faible). Si le Gamification Service est arrêté, les messages restent dans la file et sont traités au redémarrage : **aucun point n'est perdu**.

**Événements consommés** (file `gamification.queue`, liée à l'exchange topic `platform.events`) :

| Routing key | Producteur | Données reçues | Traitement |
|---|---|---|---|
| `profile.completed` | Profiling | `eventId, studentId, displayName, completedAt` | Crée le `PlayerProfile` si absent, +20 pts, badge `PROFILE_DONE` |
| `groups.published` | Course / Group | `eventId, courseId, groups[{groupId, defaultName, memberIds[], deliverablesTotal}]` | Crée `Team` + `TeamMembership`, +10 pts par membre |
| `contribution.recorded` | Course / Group | `eventId, groupId, studentId, type, recordedAt` | +5 pts (plafond), mise à jour de la série de jours, badges `FIRST_STEP` / `REGULAR` |
| `deliverable.submitted` | Course / Group | `eventId, groupId, deliverableId, dueDate, submittedAt` | Progression de l'équipe, +30 ou +10 pts par membre, badges `ON_TIME` / `DREAM_TEAM` |

**Événements publiés :**

| Routing key | Données envoyées | Consommateurs |
|---|---|---|
| `badge.awarded` | `eventId, studentId, badgeCode, badgeName, awardedAt` | Analytics (indicateurs), notification front |
| `level.up` | `eventId, studentId, newLevel, reachedAt` | Analytics |
| `team.points.updated` | `eventId, teamId, groupId, courseId, totalPoints, progressPercent` | Analytics |

**Exemple de message `deliverable.submitted` :**

```json
{
  "eventId": "c1b9e7d2-4f0a-4d6e-9a51-3b2f1a7e8c90",
  "eventType": "DELIVERABLE_SUBMITTED",
  "occurredAt": "2026-11-20T17:42:00Z",
  "payload": { "groupId": 12, "deliverableId": 4, "dueDate": "2026-11-21T23:59:00Z", "submittedAt": "2026-11-20T17:42:00Z" }
}
```

**Scénario : rendu d'un livrable**

```mermaid
sequenceDiagram
    participant G as Course/Group Service
    participant MQ as RabbitMQ
    participant GAM as Gamification Service
    participant DB as MySQL
    participant A as Analytics Service
    G->>MQ: publish deliverable.submitted
    MQ->>GAM: consume (gamification.queue)
    GAM->>DB: eventId déjà traité ?
    alt déjà traité
        GAM-->>MQ: ack (ignoré)
    else nouveau
        GAM->>DB: @Transactional : points membres + équipe, progression, badges, ProcessedEvent
        GAM-->>MQ: ack
        GAM->>MQ: publish team.points.updated (+ badge.awarded)
        MQ->>A: consume
    end
```

### 7.2 Communication synchrone (OpenFeign)

**Justification :** utilisée seulement quand une **réponse immédiate** est nécessaire.

| Sens | Appel | Données échangées | Quand |
|---|---|---|---|
| Gamification → Course / Group | `GET /api/groups/{groupId}` | `groupId, courseId, name, memberIds[]` | Réconciliation : un événement arrive pour une équipe inconnue localement (ex. `groups.published` perdu ou arrivé dans le désordre) |
| Analytics → Gamification | `GET /api/gamification/courses/{courseId}/engagement` | points moyens par équipe, badges distribués, taux d'étudiants actifs | Construction des indicateurs administratifs |
| Frontend → Gamification (via Gateway) | tous les endpoints du §6 | DTO JSON | Affichage des écrans |

```java
@FeignClient(name = "course-group-service", fallbackFactory = GroupClientFallbackFactory.class)
public interface GroupClient {
    @GetMapping("/api/groups/{groupId}")
    GroupDTO getGroup(@PathVariable Long groupId);
}
```

---

## 8. Gestion des pannes

| Situation | Comportement prévu |
|---|---|
| **Gamification Service arrêté** | Files RabbitMQ **durables** : les événements s'accumulent et sont traités au redémarrage. Les autres services continuent de fonctionner normalement (la gamification n'est pas sur leur chemin critique). |
| **Course / Group Service indisponible** lors d'un appel Feign | Resilience4j : *timeout* 2 s, 2 tentatives, puis **circuit breaker** ouvert. Le *fallback* lève une exception récupérable : le message est rejeté et **re-livré plus tard** (retry avec délai) au lieu d'être perdu. |
| **Message en échec répété** (données invalides) | Après 3 tentatives → **Dead Letter Queue** `gamification.dlq` pour analyse, sans bloquer la file. |
| **Message reçu deux fois** (at-least-once) | Idempotence : vérification dans `processed_event` + contraintes `UNIQUE` sur `point_transaction` et `badge_award`. |
| **RabbitMQ indisponible** à la publication de `badge.awarded` | La transaction métier est déjà validée ; la publication est retentée (retry Spring AMQP). Évolution possible : *pattern Outbox*. |
| **MySQL indisponible** | Le service renvoie `503 Service Unavailable` ; l'*actuator health* passe à `DOWN` et Eureka / la Gateway arrêtent de router vers l'instance. |

---

## 9. Sécurité

- Le service est un **OAuth2 Resource Server** : il valide le JWT émis par Keycloak (realm de la plateforme) transmis par la Gateway.
- Rôles du realm utilisés : `STUDENT`, `TEACHER`, `ADMIN` → `@PreAuthorize("hasRole('TEACHER')")`.
- L'identité de l'étudiant (`studentId`) est **toujours lue depuis le token** (`sub`), jamais depuis le corps de la requête → un étudiant ne peut pas s'attribuer des points.
- Vérifications métier : seul un membre peut renommer son équipe ; un kudos n'est possible qu'entre membres de la même équipe.
- Les appels Feign inter-services propagent le token (ou utilisent un client *client_credentials* Keycloak).

---

## 10. Structure du projet Spring Boot

```
gamification-service/
├── pom.xml
├── Dockerfile
├── docker-compose.dev.yml         MySQL + RabbitMQ + Keycloak pour le développement
├── keycloak/groupify-realm.json   realm importé : rôles, clients, utilisateurs de test
├── docs/                          diagramme de classes (.png, .svg, .mmd)
└── src/
    ├── main/java/tn/esprit/gamification/
    │   ├── GamificationServiceApplication.java
    │   ├── entity/       PlayerProfile, Avatar, Level, Badge, BadgeRule, BadgeAward, PointTransaction,
    │   │                 Team, Emblem, TeamMembership, Kudos, ProcessedEvent
    │   ├── enums/        EventType, BadgeCategory, ConditionType, RuleScope
    │   ├── repository/   interfaces Spring Data JPA (12)
    │   ├── dto/          records d'entrée / sortie (PlayerDtos, BadgeDtos, TeamDtos, CatalogDtos)
    │   ├── mapper/       GamificationMapper (entité -> DTO)
    │   ├── service/      PointService, BadgeEngine, LevelService, PlayerService, TeamService,
    │   │                 KudosService, BadgeService, CatalogService, EventProcessingService
    │   ├── controller/   PlayerController, BadgeController, TeamController, KudosController,
    │   │                 CatalogController, DevEventController (profil dev)
    │   ├── messaging/    RabbitConfig, EventConsumer, EventPublisher, event/ (enveloppe + payloads)
    │   ├── client/       GroupClient (OpenFeign), GroupClientFallbackFactory, FeignAuthConfig
    │   ├── security/     SecurityConfig, KeycloakRoleConverter, CurrentUser, CurrentUserProvider
    │   ├── config/       GamificationProperties, OpenApiConfig, DataSeeder (données initiales)
    │   └── exception/    ApiException, ApiError, GlobalExceptionHandler
    ├── main/resources/application.yml
    └── test/java/.../DomainRulesTest.java
```

**Dépendances Maven :** `spring-boot-starter-web`, `spring-boot-starter-data-jpa`, `mysql-connector-j`, `spring-boot-starter-validation`, `spring-cloud-starter-netflix-eureka-client`, `spring-cloud-starter-config`, `spring-cloud-starter-openfeign`, `spring-cloud-starter-circuitbreaker-resilience4j`, `spring-boot-starter-amqp`, `spring-boot-starter-oauth2-resource-server`, `spring-boot-starter-oauth2-client`, `springdoc-openapi-starter-webmvc-ui`, `spring-boot-starter-actuator`, `lombok`.

**`application.yml` (extrait) :**

```yaml
server:
  port: 8084
spring:
  application:
    name: gamification-service
  datasource:
    url: jdbc:mysql://localhost:3306/gamification_db?createDatabaseIfNotExist=true
    username: root
    password: root
  jpa:
    hibernate:
      ddl-auto: update
  rabbitmq:
    host: localhost
    port: 5672
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://localhost:8180/realms/groupify
eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka
```

---

## 11. Écrans Angular consommant le service

| Écran / composant | Endpoints utilisés |
|---|---|
| `AvatarPickerComponent` – choix de l'avatar | `GET /avatars`, `PUT /players/me/avatar` |
| `PlayerCardComponent` – points, niveau, barre de progression | `GET /players/me` |
| `BadgeWallComponent` – mur de badges (obtenus / verrouillés) | `GET /badges`, `GET /players/me/badges` |
| `TeamIdentityComponent` – nom et emblème de l'équipe | `GET /emblems`, `PATCH /teams/{id}/identity` |
| `TeamDashboardComponent` – jauge, répartition des contributions (graphique) | `GET /teams/{id}/dashboard` |
| `LeaderboardComponent` – classement des équipes | `GET /courses/{id}/leaderboard` |
| `KudosDialogComponent` – remercier un coéquipier | `POST /kudos` |
| `BadgeAdminComponent` (enseignant) – gestion des badges et règles | `POST/PUT/DELETE /badges` |

---

## 12. API Gateway du microservice

Projet séparé : `api-gateway/` (Spring Cloud Gateway, port **8080**). C'est le point d'entrée unique du front Angular vers le Gamification Service.

```
Angular :4200 ──► API Gateway :8080 ──lb://gamification-service──► Gamification Service :8084 ──► MySQL
                    ├─ vérifie le JWT Keycloak (401 sinon)              ▲
                    ├─ CORS pour http://localhost:4200                  │ adresse obtenue auprès d'Eureka :8761
                    ├─ CircuitBreaker + fallback 503
                    └─ en-tête X-Correlation-Id + logs
```

| Route | Prédicat | Cible | Filtres |
|---|---|---|---|
| `gamification-service` | `Path=/api/gamification/**` | `lb://gamification-service` | `CircuitBreaker` (`gamificationCB`, fallback `forward:/fallback/gamification-service`) |
| `gamification-docs` | `Path=/docs/gamification/**` | `lb://gamification-service` | `RewritePath` → `/v3/api-docs` (Swagger accessible via la Gateway) |

| Fichier | Rôle |
|---|---|
| `application.yml` | Routes, Eureka, Resilience4j (timeout 5 s, circuit ouvert à 50 % d'échecs), CORS, Swagger |
| `security/SecurityConfig.java` | Toute requête `/api/**` exige un JWT valide ; `OPTIONS`, santé, Swagger et fallback publics |
| `security/KeycloakReactiveJwtConverter.java` | Rôles Keycloak `realm_access.roles` → `ROLE_STUDENT`, `ROLE_TEACHER`, `ROLE_ADMIN` |
| `web/FallbackController.java` | Réponse **503** JSON quand le Gamification Service est arrêté, lent ou que le circuit est ouvert |
| `filter/CorrelationIdFilter.java` | Ajoute `X-Correlation-Id` à chaque requête et journalise méthode, chemin, statut, durée |

**Choix justifiés :**
- **Sécurité en deux niveaux** : la Gateway refuse les requêtes sans jeton ; le microservice revalide le jeton et contrôle les rôles (`@PreAuthorize`).
- **`lb://`** : la Gateway ne connaît pas l'adresse du service, elle la demande à Eureka ; plusieurs instances peuvent tourner, la charge est répartie.
- **CORS dans la chaîne de sécurité** : les requêtes *preflight* `OPTIONS` d'Angular passent avant l'authentification.
- **Circuit breaker** : le front reçoit un 503 clair au lieu d'attendre un timeout.

---

## 13. Lancement et tests

### 13.0 Démarrage rapide sans Docker (profil `local`)

Seul **MySQL** est nécessaire (XAMPP / WAMP). Keycloak, RabbitMQ et Eureka sont désactivés.

1. Démarrer MySQL (XAMPP → *Start*). Utilisateur `root`, mot de passe vide par défaut ; sinon modifier `password` dans `application-local.yml`.
2. IntelliJ → *Run → Edit Configurations* → `GamificationServiceApplication` → **Active profiles : `local`** → ▶.
   Ou : `mvn spring-boot:run -Dspring-boot.run.profiles=local`
3. Ouvrir http://localhost:8084/swagger-ui.html : tous les endpoints sont testables sans jeton.

| Élément | En profil `local` |
|---|---|
| Utilisateur connecté | `student1` avec les rôles STUDENT, TEACHER, ADMIN |
| Changer d'étudiant | Swagger → **Authorize** → `X-User-Id` = `student2` (ou en-tête `X-User-Id` dans Postman) |
| Limiter les rôles | en-tête `X-User-Roles: STUDENT` (Postman) |
| Événements | `POST /api/gamification/dev/events/{routingKey}` les traite directement (sans RabbitMQ) |
| Événements publiés | écrits dans la console au lieu d'être envoyés à RabbitMQ |

Scénario de démo dans Swagger : `groups.published` avec `"memberIds":["student1","student2"]`, puis `profile.completed` et `deliverable.submitted` (corps de la section 13.2, en remplaçant `S1_ID` / `S2_ID` par `student1` / `student2`), puis `GET /players/me`, `GET /teams/1/dashboard`, `GET /courses/1/leaderboard`.

**Passer par l'API Gateway (facultatif)** : lancer aussi `api-gateway` avec le profil **`local`** (*Active profiles : `local`*, ou `mvn spring-boot:run -Dspring-boot.run.profiles=local`). La Gateway route alors directement vers `http://localhost:8084` (sans Eureka) et ne demande pas de jeton (sans Keycloak). Le CORS, le circuit breaker et `X-Correlation-Id` restent actifs.

| Démo via la Gateway | Résultat |
|---|---|
| `GET http://localhost:8080/api/gamification/players/me` | Réponse du service, en-tête `X-Correlation-Id` ajouté |
| Swagger via la Gateway : http://localhost:8080/swagger-ui.html | Documentation du service servie par la Gateway |
| Arrêter le service, refaire l'appel | **503** JSON du `FallbackController` (circuit breaker) |

> Ces profils servent uniquement à la démonstration. La sécurité Keycloak et la découverte Eureka réelles (profil par défaut) restent dans le code : `security/SecurityConfig.java` des deux projets.

### Démarrage complet (Docker : MySQL + RabbitMQ + Keycloak)

**Prérequis :** JDK 17+, Maven, Docker Desktop, un serveur Eureka sur le port 8761 (infrastructure commune).

```bash
# 1. Infrastructure du service : MySQL, RabbitMQ, Keycloak (realm "groupify" importé automatiquement)
cd gamification-service
docker compose -f docker-compose.dev.yml up -d

# 2. Le microservice (profil dev = endpoint de simulation d'événements)
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# 3. L'API Gateway
cd ../api-gateway
mvn spring-boot:run
```

| URL | Accès |
|---|---|
| Swagger du service | http://localhost:8084/swagger-ui.html |
| Swagger via la Gateway | http://localhost:8080/swagger-ui.html |
| RabbitMQ | http://localhost:15672 (guest / guest) |
| Keycloak | http://localhost:8180 (admin / admin) |

Comptes de test : `student1`, `student2`, `teacher1`, `admin1` (mot de passe = nom d'utilisateur).

### 13.1 Obtenir un jeton

```bash
curl -s -X POST http://localhost:8180/realms/groupify/protocol/openid-connect/token \
  -d grant_type=password -d client_id=angular-frontend -d username=teacher1 -d password=teacher1
```

Copier `access_token` (Swagger : bouton **Authorize**). Faire de même pour `student1` et `student2`, puis appeler `GET /api/gamification/players/me` avec chacun pour noter leur `studentId` (`S1_ID`, `S2_ID`).

### 13.2 Simuler les événements reçus (profil `dev`, jeton enseignant)

```bash
curl -X POST http://localhost:8080/api/gamification/dev/events/groups.published \
  -H "Authorization: Bearer $TOKEN_TEACHER" -H "Content-Type: application/json" \
  -d '{"courseId":1,"groups":[{"groupId":10,"name":"Les Pionniers","memberIds":["S1_ID","S2_ID"],"deliverablesTotal":4}]}'

curl -X POST http://localhost:8080/api/gamification/dev/events/profile.completed \
  -H "Authorization: Bearer $TOKEN_TEACHER" -H "Content-Type: application/json" \
  -d '{"studentId":"S1_ID","displayName":"Sara Ben Ali","completedAt":"2026-11-10T09:00:00Z"}'

curl -X POST http://localhost:8080/api/gamification/dev/events/contribution.recorded \
  -H "Authorization: Bearer $TOKEN_TEACHER" -H "Content-Type: application/json" \
  -d '{"groupId":10,"studentId":"S1_ID","type":"COMMIT","recordedAt":"2026-11-10T10:00:00Z"}'

curl -X POST http://localhost:8080/api/gamification/dev/events/deliverable.submitted \
  -H "Authorization: Bearer $TOKEN_TEACHER" -H "Content-Type: application/json" \
  -d '{"groupId":10,"deliverableId":1,"dueDate":"2026-11-21T23:59:00Z","submittedAt":"2026-11-20T17:00:00Z"}'
```

### 13.3 Vérifier

```bash
curl http://localhost:8080/api/gamification/players/me            -H "Authorization: Bearer $TOKEN_S1"
curl http://localhost:8080/api/gamification/players/me/badges     -H "Authorization: Bearer $TOKEN_S1"
curl http://localhost:8080/api/gamification/teams/1/dashboard     -H "Authorization: Bearer $TOKEN_S1"
curl http://localhost:8080/api/gamification/courses/1/leaderboard -H "Authorization: Bearer $TOKEN_S1"
curl -X POST http://localhost:8080/api/gamification/kudos -H "Authorization: Bearer $TOKEN_S1" \
  -H "Content-Type: application/json" -d '{"toStudentId":"S2_ID","message":"Merci pour ton aide !"}'
```

Attendu pour student1 : 10 + 20 + 10 (badge `PROFILE_DONE`) + 5 + 2 + 10 (badge `FIRST_STEP`) + 30 + 15 (badge `ON_TIME`) = **102 points → niveau 2 « Contributeur »**.

### 13.4 Résilience à démontrer

| Test | Résultat attendu |
|---|---|
| Appel sans jeton via la Gateway | **401** |
| Service arrêté, appel via la Gateway | **503** JSON du `FallbackController` |
| Service arrêté, événements publiés, puis redémarrage | Les messages attendaient dans `gamification.queue`, les points sont attribués |
| Même événement publié deux fois | Ignoré la 2e fois (`processed_event`) |
| `contribution.recorded` pour un `groupId` inconnu | Appel Feign ; en échec → 3 tentatives puis message dans `gamification.dlq` |

Tests unitaires : `mvn test`.

---

## 14. Correspondance avec la grille d'évaluation

| Exigence (grille / rendu demandé) | Où la trouver |
|---|---|
| **I1** – Responsabilités | §2 |
| **I1** – Entités et modèle de données (diagramme de classes) | §4, `docs/diagramme-classes-gamification.png`, package `entity/` |
| **I1** – Choix de la base justifié | §5 (MySQL, contraintes) |
| **I1** – API REST : ressources, URI, méthodes, codes de statut | §6, Swagger `/swagger-ui.html` |
| **I2** – Services appelés et appelants, données échangées | §7 |
| **I2** – Mode synchrone / asynchrone justifié | §7.1 (RabbitMQ), §7.2 (OpenFeign) |
| **I2** – Comportement si un service est indisponible | §8, §13.4 |
| Contrat d'API : endpoints, codes, **événements** | §6 et §7.1 |
| **I3** – Projet créé dans `Backend/`, compile et démarre | `gamification-service/`, §13 |
| Une base par microservice | `gamification_db`, propre au service (§1, §5) |
| Enregistrement Eureka | `spring.application.name: gamification-service`, client Eureka (§1) |
| Swagger / OpenAPI | `springdoc-openapi`, `OpenApiConfig` |
| Sécurité Keycloak | §9, `security/` |
| API Gateway | §12, projet `api-gateway/` |
| Dockerisation | `Dockerfile` des deux projets |




