# Todo App: Vue 3 + Node.js + MongoDB on Docker + AWS

A small task manager. Add, tick off and delete tasks; they are stored in MongoDB.

| Part | Technology | Public address |
|---|---|---|
| Frontend | Vue 3 (built with Vite, served by Nginx) | https://myproject.site |
| Backend | Node.js + Express | https://backend.myproject.site |
| API | same Node.js app | https://api.myproject.site/api/todos |
| Database | MongoDB 7 (private, Docker volume) | not public |

## Project layout

```
myproject/
├── compose.yaml          # runs mongo + backend + frontend
├── .env.example          # copy to .env, set your domain
├── backend/              # Node.js API (Dockerfile, server.js)
├── frontend/             # Vue 3 app (Dockerfile, src/)
└── nginx/myproject.conf  # server Nginx: routes 3 domains to containers
```

## Run it on your own computer first

```bash
cp .env.example .env
# for local testing use:
#   FRONTEND_URL=http://localhost:8080
#   API_URL=http://localhost:3000
docker compose up -d --build
```
Open http://localhost:8080 and http://localhost:3000/api/todos.

## Deploy on AWS (step by step)

1. **Buy a domain** (cheap `.site`).
2. **Create an EC2 instance**: Ubuntu 24.04, t3.small or bigger, 20 GB disk. Download the key pair (`.pem`).
3. **Security group** inbound rules: 22 (SSH), 80 (HTTP), 443 (HTTPS). Do NOT open 3000, 8080 or 27017.
4. **Elastic IP**: allocate one and attach it to the instance so the IP never changes.
5. **DNS**: create three A records pointing to the Elastic IP: `@` (main domain), `backend`, `api`.
6. **Connect**: `ssh -i key.pem ubuntu@YOUR_IP`
7. **Install Docker** (official apt repository, see Docker cheat sheet section 1), then `sudo usermod -aG docker $USER` and log in again.
8. **Install Nginx**: `sudo apt install -y nginx`
9. **Upload the project**: `git clone` your repo, or `scp -r myproject ubuntu@YOUR_IP:~/`
10. **Set the domain**: `cd myproject && cp .env.example .env && nano .env` (use https URLs).
11. **Start containers**: `docker compose up -d --build` then check `docker compose ps`.
12. **Configure Nginx**:
    ```bash
    sudo cp nginx/myproject.conf /etc/nginx/sites-available/myproject
    sudo nano /etc/nginx/sites-available/myproject   # replace myproject.site with your domain
    sudo ln -s /etc/nginx/sites-available/myproject /etc/nginx/sites-enabled/
    sudo rm /etc/nginx/sites-enabled/default
    sudo nginx -t && sudo systemctl reload nginx
    ```
13. **HTTPS** (DNS must already point to the server):
    ```bash
    sudo apt install -y certbot python3-certbot-nginx
    sudo certbot --nginx -d myproject.site -d www.myproject.site -d backend.myproject.site -d api.myproject.site
    ```
14. **Test** the three links in a browser.

## Useful commands

```bash
docker compose ps                 # status
docker compose logs -f backend    # backend logs
docker compose up -d --build      # rebuild after code changes
docker compose down               # stop (data is kept)
docker compose down -v            # stop AND delete database data
sudo tail -f /var/log/nginx/error.log
```

## Troubleshooting

| Problem | Fix |
|---|---|
| Frontend says "Cannot reach the API" | `API_URL` in `.env` is wrong. Fix it, then `docker compose up -d --build` (the URL is baked in at build time). |
| 502 Bad Gateway | A container is down: `docker compose ps`, `docker compose logs backend` |
| Backend exits at start | MongoDB not ready or wrong `MONGO_URL`: `docker compose logs backend` |
| Browser CORS error | `FRONTEND_URL` must exactly match the frontend address (https, no trailing slash). |
| Certbot fails | DNS A records not pointing to the server yet, or port 80 closed in the security group. |
