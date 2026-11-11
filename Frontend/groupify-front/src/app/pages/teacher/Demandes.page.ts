import { JsonPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClusteringApi, Demande } from '../../core/api/clustering-api.service';

@Component({
    selector: 'app-demandes',
    imports: [FormsModule, JsonPipe],
    template: `
    <div class="page">
      <div class="page-title">
        <div><h1>Demandes de groupement</h1><p>ML Clustering Engine · FastAPI · PostgreSQL</p></div>
      </div>

      @if (erreur()) { <div class="card err">{{ erreur() }}</div> }
      @if (message()) { <div class="card ok">{{ message() }}</div> }

      <!-- 1) FORMULAIRE -->
      <div class="card">
        <div class="card-head"><h3><span class="mi">add_circle</span> Nouvelle demande</h3><span class="card-sub">POST /api/clustering/demandes</span></div>
        <div class="row wrap">
          <div class="field" style="width:150px"><label>ID du cours</label><input class="input" type="number" [(ngModel)]="form.idCours" /></div>
          <div class="field" style="width:150px"><label>ID enseignant</label><input class="input" type="number" [(ngModel)]="form.idEnseignant" /></div>
          <div class="field" style="width:170px"><label>Algorithme</label><input class="input" type="text" [(ngModel)]="form.algorithme" /></div>
          <div class="field" style="width:150px"><label>Nombre de groupes</label><input class="input" type="number" min="1" [(ngModel)]="form.nombreGroupes" /></div>
          <div class="field" style="width:150px"><label>Taille d'un groupe</label><input class="input" type="number" min="1" [(ngModel)]="form.tailleGroupe" /></div>
          <div class="field" style="width:150px"><label>Graine aléatoire</label><input class="input" type="number" [(ngModel)]="form.graineAleatoire" /></div>
          <button class="btn primary" style="align-self:flex-end" [disabled]="loading()" (click)="creer()">
            <span class="mi">send</span> {{ loading() ? 'Envoi…' : 'Créer la demande' }}
          </button>
        </div>
      </div>

      <div class="grid g-3">
        <!-- 2) LISTE DES DEMANDES -->
        <div class="card">
          <div class="card-head"><h3><span class="mi">history</span> Demandes</h3><span class="card-sub">GET /demandes</span></div>
          <div class="col">
            @for (d of demandes(); track d.id) {
              <button class="job" [class.active]="selected()?.id === d.id" (click)="choisir(d)">
                <span class="mono bold">Demande #{{ d.id }}</span>
                <span class="small muted">Cours {{ d.idCours }} · {{ d.algorithme }} · {{ d.nombreGroupes }} groupes</span>
                <span class="small"><b>{{ d.etat }}</b></span>
              </button>
            } @empty { <p class="empty">Aucune demande.</p> }
          </div>
        </div>

        <!-- 3) DETAIL ET RESULTATS -->
        <div class="card span-2">
          @if (selected(); as d) {
            <div class="card-head">
              <h3><span class="mi">scatter_plot</span> Demande #{{ d.id }}</h3>
              <span class="chip">{{ d.etat }}</span>
            </div>
            <div class="row wrap">
              <button class="btn primary" [disabled]="loading()" (click)="executer()"><span class="mi">play_arrow</span> Exécuter</button>
              <button class="btn" [disabled]="loading()" (click)="actualiser()"><span class="mi">refresh</span> Actualiser</button>
              <button class="btn" [disabled]="loading()" (click)="valider()"><span class="mi">check</span> Valider</button>
              <button class="btn" [disabled]="loading()" (click)="supprimer()"><span class="mi">delete</span> Supprimer</button>
            </div>

            <h4 class="mt">Détails de la demande</h4>
            <pre class="res">{{ d | json }}</pre>

            <h4 class="mt">Groupes</h4>
            @if (groupes() !== null) { <pre class="res">{{ groupes() | json }}</pre> }
            @else { <p class="small muted">Pas encore de groupes : clique sur « Exécuter ».</p> }

            <h4 class="mt">Clusters (profils détectés)</h4>
            @if (clusters() !== null) { <pre class="res">{{ clusters() | json }}</pre> }
            @else { <p class="small muted">Pas encore de clusters.</p> }

            <h4 class="mt">Qualité</h4>
            @if (qualite() !== null) { <pre class="res">{{ qualite() | json }}</pre> }
            @else { <p class="small muted">Pas encore d'indicateurs.</p> }
          } @else { <div class="empty">Choisis une demande dans la liste.</div> }
        </div>
      </div>
    </div>
  `,
    styles: [`
    .job{display:flex;flex-direction:column;gap:2px;text-align:left;padding:10px 12px;border:1.6px solid #1e1e1e;border-radius:14px;background:#fff;cursor:pointer;font-family:inherit}
    .job:hover,.job.active{background:#fff3cf}
    .res{background:#f6f4ee;border:1.6px solid #1e1e1e;border-radius:12px;padding:10px 12px;font-size:12px;max-height:260px;overflow:auto;white-space:pre-wrap}
    .err{background:#fde7e7;border:1.6px solid #b00020;color:#b00020}
    .ok{background:#e6f6ea;border:1.6px solid #1b7a3a;color:#1b7a3a}
  `],
})
export class DemandesPage {
    private api = inject(ClusteringApi);

