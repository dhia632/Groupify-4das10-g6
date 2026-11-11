# Groupify

**Groupify** est une application web basée sur une architecture frontend et microservices. Elle intègre notamment un service Analytics permettant de consulter les statistiques des cours, des groupes et des promotions.

## Architecture du projet

Le projet repose sur les composants suivants :

| Composant | Technologie | Port |
|---|---|---:|
| Frontend | Angular | 4200 |
| API Gateway | Spring Cloud Gateway | 8090 |
| Analytics Service | Spring Boot | 8085 |
| Database | MongoDB 7 | 27018 |

### Architecture générale

```text
             Angular Frontend
                 Port 4200
                     |
                     v
              API Gateway
                 Port 8090
                     |
                     v
             Analytics Service
                 Port 8085
                     |
                     v
                 MongoDB
                 Port 27018
```

## Technologies utilisées

### Frontend
- Angular
- TypeScript
- HTML / CSS
- Angular HTTP Client

### Backend
- Java 17
- Spring Boot 3.4.4
- Spring Cloud Gateway
- REST API
- Spring Boot Actuator

### Database
- MongoDB 7
- Docker

## Structure du projet

```text
groupify-front/
│
├── groupify-front/
│   └── Angular application
│
├── groupify-gateway/
│   └── Spring Cloud Gateway
│
├── analytics-service-springboot/
│   └── analytics-service/
│       └── Spring Boot application
│
└── README.md
```

## Prérequis

Avant de démarrer le projet, installer :

- Node.js et npm
- Angular CLI
- Java JDK 17
- Maven
- Docker Desktop
- IntelliJ IDEA (recommandé)

Vérifier les installations :

```bash
node --version
npm --version
ng version
java -version
mvn -version
docker --version
```

## Installation et démarrage

### 1. Démarrer MongoDB

Vérifier les conteneurs Docker :

```bash
docker ps -a
```

Si le conteneur MongoDB existe déjà :

```bash
docker start mongodb-analytics
```

Si aucun conteneur MongoDB n'existe :

```bash
docker run -d \
  --name mongodb-analytics \
  -p 27018:27017 \
  -v analytics-mongo-data:/data/db \
  mongo:7
```

Vérifier que MongoDB fonctionne :

```bash
docker ps
```

### 2. Démarrer Analytics Service

Ouvrir le dossier :

```text
analytics-service-springboot/analytics-service
```

Démarrer l'application avec IntelliJ IDEA ou Maven :

```bash
mvn spring-boot:run
```

Le service sera accessible sur :

```text
http://localhost:8085
```

Vérifier son état :

```text
http://localhost:8085/actuator/health
```

Résultat attendu :

```json
{
  "status": "UP"
}
```

### 3. Démarrer API Gateway

Ouvrir le dossier :

```text
groupify-gateway
```

Exécuter :

```bash
mvn spring-boot:run
```

Le Gateway sera accessible sur :

```text
http://localhost:8090
```

Vérifier son état :

```text
http://localhost:8090/actuator/health
```

Le Gateway redirige les requêtes Analytics vers le service correspondant.

### 4. Démarrer Angular Frontend

Ouvrir un terminal dans :

```text
groupify-front
```

Installer les dépendances :

```bash
npm install
```

Démarrer Angular :

```bash
ng serve
```

Accéder à l'application :

```text
http://localhost:4200
```

## Configuration Angular

Dans `src/environments/environment.ts`, configurer l'URL du Gateway :

```typescript
apiUrl: 'http://localhost:8090'
```

Pour utiliser le véritable service Analytics et non les données simulées :

```typescript
mocks: {
  analytics: false
}
```

Les autres options de mock restent configurables indépendamment.

## API Analytics

Toutes les requêtes Analytics passent par l'API Gateway.

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/api/analytics/courses/{courseId}/balance` | Statistiques d'équilibre des groupes |
| GET | `/api/analytics/courses/{courseId}/engagement` | Statistiques d'engagement |
| GET | `/api/analytics/promotions/{promotionId}/summary` | Résumé d'une promotion |
| GET | `/api/analytics/reports` | Consulter les rapports |
| POST | `/api/analytics/reports` | Créer un rapport |

### Exemple de test avec cURL

```bash
curl -i \
  -H "X-User-Id: 1" \
  -H "X-User-Name: Test" \
  -H "X-User-Roles: TEACHER" \
  http://localhost:8090/api/analytics/courses/1/balance
```

Une réponse `HTTP 200 OK` indique que la requête a été traitée avec succès.

### Exemple de réponse JSON

```json
{
  "courseId": 1,
  "projectId": 1,
  "gpaStdDev": 2.35,
  "skillCoverage": 100.0,
  "diversityIndex": 50.0,
  "groups": [],
  "computedAt": "2026-11-10T23:53:10Z"
}
```

Les valeurs et les groupes dépendent des données disponibles dans la base.

## Sécurité et autorisations

En mode développement, les requêtes Analytics utilisent les en-têtes suivants :

```text
X-User-Id
X-User-Name
X-User-Roles
```

L'endpoint de balance nécessite un rôle autorisé, notamment :

- TEACHER
- ADMIN

Une requête avec un rôle non autorisé peut retourner `403 Forbidden`.

## Vérification du fonctionnement

Avant de tester l'application, vérifier les composants :

| Vérification | URL |
|---|---|
| Angular | http://localhost:4200 |
| Gateway Health | http://localhost:8090/actuator/health |
| Analytics Health | http://localhost:8085/actuator/health |
| MongoDB | Port 27018 |

## Dépannage

### Erreur 403 Forbidden
Vérifier le rôle transmis dans `X-User-Roles`.

### Erreur 404 Not Found
Vérifier le chemin de l'API et la configuration des routes du Gateway.

### Erreur CORS
Vérifier que le Gateway autorise l'origine :

```text
http://localhost:4200
```

### Erreur de connexion MongoDB
Vérifier que le conteneur est actif :

```bash
docker ps
```

Consulter les logs :

```bash
docker logs mongodb-analytics
```

### Consulter les logs Analytics

```bash
docker logs analytics-service
```

## Équipe et contribution

Les contributions au projet sont les bienvenues.

Pour contribuer :

1. Forker le dépôt.
2. Créer une branche pour la fonctionnalité.
3. Effectuer les modifications.
4. Tester les changements.
5. Soumettre une Pull Request.

---

**Groupify — Application web de gestion et d'analyse des groupes.**