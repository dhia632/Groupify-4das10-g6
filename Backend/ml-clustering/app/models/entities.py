"""Modèle de données du ML Clustering Engine (PostgreSQL).

Règle d'or microservices : on ne met AUCUNE clé étrangère vers les autres
services. id_cours, id_etudiant, id_enseignant sont de simples entiers
(références logiques) ; les données sont récupérées par appel REST.
"""
from datetime import datetime

from sqlalchemy import (
    Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.database import Base


class DemandeGroupement(Base):
    """Une exécution de clustering demandée par un enseignant pour un cours."""
    __tablename__ = "demandes_groupement"

    id = Column(Integer, primary_key=True, index=True)
    id_cours = Column(Integer, nullable=False, index=True)      # réf. Course Service
    id_enseignant = Column(Integer, nullable=False)             # réf. Auth Service
    algorithme = Column(String(50), nullable=False, default="KMEANS")  # KMEANS | KPROTOTYPES
    nombre_groupes = Column(Integer)
    taille_groupe = Column(Integer)
    graine_aleatoire = Column(Integer, default=42)              # reproductibilité
    version_modele = Column(String(50))
    # EN_ATTENTE -> EN_COURS -> PROPOSE -> VALIDE -> PUBLIE   (ou ECHEC)
    etat = Column(String(20), nullable=False, default="EN_ATTENTE")
    message_erreur = Column(Text)
    date_creation = Column(DateTime, default=datetime.utcnow)
    date_debut = Column(DateTime)
    date_fin = Column(DateTime)

    criteres = relationship("CritereGroupement", back_populates="demande", cascade="all, delete-orphan")
    clusters = relationship("ClusterProfil", back_populates="demande", cascade="all, delete-orphan")
    groupes = relationship("GroupeCree", back_populates="demande", cascade="all, delete-orphan")
    qualites = relationship("QualiteGroupement", back_populates="demande", cascade="all, delete-orphan")
    modifications = relationship("HistoriqueModification", back_populates="demande", cascade="all, delete-orphan")


class CritereGroupement(Base):
    """Attribut utilisé dans le calcul + son poids (transparence)."""
    __tablename__ = "criteres_groupement"

    id = Column(Integer, primary_key=True, index=True)
    nom_critere = Column(String(100), nullable=False)   # ex: gpa, python, ...
    poids = Column(Float, nullable=False, default=1.0)
    type_critere = Column(String(20), default="NUMERIQUE")  # NUMERIQUE | CATEGORIEL
    demande_id = Column(Integer, ForeignKey("demandes_groupement.id"), nullable=False)

    demande = relationship("DemandeGroupement", back_populates="criteres")


class ClusterProfil(Base):
    """Un type de profil découvert par K-Means (ex: 'Fort en code, faible en UX')."""
    __tablename__ = "clusters_profils"

    id = Column(Integer, primary_key=True, index=True)
    numero_cluster = Column(Integer, nullable=False)
    description = Column(String(255))
    centre_profil = Column(JSONB)            # centroïde : {"gpa": 14.2, "python": 3.8, ...}
    nombre_etudiants = Column(Integer, default=0)
    demande_id = Column(Integer, ForeignKey("demandes_groupement.id"), nullable=False)

    demande = relationship("DemandeGroupement", back_populates="clusters")
    affectations = relationship("EtudiantGroupe", back_populates="cluster")


class GroupeCree(Base):
    """Un groupe de projet proposé (ou validé / publié)."""
    __tablename__ = "groupes_crees"

    id = Column(Integer, primary_key=True, index=True)
    numero_groupe = Column(Integer, nullable=False)
    demande_id = Column(Integer, ForeignKey("demandes_groupement.id"), nullable=False)

    demande = relationship("DemandeGroupement", back_populates="groupes")
    etudiants = relationship("EtudiantGroupe", back_populates="groupe")
    qualites = relationship("QualiteGroupement", back_populates="groupe")


class EtudiantGroupe(Base):
    """Affectation d'un étudiant à un groupe, avec explication."""
    __tablename__ = "etudiants_groupes"

    id = Column(Integer, primary_key=True, index=True)
    id_etudiant = Column(Integer, nullable=False, index=True)   # réf. User Service
    distance_centre = Column(Float)                              # distance au centroïde
    explication = Column(Text)                                   # pourquoi dans ce groupe
    affectation_manuelle = Column(Boolean, default=False)        # déplacé par l'enseignant

    groupe_id = Column(Integer, ForeignKey("groupes_crees.id"), nullable=False)
    cluster_id = Column(Integer, ForeignKey("clusters_profils.id"))

    groupe = relationship("GroupeCree", back_populates="etudiants")
    cluster = relationship("ClusterProfil", back_populates="affectations")


class QualiteGroupement(Base):
    """Indicateur de qualité : global (groupe_id NULL) ou par groupe.
    methode = 'ML' ou 'ALEATOIRE' pour comparer avec une répartition aléatoire."""
    __tablename__ = "qualites_groupement"

    id = Column(Integer, primary_key=True, index=True)
    nom_indicateur = Column(String(100), nullable=False)  # silhouette, ecart_type_gpa, diversite...
    valeur = Column(Float, nullable=False)
    methode = Column(String(20), default="ML")
    demande_id = Column(Integer, ForeignKey("demandes_groupement.id"), nullable=False)
    groupe_id = Column(Integer, ForeignKey("groupes_crees.id"))

    demande = relationship("DemandeGroupement", back_populates="qualites")
    groupe = relationship("GroupeCree", back_populates="qualites")


class HistoriqueModification(Base):
    """Humain dans la boucle : trace des déplacements faits par l'enseignant."""
    __tablename__ = "historique_modifications"

    id = Column(Integer, primary_key=True, index=True)
    id_etudiant = Column(Integer, nullable=False)
    id_enseignant = Column(Integer, nullable=False)
    groupe_source_id = Column(Integer, ForeignKey("groupes_crees.id"))
    groupe_cible_id = Column(Integer, ForeignKey("groupes_crees.id"))
    date_modification = Column(DateTime, default=datetime.utcnow)
    demande_id = Column(Integer, ForeignKey("demandes_groupement.id"), nullable=False)

    demande = relationship("DemandeGroupement", back_populates="modifications")