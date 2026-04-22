[![ci-nextjs-application-template](https://github.com/pantry-pals/pantry-pal/actions/workflows/ci.yml/badge.svg)](https://github.com/pantry-pals/pantry-pal/actions/workflows/ci.yml)

TEMPORARY DEVELOPMENT ENVIORNMENT VARIABLES
create a folder named .env
paste the following:

NEXTAUTH_SECRET=5f3b9ffcc572a74b0d3d85cfd972a5754304af589ba0a711b2b85b517df9aeef8cb6966ccb30f464ffba9348ac5294dced159248161627281d96f3c0f0a027e5
JWT_SECRET=5f3b9ffcc572a74b0d3d85cfd972a5754304af589ba0a711b2b85b517df9aeef8cb6966ccb30f464ffba9348ac5294dced159248161627281d96f3c0f0a027e5

NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000

GMAIL_USER=alohatest8008@gmail.com
GMAIL_PASS=uwsprolutcywqznf





brew install nvm
nvm install 22.12.0
nvm use 22.12.0

npm install (AT ROOT OF APP)
npx prisma generate 
npx prisma migrate 
npx prisma db seed
