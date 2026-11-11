
"""Résultats du clustering : exécution, consultation, déplacement, validation et suppression."""

from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    ClusterProfil,
    DemandeGroupement,
    EtudiantGroupe,
    GroupeCree,
    HistoriqueModification,
    QualiteGroupement,
)
from app.schemas.demande import DemandeOut
from app.schemas.groupe import (
    ClusterOut,
    DeplacerIn,
    EtudiantGroupeOut,
    GroupeOut,
    QualiteOut,
)

router = APIRouter(
    prefix="/api/clustering/demandes",
    tags=["Groupes et résultats"],
)


# ---------- Utilitaires ----------

def _get_demande(db: Session, demande_id: int) -> DemandeGroupement:
    demande = db.get(DemandeGroupement, demande_id)

    if demande is None:
        raise HTTPException(
            status_code=404,
            detail="Demande introuvable"
        )

    return demande


def _vider_resultats(db: Session, demande_id: int) -> None:
    """Supprime les anciens résultats d'une demande."""

    groupe_ids = [
        g.id
        for g in db.query(GroupeCree.id).filter_by(
            demande_id=demande_id
        ).all()
    ]

    db.query(HistoriqueModification).filter_by(
        demande_id=demande_id
    ).delete(synchronize_session=False)

    db.query(QualiteGroupement).filter_by(
        demande_id=demande_id
    ).delete(synchronize_session=False)

    if groupe_ids:
        db.query(EtudiantGroupe).filter(
            EtudiantGroupe.groupe_id.in_(groupe_ids)
        ).delete(synchronize_session=False)

    db.query(GroupeCree).filter_by(
        demande_id=demande_id
    ).delete(synchronize_session=False)

    db.query(ClusterProfil).filter_by(
        demande_id=demande_id
    ).delete(synchronize_session=False)


# ---------- Exécution provisoire ----------

