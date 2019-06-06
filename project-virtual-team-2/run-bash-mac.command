#!/bin/bash  
echo "Starting up VisualGit"
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
cd "${DIR}"
npm start