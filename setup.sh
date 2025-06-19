#!/bin/bash
set -e

# Install backend and frontend dependencies using package-lock
npm ci --prefix ethos-backend
npm ci --prefix ethos-frontend
