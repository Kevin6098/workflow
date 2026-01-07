# ✅ Deployment Checklist

Quick checklist for deploying to VPS at `workflow.taskinsight.my`

## 📋 Pre-Deployment

- [ ] Domain DNS A record pointing to VPS IP
- [ ] SSH access to server configured
- [ ] Server access credentials ready

## 🔧 Server Setup

- [ ] Ubuntu 24 system updated
- [ ] Node.js 20.x installed
- [ ] MySQL server installed and secured
- [ ] Nginx installed
- [ ] UFW firewall configured (ports 22, 80, 443)
- [ ] Git installed (or SCP/SFTP ready)

## 📦 Application Setup

- [ ] Project files uploaded to `/projects/workflow`
- [ ] Backend dependencies installed (`cd backend && npm install`)
- [ ] Frontend dependencies installed (`cd frontend && npm install`)
- [ ] Frontend built (`cd frontend && npm run build`)

## 🗄️ Database Setup

- [ ] Database `workflow_system` created
- [ ] User `workflow_user` created with password
- [ ] Database schema imported (`schema.sql`)
- [ ] Database connection tested

## ⚙️ Configuration

- [ ] Backend `.env` file created with production values:
  - [ ] PORT=4005
  - [ ] NODE_ENV=production
  - [ ] Database credentials
  - [ ] Strong JWT_SECRET generated
  - [ ] CORS_ORIGIN=https://workflow.taskinsight.my
- [ ] Frontend `.env.production` created:
  - [ ] VITE_API_URL=https://workflow.taskinsight.my/api

## 🔄 Process Management

- [ ] PM2 installed globally
- [ ] `serve` package installed globally (for frontend)
- [ ] `ecosystem.config.js` updated with correct paths
- [ ] PM2 apps started: `pm2 start ecosystem.config.js`
- [ ] PM2 startup script configured: `pm2 startup`
- [ ] PM2 configuration saved: `pm2 save`

## 🌐 Nginx Configuration

- [ ] Nginx config created at `/etc/nginx/sites-available/workflow.taskinsight.my`
- [ ] Symbolic link created: `/etc/nginx/sites-enabled/workflow.taskinsight.my`
- [ ] Nginx config tested: `sudo nginx -t`
- [ ] Nginx restarted: `sudo systemctl restart nginx`

## 🔒 SSL Certificate

- [ ] Certbot installed
- [ ] SSL certificate obtained: `sudo certbot --nginx -d workflow.taskinsight.my`
- [ ] Auto-renewal tested: `sudo certbot renew --dry-run`

## 📁 File Permissions

- [ ] Uploads directory created: `/projects/workflow/backend/uploads`
- [ ] Logs directory created: `/projects/workflow/logs`
- [ ] Proper ownership set: `chown -R $USER:$USER /projects/workflow`

## ✅ Testing

- [ ] Backend accessible: `curl http://localhost:4005/api/auth/me`
- [ ] Frontend accessible: `curl http://localhost:3005`
- [ ] HTTPS working: `curl https://workflow.taskinsight.my`
- [ ] Frontend loads correctly in browser
- [ ] Login functionality works
- [ ] File upload works
- [ ] API endpoints responding

## 📊 Monitoring

- [ ] PM2 status checked: `pm2 status`
- [ ] PM2 logs reviewed: `pm2 logs`
- [ ] Nginx logs checked: `sudo tail -f /var/log/nginx/workflow-error.log`
- [ ] Application logs checked: `tail -f /projects/workflow/logs/*.log`

## 🔄 Backup Setup

- [ ] Backup script created: `/projects/workflow/backup-db.sh`
- [ ] Backup script permissions set: `chmod +x backup-db.sh`
- [ ] Cron job configured for daily backups

## 🛡️ Security

- [ ] MySQL root password changed
- [ ] Strong database user password set
- [ ] Strong JWT_SECRET generated
- [ ] Firewall rules configured
- [ ] SSL certificate installed
- [ ] Regular security updates enabled

## 📝 Post-Deployment

- [ ] Test all user roles (Lecturer, Coordinator, Deputy Dean, Admin)
- [ ] Test document submission workflow
- [ ] Test approval/endorsement process
- [ ] Monitor performance
- [ ] Document any custom configurations

---

**Deployment Date:** _______________  
**Deployed By:** _______________  
**Notes:**  
_____________________________________  
_____________________________________  
_____________________________________

