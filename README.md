
# Border Dashboard ℹ️

Border Dashboard Project - 2022



## Environment Variables 🧰

To run this project, you will need to add the following environment variables to your .env file

`SECRET_PASS`
`SECRET_USER`
`SECRET_HOST` 
`SECRET_DATABASE`
`SECRET_PORT`


## Deployment :rocket:

To deploy this project run 

```bash
  npm i  
  npm run dev
```

## Installation 🛠

Install Border Dashboard with GitHub

```bash
  git clone 'https://github.com/sethmorton/BorderDashboardSkeleton.git'
  cd BorderDashboardSkeleton
```
## Deploying 🛠

Deploy Border Dashboard to GCR (MANUAL DEPLOYMENT)

```bash
docker build -t borderdashboard --platform=linux/amd64 .
docker tag borderdashboard gcr.io/ssp-all-sites/borderdashboard
docker push gcr.io/ssp-all-sites/borderdashboard
```


## Conventions 📝

Naming conventions based off [Javascript Naming Conventions](https://github.com/ktaranov/naming-convention/blob/master/JavaScript%20Name%20and%20Coding%20Conventions.md)

## Author ✍️
Seth M.
    
