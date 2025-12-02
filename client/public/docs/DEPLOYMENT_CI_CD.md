# Déploiement & CI/CD

## Vue d'ensemble

Ce document décrit la procédure complète de déploiement de la plateforme **Tech Health Platform** sur une VPS OVH, depuis le repository GitHub jusqu'à l'automatisation complète avec CI/CD.

La plateforme est une application **full-stack** composée de :
- **Frontend** : Application React (Vite) + TypeScript
- **Backend** : API GraphQL (Apollo Server) + Express + TypeScript
- **Base de données** : MongoDB
- **Architecture** : Monorepo avec packages partagés

## Table des matières

1. [Prérequis](#prérequis)
2. [Configuration initiale du serveur](#configuration-initiale-du-serveur)
3. [Installation de MongoDB](#installation-de-mongodb)
4. [Configuration du repository GitHub](#configuration-du-repository-github)
5. [Déploiement manuel (première fois)](#déploiement-manuel-première-fois)
6. [Configuration des variables d'environnement](#configuration-des-variables-denvironnement)
7. [Configuration CI/CD avec GitHub Actions](#configuration-cicd-avec-github-actions)
8. [Gestion des secrets](#gestion-des-secrets)
9. [Déploiement automatisé](#déploiement-automatisé)
10. [Monitoring et maintenance](#monitoring-et-maintenance)
11. [Troubleshooting](#troubleshooting)

---

## Prérequis

### Infrastructure

- **VPS OVH** avec au minimum :
  - 2 CPU
  - 4 Go RAM
  - 20 Go SSD
  - Ubuntu 22.04 LTS (recommandé)
- **Domaine** configuré et pointant vers l'IP de la VPS (optionnel mais recommandé)
- **Accès SSH** à la VPS avec privilèges root ou sudo

### Logiciels requis

- **Node.js** 20.x ou supérieur
- **npm** 9.x ou supérieur
- **MongoDB** 7.x
- **Nginx** (pour le reverse proxy et le serveur statique)
- **PM2** (pour la gestion des processus Node.js)
- **Git**

### Comptes et accès

- **Compte GitHub** avec accès au repository
- **GitHub Actions** activé pour le repository
- Accès SSH configuré pour le déploiement

---

## Configuration initiale du serveur

### 1. Mise à jour du système

```bash
# Connexion SSH à la VPS
ssh root@votre-ip-ovh

# Mise à jour des paquets
apt update && apt upgrade -y

# Installation des outils de base
apt install -y curl wget git build-essential ufw
```

### 2. Configuration du firewall

```bash
# Autoriser SSH (port 22)
ufw allow 22/tcp

# Autoriser HTTP (port 80)
ufw allow 80/tcp

# Autoriser HTTPS (port 443)
ufw allow 443/tcp

# Autoriser MongoDB (uniquement depuis localhost)
# ufw allow from 127.0.0.1 to any port 27017

# Activer le firewall
ufw enable

# Vérifier le statut
ufw status
```

### 3. Installation de Node.js

```bash
# Installation de Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Vérification des versions
node --version  # Doit afficher v20.x.x ou supérieur
npm --version   # Doit afficher 9.x.x ou supérieur
```

### 4. Installation de Nginx

```bash
# Installation de Nginx
apt install -y nginx

# Démarrage et activation au boot
systemctl start nginx
systemctl enable nginx

# Vérification du statut
systemctl status nginx
```

### 5. Installation de PM2

```bash
# Installation globale de PM2
npm install -g pm2

# Configuration de PM2 pour démarrer au boot
pm2 startup systemd
# Suivre les instructions affichées

# Vérification
pm2 --version
```

---

## Installation de MongoDB

### 1. Installation de MongoDB Community Edition

```bash
# Import de la clé GPG publique
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Ajout du repository MongoDB
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Mise à jour et installation
apt update
apt install -y mongodb-org

# Démarrage et activation au boot
systemctl start mongod
systemctl enable mongod

# Vérification du statut
systemctl status mongod
```

### 2. Configuration de MongoDB

```bash
# Accès à MongoDB Shell
mongosh

# Dans MongoDB Shell, créer un utilisateur administrateur
use admin
db.createUser({
  user: "admin",
  pwd: "VOTRE_MOT_DE_PASSE_SECURISE",
  roles: [ { role: "userAdminAnyDatabase", db: "admin" }, "readWriteAnyDatabase" ]
})

# Créer un utilisateur spécifique pour l'application
use tech_health_platform
db.createUser({
  user: "techhealth",
  pwd: "MOT_DE_PASSE_APPLICATION",
  roles: [ { role: "readWrite", db: "tech_health_platform" } ]
})

# Quitter MongoDB Shell
exit
```

### 3. Configuration de sécurité MongoDB

```bash
# Éditer la configuration MongoDB
nano /etc/mongod.conf

# Modifier les lignes suivantes :
# network:
#   bindIp: 127.0.0.1  # Uniquement localhost
# security:
#   authorization: enabled  # Activer l'authentification

# Redémarrer MongoDB
systemctl restart mongod
```

---

## Configuration du repository GitHub

### 1. Configuration des Secrets GitHub

Dans votre repository GitHub, allez dans **Settings > Secrets and variables > Actions** et ajoutez les secrets suivants :

| Secret | Description | Exemple |
|--------|-------------|---------|
| `VPS_HOST` | Adresse IP ou domaine de la VPS | `192.0.2.1` ou `vps.example.com` |
| `VPS_USER` | Utilisateur SSH pour le déploiement | `deploy` |
| `VPS_SSH_KEY` | Clé privée SSH pour l'authentification | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `VPS_SSH_PORT` | Port SSH (généralement 22) | `22` |
| `DEPLOY_PATH` | Chemin de déploiement sur la VPS | `/var/www/tech-health-platform` |
| `MONGO_URI` | URI de connexion MongoDB | `mongodb://techhealth:PASSWORD@localhost:27017/tech_health_platform?authSource=tech_health_platform` |
| `JWT_SECRET` | Secret pour la génération des tokens JWT | `votre-secret-jwt-tres-long-et-aleatoire` |
| `NODE_ENV` | Environnement de production | `production` |

### 2. Génération d'une clé SSH pour le déploiement

Sur votre machine locale :

```bash
# Générer une nouvelle paire de clés SSH (sans passphrase pour GitHub Actions)
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy -N ""

# Afficher la clé publique pour l'ajouter à la VPS
cat ~/.ssh/github_actions_deploy.pub
```

Sur la VPS :

```bash
# Créer un utilisateur pour le déploiement
adduser deploy
usermod -aG sudo deploy

# Passer à l'utilisateur deploy
su - deploy

# Créer le répertoire .ssh
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Ajouter la clé publique (copier le contenu de github_actions_deploy.pub)
nano ~/.ssh/authorized_keys
# Coller la clé publique et enregistrer

# Permissions appropriées
chmod 600 ~/.ssh/authorized_keys

# Retour à root
exit
```

Sur votre machine locale, ajoutez la clé privée aux secrets GitHub :

```bash
# Afficher la clé privée
cat ~/.ssh/github_actions_deploy

# Copier tout le contenu (y compris BEGIN et END) et l'ajouter comme secret VPS_SSH_KEY dans GitHub
```

---

## Déploiement manuel (première fois)

### 1. Préparation du répertoire de déploiement

```bash
# Sur la VPS, créer le répertoire de déploiement
sudo mkdir -p /var/www/tech-health-platform
sudo chown -R deploy:deploy /var/www/tech-health-platform

# Passer à l'utilisateur deploy
su - deploy
cd /var/www/tech-health-platform
```

### 2. Clonage du repository

```bash
# Cloner le repository
git clone https://github.com/VOTRE_USERNAME/tech-health-platform.git .

# Vérifier que les fichiers sont présents
ls -la
```

### 3. Configuration des variables d'environnement

Créer les fichiers `.env` nécessaires (voir section suivante pour les détails) :

```bash
# Backend
nano server/.env

# Frontend (si nécessaire)
nano client/.env
```

### 4. Installation des dépendances

```bash
# Installation des dépendances du monorepo
npm install

# Installation des dépendances backend
cd server
npm install

# Installation des dépendances frontend
cd ../client
npm install
cd ..
```

### 5. Build des applications

```bash
# Build du backend
cd server
npm run build

# Build du frontend
cd ../client
npm run build
cd ..
```

### 6. Configuration de Nginx

```bash
# Éditer la configuration Nginx
sudo nano /etc/nginx/sites-available/tech-health-platform
```

Contenu du fichier de configuration :

```nginx
# Configuration pour Tech Health Platform

# Redirection HTTP vers HTTPS (si certificat SSL configuré)
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;
    
    # Redirection vers HTTPS
    return 301 https://$server_name$request_uri;
}

# Configuration HTTPS
server {
    listen 443 ssl http2;
    server_name votre-domaine.com www.votre-domaine.com;

    # Certificats SSL (à configurer avec Certbot)
    ssl_certificate /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;
    
    # Configuration SSL (bonnes pratiques)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Taille maximale des uploads
    client_max_body_size 10M;

    # Logs
    access_log /var/log/nginx/tech-health-platform-access.log;
    error_log /var/log/nginx/tech-health-platform-error.log;

    # Serveur statique pour le frontend
    root /var/www/tech-health-platform/client/dist;
    index index.html;

    # Compression Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # Frontend - SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API GraphQL - Reverse proxy vers le backend
    location /graphql {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:4000/health;
        access_log off;
    }
}
```

Activer la configuration :

```bash
# Créer un lien symbolique
sudo ln -s /etc/nginx/sites-available/tech-health-platform /etc/nginx/sites-enabled/

# Tester la configuration
sudo nginx -t

# Recharger Nginx
sudo systemctl reload nginx
```

### 7. Configuration SSL avec Certbot (Let's Encrypt)

```bash
# Installation de Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtenir un certificat SSL
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com

# Renouvellement automatique (configuré automatiquement par Certbot)
sudo certbot renew --dry-run
```

### 8. Démarrage de l'application avec PM2

```bash
# Créer un fichier de configuration PM2
nano ecosystem.config.js
```

Contenu du fichier :

```javascript
module.exports = {
  apps: [
    {
      name: 'tech-health-platform-server',
      cwd: '/var/www/tech-health-platform/server',
      script: 'node',
      args: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      error_file: '/var/www/tech-health-platform/logs/server-error.log',
      out_file: '/var/www/tech-health-platform/logs/server-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
};
```

Démarrer l'application :

```bash
# Créer le répertoire de logs
mkdir -p /var/www/tech-health-platform/logs

# Démarrer l'application avec PM2
pm2 start ecosystem.config.js

# Sauvegarder la configuration PM2
pm2 save

# Vérifier le statut
pm2 status
pm2 logs tech-health-platform-server
```

---

## Configuration des variables d'environnement

### Variables backend (server/.env)

```bash
# Environnement
NODE_ENV=production

# Port du serveur
PORT=4000

# MongoDB
MONGO_URI=mongodb://techhealth:MOT_DE_PASSE@localhost:27017/tech_health_platform?authSource=tech_health_platform

# JWT
JWT_SECRET=votre-secret-jwt-tres-long-et-aleatoire-changez-cela
JWT_EXPIRES_IN=7d

# CORS (ajuster selon votre domaine)
CORS_ORIGIN=https://votre-domaine.com

# Cookie
COOKIE_SECRET=votre-secret-cookie-aleatoire
COOKIE_DOMAIN=votre-domaine.com
COOKIE_SECURE=true
COOKIE_HTTPONLY=true
COOKIE_SAMESITE=strict
```

### Variables frontend (client/.env)

```bash
# API GraphQL
VITE_GRAPHQL_URI=https://votre-domaine.com/graphql
# ou pour le développement local :
# VITE_GRAPHQL_URI=http://localhost:4000/graphql
```

⚠️ **Important** : Les fichiers `.env` ne doivent **jamais** être committés dans Git. Assurez-vous qu'ils sont dans `.gitignore`.

---

## Configuration CI/CD avec GitHub Actions

### 1. Création du workflow GitHub Actions

Créer le fichier `.github/workflows/deploy.yml` :

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main
  workflow_dispatch:  # Permet le déclenchement manuel

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies (root)
        run: npm install

      - name: Install dependencies (server)
        run: |
          cd server
          npm ci

      - name: Install dependencies (client)
        run: |
          cd client
          npm ci

      - name: Build server
        run: |
          cd server
          npm run build
        env:
          NODE_ENV: production

      - name: Build client
        run: |
          cd client
          npm run build
        env:
          NODE_ENV: production
          VITE_GRAPHQL_URI: ${{ secrets.VITE_GRAPHQL_URI }}

      - name: Deploy to VPS
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: ${{ secrets.VPS_SSH_PORT }}
          source: "server/dist,client/dist,server/package.json,server/node_modules,ecosystem.config.js"
          target: ${{ secrets.DEPLOY_PATH }}
          strip_components: 0

      - name: SSH and restart services
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: ${{ secrets.VPS_SSH_PORT }}
          script: |
            cd ${{ secrets.DEPLOY_PATH }}
            
            # Copier les fichiers .env s'ils n'existent pas
            if [ ! -f server/.env ]; then
              echo "⚠️  Attention: server/.env n'existe pas. Créez-le manuellement."
            fi
            
            # Recharger les variables d'environnement
            export $(cat server/.env | xargs)
            
            # Redémarrer l'application avec PM2
            pm2 restart tech-health-platform-server || pm2 start ecosystem.config.js
            
            # Sauvegarder la configuration PM2
            pm2 save
            
            # Vérifier le statut
            pm2 status
```

### 2. Amélioration du workflow (déploiement optimisé)

Version améliorée avec gestion des erreurs et notifications :

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install root dependencies
        run: npm ci

      - name: Install server dependencies
        working-directory: ./server
        run: npm ci

      - name: Install client dependencies
        working-directory: ./client
        run: npm ci

      - name: Run server tests (if available)
        working-directory: ./server
        run: npm test || echo "No tests configured"
        continue-on-error: true

      - name: Build server
        working-directory: ./server
        run: npm run build

      - name: Build client
        working-directory: ./client
        run: npm run build
        env:
          VITE_GRAPHQL_URI: ${{ secrets.VITE_GRAPHQL_URI }}

      - name: Create deployment archive
        run: |
          mkdir -p deploy
          cp -r server/dist deploy/server-dist
          cp -r client/dist deploy/client-dist
          cp server/package.json deploy/
          cp ecosystem.config.js deploy/ 2>/dev/null || echo "ecosystem.config.js not found"

      - name: Deploy to VPS
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: ${{ secrets.VPS_SSH_PORT }}
          source: "deploy/*"
          target: ${{ secrets.DEPLOY_PATH }}/deploy-temp
          strip_components: 1
          rm: false

      - name: Execute deployment script on VPS
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: ${{ secrets.VPS_SSH_PORT }}
          script: |
            set -e  # Arrêter en cas d'erreur
            
            DEPLOY_PATH="${{ secrets.DEPLOY_PATH }}"
            BACKUP_PATH="${DEPLOY_PATH}/backups/$(date +%Y%m%d_%H%M%S)"
            
            echo "🚀 Début du déploiement..."
            
            # Créer une sauvegarde
            if [ -d "${DEPLOY_PATH}/server/dist" ]; then
              echo "📦 Création d'une sauvegarde..."
              mkdir -p "${BACKUP_PATH}"
              cp -r "${DEPLOY_PATH}/server/dist" "${BACKUP_PATH}/" || true
              cp -r "${DEPLOY_PATH}/client/dist" "${BACKUP_PATH}/" || true
            fi
            
            # Copier les nouveaux fichiers
            echo "📂 Copie des nouveaux fichiers..."
            cp -r "${DEPLOY_PATH}/deploy-temp/server-dist" "${DEPLOY_PATH}/server/dist.new"
            cp -r "${DEPLOY_PATH}/deploy-temp/client-dist" "${DEPLOY_PATH}/client/dist.new"
            
            # Vérifier que les fichiers .env existent
            if [ ! -f "${DEPLOY_PATH}/server/.env" ]; then
              echo "❌ ERREUR: ${DEPLOY_PATH}/server/.env n'existe pas!"
              exit 1
            fi
            
            # Permutation atomique (swap)
            echo "🔄 Permutation des répertoires..."
            mv "${DEPLOY_PATH}/server/dist" "${DEPLOY_PATH}/server/dist.old" 2>/dev/null || true
            mv "${DEPLOY_PATH}/client/dist" "${DEPLOY_PATH}/client/dist.old" 2>/dev/null || true
            mv "${DEPLOY_PATH}/server/dist.new" "${DEPLOY_PATH}/server/dist"
            mv "${DEPLOY_PATH}/client/dist.new" "${DEPLOY_PATH}/client/dist"
            
            # Installer les dépendances de production du serveur
            echo "📦 Installation des dépendances..."
            cd "${DEPLOY_PATH}/server"
            npm ci --production
            
            # Redémarrer l'application
            echo "🔄 Redémarrage de l'application..."
            pm2 restart tech-health-platform-server || pm2 start ecosystem.config.js
            sleep 5
            
            # Vérifier que l'application fonctionne
            echo "🔍 Vérification de l'état de l'application..."
            if pm2 list | grep -q "tech-health-platform-server.*online"; then
              echo "✅ Application démarrée avec succès!"
              # Nettoyer les anciens répertoires
              rm -rf "${DEPLOY_PATH}/server/dist.old" "${DEPLOY_PATH}/client/dist.old"
              rm -rf "${DEPLOY_PATH}/deploy-temp"
            else
              echo "❌ ERREUR: L'application n'a pas démarré correctement!"
              echo "🔄 Restauration de la sauvegarde..."
              mv "${DEPLOY_PATH}/server/dist" "${DEPLOY_PATH}/server/dist.failed"
              mv "${DEPLOY_PATH}/client/dist" "${DEPLOY_PATH}/client/dist.failed"
              if [ -d "${DEPLOY_PATH}/server/dist.old" ]; then
                mv "${DEPLOY_PATH}/server/dist.old" "${DEPLOY_PATH}/server/dist"
                mv "${DEPLOY_PATH}/client/dist.old" "${DEPLOY_PATH}/client/dist"
                pm2 restart tech-health-platform-server
              fi
              exit 1
            fi
            
            # Sauvegarder la configuration PM2
            pm2 save
            
            echo "✅ Déploiement terminé avec succès!"
```

---

## Gestion des secrets

### Secrets GitHub Actions

Les secrets sont stockés dans **GitHub Settings > Secrets and variables > Actions**.

### Secrets sur la VPS

Les fichiers `.env` contenant des secrets doivent être :
- **Protégés** : permissions `600` (lecture/écriture pour le propriétaire uniquement)
- **Non versionnés** : dans `.gitignore`
- **Backup sécurisé** : sauvegardés de manière chiffrée hors du serveur

```bash
# Protection des fichiers .env
chmod 600 /var/www/tech-health-platform/server/.env
chmod 600 /var/www/tech-health-platform/client/.env
```

---

## Déploiement automatisé

Une fois le workflow GitHub Actions configuré :

1. **Push sur `main`** : Le déploiement se déclenche automatiquement
2. **Déclenchement manuel** : Via l'onglet "Actions" de GitHub

### Vérification du déploiement

```bash
# Sur la VPS, vérifier les logs
pm2 logs tech-health-platform-server --lines 50

# Vérifier le statut
pm2 status

# Vérifier les endpoints
curl http://localhost:4000/health
curl https://votre-domaine.com/graphql -X POST -H "Content-Type: application/json" -d '{"query":"{ __typename }"}'
```

---

## Monitoring et maintenance

### Monitoring avec PM2

```bash
# Interface web de monitoring PM2 (optionnel)
pm2 install pm2-server-monit

# Accès via http://votre-ip:9615 (à sécuriser avec un firewall)
```

### Logs

```bash
# Logs de l'application
pm2 logs tech-health-platform-server

# Logs Nginx
sudo tail -f /var/log/nginx/tech-health-platform-access.log
sudo tail -f /var/log/nginx/tech-health-platform-error.log

# Logs MongoDB
sudo tail -f /var/log/mongodb/mongod.log
```

### Mise à jour des dépendances

```bash
# Sur la VPS
cd /var/www/tech-health-platform
git pull origin main

# Rebuild et redéploiement (ou laisser GitHub Actions le faire)
cd server && npm ci && npm run build
cd ../client && npm ci && npm run build
pm2 restart tech-health-platform-server
```

### Sauvegarde MongoDB

```bash
# Script de sauvegarde automatique
nano /usr/local/bin/mongodb-backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="tech_health_platform"
DB_USER="techhealth"
DB_PASS="MOT_DE_PASSE"

mkdir -p $BACKUP_DIR

# Sauvegarde
mongodump --host localhost:27017 \
  --db $DB_NAME \
  --username $DB_USER \
  --password $DB_PASS \
  --authenticationDatabase $DB_NAME \
  --out $BACKUP_DIR/$DATE

# Compression
tar -czf $BACKUP_DIR/${DATE}.tar.gz -C $BACKUP_DIR $DATE
rm -rf $BACKUP_DIR/$DATE

# Suppression des sauvegardes de plus de 30 jours
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Sauvegarde terminée: ${DATE}.tar.gz"
```

```bash
# Rendre exécutable
chmod +x /usr/local/bin/mongodb-backup.sh

# Ajouter au crontab (sauvegarde quotidienne à 2h du matin)
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/mongodb-backup.sh >> /var/log/mongodb-backup.log 2>&1") | crontab -
```

---

## Troubleshooting

### L'application ne démarre pas

```bash
# Vérifier les logs PM2
pm2 logs tech-health-platform-server --err --lines 100

# Vérifier les variables d'environnement
cd /var/www/tech-health-platform/server
cat .env

# Tester manuellement
node dist/index.js
```

### Erreurs de connexion MongoDB

```bash
# Vérifier que MongoDB est actif
sudo systemctl status mongod

# Tester la connexion
mongosh -u techhealth -p MOT_DE_PASSE --authenticationDatabase tech_health_platform

# Vérifier les logs MongoDB
sudo tail -f /var/log/mongodb/mongod.log
```

### Problèmes Nginx

```bash
# Tester la configuration
sudo nginx -t

# Recharger la configuration
sudo systemctl reload nginx

# Vérifier les erreurs
sudo tail -f /var/log/nginx/error.log
```

### Port déjà utilisé

```bash
# Vérifier quel processus utilise le port 4000
sudo lsof -i :4000

# Tuer le processus si nécessaire
sudo kill -9 PID
```

### Problèmes de permissions

```bash
# Vérifier les permissions des fichiers
ls -la /var/www/tech-health-platform

# Corriger les permissions
sudo chown -R deploy:deploy /var/www/tech-health-platform
```

---

## Checklist de déploiement

- [ ] VPS configurée avec Ubuntu 22.04
- [ ] Firewall configuré (ports 22, 80, 443)
- [ ] Node.js 20.x installé
- [ ] MongoDB 7.x installé et configuré
- [ ] Nginx installé et configuré
- [ ] PM2 installé et configuré
- [ ] Repository cloné sur la VPS
- [ ] Variables d'environnement configurées
- [ ] SSL/TLS configuré (Let's Encrypt)
- [ ] Application buildée et démarrée
- [ ] GitHub Actions configuré
- [ ] Secrets GitHub configurés
- [ ] Tests de déploiement automatisé réussis
- [ ] Monitoring configuré
- [ ] Sauvegardes MongoDB configurées
- [ ] Documentation à jour

---

## Ressources supplémentaires

- [Documentation Node.js](https://nodejs.org/docs/)
- [Documentation MongoDB](https://docs.mongodb.com/)
- [Documentation Nginx](https://nginx.org/en/docs/)
- [Documentation PM2](https://pm2.keymetrics.io/docs/)
- [Documentation GitHub Actions](https://docs.github.com/en/actions)
- [Documentation Let's Encrypt](https://letsencrypt.org/docs/)

---

**Dernière mise à jour** : Décembre 2024

