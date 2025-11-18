
from typing import Any
import json


def get_workflow() -> dict[str, Any]:
    with open('./data/workflow.json', 'r') as file:
        workflow = json.load(file)

    return workflow
