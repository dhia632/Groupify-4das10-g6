import { JsonPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClusteringApi, Demande } from '../../core/api/clustering-api.service';
import { AlgorithmInfo } from '../../core/models';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-clustering-lab',
  imports: [FormsModule, JsonPipe],
  template: `
    <div class="page">

      <div class="page-title">
        <div>
          <h1>Laboratoire ML</h1>
          <p>ML Clustering Engine · Python, FastAPI, scikit-learn · base PostgreSQL</p>
        </div>
      </div>

      <!-- ==================== ALGORITHMES ==================== -->

      <div class="grid g-3">
        @for (a of algorithms(); track a.code) {
          <div class="card" [class.yellow]="a.code === 'KMEANS_STRATIFIED'">
            <h3>{{ a.name }}</h3>

            <p class="small muted mt-s">
              {{ a.description }}
            </p>

            <span class="chip mt-s mono">
              {{ a.code }}
            </span>
          </div>
        }
      </div>

      <!-- ==================== MESSAGES ==================== -->

      @if (erreur()) {
        <div class="card err">
          {{ erreur() }}
        </div>
      }

      @if (message()) {
        <div class="card ok">
          {{ message() }}
        </div>
      }

      <!-- ==================== NOUVELLE DEMANDE ==================== -->

      <div class="card">

        <div class="card-head">
          <h3>
            <span class="mi">add_circle</span>
            Nouvelle demande de groupement
          </h3>

          <span class="card-sub">
            POST /api/clustering/demandes
          </span>
        </div>

        <div class="row wrap">

          <div class="field" style="width:150px">
            <label>ID du cours</label>

            <input
              class="input"
              type="number"
              [(ngModel)]="form.idCours"
            />
          </div>

          <div class="field" style="width:150px">
            <label>ID enseignant</label>

            <input
              class="input"
              type="number"
              [(ngModel)]="form.idEnseignant"
            />
          </div>

          <div class="field" style="width:170px">
            <label>Algorithme</label>

            <input
              class="input"
              type="text"
              [(ngModel)]="form.algorithme"
            />
          </div>

          <div class="field" style="width:150px">
            <label>Nombre de groupes</label>

            <input
              class="input"
              type="number"
              min="1"
              [(ngModel)]="form.nombreGroupes"
            />
          </div>

          <div class="field" style="width:150px">
            <label>Taille d'un groupe</label>

            <input
              class="input"
              type="number"
              min="1"
              [(ngModel)]="form.tailleGroupe"
            />
          </div>

          <div class="field" style="width:150px">
            <label>Graine aléatoire</label>

            <input
              class="input"
              type="number"
              [(ngModel)]="form.graineAleatoire"
            />
          </div>

          <button
            class="btn primary"
            style="align-self:flex-end"
            [disabled]="loadingDemande()"
            (click)="creerDemande()"
          >
            <span class="mi">send</span>

            {{ loadingDemande() ? 'Envoi…' : 'Créer la demande' }}
          </button>

        </div>
      </div>

      <!-- ==================== DEMANDES ==================== -->

      <div class="grid g-3">

        <!-- Liste des demandes -->

        <div class="card">

          <div class="card-head">
            <h3>
              <span class="mi">list</span>
              Demandes
            </h3>

            <span class="card-sub">
              GET /demandes
            </span>
          </div>

          <div class="col">

            @for (d of demandes(); track d.id) {

              <button
                class="job"
                [class.active]="demandeSel()?.id === d.id"
                (click)="choisirDemande(d)"
              >

                <span class="mono bold">
                  Demande #{{ d.id }}
                </span>

                <span class="small muted">
                  Cours {{ d.idCours }}
                  · {{ d.algorithme }}
                  · {{ d.nombreGroupes }} groupes
                </span>

                <span class="small">
                  <b>{{ d.etat }}</b>
                </span>

              </button>

            } @empty {

              <p class="empty">
                Aucune demande.
              </p>

            }

          </div>
        </div>

        <!-- Détails de la demande -->

        <div class="card span-2">

          @if (demandeSel(); as d) {

            <div class="card-head">

              <h3>
                <span class="mi">groups</span>
                Demande #{{ d.id }}
              </h3>

              <span class="chip">
                {{ d.etat }}
              </span>

            </div>

            <!-- Actions -->

            <div class="row wrap">

              <button
                class="btn primary"
                [disabled]="loadingDemande()"
                (click)="executerDemande()"
              >
                <span class="mi">play_arrow</span>
                Exécuter
              </button>

              <button
                class="btn"
                [disabled]="loadingDemande()"
                (click)="actualiserDemande()"
              >
                <span class="mi">refresh</span>
                Actualiser
              </button>

              <button
                class="btn"
                [disabled]="loadingDemande()"
                (click)="validerDemande()"
              >
                <span class="mi">check</span>
                Valider
              </button>

              <button
                class="btn"
                [disabled]="loadingDemande()"
                (click)="supprimerDemande()"
              >
                <span class="mi">delete</span>
                Supprimer
              </button>

            </div>

            <!-- Groupes -->

            <h4 class="mt">
              Groupes
            </h4>

            @if (groupes() !== null) {

              <pre class="res">
{{ groupes() | json }}
              </pre>

            } @else {

              <p class="small muted">
                Pas encore de groupes : clique sur « Exécuter ».
              </p>

            }

            <!-- Clusters -->

            <h4 class="mt">
              Clusters (profils détectés)
            </h4>

            @if (clusters() !== null) {

              <pre class="res">
{{ clusters() | json }}
              </pre>

            } @else {

              <p class="small muted">
                Pas encore de clusters.
              </p>

            }

            <!-- Qualité -->

            <h4 class="mt">
              Qualité
            </h4>

            @if (qualite() !== null) {

              <pre class="res">
{{ qualite() | json }}
              </pre>

            } @else {

              <p class="small muted">
                Pas encore d'indicateurs.
              </p>

            }

          } @else {

            <div class="empty">
              Choisis une demande dans la liste.
            </div>

          }

        </div>

      </div>

    </div>
  `,

  styles: [`

    .job {
      display: flex;
      flex-direction: column;
      gap: 2px;
      text-align: left;
      padding: 10px 12px;
      border: 1.6px solid #1e1e1e;
      border-radius: 14px;
      background: #fff;
      cursor: pointer;
      font-family: inherit;
    }

    .job:hover,
    .job.active {
      background: #fff3cf;
    }

    .res {
      background: #f6f4ee;
      border: 1.6px solid #1e1e1e;
      border-radius: 12px;
      padding: 10px 12px;
      font-size: 12px;
      max-height: 260px;
      overflow: auto;
      white-space: pre-wrap;
    }

    .err {
      background: #fde7e7;
      border: 1.6px solid #b00020;
      color: #b00020;
    }

    .ok {
      background: #e6f6ea;
      border: 1.6px solid #1b7a3a;
      color: #1b7a3a;
    }

  `],
})
export class ClusteringLabPage {