@router.post(
    "/{demande_id}/executer",
    response_model=DemandeOut,
    status_code=status.HTTP_202_ACCEPTED
)
def executer(
    demande_id: int,
    nb_etudiants_test: int = Query(
        12,
        ge=2,
        le=500,
        description="Nombre d'étudiants fictifs pour les tests"
    ),
    db: Session = Depends(get_db),
):
    demande = _get_demande(db, demande_id)

    if demande.etat in ("VALIDE", "PUBLIE"):
        raise HTTPException(
            status_code=409,
            detail="Demande déjà validée : calcul impossible"
        )

    try:
        _vider_resultats(db, demande_id)

        taille = demande.taille_groupe or 4

        nb_groupes = demande.nombre_groupes or max(
            1,
            nb_etudiants_test // taille
        )

        nb_clusters = 3

        # Création de clusters fictifs
        clusters = [
            ClusterProfil(
                numero_cluster=i,
                description=f"Profil type {i} (fictif)",
                centre_profil={},
                nombre_etudiants=0,
                demande_id=demande_id
            )
            for i in range(nb_clusters)
        ]

        # Création des groupes
        groupes = [
            GroupeCree(
                numero_groupe=i + 1,
                demande_id=demande_id
            )
            for i in range(nb_groupes)
        ]

        db.add_all(clusters + groupes)
        db.flush()

        # Répartition provisoire des étudiants
        for n in range(nb_etudiants_test):

            cluster = clusters[(n // nb_groupes) % nb_clusters]
            groupe = groupes[n % nb_groupes]

            cluster.nombre_etudiants += 1

            db.add(
                EtudiantGroupe(
                    id_etudiant=1000 + n,
                    groupe_id=groupe.id,
                    cluster_id=cluster.id,
                    distance_centre=0.0,
                    explication=(
                        f"Donnée de test : profil "
                        f"{cluster.numero_cluster}"
                    ),
                )
            )

        demande.etat = "PROPOSE"
        demande.date_debut = datetime.utcnow()
        demande.date_fin = datetime.utcnow()

        db.commit()
        db.refresh(demande)

        return demande

    except Exception:
        db.rollback()
        raise


# ---------- Consultation des groupes ----------

@router.get(
    "/{demande_id}/groupes",
    response_model=List[GroupeOut]
)
def lister_groupes(
    demande_id: int,
    db: Session = Depends(get_db)
):
    _get_demande(db, demande_id)

    return (
        db.query(GroupeCree)
        .filter_by(demande_id=demande_id)
        .order_by(GroupeCree.numero_groupe)
        .all()
    )


# ---------- Consultation des clusters ----------

@router.get(
    "/{demande_id}/clusters",
    response_model=List[ClusterOut]
)
def lister_clusters(
    demande_id: int,
    db: Session = Depends(get_db)
):
    _get_demande(db, demande_id)

    return (
        db.query(ClusterProfil)
        .filter_by(demande_id=demande_id)
        .order_by(ClusterProfil.numero_cluster)
        .all()
    )


# ---------- Consultation de la qualité ----------

@router.get(
    "/{demande_id}/qualite",
    response_model=List[QualiteOut]
)
def lister_qualite(
    demande_id: int,
    db: Session = Depends(get_db)
):
    _get_demande(db, demande_id)

    return (
        db.query(QualiteGroupement)
        .filter_by(demande_id=demande_id)
        .all()
    )


# ---------- Explication de l'affectation ----------

@router.get(
    "/{demande_id}/etudiants/{id_etudiant}/explication",
    response_model=EtudiantGroupeOut
)
def expliquer(
    demande_id: int,
    id_etudiant: int,
    db: Session = Depends(get_db)
):
    _get_demande(db, demande_id)

    affectation = (
        db.query(EtudiantGroupe)
        .join(GroupeCree)
        .filter(
            GroupeCree.demande_id == demande_id,
            EtudiantGroupe.id_etudiant == id_etudiant
        )
        .first()
    )

    if affectation is None:
        raise HTTPException(
            status_code=404,
            detail="Etudiant absent de cette demande"
        )

    return affectation


# ---------- Déplacement manuel ----------

@router.put(
    "/{demande_id}/deplacer",
    response_model=List[GroupeOut]
)
def deplacer(
    demande_id: int,
    data: DeplacerIn,
    db: Session = Depends(get_db)
):
    demande = _get_demande(db, demande_id)

    if demande.etat != "PROPOSE":
        raise HTTPException(
            status_code=409,
            detail="Déplacement possible seulement en état PROPOSE"
        )

    cible = db.get(GroupeCree, data.groupe_cible_id)

    if cible is None or cible.demande_id != demande_id:
        raise HTTPException(
            status_code=404,
            detail="Groupe cible introuvable dans cette demande"
        )

    affectation = (
        db.query(EtudiantGroupe)
        .join(GroupeCree)
        .filter(
            GroupeCree.demande_id == demande_id,
            EtudiantGroupe.id_etudiant == data.id_etudiant
        )
        .first()
    )

    if affectation is None:
        raise HTTPException(
            status_code=404,
            detail="Etudiant absent de cette demande"
        )

    if affectation.groupe_id == cible.id:
        raise HTTPException(
            status_code=400,
            detail="L'étudiant appartient déjà à ce groupe"
        )

    try:
        db.add(
            HistoriqueModification(
                id_etudiant=data.id_etudiant,
                id_enseignant=data.id_enseignant,
                groupe_source_id=affectation.groupe_id,
                groupe_cible_id=cible.id,
                demande_id=demande_id,
            )
        )

        affectation.groupe_id = cible.id
        affectation.affectation_manuelle = True
        affectation.explication = (
            "Déplacé manuellement par l'enseignant"
        )

        db.commit()

        # TODO S6 : recalculer les indicateurs de qualité

        return (
            db.query(GroupeCree)
            .filter_by(demande_id=demande_id)
            .order_by(GroupeCree.numero_groupe)
            .all()
        )

    except Exception:
        db.rollback()
        raise


# ---------- Validation ----------

@router.post(
    "/{demande_id}/valider",
    response_model=DemandeOut
)
def valider(
    demande_id: int,
    db: Session = Depends(get_db)
):
    demande = _get_demande(db, demande_id)

    if demande.etat != "PROPOSE":
        raise HTTPException(
            status_code=409,
            detail="Seule une proposition PROPOSE peut être validée"
        )

    demande.etat = "VALIDE"

    db.commit()
    db.refresh(demande)

    # TODO S7 : publier l'événement RabbitMQ

    return demande


# ---------- Suppression ----------

@router.delete(
    "/{demande_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def supprimer(
    demande_id: int,
    db: Session = Depends(get_db)
):
    demande = _get_demande(db, demande_id)

    if demande.etat == "PUBLIE":
        raise HTTPException(
            status_code=409,
            detail="Impossible de supprimer une demande publiée"
        )

    try:
        _vider_resultats(db, demande_id)

        db.delete(demande)
        db.commit()

        return Response(
            status_code=status.HTTP_204_NO_CONTENT
        )

    except Exception:
        db.rollback()
        raise
