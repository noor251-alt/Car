# 🚗 CarCare - Application Web Authentifiée

Application web moderne de services de lavage automobile avec authentification unifiée pour clients et agents.

## 🌟 Fonctionnalités

- ✅ **Authentification unifiée** : Email/mot de passe pour tous les utilisateurs
- ✅ **Interface moderne** : Design glassmorphism avec animations fluides
- ✅ **Responsive design** : Adapté mobile, tablet et desktop
- ✅ **Routes protégées** : Authentification requise pour l'accès
- ✅ **Thème adaptatif** : Mode clair/sombre
- ✅ **PWA Ready** : Installation possible comme app native

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+
- NPM ou PNPM

### Installation
```bash
# Cloner le projet
git clone [repository-url]
cd carcare-demo

# Installer les dépendances
npm install

# Configuration
cp .env.example .env
# Éditer .env avec votre configuration

# Développement
npm run dev
```

### Configuration Backend
L'application se connecte au backend CarCare via API REST :
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### Build Production
```bash
npm run build
npm run preview
```

## 🎨 Design System

- **Framework** : React 18 + TypeScript + Vite
- **Styles** : Tailwind CSS + Framer Motion
- **Icons** : Lucide React
- **Routing** : React Router v6

## 🔐 Sécurité

- **Authentification** : JWT Bearer tokens
- **Protection routes** : AuthContext + ProtectedRoute
- **Validation** : Email/mot de passe requis
- **Storage** : localStorage sécurisé

## 📱 Interface

### Pages Principales
- **Landing** : Page d'accueil institutionnelle
- **Login** : Connexion unifiée client/agent
- **Home** : Tableau de bord personnalisé
- **Booking** : Réservation de services (clients)
- **Tracking** : Suivi en temps réel

### Composants Clés
- `AuthContext` : Gestion d'état d'authentification
- `ProtectedRoute` : Protection des routes
- `LoginScreen` : Interface de connexion unifiée
- `HomeScreen` : Accueil avec utilisateur connecté

## 📊 Performance

- **Bundle** : 616.75 kB (134.90 kB gzipped)
- **CSS** : 53.84 kB (8.47 kB gzipped)
- **Build time** : ~7 secondes
- **Responsive** : Mobile-first design

## 🔧 Scripts Disponibles

```bash
npm run dev          # Serveur de développement
npm run build        # Build production
npm run preview      # Prévisualisation du build
npm run type-check   # Vérification TypeScript
```

## 📁 Structure

```
src/
├── components/          # Composants React
├── context/            # Contextes (Auth, Theme)
├── App.tsx            # Application principale
└── main.tsx           # Point d'entrée

public/
└── images/            # Assets (logo, etc.)
```

## 🎯 Rôles Utilisateur

### Client
- Réservation de services
- Suivi des commandes
- Profil utilisateur
- Historique

### Agent
- Gestion des missions
- Statut de disponibilité
- Géolocalisation
- Gains et statistiques

## 🐛 Dépannage

### Erreurs Courantes
1. **API non accessible** : Vérifier backend et CORS
2. **Build failures** : `rm -rf node_modules && npm install`
3. **Authentification échoue** : Vérifier configuration backend

### Support
- Documentation technique : `CarCare-Documentation-Technique.md`
- Tests et validation : `CarCare-Tests-Validation-Complete.md`

## 📄 License

Propriétaire - CarCare Application

## 🚀 Déploiement

Application prête pour déploiement sur platforms modernes :
- Vercel, Netlify (statique)
- AWS S3 + CloudFront
- Docker containers

---

**Version** : 1.0.0 - Authentification Unifiée  
**Status** : 🟢 Prêt pour Production  
**Dernière mise à jour** : 2025-11-05
