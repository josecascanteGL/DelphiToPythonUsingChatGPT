from pydantic import BaseModel

# Request body model
class RelayRequest(BaseModel):
    message: str
    code: str

class RelayResponse(BaseModel):
    message: str