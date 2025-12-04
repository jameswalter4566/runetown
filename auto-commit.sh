#!/bin/bash

# Auto-commit and push script
git add -A
if [ -n "$(git status --porcelain)" ]; then
    git commit -m "$(cat <<'EOF'
Auto-commit: Updates to project files

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
    git push origin main
    echo "Changes committed and pushed successfully"
else
    echo "No changes to commit"
fi