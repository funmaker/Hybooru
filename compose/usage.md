# Using Hybooru Package
## Setup
Edit `/configs.json` to change the following configuration:
```json
{
  "hydrusDbPath": "/app/hydrus/db",
  "db": {
    "host": "postgres"
  }
}
```
## Run (docker run / docker-compose)
### use docker run
1. start the database
   ```bash
   docker run -d\
   --name postgres\
   -p 5432:5432\
   -e POSTGRES_PASSWORD=hybooru\
   -e POSTGRES_USER=hybooru\
   -e POSTGRES_DB=hybooru\
   --network hybooru\
   postgres
   ```
2. start the hybooru
   ```bash
   docker run -d\
   -p 8888:80\
   -v "$(pwd)/configs.json":/app/configs.json\
   -v /mnt/c/Users/chainmeans-01/Downloads/hydrus:/app/hydrus\
   --network hybooru\
   ghcr.io/funmaker/hybooru:v1.11.0
   ```
# Build Image By self
1. Edit `/configs.json` to change the following configuration:
    ```json
    {
    "hydrusDbPath": "db",
    "db": {
        "host": "hybooru_database"
      }
    }
    ```
2. Edit `/compose/.env`:
   If you are using Windows and WSL2 with Docker, you can use a path similar to the following:
    ```env
    HYBOORU_PORT=8888
    HYDRUS_DB_FOLDER=/mnt/c/Users/username/Downloads/Hydrus Network/db
    ```
3. On `/compose` directory, run `docker compose up --build -d`
4. Now you can access Hybooru on `http://localhost:8888`