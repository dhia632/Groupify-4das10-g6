from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import CritereGroupement, DemandeGroupement
from app.schemas.demande import DemandeCreate, DemandeOut

router = APIRouter(prefix="/api/clustering/demandes", tags=["Demandes de groupement"])


@router.post("", response_model=DemandeOut, status_code=status.HTTP_201_CREATED)
def creer_demande(data: DemandeCreate, db: Session = Depends(get_db)):
    demande = DemandeGroupement(
        id_cours=data.id_cours,
        id_enseignant=data.id_enseignant,
        algorithme=data.algorithme,
        nombre_groupes=data.nombre_groupes,
        taille_groupe=data.taille_groupe,
        graine_aleatoire=data.graine_aleatoire,
        etat="EN_ATTENTE",
    )
    for c in data.criteres:
        demande.criteres.append(
            CritereGroupement(nom_critere=c.nom_critere, poids=c.poids, type_critere=c.type_critere)
        )
    db.add(demande)
    db.commit()
    db.refresh(demande)
    return demande


@router.get("", response_model=List[DemandeOut])
def lister_demandes(id_cours: Optional[int] = None, db: Session = Depends(get_db)):
    requete = db.query(DemandeGroupement)
    if id_cours is not None:
        requete = requete.filter(DemandeGroupement.id_cours == id_cours)
    return requete.order_by(DemandeGroupement.id).all()


@router.get("/{demande_id}", response_model=DemandeOut)
def obtenir_demande(demande_id: int, db: Session = Depends(get_db)):
    demande = db.get(DemandeGroupement, demande_id)
    if demande is None:
        raise HTTPException(status_code=404, detail="Demande introuvable")
    return demande