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
        
    def FetchGithubTree(self, owner, repo, branch='main'):
        whitelist = [
            ".adt", ".bdsdeploy", ".bdsgroup", ".bdsproj", ".bpg", ".bpl", ".cbk", ".cfg",
            ".config", ".d", ".dcl", ".dcp", ".dcpil", ".dcr", ".dcu", ".dcuil", ".ddp",
            ".dfm", ".dof", ".dpc", ".dpk", ".dpkw", ".dpl", ".dpr", ".dproj", ".drc",
            ".dres", ".dsk", ".dsm", ".dst", ".groupproj", ".identcache", ".int", ".local",
            ".map", ".mts", ".nfm", ".pas", ".proj", ".res", ".resources", ".rsm", ".tlb",
            ".todo", ".tvsconfig", "txvpck", "txvcls", ".vlb"
        ]

        base_url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=1"
        response = requests.get(base_url, headers=self.config.git_headers)

        if response.status_code != 200:
            raise Exception(f"GitHub API error: {response.status_code} - {response.text}")

        tree_data = response.json()["tree"]
        root = {"name": repo, "type": "dir", "contents": [], "path": ""}
        node_map = {"": root}

        for item in tree_data:
            if item["type"] != "blob":
                continue

            file_path = item["path"]
            file_name = file_path.split("/")[-1]

            if not any(file_name.lower().endswith(ext.lower()) for ext in whitelist):
                continue

            path_parts = file_path.split("/")
            current_path = ""

            for i, part in enumerate(path_parts):
                parent_path = current_path
                current_path = f"{current_path}/{part}" if current_path else part
                is_last = (i == len(path_parts) - 1)
                node_type = item["type"] if is_last else "tree"

                if current_path in node_map:
                    continue

                node = {
                    "name": part,
                    "type": "dir" if node_type == "tree" else "file",
                    "path": current_path
                }

                if node["type"] == "dir":
                    node["contents"] = []
                    node_map[current_path] = node

                parent_node = node_map.get(parent_path)
                if parent_node and "contents" in parent_node:
                    parent_node["contents"].append(node)

        def prune_empty_dirs(node):
            if node["type"] != "dir":
                return True
            node["contents"] = [child for child in node["contents"] if prune_empty_dirs(child)]
            return bool(node["contents"])

        prune_empty_dirs(root)
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
        
    def GetSpecificFile(self, owner, repo, folder, file_name, branch='main'):
        github_origin_url = f'{self.config.github_base_url}/{owner}/{repo}/contents/{folder}/{file_name}'
        print(github_origin_url)
        response = requests.get(github_origin_url, headers=self.config.git_headers)
        if response.status_code != 200:
            print(f"Error reading file {github_origin_url}: {response.status_code} - {response.text}")
               
        # Base64-encode the content
        file_bytes = response.content
        encoded_content = base64.b64encode(file_bytes).decode('utf-8')

        return {
            "file": file_name,
            "content_base64": encoded_content
        }



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