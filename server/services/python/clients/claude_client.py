"""Claude AI (Haiku) client for NLP tasks in research papers.

Provides a simple interface to call Claude Haiku from Python code
for text analysis, summarization, classification, sentiment analysis,
entity extraction, and other NLP tasks useful in academic research.
"""

import json
import os

import requests


class ClaudeClient:
    """Claude AI client — NLP and text analysis for research papers.

    Uses Claude Haiku 4.5 (fast, cost-effective) for:
    - Text summarization and paraphrasing
    - Sentiment analysis (financial news, earnings calls, FOMC minutes)
    - Named entity recognition (companies, people, financial instruments)
    - Text classification (research domains, paper topics)
    - Keyword and theme extraction
    - Abstract generation from paper sections
    - Literature review synthesis
    - Translation and language detection
    """

    MODEL = 'claude-haiku-4-5-20251001'
    API_URL = 'https://api.anthropic.com/v1/messages'
    API_VERSION = '2023-06-01'
    DEFAULT_MAX_TOKENS = 4096

    def __init__(self, api_key=None):
        self.api_key = api_key or os.getenv('ANTHROPIC_API_KEY')
        if not self.api_key:
            raise ValueError('ANTHROPIC_API_KEY is required for ClaudeClient')

    # ── Core API call ────────────────────────────────────────────────

    def _call(self, messages, system=None, max_tokens=None, temperature=0.0):
        """Low-level API call to Claude Haiku.

        Args:
            messages: list of {"role": "user"/"assistant", "content": str}
            system: optional system prompt string
            max_tokens: max response tokens (default 4096)
            temperature: 0.0 = deterministic, 1.0 = creative

        Returns:
            str: the assistant's text response
        """
        headers = {
            'Content-Type': 'application/json',
            'x-api-key': self.api_key,
            'anthropic-version': self.API_VERSION,
        }

        body = {
            'model': self.MODEL,
            'max_tokens': max_tokens or self.DEFAULT_MAX_TOKENS,
            'temperature': temperature,
            'messages': messages,
        }
        if system:
            body['system'] = system

        resp = requests.post(self.API_URL, headers=headers, json=body, timeout=300)
        resp.raise_for_status()
        data = resp.json()

        # Extract text from content blocks
        content = data.get('content', [])
        return ''.join(block.get('text', '') for block in content if block.get('type') == 'text')

    def ask(self, prompt, system=None, max_tokens=None, temperature=0.0):
        """Send a single prompt to Claude Haiku and get a text response.

        Args:
            prompt: the user message / question
            system: optional system prompt for role/context
            max_tokens: max response tokens (default 4096)
            temperature: 0.0 for factual, higher for creative

        Returns:
            str: Claude's response text
        """
        messages = [{'role': 'user', 'content': prompt}]
        return self._call(messages, system=system, max_tokens=max_tokens, temperature=temperature)

    # ── NLP convenience methods ──────────────────────────────────────

    def summarize(self, text, max_words=150, style='academic'):
        """Summarize text in the given style.

        Args:
            text: input text to summarize
            max_words: approximate max words for the summary
            style: 'academic', 'executive', 'bullet_points', or 'abstract'
        """
        style_instructions = {
            'academic': f'Write a concise academic summary in approximately {max_words} words. Use formal, scholarly language.',
            'executive': f'Write an executive summary in approximately {max_words} words. Focus on key findings and implications.',
            'bullet_points': f'Summarize as bullet points (max {max_words} words total). Each point should be a key finding or insight.',
            'abstract': f'Write a structured abstract in approximately {max_words} words with: Background, Methods, Results, and Conclusions.',
        }
        system = 'You are an expert academic research assistant specializing in summarization.'
        prompt = f"{style_instructions.get(style, style_instructions['academic'])}\n\nText to summarize:\n{text}"
        return self.ask(prompt, system=system)

    def sentiment(self, text, domain='financial'):
        """Analyze sentiment of text. Returns JSON with score and label.

        Args:
            text: input text to analyze
            domain: 'financial', 'news', 'academic', or 'general'

        Returns:
            dict with keys: score (-1.0 to 1.0), label (positive/negative/neutral),
                  confidence (0-1), reasoning (brief explanation)
        """
        system = f"""You are a {domain} sentiment analysis expert. Analyze the sentiment and return ONLY valid JSON with these fields:
- "score": float from -1.0 (very negative) to 1.0 (very positive)
- "label": one of "very_negative", "negative", "neutral", "positive", "very_positive"
- "confidence": float from 0.0 to 1.0
- "reasoning": brief one-sentence explanation"""

        result = self.ask(f"Analyze the sentiment of this text:\n\n{text}", system=system, temperature=0.0)
        try:
            # Try to parse JSON from the response
            # Handle case where response has markdown code blocks
            cleaned = result.strip()
            if cleaned.startswith('```'):
                cleaned = cleaned.split('\n', 1)[1].rsplit('```', 1)[0].strip()
            return json.loads(cleaned)
        except (json.JSONDecodeError, IndexError):
            return {'score': 0.0, 'label': 'neutral', 'confidence': 0.0, 'reasoning': result, 'raw': result}

    def classify(self, text, categories, multi_label=False):
        """Classify text into one or more categories.

        Args:
            text: input text to classify
            categories: list of category strings
            multi_label: if True, can return multiple categories

        Returns:
            dict with keys: category (str or list), confidence (float), reasoning (str)
        """
        mode = 'one or more categories' if multi_label else 'exactly one category'
        cat_list = ', '.join(f'"{c}"' for c in categories)
        system = f"""You are a text classification expert. Classify the text into {mode} from this list: [{cat_list}].
Return ONLY valid JSON with:
- "category": {'list of matching categories' if multi_label else 'the single best category string'}
- "confidence": float from 0.0 to 1.0
- "reasoning": brief one-sentence explanation"""

        result = self.ask(f"Classify this text:\n\n{text}", system=system, temperature=0.0)
        try:
            cleaned = result.strip()
            if cleaned.startswith('```'):
                cleaned = cleaned.split('\n', 1)[1].rsplit('```', 1)[0].strip()
            return json.loads(cleaned)
        except (json.JSONDecodeError, IndexError):
            return {'category': categories[0] if categories else 'unknown', 'confidence': 0.0, 'reasoning': result}

    def extract_entities(self, text, entity_types=None):
        """Extract named entities from text.

        Args:
            text: input text
            entity_types: list of entity types to extract (default: auto-detect)
                         e.g. ['company', 'person', 'ticker', 'currency', 'date', 'metric']

        Returns:
            list of dicts with keys: entity, type, context
        """
        types_str = ', '.join(entity_types) if entity_types else 'companies, people, tickers, currencies, dates, financial metrics, countries, institutions'
        system = f"""You are a named entity recognition expert for financial and academic texts.
Extract entities of these types: {types_str}.
Return ONLY a valid JSON array where each element has:
- "entity": the extracted entity string
- "type": the entity type
- "context": brief context of how it appears in the text"""

        result = self.ask(f"Extract entities from:\n\n{text}", system=system, temperature=0.0)
        try:
            cleaned = result.strip()
            if cleaned.startswith('```'):
                cleaned = cleaned.split('\n', 1)[1].rsplit('```', 1)[0].strip()
            return json.loads(cleaned)
        except (json.JSONDecodeError, IndexError):
            return []

    def batch_sentiment(self, texts, domain='financial'):
        """Analyze sentiment for a list of texts (one API call).

        Args:
            texts: list of strings to analyze
            domain: sentiment domain

        Returns:
            list of dicts with score, label, confidence for each text
        """
        numbered = '\n'.join(f'[{i}] {t}' for i, t in enumerate(texts))
        system = f"""You are a {domain} sentiment analysis expert.
Analyze the sentiment of each numbered text below.
Return ONLY a valid JSON array with one object per text, each having:
- "index": the text number
- "score": float from -1.0 to 1.0
- "label": one of "very_negative", "negative", "neutral", "positive", "very_positive"
- "confidence": float from 0.0 to 1.0"""

        result = self.ask(f"Analyze sentiment for each text:\n\n{numbered}", system=system, max_tokens=8192, temperature=0.0)
        try:
            cleaned = result.strip()
            if cleaned.startswith('```'):
                cleaned = cleaned.split('\n', 1)[1].rsplit('```', 1)[0].strip()
            return json.loads(cleaned)
        except (json.JSONDecodeError, IndexError):
            return [{'index': i, 'score': 0.0, 'label': 'neutral', 'confidence': 0.0} for i in range(len(texts))]

    def extract_keywords(self, text, n=10):
        """Extract key terms and phrases from academic/financial text.

        Args:
            text: input text
            n: number of keywords to extract

        Returns:
            list of dicts with keys: keyword, relevance (0-1), category
        """
        system = f"""You are an expert at extracting key terms from academic and financial texts.
Extract the {n} most important keywords or key phrases.
Return ONLY a valid JSON array where each element has:
- "keyword": the key term or phrase
- "relevance": float from 0.0 to 1.0 (importance)
- "category": brief category (e.g. "methodology", "theory", "variable", "metric", "concept")"""

        result = self.ask(f"Extract {n} keywords from:\n\n{text}", system=system, temperature=0.0)
        try:
            cleaned = result.strip()
            if cleaned.startswith('```'):
                cleaned = cleaned.split('\n', 1)[1].rsplit('```', 1)[0].strip()
            return json.loads(cleaned)
        except (json.JSONDecodeError, IndexError):
            return []

    def analyze_text(self, text, instruction):
        """Generic text analysis with custom instruction.

        Args:
            text: input text to analyze
            instruction: what to do with the text (e.g. "identify the main arguments",
                        "extract all statistical claims", "rewrite in formal academic tone")

        Returns:
            str: Claude's analysis
        """
        system = 'You are an expert academic research assistant with deep knowledge of finance, economics, and quantitative methods.'
        prompt = f"{instruction}\n\nText:\n{text}"
        return self.ask(prompt, system=system)
