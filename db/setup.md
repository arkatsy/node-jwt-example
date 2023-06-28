Setup pgadmin and postgres with docker:

postgres:
docker run -p 54323:5432 -e POSTGRES_PASSWORD=argik1ts3 --name postgresdb postgres

pgadmin:
docker run -p 81:80 -e PGADMIN_DEFAULT_EMAIL=arkatsy@gmail.com -e PGADMIN_DEFAULT_PASSWORD=argik1ts3 dpage/pgadmin4

To find the ip of the postgres:

1. Find the id of the container running the postgres with `docker ps`
2. run `docker inspect -f \\'{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' \\<container_id>`
