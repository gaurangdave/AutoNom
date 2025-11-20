from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

app = FastAPI()

## Mount static files
app.mount("/static", StaticFiles(directory="./src/static"), name="static")


@app.get("/api/")
async def root():
    return {"message": "Hello Auto Nom"}


## catch all route everything to frontend
app.mount("/", StaticFiles(directory="./src/static", html=True), name="static")
