# Discovery Server (Eureka) – Groupify

Registre de services (**Service Discovery**) commun aux 6 microservices de Groupify et à l'API Gateway.

| | |
|---|---|
| Technologie | Spring Boot 3.5.7 · Spring Cloud 2025.0.0 · Netflix Eureka Server |
| Port | **8761** |
| Tableau de bord | http://localhost:8761 |
| Registre (REST) | http://localhost:8761/eureka/apps |
| Santé | http://localhost:8761/actuator/health |

## 1. Rôle

Sans Eureka, chaque appel devrait connaître l'adresse exacte du service (`http://localhost:8084`). Avec Eureka :

1. Au démarrage, chaque microservice **s'enregistre** sous son nom (`spring.application.name`) avec son adresse et son port.
2. Il envoie ensuite un **heartbeat** toutes les 10 s ; sans heartbeat pendant 30 s, il est retiré du registre.
3. L'**API Gateway** route vers `lb://gamification-service` : elle demande l'adresse à Eureka et répartit la charge s'il y a plusieurs instances.
4. Les appels **OpenFeign** entre services (`@FeignClient(name = "course-group-service")`) passent aussi par Eureka.

```
                         ┌──────────────────────────┐
                         │  Discovery Server :8761  │
                         └────────────▲─────────────┘
          s'enregistrent / heartbeat  │   la Gateway et Feign demandent les adresses
 ┌──────────┬───────────┬─────────────┼───────────┬────────────┬──────────────┐
 auth       profiling   course-group  gamification analytics   ml-clustering   api-gateway
 :8081      :8082       :8083         :8084        :8085       :8000 (Python)  :8080
```

## 2. Microservices enregistrés

| Nom dans Eureka (`spring.application.name`) | Port | Technologie | Configuration client |
|---|---|---|---|
| `auth-service` | 8081 | Spring Boot | `docs/clients/auth-service.yml` |
| `profiling-service` | 8082 | Spring Boot | `docs/clients/profiling-service.yml` |
| `course-group-service` | 8083 | Spring Boot | `docs/clients/course-group-service.yml` |
| `gamification-service` | 8084 | Spring Boot | `docs/clients/gamification-service.yml` |
| `analytics-service` | 8085 | Spring Boot | `docs/clients/analytics-service.yml` |
| `ml-clustering-engine` | 8000 | Python FastAPI | `docs/clients/ml-clustering-engine.py` |
| `api-gateway` | 8080 | Spring Cloud Gateway | `docs/clients/api-gateway.yml` |

Les routes de la Gateway vers les 6 services sont prêtes dans `docs/gateway-routes-6-microservices.yml`.

## 3. Lancer le serveur

**IntelliJ** : ouvrir le dossier `discovery-server` (projet Maven), puis lancer `DiscoveryServerApplication`.

**Ligne de commande** (Windows) :

```bat
cd discovery-server
mvn spring-boot:run
```

Ouvrir http://localhost:8761 : la page « Spring Eureka » s'affiche, avec la liste des instances encore vide.

> Toujours démarrer le Discovery Server **en premier**, avant la Gateway et les microservices.

## 4. Brancher un microservice Spring Boot (chaque membre)

1. Ajouter la dépendance dans le `pom.xml` :

   ```xml
   <dependency>
       <groupId>org.springframework.cloud</groupId>
       <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
   </dependency>
   ```

   (avec le BOM `spring-cloud-dependencies` 2025.0.0 dans `<dependencyManagement>`).
2. Copier son bloc depuis `docs/clients/<service>.yml` dans `application.yml`.
3. Lancer le service : il apparaît en **UP** dans http://localhost:8761 après environ 10 s.

Aucune annotation n'est nécessaire : avec Spring Cloud récent, la présence de la dépendance suffit (`@EnableDiscoveryClient` est facultatif).

## 5. Brancher le moteur ML (Python)

```bash
pip install py-eureka-client fastapi uvicorn
uvicorn main:app --port 8000
```

Le code d'enregistrement est dans `docs/clients/ml-clustering-engine.py`. Le service apparaît sous `ML-CLUSTERING-ENGINE`.

## 6. Démo avec le Gamification Service et la Gateway (sans Docker)

Un profil `eureka` a été ajouté au Gamification Service et à l'API Gateway. Combiné au profil `local`, il garde la démo sans Keycloak ni RabbitMQ mais passe par Eureka.

| Ordre | Projet | Commande / profil |
|---|---|---|
| 1 | discovery-server | `mvn spring-boot:run` |
| 2 | gamification-service | `mvn spring-boot:run "-Dspring-boot.run.profiles=local,eureka"` |
| 3 | api-gateway | `mvn spring-boot:run "-Dspring-boot.run.profiles=local,eureka" "-Dspring-boot.run.arguments=--server.port=8090"` |

Dans IntelliJ : *Run → Edit Configurations → Active profiles* : `local,eureka`.

Vérifications :

1. http://localhost:8761 → `GAMIFICATION-SERVICE` et `API-GATEWAY` sont **UP**.
2. http://localhost:8090/api/gamification/... répond comme avant, mais la route est désormais `lb://gamification-service` : l'adresse vient d'Eureka.
3. Arrêter le Gamification Service : après environ 30 s il disparaît d'Eureka, et la Gateway renvoie le fallback **503**.
4. Bonus (répartition de charge) : lancer une 2ᵉ instance avec `--server.port=8094` : Eureka affiche 2 instances et la Gateway alterne entre elles.

## 7. Docker

```bash
docker build -t groupify/discovery-server .
docker run -p 8761:8761 groupify/discovery-server
```

Extrait pour le `docker-compose.yml` du groupe :

```yaml
  discovery-server:
    build: ./Backend/discovery-server
    ports: ["8761:8761"]

  gamification-service:
    environment:
      EUREKA_URL: http://discovery-server:8761/eureka
    depends_on:
      - discovery-server
```

Si un service démarre avant Eureka, ce n'est pas grave : le client Eureka réessaie de s'enregistrer automatiquement.

Le profil `docker` (activé dans le Dockerfile) donne au serveur le nom d'hôte `discovery-server`.

## 8. Choix de configuration

| Paramètre | Valeur | Pourquoi |
|---|---|---|
| `register-with-eureka` / `fetch-registry` | `false` | Un seul serveur, il ne s'enregistre pas lui-même |
| `enable-self-preservation` | `false` | En développement, un service arrêté disparaît vite du registre |
| `eviction-interval-timer-in-ms` | `10000` | Nettoyage du registre toutes les 10 s |
| `lease-renewal-interval-in-seconds` (clients) | `10` | Heartbeat plus fréquent que la valeur par défaut (30 s) |
| `prefer-ip-address` (clients) | `true` | Adresse IP plutôt que nom de machine, plus fiable sous Windows et Docker |

En production, on remettrait `enable-self-preservation: true` et on lancerait 2 serveurs Eureka qui s'enregistrent l'un chez l'autre.

## 9. Tests

```bash
mvn test
```

Le test `DiscoveryServerApplicationTests` démarre le serveur et vérifie que le tableau de bord, `/eureka/apps` et `/actuator/health` répondent.
