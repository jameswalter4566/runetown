#!/bin/bash

# Watch for changes and auto-commit every 5 minutes
echo "Starting auto-commit watcher..."
echo "Will check for changes and commit every 5 minutes"
echo "Press Ctrl+C to stop"

while true; do
    # Wait 5 minutes
    sleep 300
    
    # Run auto-commit script
    echo "Checking for changes..."
    ./auto-commit.sh
    echo "---"
done