# Using Docker Compose
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
