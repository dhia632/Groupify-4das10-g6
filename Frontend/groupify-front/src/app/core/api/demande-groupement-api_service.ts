import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

/**
 * Appels vers le ML Clustering Engine (FastAPI, port 8000) via le gateway.
 * Les noms de champs suivent entity.py (snake_case).
 * Si ton schéma Pydantic utilise d'autres noms, corrige-les ici : c'est le seul endroit.
 */
const BASE = '/api/clustering';

export type EtatDemande = 'EN_ATTENTE' | 'EN_COURS' | 'PROPOSE' | 'VALIDE' | 'PUBLIE' | 'ECHEC';
export type TypeCritere = 'NUMERIQUE' | 'CATEGORIEL';

export interface CritereDto {
    nom_critere: string;
    poids: number;
    type_critere: TypeCritere;
}

export interface DemandeDto {
    id: number;
    id_cours: number;
    id_enseignant: number;
    algorithme: string;
    nombre_groupes?: number | null;
    taille_groupe?: number | null;
    graine_aleatoire?: number | null;
    version_modele?: string | null;
    etat: EtatDemande | string;
    message_erreur?: string | null;
    date_creation?: string | null;
    date_debut?: string | null;
    date_fin?: string | null;
    criteres?: CritereDto[];
}

export interface DemandeRequest {
    id_cours: number;
    id_enseignant: number;
    algorithme: string;
    nombre_groupes: number | null;
    taille_groupe: number | null;
    graine_aleatoire: number;
    criteres: CritereDto[];
}

@Injectable({ providedIn: 'root' })
export class DemandeGroupementApi {
    private http = inject(HttpClient);

    /** GET /api/clustering/demandes */
    demandes(): Observable<DemandeDto[]> {
        return this.http.get<unknown>(`${BASE}/demandes`).pipe(map((res) => this.toList(res)));
    }

    /** GET /api/clustering/demandes/{id} */
    demande(id: number): Observable<DemandeDto> {
        return this.http.get<DemandeDto>(`${BASE}/demandes/${id}`);
    }

    /** POST /api/clustering/demandes */
    createDemande(req: DemandeRequest): Observable<DemandeDto> {
        return this.http.post<DemandeDto>(`${BASE}/demandes`, req);
    }

    private toList(res: unknown): DemandeDto[] {
        if (Array.isArray(res)) return res as DemandeDto[];
        const r = res as { content?: unknown; items?: unknown } | null;
        if (Array.isArray(r?.content)) return r!.content as DemandeDto[];
        if (Array.isArray(r?.items)) return r!.items as DemandeDto[];
        return [];
    }
}