  private api = inject(ClusteringApi);
  private toast = inject(ToastService);

  algorithms = signal<AlgorithmInfo[]>([]);

  // ==================== DEMANDES DE GROUPEMENT ====================

  form = {
    idCours: 12,
    idEnseignant: 1,
    algorithme: 'KMEANS',
    nombreGroupes: 5,
    tailleGroupe: 4,
    graineAleatoire: 42
  };

  demandes = signal<Demande[]>([]);

  demandeSel = signal<Demande | null>(null);

  groupes = signal<any>(null);

  clusters = signal<any>(null);

  qualite = signal<any>(null);

  loadingDemande = signal(false);

  message = signal('');

  erreur = signal('');


  // ==================== CONSTRUCTEUR ====================

  constructor() {

    this.api.algorithms().subscribe({
      next: (a) => this.algorithms.set(a),

      error: (e) => this.toast.fromError(e),
    });

    this.chargerDemandes();
  }


  // ==================== UTILITAIRES ====================

  private texteErreur(e: any): string {

    const detail = e?.error?.detail;

    if (typeof detail === 'string') {
      return detail;
    }

    if (detail) {
      return JSON.stringify(detail);
    }

    return e?.message ?? 'Erreur inconnue';
  }


  private effacerMessages() {

    this.message.set('');
    this.erreur.set('');
  }


