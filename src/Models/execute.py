from pydantic import BaseModel

class ExecuteProcessorRequest:
    gpt_model: str
    input_file_type: str
    output_file_type: str