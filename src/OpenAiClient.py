from Configuration import Configuration
import requests 

class OpenAiClient:
    config: Configuration
    
    def __init__(self, config:Configuration):
        self.config = config
    
    def SendToGpt(self, content, instruction, gpt_model, history):
      history.append({'role': 'user', 'content': f'{instruction}.:\n{content}'})
      

      gpt_headers = {
        'Authorization': f'Bearer {self.config.openai_api_key}',
        'Content-Type': 'application/json'
      }
      chat_payload = {
        'model': gpt_model,
        'messages': history
      }
      try:
        chat_response = requests.post(self.config.open_ai_api_path, headers=gpt_headers, json=chat_payload)
        return chat_response
      except requests.exceptions.HTTPError as http_err:
        print(f"HTTP error occurred: {http_err} - Status code: {chat_response.status_code}")
      except requests.exceptions.ConnectionError:
          print("Connection error: could not reach the server.")
      except requests.exceptions.Timeout:
          print("Request timed out.")
      except requests.exceptions.RequestException as e:
          print(f"An unexpected error occurred: {e}")  
      return "Error from chat gpt"
