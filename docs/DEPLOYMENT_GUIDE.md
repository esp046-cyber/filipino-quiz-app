# Deployment Guide - Filipino Adaptive Quiz Application

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Application Deployment](#application-deployment)
5. [Nginx Configuration](#nginx-configuration)
6. [SSL/TLS Setup](#ssltls-setup)
7. [Monitoring & Logging](#monitoring--logging)
8. [Backup Strategy](#backup-strategy)
9. [Scaling Strategies](#scaling-strategies)
10. [Troubleshooting](#troubleshooting)

---

## 1. Pre-Deployment Checklist

### Security Checklist
- [ ] All environment variables set with strong values
- [ ] JWT_SECRET is cryptographically random (min 64 characters)
- [ ] Database passwords are strong and unique
- [ ] SSL/TLS certificates obtained and configured
- [ ] CORS configured with specific allowed origins
- [ ] Rate limiting enabled
- [ ] Helmet.js security headers configured
- [ ] SQL injection prevention verified (Prisma parameterized queries)
- [ ] XSS protection enabled
- [ ] CSRF protection implemented for state-changing operations

### Infrastructure Checklist
- [ ] Domain name registered and DNS configured
- [ ] Server provisioned (minimum 2GB RAM, 2 CPU cores)
- [ ] PostgreSQL 15+ installed and configured
- [ ] Redis 7+ installed and configured
- [ ] Node.js 20.x LTS installed
- [ ] Docker & Docker Compose installed
- [ ] Nginx installed and configured
- [ ] Firewall configured (UFW/iptables)
- [ ] Monitoring tools set up

### Application Checklist
- [ ] All tests passing
- [ ] Code linted and formatted
- [ ] Dependencies updated and audited (`npm audit`)
- [ ] Production build tested
- [ ] Database migrations prepared
- [ ] Initial data seed ready
- [ ] Backup and restore procedures tested

---

## 2. Environment Setup

### Server Requirements

**Minimum Specifications:**
- OS: Ubuntu 22.04 LTS or similar
- RAM: 2GB
- CPU: 2 cores
- Storage: 20GB SSD
- Network: 100Mbps

**Recommended Specifications:**
- OS: Ubuntu 22.04 LTS
- RAM: 4GB
- CPU: 4 cores
- Storage: 50GB SSD
- Network: 1Gbps

### Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git build-essential

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show v10.x.x

# Install PostgreSQL 15
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update
sudo apt install -y postgresql-15 postgresql-contrib-15

# Install Redis
sudo apt install -y redis-server

# Install Nginx
sudo apt install -y nginx

# Install Docker (optional but recommended)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

---

## 3. Database Setup

### PostgreSQL Configuration

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE filipino_quiz;
CREATE USER filipino_quiz_user WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE filipino_quiz TO filipino_quiz_user;

# Enable required extensions
\c filipino_quiz
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

# Exit psql
\q
```

### PostgreSQL Performance Tuning

Edit `/etc/postgresql/15/main/postgresql.conf`:

```conf
# Memory settings
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
work_mem = 16MB

# Connection settings
max_connections = 100

# Write-ahead log
wal_buffers = 16MB
checkpoint_completion_target = 0.9

# Query planner
random_page_cost = 1.1  # For SSD
effective_io_concurrency = 200

# Logging
log_min_duration_statement = 1000  # Log slow queries (>1s)
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

### Import Database Schema

```bash
# Navigate to project directory
cd /var/www/filipino-quiz-app

# Import schema
sudo -u postgres psql filipino_quiz < database/schema.sql

# Verify tables
sudo -u postgres psql filipino_quiz -c "\dt"
```

### Redis Configuration

Edit `/etc/redis/redis.conf`:

```conf
# Security
requirepass your-redis-password
bind 127.0.0.1

# Memory
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000
appendonly yes
```

Restart Redis:
```bash
sudo systemctl restart redis-server
```

---

## 4. Application Deployment

### Option A: Docker Deployment (Recommended)

```bash
# Clone repository
cd /var/www
git clone https://github.com/yourusername/filipino-quiz-app.git
cd filipino-quiz-app

# Create production environment file
cp backend/.env.example backend/.env
nano backend/.env  # Edit with production values

# Set JWT secret
export JWT_SECRET=$(openssl rand -base64 64)
echo "JWT_SECRET=$JWT_SECRET" >> backend/.env

# Build and start services
docker-compose up -d --build

# Check logs
docker-compose logs -f

# Verify all services are running
docker-compose ps
```

### Option B: Manual Deployment

```bash
# Clone repository
cd /var/www
git clone https://github.com/yourusername/filipino-quiz-app.git
cd filipino-quiz-app

# Backend setup
cd backend
npm ci --production
cp .env.example .env
nano .env  # Edit with production values

# Build TypeScript
npm run build

# Start backend with PM2
npm install -g pm2
pm2 start dist/server.js --name filipino-quiz-backend
pm2 save
pm2 startup  # Follow instructions to enable on boot

# Frontend setup
cd ../frontend
npm ci
npm run build

# Copy built files to nginx directory
sudo cp -r dist/* /var/www/filipino-quiz-frontend/
```

### Environment Variables (Production)

```bash
# Backend .env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://filipino_quiz_user:your-password@localhost:5432/filipino_quiz
REDIS_URL=redis://:your-redis-password@localhost:6379
JWT_SECRET=your-64-character-random-secret
FRONTEND_URL=https://yourdomain.com

# Frontend .env.production
VITE_API_URL=https://api.yourdomain.com/api
VITE_WS_URL=wss://api.yourdomain.com
```

---

## 5. Nginx Configuration

### Nginx Setup

```bash
# Remove default config
sudo rm /etc/nginx/sites-enabled/default

# Create API configuration
sudo nano /etc/nginx/sites-available/filipino-quiz-api
```

**API Configuration (`/etc/nginx/sites-available/filipino-quiz-api`):**

```nginx
upstream backend {
    server localhost:5000;
    keepalive 64;
}

server {
    listen 80;
    server_name api.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Logging
    access_log /var/log/nginx/api.access.log;
    error_log /var/log/nginx/api.error.log;
    
    # Proxy settings
    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # WebSocket support
    location /socket.io/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Frontend Configuration (`/etc/nginx/sites-available/filipino-quiz-frontend`):**

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    
    root /var/www/filipino-quiz-frontend;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
    
    # Caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # React Router support
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Security
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
}
```

Enable sites and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/filipino-quiz-api /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/filipino-quiz-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 6. SSL/TLS Setup

### Using Let's Encrypt (Free SSL)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificates
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal is set up automatically
# Test renewal
sudo certbot renew --dry-run
```

---

## 7. Monitoring & Logging

### Application Monitoring with PM2

```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs filipino-quiz-backend

# Check status
pm2 status

# Restart application
pm2 restart filipino-quiz-backend
```

### System Monitoring

```bash
# Install monitoring tools
sudo apt install -y htop iotop

# Monitor system resources
htop

# Check disk usage
df -h

# Check memory usage
free -h
```

### Log Management

```bash
# Set up log rotation for application logs
sudo nano /etc/logrotate.d/filipino-quiz

# Add configuration:
/var/www/filipino-quiz-app/backend/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

## 8. Backup Strategy

### Database Backups

```bash
# Create backup script
sudo nano /usr/local/bin/backup-filipino-quiz-db.sh
```

**Backup Script:**

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/filipino-quiz"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="filipino_quiz"

mkdir -p $BACKUP_DIR

# Backup database
sudo -u postgres pg_dump $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Keep only last 30 days of backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/db_backup_$DATE.sql.gz"
```

Make executable and schedule:

```bash
sudo chmod +x /usr/local/bin/backup-filipino-quiz-db.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-filipino-quiz-db.sh
```

### Application Backups

```bash
# Backup application code and uploads
tar -czf /var/backups/filipino-quiz/app_$(date +%Y%m%d).tar.gz /var/www/filipino-quiz-app
```

---

## 9. Scaling Strategies

### Horizontal Scaling

**Load Balancer Configuration:**

```nginx
upstream backend_cluster {
    least_conn;
    server backend1.internal:5000 weight=1 max_fails=3 fail_timeout=30s;
    server backend2.internal:5000 weight=1 max_fails=3 fail_timeout=30s;
    server backend3.internal:5000 weight=1 max_fails=3 fail_timeout=30s;
    keepalive 32;
}
```

### Database Scaling

**Read Replicas:**

```typescript
// Prisma configuration for read replicas
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL, // Primary (write)
    },
  },
});

const prismaRead = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_READ_URL, // Replica (read)
    },
  },
});
```

### Caching Strategy

```typescript
// Redis caching for frequently accessed data
async function getCachedData(key: string) {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  
  const data = await database.fetch();
  await redis.setex(key, 3600, JSON.stringify(data));
  return data;
}
```

---

## 10. Troubleshooting

### Common Issues

**Issue: Application won't start**
```bash
# Check logs
pm2 logs filipino-quiz-backend --lines 100

