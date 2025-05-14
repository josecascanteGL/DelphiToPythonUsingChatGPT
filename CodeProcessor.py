import requests
import base64
import datetime
import json
import chardet
import os

with open('/content/secrets.json', 'r') as f:
  secrets = json.load(f)

# Assign variables directly
github_api_key = secrets.get('github_api_key')
openai_api_key = secrets.get('openai_api_key')
open_ai_api_path = 'https://api.openai.com/v1/chat/completions'

with open('/content/config.json', 'r') as f:
  config = json.load(f)

destination_repo_owner = config.get("DestinationRepoOwner")
destination_repo_name = config.get("DestinationRepoName")
source_repo_owner = config.get("SourceRepoOwner")
source_repo_name = config.get("SourceRepoName")
source_path = config.get("SourcePath")
github_base_url = 'https://api.github.com/repos'
git_headers = {'Authorization': f'Bearer {github_api_key}'}

print(config)

def decode_file_content(git_response):
    # Step 1: Extract the base64-encoded content from GitHub
    content_b64 = git_response.json().get('content', '')
    content_bytes = base64.b64decode(content_b64)

    # Step 2: Try using the encoding from the response if available
    if hasattr(git_response, 'encoding') and git_response.encoding:
        try:
            return content_bytes.decode(git_response.encoding)
        except UnicodeDecodeError:
            print(f"Failed to decode with reported encoding: {git_response.encoding}")

    # Step 3: Fallback to auto-detecting encoding using chardet
    detected = chardet.detect(content_bytes)
    encoding = detected.get("encoding", "utf-8")
    confidence = detected.get("confidence", 0)

    try:
      if encoding is None:
        encoding = "utf-8"
      return content_bytes.decode(encoding)
    except UnicodeDecodeError:
        print(f"Failed to decode with detected encoding: {encoding} (confidence: {confidence})")
        # As a last resort, ignore errors
        return content_bytes.decode("utf-8", errors="ignore")

def GenerateTimestamp():
  now = datetime.datetime.now()
  timestamp = now.strftime("%Y%m%d_%H%M%S")
  return str(timestamp)

def RemoveExtension(filename: str) -> str:
  return os.path.splitext(filename)[0]



def GetFolderFiles(folder_name):
  github_origin_url = f'{github_base_url}/{source_repo_owner}/{source_repo_name}/contents/{folder_name}'
  response = requests.get(github_origin_url, headers=git_headers)
  if response.status_code == 200:
    files_data = response.json()
    file_names = [item['path'] for item in files_data if item['type'] == 'file']
    return file_names
  else:
    print(f"Error getting files in folder {github_origin_url}: {response.status_code} - {response.text}")
    return []


def GetSubFolders(folder_name):
  github_origin_url = f'{github_base_url}/{source_repo_owner}/{source_repo_name}/contents/{folder_name}'
  response = requests.get(github_origin_url, headers=git_headers)
  if response.status_code == 200:
    files_data = response.json()
    file_names = [item['path'] for item in files_data if item['type'] == 'dir']
    return file_names
  else:
    print(f"Error getting folder {github_origin_url}: {response.status_code} - {response.text}")
    return []

def ReadFileInGithub(file_name):
  github_origin_url = f'{github_base_url}/{source_repo_owner}/{source_repo_name}/contents/{file_name}'
  response = requests.get(github_origin_url, headers=git_headers)
  if response.status_code != 200:
    print(f"Error reading file {github_origin_url}: {response.status_code} - {response.text}")
  return response

def SendToGpt(content, instruction, gpt_model):
  gpt_headers = {
    'Authorization': f'Bearer {openai_api_key}',
    'Content-Type': 'application/json'
  }
  chat_payload = {
    'model': gpt_model,
    'messages': [{'role': 'user', 'content': f'{instruction}.:\n{content}'}]
  }

  chat_response = requests.post(open_ai_api_path, headers=gpt_headers, json=chat_payload)
  chat_result = chat_response
  return chat_result

def SendToGitHub(content, file_name, output_file_type):
  new_content = base64.b64encode(content.encode('utf-8')).decode('utf-8')
  github_destination_url = f'{github_base_url}/{destination_repo_owner}/{destination_repo_name}/contents/Generated/{time_stamp}/{RemoveExtension(file_name)}{output_file_type}'

  update_payload = {
      'message': 'Generated from ChatGPT',
      'content': new_content
  }
  update_response = requests.put(github_destination_url, headers=git_headers, json=update_payload)
  print(update_response.json())

def ProcessFiles(files_to_process, instruction, gpt_model, input_file_type, output_file_type):
  for file_name in files_to_process:
    if file_name.lower().endswith(input_file_type):
      git_response = ReadFileInGithub(file_name)
      if git_response.status_code == 200:
        file_content = decode_file_content(git_response)
        print(f"Sending {files_to_process} to gpt")
        chat_result = SendToGpt(file_content, instruction, gpt_model)
        if chat_result.status_code == 200:
          chat_result = chat_result.json()['choices'][0]['message']['content']
          SendToGitHub(chat_result, file_name, output_file_type)
        else:
          chat_result = chat_result.text
      print(git_response)
      #end if
   # else:
    #  git_response = ReadFileInGithub(file_name)
     # file_content = decode_file_content(git_response)
      #SendToGitHub(file_content, file_name)

def ProcessDirRecursively(dir_to_process, instruction, gpt_model, input_file_type, output_file_type):
  print(f'Processing directory: {dir_to_process}')
  GetFolderFiles(dir_to_process)
  to_process = GetFolderFiles(dir_to_process)
  ProcessFiles(to_process, instruction, gpt_model, input_file_type, output_file_type)
  sub_dirs = GetSubFolders(dir_to_process)
  for sub_dir in sub_dirs:
    ProcessDirRecursively(sub_dir, instruction, gpt_model, input_file_type, output_file_type)


time_stamp = GenerateTimestamp()
gpt_model = "gpt-3.5-turbo"
input_file_type = ".dpr"
output_file_type = ".py"
instruction_to_gpt = (
    "You are a Delphi-to-Python code converter. I will provide you with Delphi code, "
    "and your task is to convert it to equivalent Python code.\n\n"
    "- Do not include any explanations, comments, or formatting syntax (no triple backticks, no markdown).\n"
    "- Output only the Python and nothing else. Do not use markdown, code blocks, or extra formatting.\n"
    "- Add inline comments to explain parts of the code that are not easy to understand.\n"
    "- Match the logic and structure closely.\n"
    "- Use Pythonic idioms where appropriate.\n\n"
    "Here is the Delphi code to convert:\n\n"
)

ProcessDirRecursively(source_path, instruction_to_gpt, gpt_model, input_file_type, output_file_type)


# this part is going to anotate and sugest improvements
instruction_to_gpt = (
    "You are a Delphi code reviewer and annotator. I will provide you with Delphi source code.\n\n"
    "- Keep the original Delphi code completely intact.\n"
    "- Add inline comments to explain what each part of the code is doing.\n"
    "- Where appropriate, add suggestions for potential improvements or refactors as comments.\n"
    "- Do not remove or modify any existing code.\n"
    "- Output only the Delphi code with your added comments, and nothing else. Do not use markdown, code blocks, or extra formatting.\n\n"
    "Here is the Delphi code to annotate:\n\n"
)
output_file_type = ".dpr"
ProcessDirRecursively(source_path, instruction_to_gpt, gpt_model, input_file_type, output_file_type)
