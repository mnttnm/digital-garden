#!/bin/bash

# Digital Garden Capture App - Setup Script
# This script generates the Xcode project using xcodegen

set -e

echo "🌱 Digital Garden Capture App Setup"
echo "===================================="

cd "$(dirname "$0")"

# Check if xcodegen is installed
if ! command -v xcodegen &> /dev/null; then
    echo ""
    echo "📦 xcodegen not found. Installing via Homebrew..."

    if ! command -v brew &> /dev/null; then
        echo "❌ Homebrew not found. Please install Homebrew first:"
        echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        exit 1
    fi

    brew install xcodegen
fi

echo ""
echo "🔨 Generating Xcode project..."
xcodegen generate

echo ""
echo "✅ Project generated successfully!"
echo ""
echo "📱 Next steps:"
echo "   1. Open CaptureApp.xcodeproj in Xcode"
echo "   2. Build and run (Cmd+R)"
echo "   3. Open Settings (Cmd+,) to configure API URL and key"
echo ""
echo "🔑 For global keyboard shortcut (Cmd+Shift+C):"
echo "   Grant Accessibility permission in System Settings > Privacy & Security"
echo ""

# Ask if user wants to open Xcode
read -p "Open in Xcode now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    open CaptureApp.xcodeproj
fi
