"""Utility functions for the SEO agents."""

def extract_text(content) -> str:
    """
    Safely extract string content from Langchain LLM responses.
    This handles cases where response.content can be a list of blocks
    (common with newer Gemini models and multimodal setups).
    """
    if isinstance(content, str):
        return content
    elif isinstance(content, list):
        return "".join(
            item.get("text", "") if isinstance(item, dict) else str(item)
            for item in content
        )
    return str(content)