  // ==================== CHARGER LES DEMANDES ====================

  chargerDemandes() {

    this.api.listDemandes().subscribe({

      next: (liste) => {
        this.demandes.set(liste);
      },

      error: (e) => {
        this.erreur.set(this.texteErreur(e));
      },

    });
  }


  // ==================== CRÉER UNE DEMANDE ====================

  creerDemande() {

    this.effacerMessages();

    this.loadingDemande.set(true);

    this.api.createDemande({
      ...this.form,
      criteres: []
    }).subscribe({

      next: (d) => {

        this.loadingDemande.set(false);

        this.message.set(
            'Demande #' +
            d.id +
            ' créée (état : ' +
            d.etat +
            ').'
        );

        this.chargerDemandes();

        this.choisirDemande(d);
      },

      error: (e) => {

        this.loadingDemande.set(false);

        this.erreur.set(this.texteErreur(e));
      },

    });
  }


  // ==================== CHOISIR UNE DEMANDE ====================

  choisirDemande(d: Demande) {

    this.demandeSel.set(d);

    this.groupes.set(null);

    this.clusters.set(null);

    this.qualite.set(null);

    this.chargerResultats();
  }


  // ==================== CHARGER LES RÉSULTATS ====================

  private chargerResultats() {

    const d = this.demandeSel();

    if (!d) {
      return;
    }

    this.api.groupes(d.id).subscribe({

      next: (g) => {
        this.groupes.set(g);
      },

      error: () => {
        this.groupes.set(null);
      },

    });

    this.api.clusters(d.id).subscribe({

      next: (c) => {
        this.clusters.set(c);
      },

      error: () => {
        this.clusters.set(null);
      },

    });

    this.api.qualite(d.id).subscribe({

      next: (q) => {
        this.qualite.set(q);
      },

      error: () => {
        this.qualite.set(null);
      },

    });
  }


  // ==================== ACTUALISER UNE DEMANDE ====================

  actualiserDemande() {

    const d = this.demandeSel();

    if (!d) {
      return;
    }

    this.api.getDemande(d.id).subscribe({

      next: (maj) => {

        this.demandeSel.set(maj);

        this.chargerDemandes();

        this.chargerResultats();
      },

      error: (e) => {

        this.erreur.set(this.texteErreur(e));
      },

    });
  }


  // ==================== EXÉCUTER UNE DEMANDE ====================

  executerDemande() {

    const d = this.demandeSel();

    if (!d) {
      return;
    }

    this.effacerMessages();

    this.loadingDemande.set(true);

    this.api.executer(d.id).subscribe({

      next: () => {

        this.loadingDemande.set(false);

        this.message.set('Exécution lancée.');

        this.actualiserDemande();
      },

      error: (e) => {

        this.loadingDemande.set(false);

        this.erreur.set(this.texteErreur(e));
      },

    });
  }


  // ==================== VALIDER UNE DEMANDE ====================

  validerDemande() {

    const d = this.demandeSel();

    if (!d) {
      return;
    }

    this.effacerMessages();

    this.loadingDemande.set(true);

    this.api.valider(d.id).subscribe({

      next: () => {

        this.loadingDemande.set(false);

        this.message.set('Proposition validée.');

        this.actualiserDemande();
      },

      error: (e) => {

        this.loadingDemande.set(false);

        this.erreur.set(this.texteErreur(e));
      },

    });
  }


  // ==================== SUPPRIMER UNE DEMANDE ====================

  supprimerDemande() {

    const d = this.demandeSel();

    if (!d) {
      return;
    }

    this.effacerMessages();

    this.api.deleteDemande(d.id).subscribe({

      next: () => {

        this.message.set(
            'Demande #' + d.id + ' supprimée.'
        );

        this.demandeSel.set(null);

        this.chargerDemandes();
      },

      error: (e) => {

        this.erreur.set(this.texteErreur(e));
      },

    });
  }

}