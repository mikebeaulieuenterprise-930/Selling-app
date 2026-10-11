# Closer (selling-app)

Le copilote de vente des builders : **qui viser, quoi dire, comment conclure**, en 15 minutes par jour, depuis ton téléphone.

Phase 1 (ce dépôt) :

- **Connexion par lien magique** (pas de mot de passe)
- **Ton offre** : 3 étapes cliquables, puis l'IA génère ton positionnement, ton pitch, tes 3 arguments et les objections probables
- **Radar** : 3 à 5 segments de clients notés sur 100 (besoin, budget, joignabilité), où les trouver, quels signaux d'achat surveiller
- **Répondre** : tu colles le message d'un lead, l'IA te dit ce qu'il veut vraiment dire, la prochaine étape, et rédige la réponse
- **Leads** : la liste des gens que tu essaies de convaincre, avec statut et relances
- **Aujourd'hui** : la Mission du jour (10 à 15 min) et ta série de jours actifs
- Interface en **français et en anglais**, installable comme une app (PWA)

Stack : Next.js 16 (App Router), React 19, Tailwind CSS 4, Supabase (auth + Postgres), Claude (Anthropic SDK, sorties structurées).

---

## 1. Préparer Supabase (10 min)

Tu as déjà un projet. Dans le tableau de bord Supabase :

1. **SQL Editor → New query** : colle le contenu de `supabase/migrations/20261011000000_init.sql`, puis **Run**. Ça crée les tables, la sécurité par utilisateur (RLS) et le profil automatique à l'inscription.
2. **Authentication → Providers → Email** : laisse « Enable Email provider » activé. Le reste peut rester par défaut.
3. **Authentication → URL Configuration** :
   - *Site URL* : l'adresse de ton app (en local : `http://localhost:3000`, plus tard ton URL Vercel).
   - *Redirect URLs* : ajoute `http://localhost:3000/**` et, après le déploiement, `https://TON-APP.vercel.app/**`.
4. *(Recommandé)* **Authentication → Email Templates → Magic Link** : remplace le lien par

   ```html
   <a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email">Me connecter</a>
   ```

   Avec ce gabarit, le lien fonctionne même si tu l'ouvres sur un autre appareil que celui qui l'a demandé (ex. demandé sur l'ordi, ouvert sur le téléphone).
5. **Project Settings → API** : note l'**URL du projet** et la clé **anon** (ou la clé *publishable*, les deux marchent).

> Le service de courriel intégré de Supabase est limité à quelques envois par heure. C'est assez pour toi au début ; quand d'autres personnes utiliseront l'app, branche un SMTP (Resend, Postmark…) dans **Authentication → SMTP Settings**.

## 2. La clé Anthropic (2 min)

Crée une clé sur <https://platform.claude.com> (API keys). L'app utilise le modèle `claude-opus-5-5` avec des sorties structurées. Compte quelques cents par génération.

Le repli serveur (`fallbacks: "default"`) est activé : si le modèle refuse une demande pour une raison de sécurité, l'API la relance sur un autre modèle. Si tu ne veux pas de ce comportement, retire `betas` et `fallbacks` dans `src/lib/ai/generate.ts`.

## 3. Lancer en local (3 min)

```bash
npm install
cp .env.example .env.local   # puis remplis les 3 valeurs
npm run dev
```

Ouvre <http://localhost:3000>, entre ton courriel, clique sur le lien reçu. Première visite : l'app t'amène à **Ton offre**, puis au **Radar**.

Vérifications avant de pousser du code : `npm run check` (lint + types) et `npm run build`.

## 4. Déployer sur Vercel (5 min)

1. Sur <https://vercel.com/new>, importe le dépôt GitHub `selling-app`.
2. Dans **Environment Variables**, ajoute :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ANTHROPIC_API_KEY`
   - `NEXT_PUBLIC_SITE_URL` = `https://TON-APP.vercel.app` (tu peux l'ajouter après le premier déploiement)
3. **Deploy**. Puis retourne dans Supabase → URL Configuration et ajoute `https://TON-APP.vercel.app/**` aux Redirect URLs.

Les pages qui appellent l'IA déclarent `maxDuration = 60` : sur le plan gratuit de Vercel, c'est le maximum autorisé et c'est suffisant.

## 5. Installer l'app sur ton téléphone

- **iPhone (Safari)** : Partager → *Sur l'écran d'accueil*.
- **Android (Chrome)** : menu ⋮ → *Installer l'application*.

Elle s'ouvre alors en plein écran, comme une app native.

---

## Organisation du code

```
supabase/migrations/      Schéma SQL (tables, RLS, trigger de profil)
scripts/make-icons.mjs    Génère les icônes PNG (npm run icons)
src/proxy.ts              Rafraîchit la session Supabase, protège les pages privées
src/app/login             Connexion par lien magique
src/app/auth/callback     Cible du lien magique
src/app/(app)/            Écrans privés : today, radar, reply, leads, profile, onboarding
src/components/           UI partagée (boutons, puces, cartes, navigation)
src/lib/ai/               Client Claude, schémas de sortie (zod), prompts FR/EN
src/lib/data/             Accès à la base, une fonction par besoin
src/lib/mission.ts        Règles de la Mission du jour et de la série
src/lib/i18n/             Dictionnaires FR/EN, langue et fuseau horaire
```

Chaque Server Action revérifie l'utilisateur connecté (`requireUser`) et la base applique la RLS : un utilisateur ne voit que ses données.

## Feuille de route

- **Phase 2** : leads du jour (Google Maps + tes listes), courriel et cellulaire du décideur, synchronisation GoHighLevel, pipeline détaillé
- **Phase 3** : le Dojo (appels simulés avec un client IA, en texte puis en voix)
- **Phase 4** : le Radar apprend de tes résultats réels
- **Phase 5** : ouverture aux autres builders (abonnement, page d'accueil)
