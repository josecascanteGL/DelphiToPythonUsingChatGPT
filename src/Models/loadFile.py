from pydantic import BaseModel

class LoadFileRequest(BaseModel):
    owner: str
    repo: str
    full_file_name: str