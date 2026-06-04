# Stage 1: Build React app
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# VITE_API_URL được bake vào bundle lúc build
# Mặc định: http://localhost:5000/api (browser gọi trực tiếp vào backend host port)
ARG VITE_API_URL=http://localhost:5000/api
RUN VITE_API_URL=$VITE_API_URL npm run build

# Stage 2: Serve với nginx
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
