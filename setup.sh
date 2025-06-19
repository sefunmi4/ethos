#!/bin/bash
set -e

# Install root dependencies using package-lock
npm ci

# Install backend dependencies
npm ci --prefix ethos-backend
