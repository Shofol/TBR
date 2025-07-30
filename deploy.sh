#!/bin/bash

# TubeBender Reviews Deployment Script
# This script helps deploy the application to an Apache server

echo "🚀 TubeBender Reviews Deployment Script"
echo "========================================"

# Check if build directory exists
if [ ! -d "dist" ]; then
    echo "❌ Build directory not found. Running build first..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ Build failed. Please fix build errors first."
        exit 1
    fi
fi

echo "✅ Build directory found"

# Create logs directory for PM2
mkdir -p logs

# Create production package.json with only runtime dependencies
echo "📦 Creating production package.json..."
cat > package-prod.json << 'EOF'
{
  "name": "tubebender-reviews-prod",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "NODE_ENV=production node dist/index.js"
  },
  "dependencies": {
    "@neondatabase/serverless": "^0.10.4",
    "connect-pg-simple": "^10.0.0",
    "drizzle-orm": "^0.39.1",
    "drizzle-zod": "^0.7.0",
    "express": "^4.21.2",
    "express-session": "^1.18.1",
    "memorystore": "^1.6.7",
    "passport": "^0.7.0",
    "passport-local": "^1.0.0",
    "ws": "^8.18.0",
    "zod": "^3.24.2",
    "zod-validation-error": "^3.4.0"
  }
}
EOF

# Create deployment package
echo "📋 Creating deployment package..."
DEPLOY_DIR="tubebender-reviews-deploy"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# Copy necessary files
cp -r dist $DEPLOY_DIR/
cp ecosystem.config.js $DEPLOY_DIR/
cp package-prod.json $DEPLOY_DIR/package.json
cp APACHE_DEPLOYMENT.md $DEPLOY_DIR/
mkdir -p $DEPLOY_DIR/logs

# Create environment template
cat > $DEPLOY_DIR/.env.example << 'EOF'
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://username:password@host:port/database
EOF

# Create quick start script
cat > $DEPLOY_DIR/start.sh << 'EOF'
#!/bin/bash
echo "Installing dependencies..."
npm install --production

echo "Starting application with PM2..."
npm install -g pm2
pm2 start ecosystem.config.js

echo "Application started! Check status with: pm2 status"
echo "View logs with: pm2 logs tubebender-reviews"
EOF

chmod +x $DEPLOY_DIR/start.sh

# Create ZIP file for easy transfer
if command -v zip &> /dev/null; then
    echo "📦 Creating deployment archive..."
    zip -r tubebender-reviews-apache-deploy.zip $DEPLOY_DIR
    echo "✅ Deployment archive created: tubebender-reviews-apache-deploy.zip"
else
    echo "⚠️  Zip not available. Manual copy required."
fi

echo ""
echo "✅ Deployment package ready!"
echo "📁 Files prepared in: $DEPLOY_DIR/"
echo ""
echo "Next steps:"
echo "1. Upload the deployment folder to your Apache server"
echo "2. Follow the instructions in APACHE_DEPLOYMENT.md"
echo "3. Configure your Apache virtual host"
echo "4. Set up environment variables (.env file)"
echo "5. Run the start.sh script on your server"
echo ""
echo "📖 Full deployment guide: APACHE_DEPLOYMENT.md"