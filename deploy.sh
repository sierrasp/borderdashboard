#!/bin/bash

npm run build

docker build -t borderdashboard --platform=linux/amd64 .       

docker tag borderdashboard gcr.io/ssp-all-sites/borderdashboard

docker push gcr.io/ssp-all-sites/borderdashboard