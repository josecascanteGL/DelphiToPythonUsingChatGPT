import sys
import os

sys.path.append(os.path.abspath('../src'))
from CodeProcessor import ExecuteProcessor, GetGitTreeStructure



#ExecuteProcessor()
#{self.config.source_repo_name}/contents/{folder_name}'
#https://github.com/josecascanteGL/DelphiToPythonUsingChatGPT/contents
GetGitTreeStructure("josecascanteGL", "DelphiToPythonUsingChatGPT")