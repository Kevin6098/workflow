#!/bin/bash

# Database Backup Script for Workflow System
# Usage: ./backup-db.sh

BACKUP_DIR="/projects/workflow/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="workflow_system"
DB_USER="workflow_user"
DB_PASS=""  # Set your password here or use .my.cnf for security

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Backup database
echo "Creating backup: workflow_${DATE}.sql.gz"
mysqldump -u $DB_USER -p"$DB_PASS" $DB_NAME | gzip > $BACKUP_DIR/workflow_${DATE}.sql.gz

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "✓ Backup created successfully: $BACKUP_DIR/workflow_${DATE}.sql.gz"
    
    # Get file size
    FILE_SIZE=$(du -h "$BACKUP_DIR/workflow_${DATE}.sql.gz" | cut -f1)
    echo "  File size: $FILE_SIZE"
    
    # Remove backups older than 7 days
    echo "Cleaning up old backups (older than 7 days)..."
    find $BACKUP_DIR -name "workflow_*.sql.gz" -mtime +7 -delete
    echo "✓ Cleanup complete"
else
    echo "✗ Backup failed!"
    exit 1
fi

