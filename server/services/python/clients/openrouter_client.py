"""OpenRouter client for multi-model AI and embeddings in research papers.

Provides access to 400+ LLMs (GPT, Gemini, DeepSeek, Llama, Mistral, Qwen, etc.)
and embedding models (text-embedding-3, BGE, GTE, E5, etc.) through a single API.
Designed for NLP and semantic analysis tasks in academic research.
"""

import json
import math
import os
from typing import Optional

import numpy as np
import requests


# ── Notable models curated for research use ──────────────────────────────

CHAT_MODELS = {
    # Fast & cheap — high-volume NLP tasks
    'gemini-flash-lite': 'google/gemini-2.0-flash-lite-001',
    'gemini-flash': 'google/gemini-2.5-flash',
    'deepseek-v3': 'deepseek/deepseek-chat-v3.1',
    'qwen-flash': 'qwen/qwen3.5-flash-02-23',
    'mistral-small': 'mistralai/mistral-small-2603',
    # Mid-tier — balanced quality/cost
    'gemini-pro': 'google/gemini-2.5-pro',
    'deepseek-r1': 'deepseek/deepseek-r1-0528',
    'qwen-plus': 'qwen/qwen-plus-2025-07-28',
    'mistral-large': 'mistralai/mistral-large-2512',
    'cohere-command': 'cohere/command-a',
    # Premium — best quality
    'claude-sonnet': 'anthropic/claude-sonnet-4.6',
    'claude-opus': 'anthropic/claude-opus-4.6',
    'gpt-4o': 'openai/gpt-4o',
}

EMBEDDING_MODELS = {
    # Best quality
    'text-embedding-3-large': 'openai/text-embedding-3-large',       # 3072 dims, $0.13/Mtok
    'text-embedding-3-small': 'openai/text-embedding-3-small',       # 1536 dims, $0.02/Mtok
    # Multilingual
    'bge-m3': 'baai/bge-m3',                                         # 1024 dims, $0.01/Mtok
    'multilingual-e5-large': 'intfloat/multilingual-e5-large',       # 1024 dims, $0.01/Mtok
    # English-optimized
    'bge-large-en': 'baai/bge-large-en-v1.5',                       # 1024 dims, $0.01/Mtok
    'gte-large': 'thenlper/gte-large',                               # 1024 dims, $0.01/Mtok
    'e5-large': 'intfloat/e5-large-v2',                              # 1024 dims, $0.01/Mtok
    # Fast & cheap
    'all-minilm': 'sentence-transformers/all-minilm-l6-v2',         # 384 dims, $0.005/Mtok
    'all-mpnet': 'sentence-transformers/all-mpnet-base-v2',          # 768 dims, $0.005/Mtok
    # Long context
    'qwen3-embed-8b': 'qwen/qwen3-embedding-8b',                    # 32K ctx, $0.01/Mtok
    'qwen3-embed-4b': 'qwen/qwen3-embedding-4b',                    # 32K ctx, $0.02/Mtok
    # Code embeddings
    'codestral-embed': 'mistralai/codestral-embed-2505',             # 8K ctx, $0.15/Mtok
    # Google
    'gemini-embed': 'google/gemini-embedding-001',                    # 20K ctx, $0.15/Mtok
    # Free
    'nemotron-embed-free': 'nvidia/llama-nemotron-embed-vl-1b-v2:free',  # 131K ctx, free
}


