from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routes.plans import router as plans_router
from app.routes.simulation import router as simulation_router
from app.errors import validation_error_detail
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
async def validation_exception_handler(request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(status_code=422, content={"detail": validation_error_detail(request, exc)})


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "nerdeus-api"}


app.include_router(plans_router)
app.include_router(simulation_router)
