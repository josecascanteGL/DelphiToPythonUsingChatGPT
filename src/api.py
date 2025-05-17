from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from CodeProcessor import ExecuteProcessor, RelayMessageToGPT, GetGitTreeStructure, GetFileFromGit
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite todos los orígenes
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# Will run the process to migrate to python the given repository
# needs to be a post so the origin and destination repo can be defined 
@app.get("/execute")
def execute_processor():
    try:
        ExecuteProcessor()
        return {"message": "Process completed."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

#Sends message directly to ChatGPT 
@app.post("/relay")
def relay(request: Request):
    try:      
        response = RelayMessageToGPT(request.message, request.code)
        return Response(message = response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
#Will return the tree structure from a given repo on github 
@app.get("/loadtree/{owner}/{repo}")
def load_tree(owner: str, repo:str):
    try:
        response = GetGitTreeStructure(owner, repo)
        if(response != None):
            return JSONResponse(content=response)
        else:
            return JSONResponse(content="{}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 #"josecascanteGL", "DelphiToPythonUsingChatGPT"

@app.get("/loadfile/{owner}/{repo}/{folder}/{file_name}")
def load_tree(owner: str, repo:str, folder:str, file_name:str):
    try:
        response = GetFileFromGit(owner, repo, folder, file_name)
        if(response != None):
            return JSONResponse(content=response)
        else:
            return JSONResponse(content="{}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))