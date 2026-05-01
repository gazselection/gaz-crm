# Gaz Sélection — CRM B2B CBD

Application CRM locale pour Gaz Sélection (Montpellier, SIRET 92030948100017).
Gère 64 clients B2B et leurs factures/devis avec calcul automatique URSSAF, export CSV et génération de vrais PDF.

## Stack

- **Backend** : Node.js + Express + SQLite (better-sqlite3)
- **Frontend** : React 18 + TypeScript + Vite + Zustand
- **PDF** : @react-pdf/renderer (téléchargement direct)
- **Données** : seedées depuis le HTML v5 au premier lancement

## Démarrer

```bash
cd gaz-crm
npm install      # installe back + front automatiquement
npm run dev      # backend port 3001 + frontend port 3000 (avec proxy /api)
```

Ouvre [http://localhost:3000](http://localhost:3000).

## Production (un seul port)

```bash
npm run build    # build du front
npm start        # tout sert sur http://localhost:3000
```

## Structure

```
gaz-crm/
├─ gaz.db                # créé au 1er lancement (64 clients + 71 factures)
├─ server/               # Express + SQLite
└─ client/               # React + Vite + TypeScript
```

## Sauvegarde

Tout est dans `gaz.db`. Pour sauvegarder : copie ce fichier.
Pour repartir de zéro : supprime-le, le seed se relancera au prochain démarrage.

## Fonctionnalités

- 📊 Dashboard : CA encaissé, mois en cours, à encaisser, impayés
- 💰 URSSAF : cotisation à payer (12,3%), revenu imposable (29% après abattement 71%)
- 📈 Seuils auto-entrepreneur : barres de progression vers 91 900€ (TVA) et 188 700€ (AE), projection annuelle
- 📞 À relancer : clients avec impayé/échantillon non relancés depuis > 30 jours
- 👥 Clients : recherche, filtre statut + pays, fiche détaillée, journal des relances
- 📄 Factures/Devis : recherche + filtres mois/pays/statut, édition inline du statut
- 🖨️ PDF : aperçu modal + téléchargement réel avec logo Gaz Sélection
- 📊 Export CSV : par mois ou tout, format Excel/Google Sheets
- 📱 Responsive : menu hamburger, layout adapté mobile