    form = {
        idCours: 12,
        idEnseignant: 1,
        algorithme: 'KMEANS',
        nombreGroupes: 5,
        tailleGroupe: 4,
        graineAleatoire: 42,
    };

    demandes = signal<Demande[]>([]);
    selected = signal<Demande | null>(null);
    groupes = signal<any>(null);
    clusters = signal<any>(null);
    qualite = signal<any>(null);
    loading = signal(false);
    message = signal('');
    erreur = signal('');

    constructor() {
        this.charger();
    }

    private texteErreur(e: any): string {
        const detail = e?.error?.detail;
        if (typeof detail === 'string') return detail;
        if (detail) return JSON.stringify(detail);
        return e?.message ?? 'Erreur inconnue';
    }

    private reset() {
        this.message.set('');
        this.erreur.set('');
    }

    charger() {
        this.api.listDemandes().subscribe({
            next: (liste) => this.demandes.set(liste),
            error: (e) => this.erreur.set(this.texteErreur(e)),
        });
    }

    creer() {
        this.reset();
        this.loading.set(true);
        this.api.createDemande({ ...this.form, criteres: [] }).subscribe({
            next: (d) => {
                this.loading.set(false);
                this.message.set('Demande #' + d.id + ' créée (état : ' + d.etat + ').');
                this.charger();
                this.choisir(d);
            },
            error: (e) => {
                this.loading.set(false);
                this.erreur.set(this.texteErreur(e));
            },
        });
    }

    choisir(d: Demande) {
        this.selected.set(d);
        this.groupes.set(null);
        this.clusters.set(null);
        this.qualite.set(null);
        this.voirResultats();
    }

    /** Charge les résultats ; s'il n'y en a pas encore, on laisse vide (sans erreur). */
    private voirResultats() {
        const d = this.selected();
        if (!d) return;
        this.api.groupes(d.id).subscribe({ next: (g) => this.groupes.set(g), error: () => this.groupes.set(null) });
        this.api.clusters(d.id).subscribe({ next: (c) => this.clusters.set(c), error: () => this.clusters.set(null) });
        this.api.qualite(d.id).subscribe({ next: (q) => this.qualite.set(q), error: () => this.qualite.set(null) });
    }

    actualiser() {
        const d = this.selected();
        if (!d) return;
        this.api.getDemande(d.id).subscribe({
            next: (maj) => {
                this.selected.set(maj);
                this.charger();
                this.voirResultats();
            },
            error: (e) => this.erreur.set(this.texteErreur(e)),
        });
    }

    executer() {
        const d = this.selected();
        if (!d) return;
        this.reset();
        this.loading.set(true);
        this.api.executer(d.id).subscribe({
            next: () => {
                this.loading.set(false);
                this.message.set('Exécution lancée.');
                this.actualiser();
            },
            error: (e) => {
                this.loading.set(false);
                this.erreur.set(this.texteErreur(e));
            },
        });
    }

    valider() {
        const d = this.selected();
        if (!d) return;
        this.reset();
        this.loading.set(true);
        this.api.valider(d.id).subscribe({
            next: () => {
                this.loading.set(false);
                this.message.set('Proposition validée.');
                this.actualiser();
            },
            error: (e) => {
                this.loading.set(false);
                this.erreur.set(this.texteErreur(e));
            },
        });
    }

    supprimer() {
        const d = this.selected();
        if (!d) return;
        this.reset();
        this.api.deleteDemande(d.id).subscribe({
            next: () => {
                this.message.set('Demande #' + d.id + ' supprimée.');
                this.selected.set(null);
                this.charger();
            },
            error: (e) => this.erreur.set(this.texteErreur(e)),
        });
    }
}