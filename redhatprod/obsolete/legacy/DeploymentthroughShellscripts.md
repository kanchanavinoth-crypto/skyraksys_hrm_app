**Deployment through Shell Script**

cd /opt/skyraksys-hrm/redhatprod/scripts

# Step 1: Generate all configuration files
sudo bash 00_generate_configs.sh 95.216.14.232

# Step 2: Install system prerequisites
sudo bash 01_install_prerequisites.sh
# Installs: Node.js 22.16.0, PostgreSQL 17, Nginx, Redis

# Step 3: Setup PostgreSQL database
sudo bash 02_setup_database.sh
# Creates database, user, runs Sequelize migrations

# Step 4: Deploy application
sudo bash 03_deploy_application.sh
# Deploys backend and frontend, starts services

# Step 5: Verify deployment
sudo bash 04_health_check.sh
# Checks all services, database, ports

# Optional: Run migration with reporting
sudo bash 03_migrate_and_seed_production.sh
# Generates before/after migration report

# Optional: Validate database
sudo bash validate-database.sh
# Comprehensive validation (15+ tables, FKs, indexes)