class OpenRouterClient:
    """OpenRouter multi-model AI client for NLP and semantic analysis.

    Access 400+ LLMs and embedding models through a single API.
    Useful for:
    - Multi-model comparison studies (compare GPT vs Gemini vs DeepSeek responses)
    - Semantic analysis with embeddings (paper similarity, topic clustering)
    - High-volume NLP with cheap models (sentiment, classification at scale)
    - Cross-model robustness checks in research
    """

    API_BASE = 'https://openrouter.ai/api/v1'
    DEFAULT_CHAT_MODEL = 'google/gemini-2.5-flash'
    DEFAULT_EMBED_MODEL = 'openai/text-embedding-3-small'
    DEFAULT_MAX_TOKENS = 4096

    def __init__(self, api_key=None):
        self.api_key = api_key or os.getenv('OPENROUTER_API_KEY')
        if not self.api_key:
            raise ValueError('OPENROUTER_API_KEY is required for OpenRouterClient')
        self._session = requests.Session()
        self._session.headers.update({
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json',
        })

    # ═══════════════════════════════════════════════════════════════════
    #  CHAT COMPLETIONS
    # ═══════════════════════════════════════════════════════════════════

    def _resolve_chat_model(self, model):
        """Resolve a short alias or pass through a full model ID."""
        if model is None:
            return self.DEFAULT_CHAT_MODEL
        return CHAT_MODELS.get(model, model)

    def chat(self, messages, model=None, max_tokens=None, temperature=0.0, system=None, json_mode=False):
        """Send a chat completion request to any model.

        Args:
            messages: list of {"role": "user"/"assistant", "content": str}
                      OR a single string (converted to user message)
            model: model ID or alias (see openrouter.CHAT_MODELS). Default: gemini-2.5-flash
            max_tokens: max response tokens (default 4096)
            temperature: 0.0 = deterministic, 1.0 = creative
            system: optional system prompt string
            json_mode: if True, request JSON output format

        Returns:
            str: the assistant's text response
        """
        if isinstance(messages, str):
            messages = [{'role': 'user', 'content': messages}]

        if system:
            messages = [{'role': 'system', 'content': system}] + messages

        body = {
            'model': self._resolve_chat_model(model),
            'messages': messages,
            'max_tokens': max_tokens or self.DEFAULT_MAX_TOKENS,
            'temperature': temperature,
        }
        if json_mode:
            body['response_format'] = {'type': 'json_object'}

        resp = self._session.post(f'{self.API_BASE}/chat/completions', json=body, timeout=300)
        resp.raise_for_status()
        data = resp.json()

        return data['choices'][0]['message']['content']

    def ask(self, prompt, model=None, system=None, max_tokens=None, temperature=0.0):
        """Simple prompt → response. Convenience wrapper around chat().

        Args:
            prompt: user message string
            model: model ID or alias. Default: gemini-2.5-flash
            system: optional system prompt
            max_tokens: max response tokens
            temperature: sampling temperature

        Returns:
            str: model response
        """
        return self.chat(prompt, model=model, max_tokens=max_tokens, temperature=temperature, system=system)

    def ask_json(self, prompt, model=None, system=None, max_tokens=None, temperature=0.0):
        """Prompt → parsed JSON response.

        Args:
            prompt: user message (should ask for JSON output)
            model: model ID or alias
            system: optional system prompt
            max_tokens: max response tokens
            temperature: sampling temperature

        Returns:
            dict or list: parsed JSON response
        """
        result = self.chat(prompt, model=model, max_tokens=max_tokens, temperature=temperature,
                           system=system, json_mode=True)
        cleaned = result.strip()
        if cleaned.startswith('```'):
            cleaned = cleaned.split('\n', 1)[1].rsplit('```', 1)[0].strip()
        return json.loads(cleaned)

    def compare_models(self, prompt, models, system=None, temperature=0.0, max_tokens=None):
        """Send the same prompt to multiple models and compare responses.

        Args:
            prompt: the user prompt
            models: list of model IDs or aliases
            system: optional system prompt
            temperature: sampling temperature
            max_tokens: max response tokens

        Returns:
            dict: {model_id: response_text} for each model
        """
        results = {}
        for model in models:
            resolved = self._resolve_chat_model(model)
            try:
                results[resolved] = self.ask(prompt, model=model, system=system,
                                             temperature=temperature, max_tokens=max_tokens)
            except Exception as e:
                results[resolved] = f'ERROR: {e}'
        return results

    # ═══════════════════════════════════════════════════════════════════
    #  EMBEDDINGS
    # ═══════════════════════════════════════════════════════════════════

    def _resolve_embed_model(self, model):
        """Resolve a short alias or pass through a full model ID."""
        if model is None:
            return self.DEFAULT_EMBED_MODEL
        return EMBEDDING_MODELS.get(model, model)

    def embed(self, texts, model=None):
        """Generate embeddings for one or more texts.

        Args:
            texts: a single string or list of strings
            model: embedding model ID or alias (see openrouter.EMBEDDING_MODELS).
                   Default: openai/text-embedding-3-small (1536 dims, $0.02/Mtok)

        Returns:
            numpy array of shape (n_texts, n_dimensions) if input is list,
            or (n_dimensions,) if input is a single string
        """
        single = isinstance(texts, str)
        if single:
            texts = [texts]

        body = {
            'model': self._resolve_embed_model(model),
            'input': texts,
        }

        resp = self._session.post(f'{self.API_BASE}/embeddings', json=body, timeout=300)
        resp.raise_for_status()
        data = resp.json()

        # Sort by index to ensure correct order
        sorted_data = sorted(data['data'], key=lambda x: x['index'])
        embeddings = np.array([item['embedding'] for item in sorted_data])

        return embeddings[0] if single else embeddings

    def embed_batch(self, texts, model=None, batch_size=100):
        """Generate embeddings for a large list of texts in batches.

        Args:
            texts: list of strings
            model: embedding model ID or alias
            batch_size: number of texts per API call (default 100)

        Returns:
            numpy array of shape (n_texts, n_dimensions)
        """
        all_embeddings = []
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            embs = self.embed(batch, model=model)
            all_embeddings.append(embs)
        return np.vstack(all_embeddings)

    # ═══════════════════════════════════════════════════════════════════
    #  SEMANTIC ANALYSIS METHODS
    # ═══════════════════════════════════════════════════════════════════

    def cosine_similarity(self, vec_a, vec_b):
        """Compute cosine similarity between two embedding vectors.

        Args:
            vec_a, vec_b: numpy arrays (1D)

        Returns:
            float: cosine similarity (-1 to 1)
        """
        vec_a = np.asarray(vec_a, dtype=np.float64)
        vec_b = np.asarray(vec_b, dtype=np.float64)
        dot = np.dot(vec_a, vec_b)
        norm = np.linalg.norm(vec_a) * np.linalg.norm(vec_b)
        return float(dot / norm) if norm > 0 else 0.0

    def similarity_matrix(self, texts, model=None):
        """Compute pairwise cosine similarity matrix for a list of texts.

        Args:
            texts: list of strings
            model: embedding model ID or alias

        Returns:
            tuple: (similarity_matrix as numpy array, embeddings as numpy array)
        """
        embeddings = self.embed(texts, model=model) if len(texts) > 1 else self.embed(texts, model=model).reshape(1, -1)
        # Normalize
        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        norms = np.where(norms == 0, 1, norms)
        normalized = embeddings / norms
        sim_matrix = normalized @ normalized.T
        return sim_matrix, embeddings

    def find_similar(self, query, documents, model=None, top_k=5):
        """Find the most similar documents to a query using embeddings.

        Args:
            query: query string
            documents: list of document strings
            model: embedding model ID or alias
            top_k: number of top results to return

        Returns:
            list of dicts: [{"index": int, "text": str, "similarity": float}]
        """
        all_texts = [query] + list(documents)
        embeddings = self.embed(all_texts, model=model)
        query_emb = embeddings[0]
        doc_embs = embeddings[1:]

        similarities = []
        for i, doc_emb in enumerate(doc_embs):
            sim = self.cosine_similarity(query_emb, doc_emb)
            similarities.append({'index': i, 'text': documents[i], 'similarity': round(sim, 6)})

        similarities.sort(key=lambda x: x['similarity'], reverse=True)
        return similarities[:top_k]

    def cluster_texts(self, texts, n_clusters=5, model=None):
        """Cluster texts by semantic similarity using K-Means on embeddings.

        Args:
            texts: list of strings
            n_clusters: number of clusters
            model: embedding model ID or alias

        Returns:
            dict with keys:
                - labels: list of cluster IDs (one per text)
                - centroids: numpy array of cluster centers
                - embeddings: numpy array of text embeddings
                - clusters: dict mapping cluster_id → list of text indices
        """
        from sklearn.cluster import KMeans

        embeddings = self.embed_batch(texts, model=model)
        n_clusters = min(n_clusters, len(texts))
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        labels = kmeans.fit_predict(embeddings)

        clusters = {}
        for i, label in enumerate(labels):
            clusters.setdefault(int(label), []).append(i)

        return {
            'labels': [int(l) for l in labels],
            'centroids': kmeans.cluster_centers_,
            'embeddings': embeddings,
            'clusters': clusters,
        }

    def semantic_search(self, query, corpus, model=None, top_k=10):
        """Semantic search over a corpus of texts.

        Alias for find_similar() with a clearer name for search use cases.

        Args:
            query: search query string
            corpus: list of text strings to search through
            model: embedding model
            top_k: number of results

        Returns:
            list of dicts with index, text, similarity
        """
        return self.find_similar(query, corpus, model=model, top_k=top_k)

    def deduplicate(self, texts, threshold=0.92, model=None):
        """Find near-duplicate texts using embedding similarity.

        Args:
            texts: list of strings
            threshold: cosine similarity threshold for duplicate detection (default 0.92)
            model: embedding model

        Returns:
            dict with keys:
                - unique_indices: list of indices of unique texts
                - duplicate_pairs: list of (i, j, similarity) tuples
                - n_duplicates: count of duplicates found
        """
        sim_matrix, _ = self.similarity_matrix(texts, model=model)
        duplicate_pairs = []
        duplicate_indices = set()

        for i in range(len(texts)):
            for j in range(i + 1, len(texts)):
                if sim_matrix[i, j] >= threshold:
                    duplicate_pairs.append((i, j, round(float(sim_matrix[i, j]), 6)))
                    duplicate_indices.add(j)

        unique_indices = [i for i in range(len(texts)) if i not in duplicate_indices]

        return {
            'unique_indices': unique_indices,
            'duplicate_pairs': duplicate_pairs,
            'n_duplicates': len(duplicate_indices),
        }

    # ═══════════════════════════════════════════════════════════════════
    #  NLP CONVENIENCE METHODS (via chat)
    # ═══════════════════════════════════════════════════════════════════

    def summarize(self, text, max_words=150, style='academic', model=None):
        """Summarize text using a chat model.

        Args:
            text: input text
            max_words: approximate max words
            style: 'academic', 'executive', 'bullet_points', 'abstract'
            model: chat model to use (default: gemini-flash)
        """
        style_instructions = {
            'academic': f'Write a concise academic summary in approximately {max_words} words. Use formal, scholarly language.',
            'executive': f'Write an executive summary in approximately {max_words} words. Focus on key findings and implications.',
            'bullet_points': f'Summarize as bullet points (max {max_words} words total). Each point should be a key finding or insight.',
            'abstract': f'Write a structured abstract in approximately {max_words} words with: Background, Methods, Results, and Conclusions.',
        }
        system = 'You are an expert academic research assistant specializing in summarization.'
        prompt = f"{style_instructions.get(style, style_instructions['academic'])}\n\nText to summarize:\n{text}"
        return self.ask(prompt, model=model or 'gemini-flash', system=system)

    def sentiment(self, text, domain='financial', model=None):
        """Analyze sentiment. Returns dict with score, label, confidence.

        Args:
            text: input text
            domain: 'financial', 'news', 'academic', 'general'
            model: chat model (default: gemini-flash)

        Returns:
            dict: {score, label, confidence, reasoning}
        """
        system = f"""You are a {domain} sentiment analysis expert. Return ONLY valid JSON:
{{"score": float_-1_to_1, "label": "very_negative|negative|neutral|positive|very_positive", "confidence": float_0_to_1, "reasoning": "brief explanation"}}"""
        try:
            return self.ask_json(f"Analyze sentiment:\n\n{text}", model=model or 'gemini-flash', system=system)
        except (json.JSONDecodeError, Exception):
            raw = self.ask(f"Analyze sentiment:\n\n{text}", model=model or 'gemini-flash', system=system)
            return {'score': 0.0, 'label': 'neutral', 'confidence': 0.0, 'reasoning': raw}

    def batch_sentiment(self, texts, domain='financial', model=None):
        """Analyze sentiment for multiple texts in one call.

        Args:
            texts: list of strings
            domain: sentiment domain
            model: chat model

        Returns:
            list of dicts with score, label, confidence
        """
        numbered = '\n'.join(f'[{i}] {t}' for i, t in enumerate(texts))
        system = f"""You are a {domain} sentiment analysis expert. Return ONLY a valid JSON array with one object per text:
[{{"index": 0, "score": float, "label": "string", "confidence": float}}, ...]"""
        try:
            return self.ask_json(f"Analyze sentiment for each:\n\n{numbered}", model=model or 'gemini-flash',
                                 system=system, max_tokens=8192)
        except (json.JSONDecodeError, Exception):
            return [{'index': i, 'score': 0.0, 'label': 'neutral', 'confidence': 0.0} for i in range(len(texts))]

    def classify(self, text, categories, multi_label=False, model=None):
        """Classify text into categories.

        Args:
            text: input text
            categories: list of category strings
            multi_label: allow multiple categories
            model: chat model

        Returns:
            dict: {category, confidence, reasoning}
        """
        mode = 'one or more categories' if multi_label else 'exactly one category'
        cat_list = ', '.join(f'"{c}"' for c in categories)
        cat_field = 'list of matching categories' if multi_label else 'single best category string'
        system = f"""Classify into {mode} from: [{cat_list}]. Return ONLY valid JSON:
{{"category": {cat_field}, "confidence": float_0_to_1, "reasoning": "brief explanation"}}"""
        try:
            return self.ask_json(f"Classify:\n\n{text}", model=model or 'gemini-flash', system=system)
        except (json.JSONDecodeError, Exception):
            return {'category': categories[0] if categories else 'unknown', 'confidence': 0.0}

    def extract_entities(self, text, entity_types=None, model=None):
        """Extract named entities from text.

        Args:
            text: input text
            entity_types: list of types (default: auto-detect)
            model: chat model

        Returns:
            list of dicts: [{entity, type, context}]
        """
        types_str = ', '.join(entity_types) if entity_types else 'companies, people, tickers, currencies, dates, metrics, countries, institutions'
        system = f"""Extract entities of types: {types_str}. Return ONLY a valid JSON array:
[{{"entity": "string", "type": "string", "context": "brief context"}}]"""
        try:
            return self.ask_json(f"Extract entities:\n\n{text}", model=model or 'gemini-flash', system=system)
        except (json.JSONDecodeError, Exception):
            return []

    # ═══════════════════════════════════════════════════════════════════
    #  MODEL DISCOVERY
    # ═══════════════════════════════════════════════════════════════════

    def list_chat_models(self):
        """Return the curated dict of chat model aliases → full IDs."""
        return dict(CHAT_MODELS)

    def list_embedding_models(self):
        """Return the curated dict of embedding model aliases → full IDs."""
        return dict(EMBEDDING_MODELS)
