import json
import os

class Configuration:
    def __init__(self):
        # Load secrets
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # gets project root
        secrets_config_path = os.path.join(base_dir, 'src/config', 'secrets.json')
        with open(secrets_config_path, 'r') as f:
            secrets = json.load(f)

        self.github_api_key = secrets.get('github_api_key')
        self.openai_api_key = secrets.get('openai_api_key')
        self.open_ai_api_path = 'https://api.openai.com/v1/chat/completions'

        # Load config
        secrets_config_path = os.path.join(base_dir, 'src/config', 'config.json')
        with open(secrets_config_path, 'r') as f:
            config = json.load(f)

        self.destination_repo_owner = config.get("DestinationRepoOwner")
        self.destination_repo_name = config.get("DestinationRepoName")
        self.source_repo_owner = config.get("SourceRepoOwner")
        self.source_repo_name = config.get("SourceRepoName")
        self.source_path = config.get("SourcePath")
        self.github_base_url = 'https://api.github.com/repos'
        self.git_headers = {
            'Authorization': f'Bearer {self.github_api_key}'
        }
