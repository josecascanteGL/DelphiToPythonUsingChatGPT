import base64
from Configuration import Configuration
from Helper import Utils
from GitHubClient import GitHubClient
from OpenAiClient import OpenAiClient

config = Configuration()
git_hub_client = GitHubClient(config)
openAiClient = OpenAiClient(config)

def ProcessFiles(files_to_process, instruction, gpt_model, input_file_type, output_file_type, time_stamp):
  for file_name in files_to_process:
    if file_name.lower().endswith(input_file_type):
      git_response = git_hub_client.ReadFileInGithub(file_name)
      if git_response.status_code == 200:
        file_content = Utils.DecodeFromBase64(git_response)
        print(f"Sending {files_to_process} to gpt")
        chat_result = openAiClient.SendToGpt(file_content, instruction, gpt_model)
        if chat_result.status_code == 200:
          chat_result = chat_result.json()['choices'][0]['message']['content']
          git_hub_client.SendToGitHub(chat_result, file_name, output_file_type, time_stamp)
        else:
          chat_result = chat_result.text
      print(git_response)
      #end if
   # else:
    #  git_response = ReadFileInGithub(file_name)
     # file_content = DecodeFromBase64(git_response)
      #SendToGitHub(file_content, file_name)

def ProcessDirRecursively(dir_to_process, instruction, gpt_model, input_file_type, output_file_type, time_stamp):
  Utils.RedirectStdoutToFile("app.log", also_print=True)
  print(f'Processing directory: {dir_to_process}')
  git_hub_client.GetFolderFiles(dir_to_process)
  to_process = git_hub_client.GetFolderFiles(dir_to_process)
  ProcessFiles(to_process, instruction, gpt_model, input_file_type, output_file_type, time_stamp)
  sub_dirs = git_hub_client.GetSubFolders(dir_to_process)
  for sub_dir in sub_dirs:
    ProcessDirRecursively(sub_dir, instruction, gpt_model, input_file_type, output_file_type)

def ExecuteProcessor(gpt_model = "gpt-3.5-turbo", input_file_type = ".dpr", output_file_type = ".py"):
  time_stamp = Utils.GenerateTimestamp()
  #load RAG information 
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

  ProcessDirRecursively(config.source_path, instruction_to_gpt, gpt_model, input_file_type, output_file_type, time_stamp)


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
  ProcessDirRecursively(config.source_path, instruction_to_gpt, gpt_model, input_file_type, output_file_type, time_stamp)
  print("==========================End of process=======================================")

def RelayMessageToGPT(message, code):
  decoded_code = base64.b64decode(code).decode("utf-8")
  chat_result = openAiClient.SendToGpt(decoded_code, message, "gpt-3.5-turbo")
  if chat_result.status_code == 200:
    chat_result = chat_result.json()['choices'][0]['message']['content']
  else:
    chat_result = chat_result.text
  return chat_result

