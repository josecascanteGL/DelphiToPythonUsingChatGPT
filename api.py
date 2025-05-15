from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from CodeProcessor import ExecuteProcessor

app = FastAPI()

# Request body model
class Item(BaseModel):
    name: str
    price: float
    quantity: int

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
@app.post("/items/")
def create_item(item: Item):
    total = item.price * item.quantity
    return {
        "name": item.name,
        "price": item.price,
        "quantity": item.quantity,
        "total": total
    }
