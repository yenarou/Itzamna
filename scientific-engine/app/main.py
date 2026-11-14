from fastapi import FastAPI

from app.api.router import router

app = FastAPI(
    title="Itzamná Scientific Engine",
    version="0.1.0",
    description="Scientific engine skeleton for Itzamná.",
)

app.include_router(router)
