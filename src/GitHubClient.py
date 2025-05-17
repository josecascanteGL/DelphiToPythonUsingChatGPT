import base64
import requests
from Configuration import Configuration
from Helper import Utils


class GitHubClient:
    config: Configuration
    
    def __init__(self, config:Configuration):
        self.config = config

    def GetFolderFilesCustomRepo(self, repo_url: str):
        response = requests.get(repo_url, headers=self.config.git_headers)
        if response.status_code == 200:
            files_data = response.json()
            file_names = [item['path'] for item in files_data if item['type'] == 'file']
            return file_names
        else:
            print(f"Error getting files in folder {repo_url}: {response.status_code} - {response.text}")
            return []
        
    def FetchGithubTree(self, owner, repo, branch='main', blacklist=None):
        if blacklist is None:
            blacklist = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.pdf', '.zip', '.exe']


        base_url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=1"
        response = requests.get(base_url, headers=self.config.git_headers)
        if response.status_code != 200:
            raise Exception(f"GitHub API error: {response.status_code} - {response.text}")
        
        tree_data = response.json()["tree"]

        root = {"name": repo, "type": "dir", "contents": []}
        node_map = {repo: root}

        for item in tree_data:
            path_parts = item["path"].split("/")
            file_name = path_parts[-1]

            # Skip blacklisted file extensions
            if item["type"] == "blob":
                if any(file_name.lower().endswith(ext.lower()) for ext in blacklist):
                    continue

            current_path = repo
            for i, part in enumerate(path_parts):
                parent_path = current_path
                current_path = f"{current_path}/{part}"

                is_last = (i == len(path_parts) - 1)
                item_type = item["type"] if is_last else "tree"

                if current_path not in node_map:
                    node = {
                        "name": part,
                        "type": "dir" if item_type == "tree" else "file",
                    }
                    if node["type"] == "dir":
                        node["contents"] = []

                    # Add to parent
                    parent_node = node_map.get(parent_path)
                    if parent_node and "contents" in parent_node:
                        parent_node["contents"].append(node)

                    if node["type"] == "dir":
                        node_map[current_path] = node

        return root



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