# 🚀 Deployment Guide - Ubuntu 24 VPS

Complete guide for deploying the Document Workflow System to a VPS with Ubuntu 24, Nginx, and subdomain `workflow.taskinsight.my`.

## 📋 Prerequisites

- Ubuntu 24 VPS with root/sudo access
- Domain name pointing to your VPS IP (A record for `workflow.taskinsight.my`)
- SSH access to the server

## 🔧 Step 1: Initial Server Setup

### Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### Install Essential Tools
```bash
sudo apt install -y git curl wget build-essential
```

## 📦 Step 2: Install Node.js (v20 LTS)

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

## 🗄️ Step 3: Install MySQL

```bash
# Install MySQL Server
sudo apt install -y mysql-server

# Secure MySQL installation
sudo mysql_secure_installation

# Login to MySQL
sudo mysql
```

```sql
-- Create database
CREATE DATABASE workflow_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user (replace 'your_password' with a strong password)
CREATE USER 'workflow_user'@'localhost' IDENTIFIED BY '920214_Ang';

-- Grant privileges
GRANT ALL PRIVILEGES ON workflow_system.* TO 'workflow_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Import Database Schema
```bash
# On your local machine, export the schema
# Then on server, upload and import it
mysql -u workflow_user -p workflow_system < schema.sql
```

## 📥 Step 4: Deploy Application

### Clone/Copy Project Files
```bash
# Navigate to projects directory
cd /projects

# Clone your repository (or upload files)
sudo git clone <your-repo-url> workflow
# OR use SCP/SFTP to upload files

# Set ownership
sudo chown -R $USER:$USER /projects/workflow
cd /projects/workflow
```

### Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd ../frontend
npm install
```

## ⚙️ Step 5: Configure Environment Variables

### Backend Configuration
```bash
cd /projects/workflow/backend
nano .env
```

Add the following content:
```env
# Server
PORT=4005
NODE_ENV=production

# Database
DB_HOST=localhost
DB_USER=workflow_user
DB_PASSWORD=your_password
DB_NAME=workflow_system
DB_PORT=3306

# JWT
JWT_SECRET=your_very_strong_jwt_secret_key_change_this
JWT_EXPIRES_IN=7d

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800
ALLOWED_FILE_TYPES=pdf,doc,docx,xls,xlsx

# CORS
CORS_ORIGIN=https://workflow.taskinsight.my
```

**Generate a strong JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Frontend Configuration
```bash
cd /projects/workflow/frontend
nano .env.production
```

Add:
```env
VITE_API_URL=https://workflow.taskinsight.my/api
```

## 🏗️ Step 6: Build Frontend

```bash
cd /projects/workflow/frontend
npm run build
```

This creates a `dist` folder with production-ready files.

## 🔄 Step 7: Install PM2 (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Create PM2 ecosystem file
cd /projects/workflow
nano ecosystem.config.js
```

Add this configuration:
```javascript
module.exports = {
  apps: [
    {
      name: 'workflow-backend',
      script: './backend/server.js',
      cwd: '/projects/workflow',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 4005
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '500M'
    },
    {
      name: 'workflow-frontend',
      script: 'npx',
      args: 'serve -s dist -l 3005',
      cwd: '/projects/workflow/frontend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3005
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true
    }
  ]
};
```

```bash
# Create logs directory
mkdir -p /projects/workflow/logs

# Install serve for frontend
cd /projects/workflow/frontend
npm install -g serve

# Start applications with PM2
cd /projects/workflow
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the instructions shown by the command
```

**PM2 Useful Commands:**
```bash
pm2 status              # Check status
pm2 logs workflow-backend   # View backend logs
pm2 logs workflow-frontend  # View frontend logs
pm2 restart all         # Restart all apps
pm2 stop all            # Stop all apps
pm2 delete all          # Remove all apps
```

## 🌐 Step 8: Configure Nginx

### Install Nginx
```bash
sudo apt install -y nginx
```

### Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/workflow.taskinsight.my
```

