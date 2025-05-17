from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from CodeProcessor import ExecuteProcessor, RelayMessageToGPT, GetGitTreeStructure
from fastapi.responses import JSONResponse

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
        print(owner)
        print(repo)
        response = GetGitTreeStructure(owner, repo)
        if(response != None):
            return JSONResponse(content=response)
        else:
            return JSONResponse(content="{}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 #"josecascanteGL", "DelphiToPythonUsingChatGPT"
