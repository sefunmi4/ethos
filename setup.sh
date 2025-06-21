#!/bin/bash
set -e

# Install backend and frontend dependencies using package-lock
npm ci --prefix ethos-backend
npm ci --prefix ethos-frontend

# Ensure required typings are installed
npm ls --prefix ethos-backend @types/node @types/jest >/dev/null
npm ls --prefix ethos-frontend @types/node @types/jest >/dev/null