Add this configuration:
```nginx
# Backend API
upstream backend {
    server localhost:4005;
}

# Frontend
upstream frontend {
    server localhost:3005;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name workflow.taskinsight.my;

    # ACME challenge for Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name workflow.taskinsight.my;

    # SSL Configuration (will be updated after certbot)
    ssl_certificate /etc/letsencrypt/live/workflow.taskinsight.my/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/workflow.taskinsight.my/privkey.pem;
    
    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Logging
    access_log /var/log/nginx/workflow-access.log;
    error_log /var/log/nginx/workflow-error.log;

    # Client max body size (for file uploads)
    client_max_body_size 50M;

    # Backend API
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }

    # Frontend static files
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Handle static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            proxy_pass http://frontend;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

### Enable Site
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/workflow.taskinsight.my /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# If test passes, restart Nginx
sudo systemctl restart nginx
```

## 🔒 Step 9: Install SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d workflow.taskinsight.my

# Test auto-renewal
sudo certbot renew --dry-run
```

Certbot will automatically update your Nginx configuration with SSL certificates.

## 📁 Step 10: Setup File Uploads Directory

```bash
# Create uploads directory
mkdir -p /projects/workflow/backend/uploads

# Set permissions
chmod 755 /projects/workflow/backend/uploads
chown -R $USER:$USER /projects/workflow/backend/uploads
```

## 🔥 Step 11: Configure Firewall

```bash
# Install UFW if not installed
sudo apt install -y ufw

# Allow SSH, HTTP, and HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## ✅ Step 12: Verify Deployment

1. **Check Backend:**
   ```bash
   curl http://localhost:4005/api/auth/me
   ```

2. **Check Frontend:**
   ```bash
   curl http://localhost:3005
   ```

3. **Check Nginx:**
   ```bash
   curl -I https://workflow.taskinsight.my
   ```

4. **Check PM2 Status:**
   ```bash
   pm2 status
   pm2 logs
   ```

## 🔄 Step 13: Setup Auto-Update and Monitoring

### Setup Automatic Updates
```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### Monitor PM2 with PM2 Plus (Optional)
```bash
pm2 link <secret_key> <public_key>
```

## 📝 Maintenance Commands

### Update Application
```bash
cd /projects/workflow
git pull origin main  # Or your branch name
cd backend && npm install
cd ../frontend && npm install && npm run build
pm2 restart all
```

### View Logs
```bash
# PM2 logs
pm2 logs

# Nginx logs
sudo tail -f /var/log/nginx/workflow-access.log
sudo tail -f /var/log/nginx/workflow-error.log

# Application logs
tail -f /projects/workflow/logs/backend-error.log
tail -f /projects/workflow/logs/frontend-error.log
```

### Database Backup
```bash
# Create backup script
nano /projects/workflow/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/projects/workflow/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

mysqldump -u workflow_user -p'your_password' workflow_system > $BACKUP_DIR/workflow_$DATE.sql
gzip $BACKUP_DIR/workflow_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "workflow_*.sql.gz" -mtime +7 -delete
```

```bash
chmod +x /projects/workflow/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /projects/workflow/backup-db.sh
```

## 🐛 Troubleshooting

### Backend not responding
```bash
pm2 logs workflow-backend
pm2 restart workflow-backend
```

### Frontend not loading
```bash
pm2 logs workflow-frontend
# Check if dist folder exists
ls -la /projects/workflow/frontend/dist
```

### Nginx errors
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### Database connection issues
```bash
# Test MySQL connection
mysql -u workflow_user -p workflow_system
```

### Permission issues
```bash
sudo chown -R $USER:$USER /projects/workflow
chmod -R 755 /projects/workflow
```

## 📊 Performance Optimization

### Enable Gzip Compression in Nginx
Add to your Nginx config inside the `server` block:
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
```

### Optimize PM2
- Adjust `max_memory_restart` in `ecosystem.config.js` based on your server RAM
- Use cluster mode for backend if needed: `exec_mode: 'cluster'` with multiple instances

## 🔐 Security Checklist

- [ ] Change default MySQL password
- [ ] Use strong JWT_SECRET
- [ ] Enable firewall (UFW)
- [ ] Install SSL certificate
- [ ] Keep system updated
- [ ] Set proper file permissions
- [ ] Configure automatic backups
- [ ] Monitor logs regularly
- [ ] Use environment variables (not hardcoded secrets)

## 📞 Support

If you encounter issues:
1. Check PM2 logs: `pm2 logs`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify services are running: `pm2 status` and `sudo systemctl status nginx`

---

**Deployment Complete! 🎉**

Your application should now be accessible at: `https://workflow.taskinsight.my`

