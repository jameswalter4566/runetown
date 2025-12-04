#!/bin/bash

# Create a temporary directory for the standalone server
mkdir -p ../runetown-server-standalone
cd ../runetown-server-standalone

# Copy server files
cp -r ../RuneTown/server/* .

# Initialize git repository
git init

# Create a simple README
cat > README.md << 'EOF'
# RuneTown Multiplayer Server

WebSocket server for RuneTown multiplayer game.

## Local Development
```bash
npm install
npm run dev
```

## Environment Variables
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (development/production)
EOF

# Create .gitignore
cat > .gitignore << 'EOF'
node_modules/
.env
.DS_Store
EOF

# Add all files
git add -A
git commit -m "Initial commit - RuneTown multiplayer server"

echo "Server repository created! Now:"
echo "1. Create a new repository on GitHub called 'runetown-server'"
echo "2. Run: git remote add origin https://github.com/YOUR_USERNAME/runetown-server.git"
echo "3. Run: git push -u origin main"
echo "4. Deploy this new repo to Render!"