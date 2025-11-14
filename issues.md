
1

Automatic Zoom
[root@skytsap skyraksys_hrm_app]# chmod +x ultimate-deploy.sh 
[root@skytsap skyraksys_hrm_app]# ./ultimate-deploy.sh 
        Ultimate HRM Deployment 
========================== 
 
         Phase 1: Git Deployment 
------------------------- 
     Running Git deployment to get latest code... 
================================================================================== 
        Skyraksys HRM Git-Based Deployment (RHEL Production) 
Repository: https://github.com/kanchanavinoth-crypto/skyraksys_hrm_app.git 
Branch: master 
Timestamp: Friday 14 November 2025 01:28:32 PM EET 
================================================================================== 
[ℹ] Creating comprehensive backup at: /opt/skyraksys-hrm/backups/git-deploy-20251114_132832 
[ℹ] Backing up existing installation... 
[!] No backend .env found 
[✓] Backup completed successfully 
[ℹ] Backing up system configurations... 
[ℹ] Stopping services for update... 
[!] Backend service was not running 
     Fetching latest code from Git repository... 
[ℹ] Updating existing Git repository... 
Saved working directory and index state On master: Auto-stash before deployment Friday 14 
November 2025 01:28:32 PM EET 
Already on 'master' 
Your branch is up to date with 'origin/master'. 
From https://github.com/kanchanavinoth-crypto/skyraksys_hrm_app 
 * branch            master     -> FETCH_HEAD 
Already up to date. 
[✓] Repository updated successfully 
[ℹ] Restoring preserved configurations... 
  Deploying Backend Updates... 
[ℹ] Installing backend dependencies... 
npm warn config production Use `--omit=dev` instead. 
 
added 1 package, and audited 378 packages in 1s 
 
38 packages are looking for funding 
  run `npm fund` for details 
 
11 vulnerabilities (5 low, 4 moderate, 2 high) 
 
To address issues that do not require attention, run: 
  npm audit fix 
 
To address all issues (including breaking changes), run: 
  npm audit fix --force 
 
Run `npm audit` for details. 
[ℹ] Running database migrations... 
 
Sequelize CLI [Node: 22.21.1, CLI: 6.6.3, ORM: 6.37.7] 
 
 
 
[!] Sequelize CLI not found, trying npm script... 
 
> skyraksys-hrm-backend@1.0.0 migrate 
> npx sequelize-cli db:migrate 
 
 
