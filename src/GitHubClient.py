import base64
import requests
from Configuration import Configuration
from Helper import Utils


class GitHubClient:
    config: Configuration
    
    def __init__(self, config:Configuration):
        self.config = config


    def GetFolderFiles(self, folder_name: str):
        github_origin_url = f'{self.config.github_base_url}/{self.config.source_repo_owner}/{self.config.source_repo_name}/contents/{folder_name}'
        response = requests.get(github_origin_url, headers=self.config.git_headers)
        if response.status_code == 200:
            files_data = response.json()
            file_names = [item['path'] for item in files_data if item['type'] == 'file']
            return file_names
        else:
            print(f"Error getting files in folder {github_origin_url}: {response.status_code} - {response.text}")
            return []


    def GetSubFolders(self, folder_name:str):
        github_origin_url = f'{self.config.github_base_url}/{self.config.source_repo_owner}/{self.config.source_repo_name}/contents/{folder_name}'
        response = requests.get(github_origin_url, headers=self.config.git_headers)
        if response.status_code == 200:
            files_data = response.json()
            file_names = [item['path'] for item in files_data if item['type'] == 'dir']
            return file_names
        else:
            print(f"Error getting folder {github_origin_url}: {response.status_code} - {response.text}")
            return []

    def ReadFileInGithub(self, file_name:str):
        github_origin_url = f'{self.config.github_base_url}/{self.config.source_repo_owner}/{self.config.source_repo_name}/contents/{file_name}'
        response = requests.get(github_origin_url, headers=self.config.git_headers)
        if response.status_code != 200:
            print(f"Error reading file {github_origin_url}: {response.status_code} - {response.text}")
        return response
    
    def SendToGitHub(self, content:str, file_name:str, output_file_type:str, time_stamp:str):
        new_content = base64.b64encode(content.encode('utf-8')).decode('utf-8')
        github_destination_url = f'{self.config.github_base_url}/{self.config.destination_repo_owner}/{self.config.destination_repo_name}/contents/Generated/{time_stamp}/{Utils.RemoveExtension(file_name)}{output_file_type}'

        update_payload = {
            'message': 'Generated from ChatGPT',
            'content': new_content
        }
        update_response = requests.put(github_destination_url, headers=self.config.git_headers, json=update_payload)
        print(update_response.json())