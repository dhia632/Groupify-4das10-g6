/**
 * Configuration du front.
 *
 * apiUrl      : adresse de l'API Gateway (8080 par défaut, 8090 si vous l'avez lancée sur 8090).
 * auth.mode   : 'local'    -> démo sans Keycloak : l'utilisateur choisi est envoyé dans les en-têtes
 *                              X-User-Id / X-User-Name / X-User-Roles (profil "local" du backend) ;
 *               'keycloak' -> connexion réelle : jeton JWT obtenu auprès de Keycloak (Bearer).
 * mocks       : true = données de démonstration en mémoire (service pas encore développé),
 *               false = appels HTTP réels via la Gateway.
 *               La gamification est réelle par défaut ; si l'appel échoue, le front bascule sur la démo.
 */
export const environment = {
  apiUrl: '',
  auth: {
    mode: 'local' as 'local' | 'keycloak',
    keycloakUrl: 'http://localhost:8180',
    realm: 'groupify',
    clientId: 'angular-frontend',
  },
  mocks: {
    auth: true,
    profiling: true,
    courseGroup: true,
    clustering: true,
    gamification: false,
    analytics: true,
  },
};
