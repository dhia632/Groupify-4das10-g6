from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """JSON en camelCase (idCours) <-> attributs Python en snake_case (id_cours)."""
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class CritereCreate(CamelModel):
    nom_critere: str = Field(..., examples=["gpa"])
    poids: float = Field(1.0, gt=0, examples=[0.4])
    type_critere: str = Field("NUMERIQUE", examples=["NUMERIQUE"])


class CritereOut(CritereCreate):
    id: int


class DemandeCreate(CamelModel):
    id_cours: int = Field(..., examples=[12])
    id_enseignant: int = Field(..., examples=[1])  # temporaire : viendra du jeton Keycloak
    algorithme: str = Field("KMEANS", examples=["KMEANS"])
    nombre_groupes: Optional[int] = Field(None, examples=[5])
    taille_groupe: Optional[int] = Field(None, examples=[4])
    graine_aleatoire: int = Field(42, examples=[42])
    criteres: List[CritereCreate] = []


class DemandeOut(CamelModel):
    id: int
    id_cours: int
    id_enseignant: int
    algorithme: str
    nombre_groupes: Optional[int]
    taille_groupe: Optional[int]
    graine_aleatoire: Optional[int]
    etat: str
    date_creation: Optional[datetime]
    criteres: List[CritereOut] = []