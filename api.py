from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from CodeProcessor import ExecuteProcessor, RelayMessageToGPT

app = FastAPI()

# Request body model
class Request(BaseModel):
    message: str
    code: str

class Response(BaseModel):
    message: str

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Welcome to the sample API!"}

# Example with query parameter
@app.get("/execute")
def execute_processor():
    try:
        ExecuteProcessor()
        return {"message": "Process completed."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# POST endpoint with JSON body
@app.post("/relay")
def relay(request: Request):
    try:      
        response = RelayMessageToGPT(request.message, request.code)
        return Response(message = response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
