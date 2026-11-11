from typing import Any, Dict, List, Optional

from app.schemas.demande import CamelModel


class EtudiantGroupeOut(CamelModel):
    id_etudiant: int
    cluster_id: Optional[int]
    distance_centre: Optional[float]
    explication: Optional[str]
    affectation_manuelle: bool


class GroupeOut(CamelModel):
    id: int
    numero_groupe: int
    etudiants: List[EtudiantGroupeOut] = []


class ClusterOut(CamelModel):
    id: int
    numero_cluster: int
    description: Optional[str]
    centre_profil: Optional[Dict[str, Any]]
    nombre_etudiants: int


class QualiteOut(CamelModel):
    id: int
    nom_indicateur: str
    valeur: float
    methode: str
    groupe_id: Optional[int]


class DeplacerIn(CamelModel):
    id_etudiant: int
    groupe_cible_id: int
    id_enseignant: int  # temporaire : viendra du jeton Keycloak