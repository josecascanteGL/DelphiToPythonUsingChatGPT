from fastapi import FastAPI, HTTPException
from CodeProcessor import ExecuteProcessor, RelayMessageToGPT, GetGitTreeStructure, GetFileFromGit
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from Models.relay import RelayRequest, RelayResponse
from Models.loadFile import LoadFileRequest
from Models.execute import ExecuteProcessorRequest

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite todos los orígenes
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Welcome to the sample API!"}

# Will run the process to migrate to python the given repository
# needs to be a post so the origin and destination repo can be defined 
@app.get("/execute")
def execute_processor():
    try:
        result = ExecuteProcessor()
        return {"message": "Process completed.", "url": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
#@app.post("/execute")
#def execute_processor(request: ExecuteProcessorRequest):
 #   try:
  #      ExecuteProcessor(request.gpt_model, request.input_file_type, request.output_file_type)
   #     return {"message": "Process completed."}
    #except Exception as e:
     #   raise HTTPException(status_code=500, detail=str(e))

#Sends message directly to ChatGPT 
@app.post("/relay")
def relay(request: RelayRequest):
    try:      
        response = RelayMessageToGPT(request.message, request.code)
        return RelayResponse(message = response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
#Will return the tree structure from a given repo on github 
#"josecascanteGL", "DelphiToPythonUsingChatGPT"
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



@app.post("/loadfile")
def load_tree(request: LoadFileRequest):
    try:
        response = GetFileFromGit(
            request.owner,
            request.repo,
            request.full_file_name
        )
        if response is not None:
            return JSONResponse(content=response)
        else:
            return JSONResponse(content={})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))