from fastapi import FastAPI, Request
from pydantic import BaseModel
from fastapi.responses import JSONResponse
import uvicorn

app = FastAPI()

class EchoMessage(BaseModel):
    message: str

@app.post("/echo")
async def echo(msg: EchoMessage):
    return JSONResponse(content={"echo": msg.message})