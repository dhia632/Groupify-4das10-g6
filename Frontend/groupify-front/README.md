# Groupify – Front-end Angular

Interface web de la plateforme de constitution automatique de groupes d'apprentissage collaboratif.
Elle consomme les **6 microservices** via l'**API Gateway**.

- Angular 19 (composants standalone, signals, nouveau control flow `@if` / `@for`)
- Aucune bibliothèque d'interface ni de graphiques : design system et graphiques SVG maison
- Icônes Material Symbols et police Poppins (Google Fonts)

---

## 1. Lancer le projet

Prérequis : **Node.js 20 ou 22** et npm.

```bash
cd Frontend/groupify-front
npm install
npm start          # ouvre http://localhost:4200
```

### Comptes de démonstration
Le mot de passe est identique au nom d'utilisateur (comme le realm Keycloak de test).

| Compte | Rôle | Écran d'accueil |
|---|---|---|
| `student1` | Étudiante (Sara) | Tableau de bord gamifié |
| `student2` | Étudiant (Youssef) | Tableau de bord gamifié |
| `teacher1` | Enseignante (Amel) | Accueil enseignant |
| `admin1` | Administration | Comptes et rôles |

Le menu en haut à droite permet de **changer de compte** sans se déconnecter (mode démo).

---

## 2. Connexion au backend

Fichier `src/environments/environment.ts` :

| Paramètre | Rôle |
|---|---|
| `apiUrl` | Adresse de l'API Gateway (`http://localhost:8090` ; mettre `8080` si la Gateway tourne sur 8080) |
| `auth.mode` | `local` : identité envoyée dans `X-User-Id`, `X-User-Name`, `X-User-Roles` (profil `local` du backend) · `keycloak` : jeton JWT Keycloak en `Bearer` |
| `mocks.<service>` | `true` = données de démonstration en mémoire · `false` = appels HTTP réels |

Par défaut :
- **Gamification** : appels **réels** (`mocks.gamification: false`).
  Lancer `gamification-service` et `api-gateway` avec le profil `local`.
  Si la Gateway ou le service ne répondent pas, le front bascule automatiquement sur la démo :
  une puce « Démo gamification · réessayer » apparaît alors dans la barre du haut.
- **Auth, Profiling, Course / Group, ML Clustering, Analytics** : données de démonstration.
  Passer `mocks.<service>` à `false` quand le microservice correspondant est disponible : les URL suivent les contrats d'API de la présentation.

Les données de démonstration ne sont pas de simples maquettes : la répartition des groupes est réellement calculée par profils types. L'écart-type des GPA, la couverture des compétences et la comparaison au hasard aussi. Les actions (rendre un livrable, ajouter une contribution, compléter son profil…) mettent à jour les points et les badges comme le feraient les événements RabbitMQ.

---

## 3. Écrans par microservice

| Microservice | Écrans |
|---|---|
| **Auth** | Connexion, inscription, comptes et rôles (admin) |
| **Profiling** | Mon profil (GPA, compétences, radar, intérêts), questionnaire de styles, profils étudiants (enseignant), import CSV |
| **Course / Group** | Modules et projets, détail d'un module (projets, inscriptions), constitution des groupes, livrables, journal des contributions |
| **ML Clustering** | Résultats de constitution (profils types, projection ACP 2D, indicateurs), laboratoire ML (algorithmes, jobs, comparaison au hasard) |
| **Gamification** | Tableau de bord étudiant, mon équipe (identité, contributions, kudos), badges et points, avatar et niveaux, classement des équipes, gestion des badges (enseignant) |
| **Analytics** | Accueil enseignant, analytics par module (équilibre, engagement), promotion et rapports (admin) |

---

## 4. Structure

```
src/app/
├── app.config.ts / app.routes.ts      routes par rôle (guards STUDENT / TEACHER / ADMIN)
├── core/
│   ├── models.ts                      contrats d'API des 6 microservices
│   ├── session.service.ts             connexion (démo ou Keycloak)
│   ├── user-header.interceptor.ts     X-User-* ou Authorization: Bearer
│   ├── guards.ts · toast.service.ts
│   ├── api/                           un service par microservice
│   └── mock/                          base de démonstration en mémoire
├── layout/shell.component.*           barre latérale + barre du haut
├── shared/                            graphiques SVG, calendrier, mascotte, pipes
└── pages/
    ├── auth/        login, register
    ├── student/     dashboard, team, projects, badges, avatar, leaderboard, profile, questionnaire
    ├── teacher/     teacher-home, courses, course-detail, grouping, students, imports,
    │                clustering-lab, badges-admin, analytics
    └── admin/       users, promotion
```

---

## 5. Choix d'interface

- **Gamification responsable** : le classement compare les **équipes**, jamais les individus ;
  les points individuels ne sont visibles que par l'étudiant et l'enseignant.
- Les styles d'apprentissage sont présentés comme un critère **optionnel et pondérable**.
- Les écrans indiquent le microservice et l'endpoint utilisés, ce qui est pratique pour la démonstration.