# Check environment variables
pm2 env filipino-quiz-backend

# Verify database connection
sudo -u postgres psql filipino_quiz -c "SELECT 1"
```

**Issue: High memory usage**
```bash
# Check memory usage
pm2 monit

# Restart application
pm2 restart filipino-quiz-backend

# Check for memory leaks in logs
grep -i "memory" /var/www/filipino-quiz-app/backend/logs/*.log
```

**Issue: Slow queries**
```bash
# Enable query logging in PostgreSQL
sudo -u postgres psql filipino_quiz
ALTER DATABASE filipino_quiz SET log_min_duration_statement = 1000;

# Check slow query log
sudo tail -f /var/log/postgresql/postgresql-15-main.log | grep "duration"
```

**Issue: WebSocket connection fails**
```bash
# Check Nginx WebSocket configuration
sudo nginx -t

# Verify WebSocket endpoint
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost:5000/socket.io/

# Check firewall
sudo ufw status
```

---

## Quick Reference Commands

```bash
# Application Management
pm2 start/stop/restart filipino-quiz-backend
pm2 logs filipino-quiz-backend
pm2 monit

# Database
sudo -u postgres psql filipino_quiz
sudo systemctl status postgresql
sudo systemctl restart postgresql

# Redis
redis-cli
sudo systemctl status redis-server
sudo systemctl restart redis-server

# Nginx
sudo nginx -t
sudo systemctl status nginx
sudo systemctl reload nginx

# Docker
docker-compose ps
docker-compose logs -f
docker-compose restart
docker-compose down && docker-compose up -d
```

---

**Deployment completed! Your Filipino Quiz Application is now live! 🎉**
