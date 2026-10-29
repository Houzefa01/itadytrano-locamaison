// En développement, l'URL de l'API suit l'hôte utilisé pour ouvrir le site :
// - en local : http://localhost:8080/api/v1
// - depuis un autre appareil du même réseau (IP de la machine) :
//   http://<ip-de-la-machine>:8080/api/v1
// Le site est ainsi utilisable depuis un téléphone/PC du même réseau sans
// reconfiguration. (Repli sur localhost côté rendu serveur / SSR.)
export const environment = {
  production: false,
  get apiUrl(): string {
    if (typeof window !== 'undefined' && window.location?.hostname) {
      return `${window.location.protocol}//${window.location.hostname}:8080/api/v1`;
    }
    return 'http://localhost:8080/api/v1';
  },
};
