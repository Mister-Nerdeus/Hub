from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routes.plans import router as plans_router
from app.routes.simulation import router as simulation_router
from app.settings import get_settings

settings = get_settings()

app = FastAPI(
    title="Nerdeus ER Pod Shift Simulator API",
    version="0.1.0",
    description="Operational simulation API shell. No PHI or clinical safety certification.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request, exc: RequestValidationError) -> JSONResponse:
    errors = [
        {
            "type": error.get("type", "value_error"),
            "loc": error.get("loc", ()),
            "msg": error.get("msg", "Invalid request"),
        }
        for error in exc.errors()
    ]
    return JSONResponse(status_code=422, content={"detail": errors})


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "nerdeus-api"}


app.include_router(plans_router)
app.include_router(simulation_router)
