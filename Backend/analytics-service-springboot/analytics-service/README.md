# Groupify – Analytics Service (Microservice 6)

Backend Spring Boot 3.4.4 / Java 17 / MongoDB. Les endpoints correspondent au frontend Angular fourni.

## Endpoints

Base URL : `/api/analytics`

| Méthode | Endpoint | Rôle |
|---|---|---|
| GET | `/courses/{courseId}/balance` | TEACHER, ADMIN |
| GET | `/courses/{courseId}/engagement` | TEACHER, ADMIN |
| GET | `/promotions/{promotionId}/summary` | TEACHER, ADMIN |
| GET | `/reports` | TEACHER, ADMIN |
| POST | `/reports` | TEACHER, ADMIN |

Exemple POST `/reports` :
```json
{"scope":"COURSE","scopeId":"1","period":"Novembre 2026"}
```

## Prérequis

- Docker Desktop démarré (recommandé).
- Le frontend Angular utilise `http://localhost:8090` comme URL de Gateway.
- Java 17 est utilisé dans le conteneur. Maven n'a pas besoin d'être installé sur Windows.

## Démarrage rapide (sans Maven)

Dans PowerShell, ouvrir ce dossier puis :

```powershell
docker compose -f docker-compose.analytics.yml up --build -d
docker compose -f docker-compose.analytics.yml logs -f analytics-service
```

Attendre le message indiquant que Spring Boot a démarré. L'API directe est alors sur `http://localhost:8085`.

Arrêt :
```powershell
docker compose -f docker-compose.analytics.yml down
```

Les données MongoDB restent dans le volume Docker. Pour tout supprimer (y compris les données) :
```powershell
docker compose -f docker-compose.analytics.yml down -v
```

## Tester le service seul

```powershell
.\scripts\smoke-test.ps1
```

Ou dans le navigateur, l'endpoint de santé :
`http://localhost:8085/actuator/health`

Les endpoints métier exigent les en-têtes d'identité en mode local. Exemple :
- `X-User-Id: teacher1`
- `X-User-Name: Amel Haddad`
- `X-User-Roles: TEACHER`

## Connexion à l'API Gateway

### Avec Eureka

Copier la route de `gateway/analytics-route.yml` dans la configuration Spring Cloud Gateway de l'équipe. Vérifier que :
1. `analytics-service` est bien le nom Spring de l'application.
2. Eureka est démarré et le service apparaît dans le dashboard Eureka.
3. La Gateway écoute sur le port 8090 (comme le frontend).
4. La Gateway transmet les en-têtes `X-User-*` en mode local.
5. Aucun `StripPrefix` ne supprime `/api/analytics`.

### Sans Eureka (test local)

Utiliser `gateway/analytics-route-local.yml` et `uri: http://localhost:8085`.

Tester ensuite :
`http://localhost:8090/api/analytics/courses/1/balance`

## Connexion au frontend Angular

Dans `src/environments/environment.ts` :
```ts
apiUrl: 'http://localhost:8090',
auth: { mode: 'local' as 'local' | 'keycloak', ... },
mocks: {
  // conserver les autres valeurs
  analytics: false
}
```

Le service Angular appelle déjà exactement ces chemins :
- `/api/analytics/courses/{id}/balance`
- `/api/analytics/courses/{id}/engagement`
- `/api/analytics/promotions/{id}/summary`
- `/api/analytics/reports`

L'interceptor Angular ajoute `X-User-Id`, `X-User-Name` et `X-User-Roles` lorsqu'un utilisateur est connecté.

## Sécurité – important

Le filtre fourni est un mode de développement qui accepte les en-têtes `X-User-*`. Il ne constitue PAS une authentification de production : un client pourrait fabriquer ces en-têtes s'il peut appeler directement le service. En déploiement, la Gateway doit valider le JWT Keycloak, et le service doit aussi valider le JWT ou n'accepter le trafic que depuis le réseau interne de confiance. Ne pas exposer directement le port 8085 sur Internet.

## Données de démonstration

Avec le profil `local`, un jeu de démonstration est créé au premier démarrage :
- promotion `4DAS`
- cours `1`, projet `1`
- 24 étudiants
- 6 groupes
- contributions sur les 4 dernières semaines
- quelques rapports

Les données sont dans MongoDB, collection `analytics_snapshots` et `analytics_reports`.

## Limites de cette première version

- Les données sont initialisées localement pour valider l'intégration front/API/DB.
- Les événements RabbitMQ des services Course/Group, User et Gamification ne sont pas encore branchés : leurs contrats doivent être confirmés avec l'équipe.
- Les rapports passent rapidement à READY ; une génération réelle PDF/CSV et un traitement asynchrone seront une évolution.
- Les calculs sont effectués à la lecture. Une tâche de recalcul planifiée ou pilotée par événements pourra être ajoutée.
- Le mode Keycloak/JWT réel reste à intégrer avec le realm et les rôles de votre équipe.

## Intégration dans le dépôt de l'équipe

Copier le dossier `analytics-service` dans `Backend/analytics-service`. Ajouter la route Gateway dans la configuration de votre équipe et vérifier les ports avant de lancer tous les services.
