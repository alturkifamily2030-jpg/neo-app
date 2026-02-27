#!/bin/bash
# Deploy NEO app to production
echo "Building NEO..."
cd /home/ubuntu/neo-app
npm run build
echo "Deploying to /var/www/neo..."
sudo cp -r dist/* /var/www/neo/
sudo systemctl reload nginx
echo "✅ Done! NEO is live at http://51.161.11.171/"
